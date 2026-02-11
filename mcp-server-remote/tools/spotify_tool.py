import httpx
import logging
from typing import Optional, List, Dict, Any

# Import OAuth functions from our new spotify_oauth_flow
from auth.spotify_oauth_flow import (
    get_spotify_token,
    create_spotify_authorization_url
)

# Setup logging
logger = logging.getLogger(__name__)

# --- MASTER SCOPES ---
MASTER_SPOTIFY_SCOPES = [
    'user-read-playback-state',
    'user-read-currently-playing',
    'user-modify-playback-state'
]


# --- Internal Helper ---
def _handle_spotify_auth_flow(required_scopes: List[str], user_id: str) -> Optional[str]:
    """
    Internal helper to check for a token or return an auth URL.
    Returns: A valid token string, or a JSON string with an error and auth URL.
    """
    token = get_spotify_token(required_scopes, user_id)
    if not token:
        auth_data = create_spotify_authorization_url(MASTER_SPOTIFY_SCOPES, user_id)
        return (
            f"❌ Authorization required for Spotify.\n"
            f"Please open this URL in your browser to authorize the application:\n"
            f"{auth_data['url']}\n\n"
            f"After authorizing, please run your request again."
        )
    return token


def _handle_spotify_api_error(e: httpx.HTTPStatusError) -> str:
    """Internal helper to format Spotify API errors."""
    if e.response.status_code == 401:
        return (
            "Error: Spotify authentication failed. Token may be invalid or expired.\n"
            "Please re-authorize the application by calling any Spotify function again."
        )
    if e.response.status_code == 403:
        try:
            error_detail = e.response.json()
            message = error_detail.get('error', {}).get('message', 'Permission denied.')
            reason = error_detail.get('error', {}).get('reason')
            if reason == "NO_ACTIVE_DEVICE":
                return "Error: No active Spotify device found. Please use 'list_spotify_devices' to see available devices and 'set_spotify_device' to activate one."    # noqa

            # Enhanced scope error message
            return (
                f"Error: Permission denied (403). {message}\n"
                f"Your token may be missing required scopes. You may need to re-authorize.\n"
                f"Required scopes: {', '.join(MASTER_SPOTIFY_SCOPES)}"
            )
        except Exception:
            return (
                "Error: Permission denied (403). Your token may be missing required scopes.\n"
                f"Required scopes: {', '.join(MASTER_SPOTIFY_SCOPES)}\n"
                "Please re-authorize the application."
            )
    if e.response.status_code == 404:
        try:
            error_detail = e.response.json()
            message = error_detail.get('error', {}).get('message', 'Not found.')
            reason = error_detail.get('error', {}).get('reason')
            if reason == "NO_ACTIVE_DEVICE":    # 404 can also mean no active device
                return "Error: No active Spotify device found. Please use 'list_spotify_devices' to see available devices and 'set_spotify_device' to activate one."    # noqa
            return f"Error: Not found (404). {message}"
        except Exception:
            return "Error: Not found (404)."
    try:
        error_detail = e.response.json()
        return f"HTTP Error {e.response.status_code}: {error_detail}"
    except (ValueError, KeyError):
        return f"HTTP Error {e.response.status_code}: {e.response.text[:200]}"


# --- Spotify Tools ---

def get_current_playback(user_id: str = "default") -> str:
    """
    Gets the user's currently playing track on Spotify.

    Args:
        user_id: User identifier for multi-user support (default: "default").
    """
    required_scopes = ['user-read-playback-state', 'user-read-currently-playing']
    auth_result = _handle_spotify_auth_flow(required_scopes, user_id)
    if "❌" in auth_result:
        return auth_result

    token = auth_result
    try:
        headers = {"Authorization": f"Bearer {token}"}
        # --- URL FIXED ---
        api_url = "https://api.spotify.com/v1/me/player/currently-playing"

        logger.debug(f"Spotify API call: {api_url}")
        logger.debug(f"Token (first 10 chars): {token[:10]}...")

        # --- HTTX PATTERN FIXED ---
        with httpx.Client() as client:
            response = client.get(api_url, headers=headers)

            if response.status_code == 204:
                return "No track is currently playing on Spotify."

            logger.debug(f"Spotify response status: {response.status_code}")
            response.raise_for_status()
            data = response.json()

            if data and data.get('is_playing'):
                track = data.get('item', {})
                if track:
                    artist_name = track['artists'][0]['name'] if track.get('artists') else 'Unknown Artist'
                    track_name = track.get('name', 'Unknown Track')
                    device_name = data.get('device', {}).get('name', 'Unknown Device')
                    track_uri = track.get('uri', 'N/A')
                    track_url = track.get('external_urls', {}).get('spotify', 'N/A')
                    album_name = track.get('album', {}).get('name', 'Unknown Album')

                    return (
                        f"Currently playing on Spotify:\n"
                        f"  Track: {track_name}\n"
                        f"  Artist: {artist_name}\n"
                        f"  Album: {album_name}\n"
                        f"  Device: {device_name}\n"
                        f"  URI: {track_uri}\n"
                        f"  URL: {track_url}"
                    )
            return "Nothing appears to be playing on Spotify."

    except httpx.HTTPStatusError as e:
        return _handle_spotify_api_error(e)
    except httpx.RequestError as e:
        return f"Network error: Could not connect to Spotify API. {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"


