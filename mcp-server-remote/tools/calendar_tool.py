import httpx
from datetime import datetime, timezone
from typing import Optional, List
from fastmcp.server.dependencies import get_access_token

# Import OAuth functions and new centralized config
from auth.oauth_flow import get_google_token, create_authorization_url
from auth.google_config import (
    GOOGLE_SERVICE_NAME,
    CALENDAR_SCOPES,
    MASTER_GOOGLE_SCOPES
)


# --- Helper Functions (Standardized) ---
def _handle_google_auth_flow(required_scopes: List[str], user_id: str) -> str:
    """
    Internal helper to check for a token or return an auth URL.
    Returns: A valid token string, or an error string with auth URL.
    """
    token = get_google_token(GOOGLE_SERVICE_NAME, required_scopes, user_id)

    if not token:
        auth_data = create_authorization_url(
            MASTER_GOOGLE_SCOPES,
            user_id,
            GOOGLE_SERVICE_NAME
        )
        return (
            f"❌ Authorization required for Google Calendar.\n"
            f"Please open this URL in your browser to authorize the application:\n"
            f"{auth_data['url']}\n\n"
            f"After authorizing, please run your request again."
        )
    return token


def _handle_google_api_error(e: httpx.HTTPStatusError, tool_name: str) -> str:
    """Internal helper to format Google API errors."""
    if e.response.status_code == 401:
        return f"Error ({tool_name}): Authentication failed. Token may be invalid. You may need to re-auth."
    if e.response.status_code == 403:
        try:
            error_detail = e.response.json().get('error', {})
            reason = error_detail.get('details', [{}])[0].get('reason', 'permissionDenied')

            # This is the key check
            if reason == "SERVICE_DISABLED" or "ApiNotEnabled" in error_detail.get('message', ''):
                return (
                    f"Error ({tool_name}): The Google Calendar API is disabled. "
                    f"Please go to your Google Cloud Console, search for 'Google Calendar API', and click 'Enable'."
                 )

            return (
                f"Error ({tool_name}): Permission denied (403). "
                f"Reason: {reason}. Your token may be missing the required scopes."
            )
        except Exception:
            return f"Error ({tool_name}): Permission denied (403). Your token may be missing required scopes."
    try:
        error_detail = e.response.json()
        return f"HTTP Error ({tool_name}) {e.response.status_code}: {error_detail}"
    except (ValueError, KeyError):
        return f"HTTP Error ({tool_name}) {e.response.status_code}: {e.response.text[:200]}"


def list_calendar_events(
    max_results: int = 5) -> str:
    """
    Retrieves the user's personal daily agenda, upcoming meetings, and appointments from Google Calendar.
    Use this to check availability, see what is planned for today or tomorrow, and manage time.
    """
    user_id = get_access_token().claims["sub"]
    auth_result = _handle_google_auth_flow(CALENDAR_SCOPES, user_id)
    if "❌" in auth_result:
        return auth_result

    token = auth_result

    try:
        now_utc = datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
        headers = {"Authorization": f"Bearer {token}"}
        api_url = f"https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults={max_results}&timeMin={now_utc}&orderBy=startTime&singleEvents=true"     # noqa

        with httpx.Client() as client:
            response = client.get(api_url, headers=headers)
            response.raise_for_status()

            events = response.json().get('items', [])
            if not events:
                return "No upcoming events found."

            event_list = ["Upcoming events:"]
            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                try:
                    start_dt = datetime.fromisoformat(start)
                    start_formatted = start_dt.strftime('%Y-%m-%d %I:%M %p')
                except ValueError:
                    start_formatted = start

                event_list.append(f"- {event['summary']} (at {start_formatted})")

            return "\n".join(event_list)

    except httpx.HTTPStatusError as e:
        # Use the new, smarter error handler
        return _handle_google_api_error(e, "list_calendar_events")
    except httpx.RequestError as e:
        return f"Network error (list_calendar_events): Could not connect to Calendar API. {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred (list_calendar_events): {e}"


def create_calendar_event(
    summary: str,
    start_datetime: str,
    end_datetime: str,
    time_zone: str = "Asia/Kolkata",
    attendees: Optional[List[str]] = None,
    description: Optional[str] = None,
) -> str:
    """
    Schedules a new event, meeting, or appointment in Google Calendar.
    Use this to book time slots, set up reminders for specific dates and times, and invite attendees.
    """
    user_id = get_access_token().claims["sub"]
    auth_result = _handle_google_auth_flow(CALENDAR_SCOPES, user_id)
    if "❌" in auth_result:
        return auth_result

    token = auth_result

    # Construct the event payload
    event_payload = {
        'summary': summary,
        'start': {
            'dateTime': start_datetime,
            'timeZone': time_zone,
        },
        'end': {
            'dateTime': end_datetime,
            'timeZone': time_zone,
        },
    }

    if description:
        event_payload['description'] = description

    if attendees:
        event_payload['attendees'] = [{'email': email} for email in attendees]

    try:
        headers = {"Authorization": f"Bearer {token}"}
        api_url = "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all"

        with httpx.Client() as client:
            response = client.post(api_url, headers=headers, json=event_payload)
            response.raise_for_status()

            event_url = response.json().get('htmlLink', 'N/A')
            return f"✅ Event '{summary}' created successfully. View it here: {event_url}"

    except httpx.HTTPStatusError as e:
        return _handle_google_api_error(e, "create_calendar_event")
    except httpx.RequestError as e:
        return f"Network error (create_calendar_event): Could not connect to Calendar API. {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred (create_calendar_event): {e}"
