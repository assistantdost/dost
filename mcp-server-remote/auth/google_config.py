# auth/google_config.py

"""
Central configuration for Google OAuth services and scopes.
"""

# This single service name will be used to store all Google-related tokens
# for a user. This allows a single refresh token to manage multiple services.
GOOGLE_SERVICE_NAME = "google_services"


# Define scopes for each service
GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send'
]

CALENDAR_SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
]

CONTACTS_SCOPES = [
    'https://www.googleapis.com/auth/contacts.readonly'
]


# Master list of all scopes you want to request during a new auth flow.
# Using set() removes duplicates if any.
MASTER_GOOGLE_SCOPES = list(set(
    GMAIL_SCOPES +
    CALENDAR_SCOPES +
    CONTACTS_SCOPES
))
