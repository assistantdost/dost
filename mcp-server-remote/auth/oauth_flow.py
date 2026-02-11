"""
OAuth 2.0 Flow for Remote FastAPI Server
Uses server-side endpoints instead of localhost callback server.

Updates:
- Added Valkey connection string support.
- Stores and validates token scopes to support a single, unified Google token.
- Handles progressive authorization (adding scopes to an existing token).
"""

import json
import secrets
import time
import os
import logging
from pathlib import Path
from typing import Dict, Optional, List
from authlib.integrations.httpx_client import OAuth2Client
from dotenv import load_dotenv

# Setup logging
logger = logging.getLogger(__name__)
load_dotenv()

# --- Configuration ---
STORAGE_MODE = os.getenv('TOKEN_STORAGE', 'json')
VALKEY_CONN_STRING = os.getenv('VALKEY_CONNECTION_STRING')

# Get server URL from environment (for callback)
SERVER_URL = os.getenv('SERVER_URL', 'http://127.0.0.1:8000')
REDIRECT_URI = f'{SERVER_URL}/auth/callback'

# File paths
try:
    PROJECT_ROOT = Path(__file__).parent.parent
    CLIENT_SECRET_FILE = PROJECT_ROOT / 'client_secret.json'
    TOKEN_CACHE_FILE = PROJECT_ROOT / 'token_cache.json'

    with open(CLIENT_SECRET_FILE, 'r') as f:
        creds_data = json.load(f)
        google_creds = creds_data.get('web') or creds_data.get('installed') or creds_data
        CLIENT_ID = google_creds['client_id']
        CLIENT_SECRET = google_creds['client_secret']
except FileNotFoundError:
    logger.critical("'client_secret.json' not found")
    CLIENT_ID, CLIENT_SECRET = None, None
except KeyError as e:
    logger.critical(f"Invalid client_secret.json format: missing {e}")
    CLIENT_ID, CLIENT_SECRET = None, None

# Google OAuth endpoints
AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

# In-memory state storage (for CSRF protection)
oauth_states: Dict[str, dict] = {}

# Storage backend
R = None

# --- Valkey/Redis Connection ---
if VALKEY_CONN_STRING:
    STORAGE_MODE = 'redis'  # Prioritize Valkey/Redis if string is present
    try:
        import redis
        R = redis.from_url(VALKEY_CONN_STRING, decode_responses=True)
        R.ping()
        logger.info("✅ Connected to Valkey/Redis via connection string")
    except Exception as e:
        logger.error(f"Valkey/Redis (from string) error: {e}. Using JSON mode.")
        STORAGE_MODE = 'json'
        R = None
elif STORAGE_MODE == 'redis':
    # Fallback to default localhost if STORAGE_MODE='redis' but no string
    try:
        import redis
        R = redis.Redis(decode_responses=True)
        R.ping()
        logger.info("✅ Connected to Redis (localhost default)")
    except Exception as e:
        logger.error(f"Redis (default) error: {e}. Using JSON mode.")
        STORAGE_MODE = 'json'
        R = None

if STORAGE_MODE == 'json':
    logger.info(f"📁 Using JSON cache: {TOKEN_CACHE_FILE}")


# --- Storage Functions ---
def _read_token_cache() -> dict:
    """Read token cache from JSON file."""
    if not TOKEN_CACHE_FILE.exists():
        return {}
    try:
        with open(TOKEN_CACHE_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}


def _write_token_cache(cache: dict):
    """Write token cache to JSON file."""
    with open(TOKEN_CACHE_FILE, 'w') as f:
        json.dump(cache, f, indent=2)


def get_cached_scopes(service_name: str, user_id: str = "default") -> Optional[str]:
    """Get the space-separated scope string from cache."""
    if STORAGE_MODE == 'redis' and R:
        scopes_key = f"mcp:token:{user_id}:{service_name}:scopes"
        return R.get(scopes_key)
    else:
        cache = _read_token_cache()
        return cache.get(user_id, {}).get(service_name, {}).get('scopes')


def get_cached_token(
    service_name: str,
    required_scopes: List[str],
    user_id: str = "default"
) -> Optional[str]:
    """Get cached access token if valid and has required scopes."""
    required_scopes_set = set(required_scopes)

    if STORAGE_MODE == 'redis' and R:
        token_key = f"mcp:token:{user_id}:{service_name}:access_token"
        scopes_key = f"mcp:token:{user_id}:{service_name}:scopes"

        # Use pipeline to get multiple keys efficiently
        pipe = R.pipeline()
        pipe.get(token_key)
        pipe.get(scopes_key)
        pipe.ttl(token_key)
        access_token, cached_scopes_str, ttl = pipe.execute()

        cached_scopes_str = cached_scopes_str or ""
        expires_at = (time.time() + ttl) if ttl > 0 else 0

    else:
        cache = _read_token_cache()
        service_data = cache.get(user_id, {}).get(service_name, {})
        access_token = service_data.get('access_token')
        expires_at = service_data.get('expires_at', 0)
        cached_scopes_str = service_data.get('scopes', '')

    # Validate scopes
    cached_scopes_set = set(cached_scopes_str.split())
    if not required_scopes_set.issubset(cached_scopes_set):
        logger.warning(f"Token for {user_id}/{service_name} found, but missing scopes: {required_scopes_set - cached_scopes_set}")
        return None  # Token exists but has insufficient scopes

    # Validate expiration
    if access_token and time.time() < (expires_at - 60):
        return access_token

    return None


def get_refresh_token(service_name: str, user_id: str = "default") -> Optional[str]:
    """Get refresh token from cache."""
    if STORAGE_MODE == 'redis' and R:
        refresh_key = f"mcp:token:{user_id}:{service_name}:refresh_token"
        return R.get(refresh_key)
    else:
        cache = _read_token_cache()
        return cache.get(user_id, {}).get(service_name, {}).get('refresh_token')


