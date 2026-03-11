import hashlib
import httpx
import json
import os
from fastapi import Security, HTTPException, Request
from fastapi.security import APIKeyHeader
from redis import asyncio as aioredis

MAIN_SERVER_URL = os.getenv("MAIN_SERVER_URL", "http://localhost:8000")
VALIDATE_URL = f"{MAIN_SERVER_URL}/internal/validate-api-key"

VALKEY_CONN_STRING = os.getenv("VALKEY_CONNECTION_STRING", "redis://localhost:6379")

redis_client = aioredis.from_url(VALKEY_CONN_STRING, decode_responses=True)

api_key_header = APIKeyHeader(name="X-API-Key")


def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


async def validate_key(api_key: str) -> dict:
    """Core validation: cache → main server. Returns user data dict."""
    redis_key = f"apikey:{hash_key(api_key)}"

    cached = await redis_client.get(redis_key)
    if cached:
        return json.loads(cached)

    async with httpx.AsyncClient() as client:
        resp = await client.post(VALIDATE_URL, json={"api_key": api_key})
        data = resp.json()

    if not data.get("valid"):
        raise HTTPException(status_code=403, detail="Invalid or revoked API key")

    await redis_client.setex(redis_key, 600, json.dumps(data))
    return data


async def verify_api_key(api_key: str = Security(api_key_header)) -> dict:
    """FastAPI dependency for protected routes — returns validated user data."""
    return await validate_key(api_key)


def get_current_user(request: Request) -> dict:
    """Dependency to access the user injected by api_key_middleware."""
    return request.state.user