def list_spotify_devices(user_id: str = "default") -> str:
    """
    Lists all available devices (computers, phones, speakers) on the user's Spotify account.
    Use this if a user needs to choose a device to play music on.

    Args:
        user_id: User identifier for multi-user support (default: "default").
    """
    required_scopes = ['user-read-playback-state']
    auth_result = _handle_spotify_auth_flow(required_scopes, user_id)
    if "❌" in auth_result:
        return auth_result

    token = auth_result
    try:
        headers = {"Authorization": f"Bearer {token}"}
        # --- URL FIXED ---
        api_url = "https://api.spotify.com/v1/me/player/devices"

        # --- HTTX PATTERN FIXED ---
        with httpx.Client() as client:
            response = client.get(api_url, headers=headers)
            response.raise_for_status()

            devices = response.json().get('devices', [])
            if not devices:
                return "No available Spotify devices found. Please open Spotify on one of your devices."

            device_list = ["Available Spotify devices:"]
            for device in devices:
                name = device.get('name', 'Unknown')
                device_type = device.get('type', 'Unknown')
                device_id = device.get('id', 'N/A')
                is_active = device.get('is_active', False)
                status = " (Currently Active)" if is_active else ""
                device_list.append(f"- Name: {name}, Type: {device_type}, ID: {device_id}{status}")

            return "\n".join(device_list)

    except httpx.HTTPStatusError as e:
        return _handle_spotify_api_error(e)
    except httpx.RequestError as e:
        return f"Network error: Could not connect to Spotify API. {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"


def set_spotify_device(device_id: str, play: bool = False, user_id: str = "default") -> str:
    """
    Transfers Spotify playback to a specific device ID.
    Get the device_id from the 'list_spotify_devices' tool.

    Args:
        device_id: The ID of the device to transfer playback to.
        play: (Optional) If true, playback will start on the new device (default: false).
        user_id: User identifier for multi-user support (default: "default").
    """
    required_scopes = ['user-modify-playback-state']
    auth_result = _handle_spotify_auth_flow(required_scopes, user_id)
    if "❌" in auth_result:
        return auth_result

    token = auth_result
    try:
        headers = {"Authorization": f"Bearer {token}"}
        # --- URL FIXED ---
        api_url = "https://api.spotify.com/v1/me/player"
        payload = {
            "device_ids": [device_id],
            "play": play
        }

        # --- HTTX PATTERN FIXED ---
        with httpx.Client() as client:
            response = client.put(api_url, headers=headers, json=payload)
            if response.status_code == 204:
                return "✅ Spotify playback transferred to the selected device."
            response.raise_for_status()
            return "✅ Spotify playback transferred to the selected device."

    except httpx.HTTPStatusError as e:
        return _handle_spotify_api_error(e)
    except httpx.RequestError as e:
        return f"Network error: Could not connect to Spotify API. {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"


def play_spotify(user_id: str = "default") -> str:
    """
    Resumes playback on the user's active Spotify device.
    If this fails with 'No active device', use 'list_spotify_devices' to ask the user to pick one.

    Args:
        user_id: User identifier for multi-user support (default: "default").
    """
    required_scopes = ['user-modify-playback-state']
    auth_result = _handle_spotify_auth_flow(required_scopes, user_id)
    if "❌" in auth_result:
        return auth_result

    token = auth_result
    try:
        headers = {"Authorization": f"Bearer {token}"}
        # --- URL FIXED ---
        api_url = "https://api.spotify.com/v1/me/player/play"

        # --- HTTX PATTERN FIXED ---
        with httpx.Client() as client:
            response = client.put(api_url, headers=headers)
            if response.status_code == 204:
                return "▶️ Playback resumed on Spotify."
            response.raise_for_status()
            return "▶️ Playback resumed on Spotify."

    except httpx.HTTPStatusError as e:
        return _handle_spotify_api_error(e)
    except httpx.RequestError as e:
        return f"Network error: Could not connect to Spotify API. {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"


