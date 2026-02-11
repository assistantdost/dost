"""
OAuth endpoints for FastAPI server.
Handles Google & Spotify OAuth 2.0 authorization flows.
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional, List
import logging

# --- Google Imports ---
from .oauth_flow import (
    create_authorization_url as create_google_auth_url,
    handle_callback as handle_google_callback,
    get_google_token
)
from .google_config import (
    GOOGLE_SERVICE_NAME,
    MASTER_GOOGLE_SCOPES,
    GMAIL_SCOPES,
    CALENDAR_SCOPES,
    CONTACTS_SCOPES
)

# --- Spotify Imports ---
from .spotify_oauth_flow import (
    handle_spotify_callback,
    get_spotify_token
)
# Import *master* scopes from the tool
from tools.spotify_tool import MASTER_SPOTIFY_SCOPES


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])


# --- Request/Response Models ---
class AuthStartRequest(BaseModel):
    """Request to start OAuth flow."""
    service: str = "google_services"
    user_id: str = "default"


class AuthStartResponse(BaseModel):
    """Response with authorization URL."""
    authorization_url: str
    message: str


class TokenStatusResponse(BaseModel):
    """Token availability status."""
    has_token: bool
    user_id: str
    service: str
    missing_scopes: Optional[List[str]] = None


# --- Success HTML Page ---
SUCCESS_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>✅ Authorization Successful</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: grid;
            place-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 3rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 500px;
        }
        h1 {
            color: #4CAF50;
            font-size: 2rem;
            margin-bottom: 1rem;
        }
        p {
            color: #666;
            font-size: 1.1rem;
            line-height: 1.6;
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        .close-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-size: 1rem;
            cursor: pointer;
            margin-top: 1.5rem;
        }
        .close-btn:hover {
            background: #5568d3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">✅</div>
        <h1>Authorization Successful!</h1>
        <p>You have successfully authorized the application.</p>
        <p>You can now close this window and return to the application.</p>
        <button class="close-btn" onclick="window.close()">Close Window</button>
    </div>
    <script>
        // Auto-close after 3 seconds (optional)
        setTimeout(() => {
            window.close();
        }, 3000);
    </script>
</body>
</html>
"""


# --- Google Endpoints ---
google_scopes_map = {
    GOOGLE_SERVICE_NAME: MASTER_GOOGLE_SCOPES,
    "google_gmail": GMAIL_SCOPES,
    "google_calendar": CALENDAR_SCOPES,
    "google_contacts": CONTACTS_SCOPES,
}


@router.post("/start", response_model=AuthStartResponse)
async def start_oauth(request: AuthStartRequest):
    """
    Start Google OAuth 2.0 authorization flow.
    Returns authorization URL for user to open in browser.
    """
    scopes = google_scopes_map.get(request.service)
    if not scopes:
        raise HTTPException(status_code=400, detail=f"Unknown service: {request.service}")

    try:
        auth_data = create_google_auth_url(
            scopes=scopes,
            user_id=request.user_id,
            service_name=GOOGLE_SERVICE_NAME
        )
        logger.info(f"🔐 Google Auth started for {request.user_id}/{request.service}")
        return AuthStartResponse(
            authorization_url=auth_data['url'],
            message="Please open the authorization URL in your browser"
        )
    except Exception as e:
        logger.error(f"Google Auth start failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/callback", response_class=HTMLResponse)
