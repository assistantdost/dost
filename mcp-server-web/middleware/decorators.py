from fastapi import HTTPException
from functools import wraps
import logging
from typing import Callable
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
# Load environment variables
import os
from dotenv import load_dotenv
load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("ALGORITHM")


def handle_route_exception(func: Callable):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except HTTPException as e:
            logging.error(f"HTTP error: {e}")
            raise e
        except Exception as e:
            logging.error(f"Unexpected error: {e}")
            raise HTTPException(
                status_code=500, detail="An unexpected error occurred")
    return wrapper


def handle_jwt_exception(func: Callable):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
        except Exception as e:
            logging.error(f"Unexpected error: {e}")
            raise HTTPException(
                status_code=500, detail="An unexpected error occurred")
    return wrapper