def pause_spotify(user_id: str = "default") -> str:
    """
    Pauses playback on the user's active Spotify device.
    If this fails with 'No active device', use 'list_spotify_devices'.

    Args:
        user_id: User identifier for multi-user support (default: "default").
    """
    required_scopes = ['user-modify-playback-state']
    auth_result = _handle_spotify_auth_flow(required_scopes, user_id)
    if "❌" in auth_result:
        return auth_result

    token = auth_result
    try:
        headers = {"Authorization": f"Bearer {token}"}
        # --- URL FIXED ---
        api_url = "https://api.spotify.com/v1/me/player/pause"

        # --- HTTX PATTERN FIXED ---
        with httpx.Client() as client:
            response = client.put(api_url, headers=headers)
            if response.status_code == 204:
                return "⏸️ Playback paused on Spotify."
            response.raise_for_status()
            return "⏸️ Playback paused on Spotify."

    except httpx.HTTPStatusError as e:
        return _handle_spotify_api_error(e)
    except httpx.RequestError as e:
        return f"Network error: Could not connect to Spotify API. {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"


def next_track_spotify(user_id: str = "default") -> str:
    """
    Skips to the next track on Spotify.
    If this fails with 'No active device', use 'list_spotify_devices'.

    Args:
        user_id: User identifier for multi-user support (default: "default").
    """
    required_scopes = ['user-modify-playback-state']
    auth_result = _handle_spotify_auth_flow(required_scopes, user_id)
    if "❌" in auth_result:
        return auth_result

    token = auth_result
    try:
        headers = {"Authorization": f"Bearer {token}"}
        # --- URL FIXED ---
        api_url = "https://api.spotify.com/v1/me/player/next"

        # --- HTTX PATTERN FIXED ---
        with httpx.Client() as client:
            response = client.post(api_url, headers=headers)
            if response.status_code == 204:
                return "⏭️ Skipped to next track on Spotify."
            response.raise_for_status()
            return "⏭️ Skipped to next track on Spotify."

    except httpx.HTTPStatusError as e:
        return _handle_spotify_api_error(e)
    except httpx.RequestError as e:
        return f"Network error: Could not connect to Spotify API. {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"


def previous_track_spotify(user_id: str = "default") -> str:
    """
    Skips to the previous track on Spotify.
    If this fails with 'No active device', use 'list_spotify_devices'.

    Args:
        user_id: User identifier for multi-user support (default: "default").
    """
    required_scopes = ['user-modify-playback-state']
    auth_result = _handle_spotify_auth_flow(required_scopes, user_id)
    if "❌" in auth_result:
        return auth_result

    token = auth_result
    try:
        headers = {"Authorization": f"Bearer {token}"}
        # --- URL FIXED ---
        api_url = "https://api.spotify.com/v1/me/player/previous"

        # --- HTTX PATTERN FIXED ---
        with httpx.Client() as client:
            response = client.post(api_url, headers=headers)
            if response.status_code == 204:
                return "⏮️ Skipped to previous track on Spotify."
            response.raise_for_status()
            return "⏮️ Skipped to previous track on Spotify."

    except httpx.HTTPStatusError as e:
        return _handle_spotify_api_error(e)
    except httpx.RequestError as e:
        return f"Network error: Could not connect to Spotify API. {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"


def start_spotify_playback(
    context_uri: Optional[str] = None,
    uris: Optional[List[str]] = None,
    user_id: str = "default"
) -> str:
    """
    Starts new playback on Spotify. Can play an album, artist, playlist, or specific track(s).
    If this fails with 'No active device', use 'list_spotify_devices' to ask the user to pick one.

    Examples:
    - Play an album: context_uri="spotify:album:1Je1IMUlBXcx1Fz0WE7oPT"
    - Play a track: uris=["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"]

    Args:
        context_uri (Optional[str]): The Spotify URI of the context to play (album, artist, playlist).
        uris (Optional[List[str]]): A list of Spotify track URIs to play.
        user_id (str): User identifier for multi-user support (default: "default").
    """
    required_scopes = ['user-modify-playback-state']
    auth_result = _handle_spotify_auth_flow(required_scopes, user_id)
    if "❌" in auth_result:
        return auth_result

    token = auth_result

    if not context_uri and not uris:
        return "Error: You must provide either 'context_uri' (for an album/playlist) or 'uris' (for tracks)."
    if context_uri and uris:
        return "Error: You must provide *either* 'context_uri' or 'uris', not both."

    payload: Dict[str, Any] = {}
    if context_uri:
        payload["context_uri"] = context_uri
    if uris:
        payload["uris"] = uris

    try:
        headers = {"Authorization": f"Bearer {token}"}
        # --- URL FIXED ---
        api_url = "https://api.spotify.com/v1/me/player/play"

        # --- HTTX PATTERN FIXED ---
        with httpx.Client() as client:
            response = client.put(api_url, headers=headers, json=payload)
            if response.status_code == 204:
                return "▶️ Starting new playback on Spotify."
            response.raise_for_status()
            return "▶️ Starting new playback on Spotify."

    except httpx.HTTPStatusError as e:
        return _handle_spotify_api_error(e)
    except httpx.RequestError as e:
        return f"Network error: Could not connect to Spotify API. {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"


