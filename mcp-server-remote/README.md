# MCP Server Remote

HTTP-based MCP server that exposes 25+ tools via [FastMCP](https://github.com/jlowin/fastmcp) + [FastAPI](https://fastapi.tiangolo.com/). Handles weather, math, finance, Google services, and Spotify — all behind OAuth 2.0 where needed.

## How It Works

The server starts a FastAPI app, mounts a FastMCP streamable-HTTP endpoint at `/remote_mcp`, and registers all tools from the `tools/` directory. Google and Spotify integrations use OAuth 2.0 flows managed through the `/auth` endpoints.

## Tools

| Category     | Tool                                                                                                                                                                                              | Auth Required |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **Weather**  | `get_weather`                                                                                                                                                                                     | No            |
| **Math**     | `basic_math`, `evaluate_expression`, `statistics_calc`, `unit_converter`, `date_calculator`, `base_converter`                                                                                     | No            |
| **Stocks**   | `get_stock_data`                                                                                                                                                                                  | No            |
| **Crypto**   | `get_crypto_price`, `get_crypto_price_history`                                                                                                                                                    | No            |
| **Metals**   | `get_metal_price`                                                                                                                                                                                 | No            |
| **Currency** | `convert_currency`                                                                                                                                                                                | No            |
| **Gmail**    | `read_recent_emails`, `send_email`                                                                                                                                                                | Google OAuth  |
| **Calendar** | `list_calendar_events`, `create_calendar_event`                                                                                                                                                   | Google OAuth  |
| **Contacts** | `list_contacts`                                                                                                                                                                                   | Google OAuth  |
| **Spotify**  | `get_current_playback`, `play_spotify`, `pause_spotify`, `next_track_spotify`, `previous_track_spotify`, `start_spotify_playback`, `search_spotify`, `list_spotify_devices`, `set_spotify_device` | Spotify OAuth |

## Project Structure

```
mcp-server-remote/
├── server.py              # FastAPI + FastMCP entry point
├── requirements.txt       # Python dependencies
├── auth/                  # OAuth 2.0 flows
│   ├── endpoints.py       #   FastAPI router for /auth/*
│   ├── oauth_flow.py      #   Google OAuth helpers
│   ├── spotify_oauth_flow.py  # Spotify OAuth helpers
│   └── google_config.py   #   Scopes & service config
└── tools/                 # Tool modules
    ├── calculator.py      #   Math, expressions, stats, units, dates, base conversion
    ├── stock.py           #   Stock market data
    ├── crypto.py          #   Cryptocurrency prices + history
    ├── metal.py           #   Precious metal prices
    ├── currency.py        #   Currency conversion
    ├── gmail_tool.py      #   Gmail read/send
    ├── calendar_tool.py   #   Google Calendar
    ├── contacts_tool.py   #   Google Contacts
    └── spotify_tool.py    #   Spotify playback control
```

## Setup

```bash
cd mcp-server-remote
python -m venv .remotevenv
.remotevenv\Scripts\activate        # Windows
# source .remotevenv/bin/activate   # Linux/macOS
pip install -r requirements.txt
```

## Environment Variables

Create a `.env` file:

```env
WEATHER_API_KEY=...                # OpenWeatherMap API key

# Google OAuth (for Gmail, Calendar, Contacts)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Spotify OAuth
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=http://localhost:8000/auth/spotify_callback
```

You also need a `client_secret.json` from the Google Cloud Console for the OAuth flow.

## Running

```bash
python server.py
```

```
🚀 Starting MCP Remote Server...
📡 Server running at: http://0.0.0.0:8000
```

### Endpoints

| Endpoint                            | Description                    |
| ----------------------------------- | ------------------------------ |
| `GET /`                             | Server info & registered tools |
| `GET /docs`                         | Swagger API docs               |
| `POST /remote_mcp/mcp`              | MCP Streamable HTTP endpoint   |
| `POST /auth/start`                  | Start Google OAuth flow        |
| `POST /auth/start_spotify`          | Start Spotify OAuth flow       |
| `GET /auth/callback`                | Google OAuth callback          |
| `GET /auth/spotify_callback`        | Spotify OAuth callback         |
| `GET /auth/status/google/{service}` | Check Google token status      |
| `GET /auth/status/spotify`          | Check Spotify token status     |

## OAuth Flow

1. Client calls `POST /auth/start` or `POST /auth/start_spotify`
2. Server returns an authorization URL
3. User opens the URL in their browser and grants permissions
4. Browser redirects to the callback endpoint
5. Server stores tokens per user, auto-refreshes on expiry

## Inspect with MCP Inspector

```bash
npx @modelcontextprotocol/inspector
```

## Adding a New Tool

1. Create a new file in `tools/` (e.g., `my_tool.py`)
2. Define public functions with docstrings (the docstring is used as the tool description)
3. Register in `server.py`:
   ```python
   from tools import my_tool
   register_tools(my_tool)
   ```
4. Restart the server
