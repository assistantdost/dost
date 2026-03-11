import hashlib
import httpx
import json
import os
from fastmcp.server.auth import AuthProvider
from redis import asyncio as aioredis

MAIN_SERVER_URL = os.getenv("MAIN_SERVER_URL", "http://localhost:8000")
VALIDATE_URL = f"{MAIN_SERVER_URL}/internal/validate-api-key"

VALKEY_CONN_STRING = os.getenv("VALKEY_CONNECTION_STRING", "redis://localhost:6379")

redis_client = aioredis.from_url(VALKEY_CONN_STRING, decode_responses=True)


def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


async def validate_key(api_key: str) -> dict:
    """Cache → main server validation. Returns user data dict or None."""
    redis_key = f"apikey:{hash_key(api_key)}"

    cached = await redis_client.get(redis_key)
    if cached:
        return json.loads(cached)

    async with httpx.AsyncClient() as client:
        resp = await client.post(VALIDATE_URL, json={"api_key": api_key})
        data = resp.json()

    if not data.get("valid"):
        return None

    await redis_client.setex(redis_key, 600, json.dumps(data))
    return data


class APIKeyAuth(AuthProvider):
    async def authenticate(self, request):
        api_key = request.headers.get("X-API-Key")

        if not api_key:
            return None

        data = await validate_key(api_key)

        if not data:
            return None

        return {"sub": data["api_key"]["user_id"]}

