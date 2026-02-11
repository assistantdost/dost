import os
import base64
import pickle
import google.auth
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# If modifying these SCOPES, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/gmail.send']


def get_gmail_service():
    creds = None
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    service = build('gmail', 'v1', credentials=creds)
    return service


def gmail_service_generator():
    service = get_gmail_service()
    print("Gmail Service Created")
    while True:
        yield service


def create_message(sender, to, subject, content, type="text"):
    message = MIMEMultipart('alternative')
    message['to'] = to
    message['from'] = sender
    message['subject'] = subject

    if type == "html":
        content = MIMEText(content, 'html')
        message.attach(content)
    else:
        content = MIMEText(content, 'plain')
        message.attach(content)

    raw = base64.urlsafe_b64encode(message.as_bytes())
    raw = raw.decode()
    return {'raw': raw}


def send_message(service, user_id, message):
    try:
        message = (service.users().messages().send(userId=user_id, body=message)
                   .execute())
        print('Message Id: %s' % message['id'])
        return message
    except Exception as error:
        print(f'An error occurred: {error}')
        return None


if __name__ == '__main__':
    service_gen = gmail_service_generator()
    service = next(service_gen)
    message = create_message(
        'DOST MCP <assistant.dost@gmail.com>',
        'ribhusaha2003@gmail.com',
        'Test Email 2',
        '<h1>Hello World from DOST MCP </h1>',
        'html',
    )
    send_message(service, 'me', message)