def store_tokens(service_name: str, user_id: str, token_data: dict):
    """Save tokens to cache, including scopes."""
    access_token = token_data['access_token']
    expires_in = token_data['expires_in']
    refresh_token = token_data.get('refresh_token')
    # Get scopes from the token response, default to empty string
    token_scopes = token_data.get('scope', '')

    if STORAGE_MODE == 'redis' and R:
        token_key = f"mcp:token:{user_id}:{service_name}:access_token"
        refresh_key = f"mcp:token:{user_id}:{service_name}:refresh_token"
        scopes_key = f"mcp:token:{user_id}:{service_name}:scopes"

        with R.pipeline() as pipe:
            pipe.setex(token_key, expires_in - 60, access_token)
            pipe.set(scopes_key, token_scopes)
            if refresh_token:
                pipe.set(refresh_key, refresh_token)
            pipe.execute()

        logger.info(f"💾 Tokens stored in Valkey/Redis: {service_name}/{user_id}")
    else:
        cache = _read_token_cache()

        if user_id not in cache:
            cache[user_id] = {}

        expires_at = time.time() + expires_in
        # Preserve existing refresh token or scopes if not in new token data
        existing_data = cache.get(user_id, {}).get(service_name, {})
        final_refresh_token = refresh_token or existing_data.get('refresh_token')
        final_scopes = token_scopes or existing_data.get('scopes')

        cache[user_id][service_name] = {
            'access_token': access_token,
            'expires_at': expires_at,
            'refresh_token': final_refresh_token,
            'scopes': final_scopes  # Store the scopes
        }

        _write_token_cache(cache)
        logger.info(f"💾 Tokens stored in JSON: {service_name}/{user_id}")


def create_authorization_url(scopes: list[str], user_id: str = "default", service_name: str = "google") -> dict:
    """
    Create OAuth authorization URL.
    Returns: dict with 'url' and 'state' for CSRF protection.
    """
    scope_str = " ".join(scopes)
    state = secrets.token_urlsafe(32)

    # Store state and metadata for callback validation
    oauth_states[state] = {
        'user_id': user_id,
        'service_name': service_name,
        'scopes': scope_str,
        'created_at': time.time()
    }

    session = OAuth2Client(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        scope=scope_str,
        redirect_uri=REDIRECT_URI,
    )

    authorization_url, _ = session.create_authorization_url(
        AUTHORIZATION_ENDPOINT,
        state=state,
        # Ensure we ask for a refresh token every time
        access_type='offline',
        prompt='consent'
    )

    logger.info(f"🔐 Created auth URL for {service_name}/{user_id}")
    return {
        'url': authorization_url,
        'state': state
    }


def handle_callback(code: str, state: str) -> dict:
    """
    Handle OAuth callback with authorization code.
    Returns: dict with success status and message.
    """
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
        code=code
    )

    # Combine new scopes with any existing ones for this service
    existing_scopes_str = get_cached_scopes(state_data['service_name'], state_data['user_id']) or ""
    existing_scopes = set(existing_scopes_str.split())

    new_scopes_str = token_data.get('scope', '')
    new_scopes = set(new_scopes_str.split())

    # Create a union of old and new scopes
    all_scopes = existing_scopes.union(new_scopes)
    token_data['scope'] = " ".join(all_scopes)  # Store the combined set

    store_tokens(
        state_data['service_name'],
        state_data['user_id'],
        token_data
    )

    logger.info(f"✅ OAuth completed: {state_data['service_name']}/{state_data['user_id']}")
    return {
        'success': True,
        'user_id': state_data['user_id'],
        'service': state_data['service_name']
    }


def refresh_access_token(service_name: str, user_id: str = "default") -> Optional[str]:
    """Refresh access token using refresh token."""
    refresh_token = get_refresh_token(service_name, user_id)
    if not refresh_token:
        logger.warning(f"No refresh token found for {user_id}/{service_name}")
        return None

    # Get old scopes to preserve them
    old_scopes = get_cached_scopes(service_name, user_id)

    try:
        session = OAuth2Client(
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET,
            redirect_uri=REDIRECT_URI
        )

        token_data = session.fetch_token(
            TOKEN_ENDPOINT,
            grant_type='refresh_token',
            refresh_token=refresh_token
        )

        # Preserve refresh token and scopes if not returned
        if 'refresh_token' not in token_data:
            token_data['refresh_token'] = refresh_token
        if 'scope' not in token_data and old_scopes:
            token_data['scope'] = old_scopes

        store_tokens(service_name, user_id, token_data)
        logger.info(f"🔄 Token refreshed: {service_name}/{user_id}")
        return token_data['access_token']
    except Exception as e:
        logger.error(f"Token refresh failed for {user_id}/{service_name}: {e}")
        return None


def get_google_token(service_name: str, scopes: list[str], user_id: str = "default") -> Optional[str]:
    """
    Get valid access token, refreshing if needed.
    Validates that the token has the required scopes.
    Returns None if authorization is required.
    """
    # Try cached token (this now checks scopes)
    token = get_cached_token(service_name, scopes, user_id)
    if token:
        return token

    # Try refresh (if refresh fails, it returns None)
    logger.info(f"Token for {user_id}/{service_name} invalid or missing scopes, attempting refresh...")
    token = refresh_access_token(service_name, user_id)

    if token:
        # After refresh, re-check the token and its scopes
        # This covers the case where refresh worked but scopes are still insufficient
        return get_cached_token(service_name, scopes, user_id)

    # Need full authorization
    logger.info(f"No valid token or refresh failed for {user_id}/{service_name}. Full auth required.")
    return None
