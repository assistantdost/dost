from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: Optional[str] = "user"
    email_verified: Optional[bool] = False


class UserCreate(UserBase):
    password_hash: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password_hash: Optional[str] = None
    role: Optional[str] = None
    email_verified: Optional[bool] = None
    last_login: Optional[datetime] = None


class User(UserBase):
    id: str
    password_hash: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class OAuthAccountCreate(BaseModel):
    user_id: str
    provider: str
    provider_user_id: str


class APIKeyResponse(BaseModel):
    id: str
    name: str
    key: str  # raw key, only shown once at creation


class GoogleUser(BaseModel):
    name: str
    email: EmailStr
    sub: str
    picture: Optional[str] = None


class LogGoogleUser(BaseModel):
    payload: object  # Using Any if the payload structure is not fixed or known

    async def get_user(self):
        from crud.auth import CRUDAuth
        user_data = await CRUDAuth.verify_google_token(self.payload)
        return GoogleUser(**user_data)


def serialize_user(user):
    return User.model_validate(user)
