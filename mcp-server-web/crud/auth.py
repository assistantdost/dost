import random
import valkey
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from crud.users import CRUDUser
from schemas.users import UserCreate, UserUpdate, GoogleUser
from middleware.send_email import create_message
from middleware import gmail_service
import os
import bcrypt
from google.auth.transport import requests
from google.oauth2 import id_token
import google.auth.exceptions

# Redis connection
redis_client = valkey.Valkey.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379"))


class CRUDAuth:
    @staticmethod
    def generate_otp():
        return str(random.randint(100000, 999999))

    @staticmethod
    def store_otp(email: str, otp: str):
        key = f"otp:{email}"
        redis_client.setex(key, 600, otp)  # 10 minutes TTL

    @staticmethod
    def verify_otp(email: str, otp: str) -> bool:
        key = f"otp:{email}"
        stored_otp = redis_client.get(key)
        if stored_otp and stored_otp.decode() == otp:
            redis_client.delete(key)  # Delete after successful verification
            return True
        return False

    @staticmethod
    async def send_otp_email(email: str, otp: str, subject: str = "Your OTP Code"):
        sender = os.getenv("GMAIL_SENDER")
        content = f"Your OTP code is: {otp}. It expires in 10 minutes."
        message = create_message(sender, email, subject, content)
        try:
            gmail_service.users().messages().send(
                userId="me", body={'raw': message['raw']}).execute()
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

    @staticmethod
    async def verify_google_token(payload: dict) -> dict:
        try:
            # Extract the ID token from the payload
            id_token_str = payload.get("credential") or payload.get("id_token")
            if not id_token_str:
                raise ValueError("No ID token found in payload")

            # Verify the token
            CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
            if not CLIENT_ID:
                raise ValueError("GOOGLE_CLIENT_ID not set")

            request = requests.Request()
            token_info = id_token.verify_oauth2_token(
                id_token_str, request, CLIENT_ID)

            return {
                "token_info": token_info,
                "user": {
                    "name": token_info.get("name"),
                    "email": token_info.get("email"),
                    "sub": token_info.get("sub"),
                    "picture": token_info.get("picture"),
                }
            }
        except google.auth.exceptions.GoogleAuthError as e:
            raise ValueError(f"Invalid Google token: {str(e)}")
        except Exception as e:
            raise ValueError(f"Error verifying Google token: {str(e)}")

    @staticmethod
    async def signup(user_data: dict, db: AsyncSession):
        user_create = UserCreate(**user_data)
        db_user = await CRUDUser.get_user_by_email(db, user_create.email)
        if db_user:
            if db_user.email_verified:
                return {"error": "Email already registered"}
            else:
                # Delete unverified user
                await CRUDUser.delete_user(db, db_user.id)

        if user_create.password:
            hashed_password = bcrypt.hashpw(
                user_create.password.encode('utf-8'), bcrypt.gensalt())
            user_create.password = hashed_password.decode('utf-8')
        created_user = await CRUDUser.create_user(db, user_create)

        otp = CRUDAuth.generate_otp()
        CRUDAuth.store_otp(user_create.email, otp)
        await CRUDAuth.send_otp_email(user_create.email, otp, "Verify Your Email")

        return {
            "message": "Signup successful. Check your email for OTP to verify.",
            "user_id": str(created_user.id)  # Added user_id to response
        }

    @staticmethod
    async def verify_email(email: str, otp: str, db: AsyncSession):
        if CRUDAuth.verify_otp(email, otp):
            db_user = await CRUDUser.get_user_by_email(db, email)
            if db_user:
                await CRUDUser.update_user(db, db_user.id, UserUpdate(email_verified=True))
                return {"message": "Email verified successfully"}
        return {"error": "Invalid or expired OTP"}

    @staticmethod
    async def signin(email: str, password: str, db: AsyncSession):
        db_user = await CRUDUser.get_user_by_email(db, email)
        if not db_user:
            return {"error": "User not found"}
        if not db_user.password and db_user.google_sub:
            return {"error": "Please sign in with Google"}
        if not bcrypt.checkpw(password.encode('utf-8'), db_user.password.encode('utf-8')):
            return {"error": "Invalid credentials"}
        if not db_user.email_verified:
            return {"error": "Email not verified"}

        await CRUDUser.update_user(db, db_user.id, UserUpdate(last_login=datetime.now(timezone.utc)))
        return {"user": db_user}

    @staticmethod
    async def google_signin(payload: dict, db: AsyncSession):
        try:
            verified_data = await CRUDAuth.verify_google_token(payload)
            google_user_data = verified_data["user"]

            google_user = GoogleUser(**google_user_data)

            # Check if user exists by google_sub
            db_user = await CRUDUser.get_user_by_google_sub(db, google_user.sub)
            if not db_user:
                # Check if user exists by email
                db_user = await CRUDUser.get_user_by_email(db, google_user.email)
                if db_user:
                    # Link Google account to existing user
                    await CRUDUser.update_user(db, db_user.id, UserUpdate(google_sub=google_user.sub, email_verified=True))
                else:
                    # Create new user
                    user_create = UserCreate(
                        name=google_user.name,
                        email=google_user.email,
                        google_sub=google_user.sub,
                        email_verified=True
                    )
                    db_user = await CRUDUser.create_user(db, user_create)

            await CRUDUser.update_user(db, db_user.id, UserUpdate(last_login=datetime.now(timezone.utc)))
            return {"user": db_user}
        except ValueError as e:
            return {"error": str(e)}

    @staticmethod
    async def forgot_password(email: str, db: AsyncSession):
        db_user = await CRUDUser.get_user_by_email(db, email)
        if not db_user:
            return {"message": "If the email exists, an OTP has been sent."}

        otp = CRUDAuth.generate_otp()
        CRUDAuth.store_otp(email, otp)
        await CRUDAuth.send_otp_email(email, otp, "Password Reset OTP")
        return {"message": "If the email exists, an OTP has been sent."}

    @staticmethod
    async def resend_otp(email: str, db: AsyncSession):
        db_user = await CRUDUser.get_user_by_email(db, email)
        if not db_user:
            return {"error": "User not found"}
        if db_user.email_verified:
            return {"error": "Email already verified"}

        otp = CRUDAuth.generate_otp()
        CRUDAuth.store_otp(email, otp)
        await CRUDAuth.send_otp_email(email, otp, "Verify Your Email")
        return {"message": "OTP sent successfully"}

    @staticmethod
    async def reset_password(email: str, otp: str, new_password: str, db: AsyncSession):
        if CRUDAuth.verify_otp(email, otp):
            db_user = await CRUDUser.get_user_by_email(db, email)
            if db_user:
                # Hash the new password
                hashed_password = bcrypt.hashpw(
                    new_password.encode('utf-8'), bcrypt.gensalt())
                hashed_password_str = hashed_password.decode('utf-8')

                # Update user password
                await CRUDUser.update_user(db, db_user.id, UserUpdate(password=hashed_password_str))
                return {"message": "Password reset successfully"}
        return {"error": "Invalid or expired OTP"}
