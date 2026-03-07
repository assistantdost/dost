import random
import valkey
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from crud.users import CRUDUser, CRUDOAuthAccount
from schemas.users import UserCreate, UserUpdate, GoogleUser, OAuthAccountCreate
from middleware.send_email import create_message
from middleware import gmail_service
import os
import bcrypt
import httpx
from authlib.jose import JsonWebToken

# Redis connection
redis_client = valkey.Valkey.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379"))

_google_jwks_cache = None


async def _get_google_jwks() -> dict:
    global _google_jwks_cache
    if _google_jwks_cache is None:
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://www.googleapis.com/oauth2/v3/certs")
            resp.raise_for_status()
            _google_jwks_cache = resp.json()
    return _google_jwks_cache


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
        id_token_str = payload.get("credential") or payload.get("id_token")
        if not id_token_str:
            raise ValueError("No ID token found in payload")

        CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
        if not CLIENT_ID:
            raise ValueError("GOOGLE_CLIENT_ID not set")

        jwks = await _get_google_jwks()
        jwt_obj = JsonWebToken(algorithms=["RS256"])
        try:
            claims = jwt_obj.decode(id_token_str, jwks)
            claims.validate()
        except Exception as e:
            raise ValueError(f"Invalid Google token: {str(e)}")

        aud = claims.get("aud")
        if isinstance(aud, str):
            aud = [aud]
        if CLIENT_ID not in aud:
            raise ValueError("Token audience mismatch")

        return {
            "name": claims.get("name"),
            "email": claims.get("email"),
            "sub": claims.get("sub"),
            "picture": claims.get("picture"),
        }

    @staticmethod
    async def signup(user_data: dict, db: AsyncSession):
        password = user_data.pop("password", None)
        user_create = UserCreate(**user_data)

        db_user = await CRUDUser.get_user_by_email(db, user_create.email)
        if db_user:
            if db_user.email_verified:
                return {"error": "Email already registered"}
            else:
                # Delete unverified user and start fresh
                await CRUDUser.delete_user(db, db_user.id)

        if password:
            hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            user_create.password_hash = hashed.decode('utf-8')

        created_user = await CRUDUser.create_user(db, user_create)

        otp = CRUDAuth.generate_otp()
        CRUDAuth.store_otp(user_create.email, otp)
        await CRUDAuth.send_otp_email(user_create.email, otp, "Verify Your Email")

        return {
            "message": "Signup successful. Check your email for OTP to verify.",
            "user_id": str(created_user.id),
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
        if not db_user.password_hash:
            return {"error": "This account uses OAuth login. Please sign in with your provider."}
        if not bcrypt.checkpw(password.encode('utf-8'), db_user.password_hash.encode('utf-8')):
            return {"error": "Invalid credentials"}
        if not db_user.email_verified:
            return {"error": "Email not verified"}

        await CRUDUser.update_user(db, db_user.id, UserUpdate(last_login=datetime.now(timezone.utc)))
        return {"user": db_user}

    @staticmethod
    async def google_signin(payload: dict, db: AsyncSession):
        try:
            google_user_data = await CRUDAuth.verify_google_token(payload)
            google_user = GoogleUser(**google_user_data)

            # Check if this OAuth account is already linked
            oauth_account = await CRUDOAuthAccount.get_by_provider(
                db, "google", google_user.sub
            )
            if oauth_account:
                db_user = await CRUDUser.get_user_by_id(db, oauth_account.user_id)
            else:
                db_user = await CRUDUser.get_user_by_email(db, google_user.email)
                if db_user:
                    # Link Google to existing user
                    await CRUDOAuthAccount.create(db, OAuthAccountCreate(
                        user_id=str(db_user.id),
                        provider="google",
                        provider_user_id=google_user.sub,
                    ))
                    if not db_user.email_verified:
                        await CRUDUser.update_user(
                            db, db_user.id, UserUpdate(email_verified=True)
                        )
                else:
                    # New user via Google
                    user_create = UserCreate(
                        name=google_user.name,
                        email=google_user.email,
                        email_verified=True,
                    )
                    db_user = await CRUDUser.create_user(db, user_create)
                    await CRUDOAuthAccount.create(db, OAuthAccountCreate(
                        user_id=str(db_user.id),
                        provider="google",
                        provider_user_id=google_user.sub,
                    ))

            await CRUDUser.update_user(
                db, db_user.id, UserUpdate(last_login=datetime.now(timezone.utc))
            )
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
                hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
                await CRUDUser.update_user(
                    db, db_user.id,
                    UserUpdate(password_hash=hashed.decode('utf-8'))
                )
                return {"message": "Password reset successfully"}
        return {"error": "Invalid or expired OTP"}