def search_spotify(
    query: str,
    search_type: str = "track",
    limit: int = 5,
    user_id: str = "default"
) -> str:
    """
    Search for tracks, albums, artists, or playlists on Spotify.
    Returns the names, URIs, and URLs for the search results.

    Args:
        query: Search query string (e.g., "Bohemian Rhapsody", "Queen", etc.)
        search_type: Type to search for - "track", "album", "artist", or "playlist" (default: "track")
        limit: Maximum number of results to return (1-50, default: 5)
        user_id: User identifier for multi-user support (default: "default")

    Returns:
        List of results with names, Spotify URIs (for playback), and URLs (for sharing)
    """
    required_scopes = ['user-read-playback-state']
    auth_result = _handle_spotify_auth_flow(required_scopes, user_id)
    if "❌" in auth_result:
        return auth_result

    token = auth_result

    # Validate search type
    valid_types = ["track", "album", "artist", "playlist"]
    if search_type not in valid_types:
        return f"Error: Invalid search_type '{search_type}'. Must be one of: {', '.join(valid_types)}"

    # Validate limit
    if not 1 <= limit <= 50:
        return "Error: limit must be between 1 and 50"

    try:
        headers = {"Authorization": f"Bearer {token}"}
        api_url = f"https://api.spotify.com/v1/search?q={query}&type={search_type}&limit={limit}"

        with httpx.Client() as client:
            response = client.get(api_url, headers=headers)
            response.raise_for_status()
            data = response.json()

            # Get the items based on search type
            items_key = f"{search_type}s"  # tracks, albums, artists, or playlists
            items = data.get(items_key, {}).get('items', [])

            if not items:
                return f"No {search_type}s found for query: '{query}'"

            result_lines = [f"Spotify search results for '{query}' ({search_type}s):"]

            for idx, item in enumerate(items, 1):
                name = item.get('name', 'Unknown')
                uri = item.get('uri', 'N/A')
                url = item.get('external_urls', {}).get('spotify', 'N/A')

                # Add additional context based on type
                if search_type == "track":
                    artist = item.get('artists', [{}])[0].get('name', 'Unknown Artist')
                    album = item.get('album', {}).get('name', 'Unknown Album')
                    result_lines.append(
                        f"{idx}. 🎵 {name}\n"
                        f"   Artist: {artist}\n"
                        f"   Album: {album}\n"
                        f"   URI: {uri}\n"
                        f"   URL: {url}"
                    )
                elif search_type == "album":
                    artist = item.get('artists', [{}])[0].get('name', 'Unknown Artist')
                    total_tracks = item.get('total_tracks', 0)
                    result_lines.append(
                        f"{idx}. 💿 {name}\n"
                        f"   Artist: {artist}\n"
                        f"   Tracks: {total_tracks}\n"
                        f"   URI: {uri}\n"
                        f"   URL: {url}"
                    )
                elif search_type == "artist":
                    followers = item.get('followers', {}).get('total', 0)
                    genres = item.get('genres', [])
                    genre_str = ', '.join(genres[:3]) if genres else 'N/A'
                    result_lines.append(
                        f"{idx}. 🎤 {name}\n"
                        f"   Followers: {followers:,}\n"
                        f"   Genres: {genre_str}\n"
                        f"   URI: {uri}\n"
                        f"   URL: {url}"
                    )
                elif search_type == "playlist":
                    owner = item.get('owner', {}).get('display_name', 'Unknown')
                    total_tracks = item.get('tracks', {}).get('total', 0)
                    result_lines.append(
                        f"{idx}. 📝 {name}\n"
                        f"   Owner: {owner}\n"
                        f"   Tracks: {total_tracks}\n"
                        f"   URI: {uri}\n"
                        f"   URL: {url}"
                    )

            return "\n\n".join(result_lines)

    except httpx.HTTPStatusError as e:
        return _handle_spotify_api_error(e)
    except httpx.RequestError as e:
        return f"Network error: Could not connect to Spotify API. {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"
