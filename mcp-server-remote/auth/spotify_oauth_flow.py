"""
OAuth 2.0 Flow for Spotify.
- Uses Valkey/Redis via VALKEY_CONNECTION_STRING
- Implements auto-auth pattern
- Stores tokens under the 'spotify' service name
"""

import json
import secrets
import time
import os
import logging
from pathlib import Path
from typing import Dict, Optional, List
from authlib.integrations.httpx_client import OAuth2Client

# Setup logging
logger = logging.getLogger(__name__)

# --- Configuration ---
STORAGE_MODE = os.getenv('TOKEN_STORAGE', 'json')
VALKEY_CONN_STRING = os.getenv('VALKEY_CONNECTION_STRING')
SERVER_URL = os.getenv('SERVER_URL', 'http://127.0.0.1:8000')

# --- Spotify Specifics ---
SERVICE_NAME = "spotify"
REDIRECT_URI = f'{SERVER_URL}/auth/spotify_callback'
CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')

if not CLIENT_ID or not CLIENT_SECRET:
    logger.critical("SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not set in .env")

# --- URLs FIXED ---
# Spotify OAuth endpoints
AUTHORIZATION_ENDPOINT = 'https://accounts.spotify.com/authorize'
TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'

# --- Storage Config ---
PROJECT_ROOT = Path(__file__).parent.parent
TOKEN_CACHE_FILE = PROJECT_ROOT / 'spotify_token_cache.json'

# In-memory state storage (for CSRF protection)
oauth_states: Dict[str, dict] = {}

# Storage backend (Copied from google_oauth_flow)
R = None
if VALKEY_CONN_STRING:
    STORAGE_MODE = 'redis'
    try:
        import redis
        R = redis.from_url(VALKEY_CONN_STRING, decode_responses=True)
        R.ping()
        logger.info("✅ Spotify OAuth: Connected to Valkey/Redis")
    except Exception as e:
        logger.error(f"Spotify OAuth (Valkey) error: {e}. Using JSON.")
        STORAGE_MODE = 'json'
        R = None
elif STORAGE_MODE == 'redis':
    try:
        import redis
        R = redis.Redis(decode_responses=True)
        R.ping()
        logger.info("✅ Spotify OAuth: Connected to Redis (localhost default)")
    except Exception as e:
        logger.error(f"Spotify OAuth (Redis) error: {e}. Using JSON.")
        STORAGE_MODE = 'json'
        R = None

if STORAGE_MODE == 'json':
    logger.info(f"📁 Spotify OAuth: Using JSON cache: {TOKEN_CACHE_FILE}")


# --- Storage Functions (Adapted for Spotify) ---
def _read_token_cache() -> dict:
    if not TOKEN_CACHE_FILE.exists():
        return {}
    try:
        with open(TOKEN_CACHE_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}


def _write_token_cache(cache: dict):
    with open(TOKEN_CACHE_FILE, 'w') as f:
        json.dump(cache, f, indent=2)


def get_cached_scopes(user_id: str = "default") -> Optional[str]:
    if STORAGE_MODE == 'redis' and R:
        scopes_key = f"mcp:token:{user_id}:{SERVICE_NAME}:scopes"
        return R.get(scopes_key)
    else:
        cache = _read_token_cache()
        return cache.get(user_id, {}).get(SERVICE_NAME, {}).get('scopes')


def get_cached_token(required_scopes: List[str], user_id: str = "default") -> Optional[str]:
    required_scopes_set = set(required_scopes)

    if STORAGE_MODE == 'redis' and R:
        token_key = f"mcp:token:{user_id}:{SERVICE_NAME}:access_token"
        scopes_key = f"mcp:token:{user_id}:{SERVICE_NAME}:scopes"
        pipe = R.pipeline()
        pipe.get(token_key)
        pipe.get(scopes_key)
        pipe.ttl(token_key)
        access_token, cached_scopes_str, ttl = pipe.execute()
        cached_scopes_str = cached_scopes_str or ""
        expires_at = (time.time() + ttl) if ttl > 0 else 0
    else:
        cache = _read_token_cache()
        service_data = cache.get(user_id, {}).get(SERVICE_NAME, {})
        access_token = service_data.get('access_token')
        expires_at = service_data.get('expires_at', 0)
        cached_scopes_str = service_data.get('scopes', '')

    cached_scopes_set = set(cached_scopes_str.split())

    if not cached_scopes_set:
        logger.warning(f"No Spotify token found for {user_id}. Authorization required.")
        return None

    if not required_scopes_set.issubset(cached_scopes_set):
        missing_scopes = required_scopes_set - cached_scopes_set
        logger.warning(f"Spotify token for {user_id} missing scopes: {missing_scopes}")
        logger.info(f"Required: {required_scopes_set}, Cached: {cached_scopes_set}")
        return None

    if access_token and time.time() < (expires_at - 60):
        logger.debug(f"Valid Spotify token found for {user_id}")
        return access_token

    logger.info(f"Spotify token for {user_id} expired. Refresh needed.")
    return None


