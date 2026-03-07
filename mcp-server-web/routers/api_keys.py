from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from crud.users import CRUDAPIKey
from middleware.decorators import handle_route_exception
from middleware.helper import protected_route_cache_user

router = APIRouter()


class CreateAPIKeyRequest(BaseModel):
    name: str


@router.get("")
@handle_route_exception
async def list_api_keys(
    user=Depends(protected_route_cache_user),
    db: AsyncSession = Depends(get_db),
):
    keys = await CRUDAPIKey.get_by_user(db, user["id"])
    return {
        "message": "API keys retrieved successfully",
        "api_keys": [
            {
                "id": key.id,
                "name": key.name,
                "created_at": key.created_at,
                "last_used": key.last_used,
            }
            for key in keys
        ],
    }


@router.post("")
@handle_route_exception
async def create_api_key(
    body: CreateAPIKeyRequest,
    user=Depends(protected_route_cache_user),
    db: AsyncSession = Depends(get_db),
):
    raw_key, key_hash = CRUDAPIKey.generate_key()
    key = await CRUDAPIKey.create(db, user["id"], body.name, key_hash)
    return {
        "message": "API key created successfully",
        "api_key": {
            "id": key.id,
            "name": key.name,
            "key": raw_key,  # shown once — store it safely
            "created_at": key.created_at,
        },
    }


@router.patch("/{key_id}/revoke")
@handle_route_exception
async def revoke_api_key(
    key_id: str,
    user=Depends(protected_route_cache_user),
    db: AsyncSession = Depends(get_db),
):
    success = await CRUDAPIKey.revoke(db, key_id, user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="API key not found")
    return {"message": "API key revoked successfully"}


@router.delete("/{key_id}")
@handle_route_exception
async def delete_api_key(
    key_id: str,
    user=Depends(protected_route_cache_user),
    db: AsyncSession = Depends(get_db),
):
    success = await CRUDAPIKey.delete(db, key_id, user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="API key not found")
    return {"message": "API key deleted successfully"}