async def oauth_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: str = Query(..., description="State parameter for CSRF protection"),
    error: Optional[str] = Query(None, description="Error if user denied")
):
    """
    OAuth callback endpoint for Google.
    """
    if error:
        error_html = f"""
        <!DOCTYPE html>
        <html>
        <head><title>Authorization Denied</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #f44336;">❌ Authorization Denied</h1>
            <p>You denied the authorization request.</p>
            <p>Error: {error}</p>
            <p>You can close this window.</p>
        </body>
        </html>
        """
        return HTMLResponse(content=error_html)

    try:
        result = handle_google_callback(code, state)
        logger.info(f"✅ Google OAuth callback processed: {result['user_id']}/{result['service']}")
        return HTMLResponse(content=SUCCESS_HTML)
    except ValueError as e:
        logger.error(f"Google Callback validation failed: {e}")
        error_html = f"""
        <!DOCTYPE html>
        <html>
        <head><title>Authorization Error</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #f44336;">❌ Authorization Error</h1>
            <p>{str(e)}</p>
            <p>Please try again.</p>
        </body>
        </html>
        """
        return HTMLResponse(content=error_html)
    except Exception as e:
        logger.error(f"Google Callback processing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/google/{service}", response_model=TokenStatusResponse)
async def check_google_token_status(
    service: str,
    user_id: str = Query("default", description="User identifier")
):
    """
    Check if user has valid token for a Google service.
    """
    scopes = google_scopes_map.get(service)
    if not scopes:
        raise HTTPException(status_code=400, detail=f"Unknown service: {service}")

    token = get_google_token(GOOGLE_SERVICE_NAME, scopes, user_id)

    return TokenStatusResponse(
        has_token=token is not None,
        user_id=user_id,
        service=service
    )


# --- Spotify Endpoints ---

class SpotifyAuthStartRequest(BaseModel):
    """Request to start Spotify OAuth flow."""
    user_id: str = "default"


@router.post("/start_spotify", response_model=AuthStartResponse)
async def start_spotify_oauth(request: SpotifyAuthStartRequest):
    """
    Start Spotify OAuth 2.0 authorization flow.
    Returns authorization URL for user to open in browser.
    """
    try:
        from .spotify_oauth_flow import create_spotify_authorization_url

        auth_data = create_spotify_authorization_url(
            scopes=MASTER_SPOTIFY_SCOPES,
            user_id=request.user_id
        )
        logger.info(f"🔐 Spotify Auth started for {request.user_id}")
        return AuthStartResponse(
            authorization_url=auth_data['url'],
            message="Please open the authorization URL in your browser"
        )
    except Exception as e:
        logger.error(f"Spotify Auth start failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/spotify_callback", response_class=HTMLResponse)
async def spotify_callback(
    code: str = Query(..., description="Authorization code from Spotify"),
    state: str = Query(..., description="State parameter for CSRF protection"),
    error: Optional[str] = Query(None, description="Error if user denied")
):
    """
    OAuth callback endpoint for Spotify.
    """
    if error:
        error_html = f"""
        <!DOCTYPE html>
        <html>
        <head><title>Authorization Denied</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #f44336;">❌ Authorization Denied</h1>
            <p>You denied the authorization request.</p>
            <p>Error: {error}</p>
            <p>You can close this window.</p>
        </body>
        </html>
        """
        return HTMLResponse(content=error_html)

    try:
        result = handle_spotify_callback(code, state)
        logger.info(f"✅ Spotify OAuth callback processed: {result['user_id']}/{result['service']}")
        return HTMLResponse(content=SUCCESS_HTML)
    except ValueError as e:
        logger.error(f"Spotify Callback validation failed: {e}")
        error_html = f"""
        <!DOCTYPE html>
        <html>
        <head><title>Authorization Error</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #f44336;">❌ Authorization Error</h1>
            <p>{str(e)}</p>
            <p>Please try again.</p>
        </body>
        </html>
        """
        return HTMLResponse(content=error_html)
    except Exception as e:
        logger.error(f"Spotify Callback processing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/spotify", response_model=TokenStatusResponse)
async def check_spotify_token_status(
    user_id: str = Query("default", description="User identifier")
):
    """
    Check if user has valid token for Spotify.
    """
    # Check for the master scopes from the tool
    token = get_spotify_token(MASTER_SPOTIFY_SCOPES, user_id)
    return TokenStatusResponse(
        has_token=token is not None,
        user_id=user_id,
        service="spotify"
    )


# --- Common Endpoints ---

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "oauth"}
