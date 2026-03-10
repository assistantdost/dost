import hashlib
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from crud.users import CRUDAPIKey

router = APIRouter()


def hash_key(key: str):
    return hashlib.sha256(key.encode()).hexdigest()


class ValidateAPIKeyRequest(BaseModel):
    api_key: str


@router.post("/validate-api-key")
async def validate_api_key(
    body: ValidateAPIKeyRequest,
    db: AsyncSession = Depends(get_db),
):
    if not body.api_key:
        raise HTTPException(status_code=401, detail="API key is required")

    key_hash = hash_key(body.api_key)
    api_key = await CRUDAPIKey.get_by_key_hash(db, key_hash)

    if not api_key:
        raise HTTPException(status_code=401, detail="Invalid or revoked API key")

    return {
        "valid": True,
        "api_key": {
            "id": api_key.id,
            "name": api_key.name,
            "user_id": api_key.user_id,
            "created_at": api_key.created_at,
            "last_used": api_key.last_used,
        },
    }