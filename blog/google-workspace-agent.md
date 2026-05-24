# Automating Your Workspace: Gmail, Calendar, & Contacts

Keeping up with schedule bookings and incoming email notifications is one of the most time-consuming parts of the modern office workflow. With DOST, you can delegate these tasks directly to your agent.

By combining the **Google Workspace MCP Server** with DOST's semantic routing, you can run multi-step office automations with simple natural language inputs.

## What You Can Automate

- **Email Management**: Ask DOST to *"Read recent emails"* to summarize your inbox, or *"Send an email to team@company.com with the meeting notes"*.
- **Calendar Bookings**: Run *"List my upcoming meetings"* or *"Schedule a sync with Sarah on Monday at 3 PM"* to automatically update your calendar.
- **Contact Searching**: Quick lookup for client emails, phone numbers, and addresses.

## Privacy & Safety Precautions

Since email and calendar data are extremely sensitive, DOST establishes robust security guardrails:
- **OAuth Permissions**: Only access scope you explicitly approve during the login flow.
- **Sanity Validations**: Large language models confirm parameters (recipient email, meeting times) before committing changes.
- **Audit Trails**: Every command sent to Gmail or Google Calendar is logged locally.

Try it out today and turn conversation into real outcomes!
