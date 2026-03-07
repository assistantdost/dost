from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from crud.auth import CRUDAuth
from auth.jwt import create_access_token, create_refresh_token, verify_token
from config.settings import settings
from schemas.users import LogGoogleUser
from schemas.auth import SignupRequest, VerifyEmailRequest, SigninRequest, ForgotPasswordRequest, ResetPasswordRequest, RefreshTokenRequest, ResendOtpRequest
from middleware.decorators import handle_route_exception

router = APIRouter()

def set_auth_cookie(response: Response, token: str, request: Request):
    origin = request.headers.get("origin", "")
    is_electron = origin.startswith("app://")

    response.set_cookie(
        key="refresh_token",
        value=token,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        httponly=True,
        secure=is_electron,                      # False for localhost, True for app://
        samesite="None" if is_electron else "Lax",
        path="/",
    )


@router.post("/signup")
@handle_route_exception
async def signup(user_data: SignupRequest, db: AsyncSession = Depends(get_db)):
    result = await CRUDAuth.signup(user_data.dict(), db)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return {
        "message": "User registered successfully. Please check your email for OTP.",
        "user_id": result["user_id"],
    }


@router.post("/verify_email_and_signup")
@handle_route_exception
async def verify_email_and_signup(request: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    result = await CRUDAuth.verify_email(request.email, request.otp, db)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return {
        "message": "Email verified successfully",

    }


@router.post("/resend_otp")
@handle_route_exception
async def resend_otp(request: ResendOtpRequest, db: AsyncSession = Depends(get_db)):
    result = await CRUDAuth.resend_otp(request.email, db)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return {
        "message": "OTP sent successfully",

    }


@router.post("/signin")
@handle_route_exception
async def signin(request: SigninRequest, response: Response, raw_request: Request, db: AsyncSession = Depends(get_db)):
    result = await CRUDAuth.signin(request.email, request.password, db)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    user = result["user"]
    access_token = create_access_token(data={"id": str(user.id)})
    refresh_token = create_refresh_token(data={"id": str(user.id)})

    set_auth_cookie(response, refresh_token, raw_request)

    return {
        "message": "User Logged In!",
        "user": {"name": user.name, "email": user.email},
        "token": access_token,
    }


@router.post("/google_signin")
@handle_route_exception
async def google_signin(log_google_user: LogGoogleUser, response: Response, request: Request, db: AsyncSession = Depends(get_db)):
    result = await CRUDAuth.google_signin(log_google_user.payload, db)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    user = result["user"]
    access_token = create_access_token(data={"id": str(user.id)})
    refresh_token = create_refresh_token(data={"id": str(user.id)})

    set_auth_cookie(response, refresh_token, request)

    return {
        "message": "User Logged In via Google!",
        "user": {"name": user.name, "email": user.email},
        "token": access_token,
    }


@router.post("/logout")
@handle_route_exception
async def logout(response: Response):
    # Clear the refresh token cookie
    response.delete_cookie(key="refresh_token", path="/")
    return {
        "message": "Logged out successfully",
    }


@router.post("/forgot_password")
@handle_route_exception
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await CRUDAuth.forgot_password(request.email, db)
    return {
        "message": result["message"],
    }


@router.post("/reset_password")
@handle_route_exception
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await CRUDAuth.reset_password(request.email, request.otp, request.new_password, db)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return {
        "message": "Password reset successfully",

    }


@router.post("/refresh")
@handle_route_exception
async def refresh_token(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        response.delete_cookie(key="refresh_token", path="/")
        raise HTTPException(
            status_code=401, detail="No refresh token provided")

    try:
        payload = verify_token(refresh_token, settings.refresh_token_secret)
        if not payload:
            response.delete_cookie(key="refresh_token", path="/")
            raise HTTPException(
                status_code=401, detail="Invalid refresh token")

        user_id = payload.get("id")  # Changed from "sub" to "id"
        if not user_id:
            response.delete_cookie(key="refresh_token", path="/")
            raise HTTPException(
                status_code=401, detail="Invalid refresh token")

        # Create new access token
        data = {"id": user_id}
        access_token = create_access_token(data)

        return {"message": "Token refreshed successfully", "logged": True, "token": access_token}

    except Exception as e:
        response.delete_cookie(key="refresh_token", path="/")
        raise HTTPException(
            status_code=401, detail="Refresh token expired or invalid")
