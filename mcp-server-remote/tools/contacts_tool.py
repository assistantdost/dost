# tools/contacts_tool.py

import httpx
from typing import Optional, List

# Import OAuth functions and new centralized config
from auth.oauth_flow import get_google_token, create_authorization_url
from auth.google_config import (
    GOOGLE_SERVICE_NAME,
    CONTACTS_SCOPES,
    MASTER_GOOGLE_SCOPES
)


# --- Helper Functions ---
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
            f"❌ Authorization required for Google Contacts.\n"
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


def list_contacts(
    query: Optional[str] = None,
    max_results: int = 10,
    user_id: str = "default"
) -> str:
    """
    Searches the user's Google Contacts address book.
    Use this to find contact details like email addresses or phone numbers for a specific person (e.g., 'What is John's email?').
    """
    auth_result = _handle_google_auth_flow(CONTACTS_SCOPES, user_id)
    if "❌" in auth_result:
        return auth_result

    token = auth_result

    try:
        headers = {"Authorization": f"Bearer {token}"}

        # Determine the correct API endpoint
        if query:
            # Use search endpoint
            api_url = "https://people.googleapis.com/v1/people:searchContacts"
            params = {
                "query": query,
                "pageSize": max_results,
                "readMask": "names,emailAddresses,phoneNumbers"
            }
        else:
            # Use list connections endpoint
            api_url = "https://people.googleapis.com/v1/people/me/connections"
            params = {
                "pageSize": max_results,
                "personFields": "names,emailAddresses,phoneNumbers"
            }

        with httpx.Client(headers=headers) as client:
            response = client.get(api_url, params=params)
            response.raise_for_status()

            data = response.json()

            # The response structure is different for search vs. list
            connections = data.get('results', []) if query else data.get('connections', [])

            if not connections:
                return "No contacts found." if not query else f"No contacts found matching query: '{query}'"

            contact_list = ["Found contacts:"]
            for item in connections:
                # The person object is nested inside 'person' for search results
                person = item.get('person', item)

                name = person.get('names', [{}])[0].get('displayName', 'N/A')
                email = person.get('emailAddresses', [{}])[0].get('value', 'N/A')
                phone = person.get('phoneNumbers', [{}])[0].get('value', 'N/A')

                contact_list.append(f"- Name: {name}, Email: {email}, Phone: {phone}")

            return "\n".join(contact_list)

    except httpx.HTTPStatusError as e:
        return _handle_google_api_error(e, "list_contacts")
    except httpx.RequestError as e:
        return f"Network error (list_contacts): Could not connect to People API. {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred (list_contacts): {e}"