def get_refresh_token(user_id: str = "default") -> Optional[str]:
    if STORAGE_MODE == 'redis' and R:
        refresh_key = f"mcp:token:{user_id}:{SERVICE_NAME}:refresh_token"
        return R.get(refresh_key)
    else:
        cache = _read_token_cache()
        return cache.get(user_id, {}).get(SERVICE_NAME, {}).get('refresh_token')


def store_tokens(user_id: str, token_data: dict):
    access_token = token_data['access_token']
    expires_in = token_data['expires_in']
    refresh_token = token_data.get('refresh_token')
    token_scopes = token_data.get('scope', '')

    if STORAGE_MODE == 'redis' and R:
        token_key = f"mcp:token:{user_id}:{SERVICE_NAME}:access_token"
        refresh_key = f"mcp:token:{user_id}:{SERVICE_NAME}:refresh_token"
        scopes_key = f"mcp:token:{user_id}:{SERVICE_NAME}:scopes"
        with R.pipeline() as pipe:
            pipe.setex(token_key, expires_in - 60, access_token)
            pipe.set(scopes_key, token_scopes)
            if refresh_token:
                pipe.set(refresh_key, refresh_token)
            pipe.execute()
        logger.info(f"💾 Spotify tokens stored in Valkey/Redis: {user_id}")
    else:
        cache = _read_token_cache()
        if user_id not in cache:
            cache[user_id] = {}
        expires_at = time.time() + expires_in
        existing_data = cache.get(user_id, {}).get(SERVICE_NAME, {})
        final_refresh_token = refresh_token or existing_data.get('refresh_token')
        final_scopes = token_scopes or existing_data.get('scopes')
        cache[user_id][SERVICE_NAME] = {
            'access_token': access_token,
            'expires_at': expires_at,
            'refresh_token': final_refresh_token,
            'scopes': final_scopes
        }
        _write_token_cache(cache)
        logger.info(f"💾 Spotify tokens stored in JSON: {user_id}")


def create_spotify_authorization_url(scopes: list[str], user_id: str = "default") -> dict:
    scope_str = " ".join(scopes)
    state = secrets.token_urlsafe(32)

    oauth_states[state] = {
        'user_id': user_id,
        'scopes': scope_str,
        'created_at': time.time()
    }

    session = OAuth2Client(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        scope=scope_str,
        redirect_uri=REDIRECT_URI
    )
    authorization_url, _ = session.create_authorization_url(
        AUTHORIZATION_ENDPOINT,
        state=state
    )
    logger.info(f"🔐 Created Spotify auth URL for {user_id}")
    return {'url': authorization_url, 'state': state}


def handle_spotify_callback(code: str, state: str) -> dict:
    if state not in oauth_states:
        raise ValueError("Invalid or expired state parameter")
    state_data = oauth_states.pop(state)
    if time.time() - state_data['created_at'] > 300:
        raise ValueError("Authorization session expired")

    session = OAuth2Client(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        scope=state_data['scopes'],
        redirect_uri=REDIRECT_URI
    )
    token_data = session.fetch_token(
        TOKEN_ENDPOINT,
        code=code,
        grant_type='authorization_code'
    )

    existing_scopes_str = get_cached_scopes(state_data['user_id']) or ""
    existing_scopes = set(existing_scopes_str.split())
    new_scopes_str = token_data.get('scope', '')
    new_scopes = set(new_scopes_str.split())
    all_scopes = existing_scopes.union(new_scopes)
    token_data['scope'] = " ".join(all_scopes)

    store_tokens(state_data['user_id'], token_data)
    logger.info(f"✅ Spotify OAuth completed: {state_data['user_id']}")
    return {
        'success': True,
        'user_id': state_data['user_id'],
        'service': SERVICE_NAME
    }


def refresh_spotify_access_token(user_id: str = "default") -> Optional[str]:
    refresh_token = get_refresh_token(user_id)
    if not refresh_token:
        logger.warning(f"No Spotify refresh token found for {user_id}")
        return None

    old_scopes = get_cached_scopes(user_id)
    try:
        session = OAuth2Client(
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET
        )
        token_data = session.fetch_token(
            TOKEN_ENDPOINT,
            grant_type='refresh_token',
            refresh_token=refresh_token
        )
        if 'refresh_token' not in token_data:
            token_data['refresh_token'] = refresh_token
        if 'scope' not in token_data and old_scopes:
            token_data['scope'] = old_scopes

        store_tokens(user_id, token_data)
        logger.info(f"🔄 Spotify token refreshed: {user_id}")
        return token_data['access_token']
    except Exception as e:
        logger.error(f"Spotify token refresh failed for {user_id}: {e}")
        return None


def get_spotify_token(required_scopes: list[str], user_id: str = "default") -> Optional[str]:
    token = get_cached_token(required_scopes, user_id)
    if token:
        return token

    logger.info(f"Spotify token for {user_id} invalid or missing scopes, attempting refresh...")
    token = refresh_spotify_access_token(user_id)
    if token:
        return get_cached_token(required_scopes, user_id)

    logger.info(f"No valid Spotify token or refresh failed for {user_id}. Full auth required.")
    return None
