import hashlib
import httpx
import json
import os
from fastapi import Security, HTTPException
from fastapi.security import APIKeyHeader
from redis import asyncio as aioredis

MAIN_SERVER_URL = os.getenv("MAIN_SERVER_URL", "http://localhost:8000")
VALIDATE_URL = f"{MAIN_SERVER_URL}/internal/validate-api-key"

VALKEY_CONN_STRING = os.getenv("VALKEY_CONNECTION_STRING", "redis://localhost:6379")

redis_client = aioredis.from_url(VALKEY_CONN_STRING, decode_responses=True)

api_key_header = APIKeyHeader(name="X-API-Key")


def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


async def verify_api_key(api_key: str = Security(api_key_header)):
    key_hash = hash_key(api_key)
    redis_key = f"apikey:{key_hash}"

    # 1. Check cache
    cached = await redis_client.get(redis_key)
    if cached:
        return json.loads(cached)

    # 2. Call main server
    async with httpx.AsyncClient() as client:
        resp = await client.post(VALIDATE_URL, json={"api_key": api_key})
        data = resp.json()

    if not data.get("valid"):
        raise HTTPException(status_code=403, detail="Invalid or revoked API key")

    # 3. Cache result for 10 min
    await redis_client.setex(redis_key, 600, json.dumps(data))

    return data

