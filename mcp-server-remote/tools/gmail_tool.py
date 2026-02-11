import httpx
from typing import Optional, List
import base64
from email.mime.text import MIMEText

# Import OAuth functions and new centralized config
from auth.oauth_flow import get_google_token, create_authorization_url
from auth.google_config import (
    GOOGLE_SERVICE_NAME,
    GMAIL_SCOPES,
    MASTER_GOOGLE_SCOPES
)


# --- Helper Functions ---
def _find_header(headers: list[dict], name: str) -> str:
    """Helper function to find a specific header value."""
    for header in headers:
        if header['name'].lower() == name.lower():
            return header['value']
    return "N/A"


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
            f"❌ Authorization required for Google services.\n"
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


def read_recent_emails(
    max_results: int = 5,
    query: Optional[str] = None,
    user_id: str = "default"
) -> str:
    """
    Use this tool to read recent emails from the user's Gmail inbox.
    You can use the 'query' parameter to search for specific emails.

    Args:
        max_results: The maximum number of emails to return (default: 5).
        query: An optional Gmail search query (e.g., "is:unread", "from:boss@example.com").
        user_id: User identifier for multi-user support (default: "default").
    """
    auth_result = _handle_google_auth_flow(GMAIL_SCOPES, user_id)
    if "❌" in auth_result:
        return auth_result

    token = auth_result
    try:
        headers = {"Authorization": f"Bearer {token}"}
        with httpx.Client(headers=headers) as client:
            list_url = "https://gmail.googleapis.com/gmail/v1/users/me/messages"
            list_params = {"maxResults": max_results}
            if query:
                list_params['q'] = query

            response = client.get(list_url, params=list_params)
            response.raise_for_status()

            messages = response.json().get('messages', [])
            if not messages:
                return f"No emails found matching query: {query}" if query else "No emails found."

            email_list = [f"Here are your {len(messages)} most recent emails:"]

            for msg_meta in messages:
                msg_id = msg_meta['id']
                get_url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}"
                msg_response = client.get(get_url, params={"format": "metadata"})

                if msg_response.status_code == 404:
                    email_list.append(f"\nError: Could not find email with ID {msg_id}")
                    continue
                msg_response.raise_for_status()
                msg_data = msg_response.json()

                snippet = msg_data.get('snippet', 'No snippet.')
                msg_headers = msg_data.get('payload', {}).get('headers', [])
                subject = _find_header(msg_headers, 'Subject')
                sender = _find_header(msg_headers, 'From')

                email_list.append(f"\nFrom: {sender}\nSubject: {subject}\nSnippet: {snippet.strip()}")

            return "\n".join(email_list)

    except httpx.HTTPStatusError as e:
        return _handle_google_api_error(e, "read_recent_emails")
    except httpx.RequestError as e:
        return f"Network error (read_recent_emails): Could not connect to Gmail API. {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred (read_recent_emails): {e}"


def send_email(
    to: str,
    subject: str,
    body: str,
    user_id: str = "default"
) -> str:
    """
    Use this tool to send an email from the user's Gmail account.
    Always ask or get the recipient's email address using the 'list_contacts' tool first,
    unless the user provides the full email address directly.

    Args:
        to: The recipient's email address (e.g., "recipient@example.com").
        subject: The subject line of the email.
        body: The plain text content of the email.
        user_id: User identifier for multi-user support (default: "default").
    """
    auth_result = _handle_google_auth_flow(GMAIL_SCOPES, user_id)
    if "❌" in auth_result:
        return auth_result

    token = auth_result
    try:
        message = MIMEText(body)
        message['to'] = to
        message['subject'] = subject

        with httpx.Client(headers={"Authorization": f"Bearer {token}"}) as client:
            profile_response = client.get("https://gmail.googleapis.com/gmail/v1/users/me/profile")
            profile_response.raise_for_status()
            sender_email = profile_response.json().get('emailAddress', 'me')
            message['from'] = sender_email

        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        payload = {'raw': encoded_message}

        with httpx.Client(headers={"Authorization": f"Bearer {token}"}) as client:
            send_url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
            response = client.post(send_url, json=payload)
            response.raise_for_status()

            return f"✅ Email sent successfully to {to}."

    except httpx.HTTPStatusError as e:
        return _handle_google_api_error(e, "send_email")
    except httpx.RequestError as e:
        return f"Network error (send_email): Could not connect to Gmail API. {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred (send_email): {e}"
