from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from dotenv import load_dotenv
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from crud.users import CRUDUser
from database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from middleware.decorators import handle_jwt_exception
from schemas.users import serialize_user
from typing import Optional
import valkey
import time
import json
from config.settings import settings


load_dotenv()

# Secret key and algorithm
SECRET_KEY = settings.jwt_secret
REFRESH_TOKEN_SECRET = settings.refresh_token_secret
ACCESS_TOKEN_SECRET = settings.access_token_secret
ALGORITHM = settings.algorithm


header_accessToken = HTTPBearer(
    scheme_name="Access-Token",
    description="JWT Bearer Token for user authentication",
    auto_error=True
)

# Optional bearer for light authentication
optional_header_accessToken = HTTPBearer(
    scheme_name="Access-Token",
    description="Optional JWT Bearer Token",
    auto_error=False
)

# Redis connection
redis_client = valkey.Valkey.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379"))


# Get JWT token details and verify user


# Get JWT token details and verify user using Access-Token
@handle_jwt_exception
async def protected_route_cache_user(credentials: HTTPAuthorizationCredentials = Depends(header_accessToken), db: AsyncSession = Depends(get_db)):
    access_token = credentials.credentials if credentials else None
    if not access_token:
        raise HTTPException(status_code=401, detail="Invalid Auth Token")

    try:
        token_data = jwt.decode(
            access_token, ACCESS_TOKEN_SECRET, algorithms=[ALGORITHM])

        user_id = token_data.get("id") or token_data.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid Auth Token")

        # user_id is already a string (ULID)

        user_key = redis_client.get(f"user:{user_id}")
        if not user_key:
            print("User not found in cache, fetching from DB")
            user = await CRUDUser.get_user_by_id(db, user_id)

            # Calculate expiry time from token
            current_time = int(time.time())
            # Default 1 hour if no exp
            expiry_seconds = token_data.get("exp") - current_time

            # Cache until token expires
            user = serialize_user(user)
            user_dict = user.dict()
            user_dict.pop('password', None)  # Remove password from cache
            redis_client.set(f"user:{user_id}",
                             json.dumps(user_dict, default=str), ex=expiry_seconds)
        else:
            print("User found in cache")
            user = json.loads(user_key.decode('utf-8'))
        if not user:
            raise HTTPException(status_code=401, detail="Invalid Auth Token")
        return user

    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid Auth Token")


#
async def protected_route(credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_header_accessToken)):
    access_token = credentials.credentials if credentials else None

    if not access_token:
        raise HTTPException(status_code=401, detail="Invalid Auth Token")

    try:
        token_data = jwt.decode(
            access_token, ACCESS_TOKEN_SECRET, algorithms=[ALGORITHM])
        # Debugging line to check decoded token
        user_id = token_data.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid Auth Token")

        # user_id is string (ULID)
        return user_id

    except (ExpiredSignatureError, InvalidTokenError):
        raise HTTPException(status_code=401, detail="Invalid Auth Token")


# Optional authentication using Access-Token - returns None if no token, user if valid token
async def protected_route_light(credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_header_accessToken), db: AsyncSession = Depends(get_db)):
    access_token = credentials.credentials if credentials else None
    if not access_token:
        return None  # No token provided, return None (anonymous user)

    try:
        token_data = jwt.decode(
            access_token, ACCESS_TOKEN_SECRET, algorithms=[ALGORITHM])
        # Debugging line to check decoded token
        user_id = token_data.get("id")
        if not user_id:
            return None  # Invalid token, treat as anonymous

        # user_id is string (ULID)
        return user_id

    except (ExpiredSignatureError, InvalidTokenError):
        return None  # Invalid/expired token, treat as anonymous


# Verify refresh token and return user


@handle_jwt_exception
async def get_refresh_token(request: Request, db: AsyncSession = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Invalid Refresh Token")
    token = jwt.decode(refresh_token, REFRESH_TOKEN_SECRET,
                       algorithms=[ALGORITHM])
    user_id = token.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid Refresh Token")
    # user_id is string (ULID)
    user = await CRUDUser.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid Refresh Token")
    return user
