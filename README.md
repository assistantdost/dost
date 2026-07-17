<p align="center">
  <h1 align="center">🤝 DOST - Personal Agentic AI Assistant</h1>
  <p align="center">
    An AI-powered desktop assistant that can control your PC, manage your emails, play music, fetch live market data, and much more - all through natural language.
  </p>
  <p align="center">
    <a href="https://dost-assistant.vercel.app"><strong>dost-assistant.vercel.app</strong></a> |
    <a href="https://github.com/assistantdost/dost"><strong>GitHub</strong></a>
  </p>
</p>

<p align="center">
  <img src="mcp-frontend-web/public/client/home_page.png" alt="DOST Homepage" width="800" />
</p>

<p align="center">
  <strong>Built on the <a href="https://modelcontextprotocol.io">Model Context Protocol (MCP)</a></strong>
</p>

---

## 🧭 What is Dost?

**Dost** (meaning _"friend"_ in Hindi) is a modular AI assistant ecosystem that connects large language models to real-world tools using the **Model Context Protocol (MCP)**. Ask it anything in plain English - from _"What's the weather in Tokyo?"_ to _"Open Spotify and play some jazz"_ - and it figures out which tools to call.

### Key Highlights

- 🖥️ **Windows Desktop Control** — Open/close apps, manage windows, adjust volume & brightness, take screenshots, schedule tasks
- 📧 **Google Suite Integration** — Read/send Gmail, manage Google Calendar events, browse contacts (OAuth 2.0)
- 🎵 **Spotify Control** — Play, pause, skip, search, switch devices (OAuth 2.0)
- 📈 **Live Market Data** — Real-time stock prices, cryptocurrency, metal prices, currency conversion
- 🌤️ **Weather** — Current weather for any city worldwide
- 🧮 **Calculator** — Math operations on datasets (sum, product, min, max, average)
- 🧠 **Smart Tool Selection** — Semantic RAG-based tool routing picks the right tool for each query
- 🔐 **Secure by Design** — Input validation, rate limiting, sandboxed execution

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          Dost Ecosystem                          │
├──────────────────────┬──────────────────┬────────────────────────┤
│   CLIENTS            │   BACKEND        │   MCP SERVERS          │
│                      │                  │                        │
│ ┌──────────────────┐ │ ┌──────────────┐ │ ┌────────────────────┐ │
│ │ mcp-desktop-     │ │ │ mcp-server-  │ │ │ mcp-server-remote  │ │
│ │ client           │ │ │ web          │ │ │ (HTTP / Streamable)│ │
│ │ (Electron+React) │─┼─│ (FastAPI +   │ │ │                    │ │
│ │                  │ │ │  PostgreSQL) │ │ │ Weather, Stocks,   │ │
│ └──────────────────┘ │ └──────────────┘ │ │ Crypto, Metals,    │ │
│                      │                  │ │ Currency, Gmail,   │ │
│ ┌──────────────────┐ │                  │ │ Calendar, Contacts,│ │
│ │ mcp-frontend-web │ │                  │ │ Spotify, Calculator│ │
│ │ (Next.js)        │─┼──────────────────│ └────────────────────┘ │
│ └──────────────────┘ │                  │                        │
│                      │                  │ ┌────────────────────┐ │
│ ┌──────────────────┐ │                  │ │ mcp-server-package │ │
│ │ mcp-client       │ │                  │ │ (stdio)            │ │
│ │ (Python CLI)     │─┼──────────────────│ │                    │ │
│ └──────────────────┘ │                  │ │ Windows Automation,│ │
│                      │                  │ │ Time, File Ops,    │ │
│                      │                  │ │ Notifications      │ │
│                      │                  │ └────────────────────┘ │
└──────────────────────┴──────────────────┴────────────────────────┘
```

---

## 📂 Project Structure

```
dost/
├── mcp-desktop-client/    # Electron + React desktop app (primary client)
│   ├── client/            #   React frontend (Vite, ShadcnUI)
│   └── electron/          #   Main process, MCP bridge, AI model mgr, Express server
│
├── mcp-frontend-web/      # Next.js web frontend (alternative UI)
│
├── mcp-server-web/        # FastAPI backend — auth, chat persistence, user mgmt
│   ├── routers/           #   API routes (auth, users, chats, api-keys, mcp-store, llm-models)
│   ├── models/            #   SQLAlchemy models (User, Chat)
│   └── database.py        #   Async PostgreSQL via asyncpg
│
├── mcp-server-remote/     # Remote MCP server (HTTP / Streamable)
│   ├── tools/             #   Tool modules (stock, crypto, metal, currency, gmail, calendar, contacts, spotify)
│   └── auth/              #   Google & Spotify OAuth 2.0 flows
│
├── mcp-server-package/    # Local MCP server (stdio transport)
│   └── tools/             #   Windows automation modules
│       ├── windows.py     #     Window & task management, reminders, system info
│       └── modules/       #     application_manager, system_control, desktop_interaction, file_operations, security
│
├── mcp-client/            # Python CLI MCP client
├── flet_client/           # Flet-based desktop UI (experimental)
└── .env                   # Root environment variables
```

---

## ⚙️ Prerequisites

| Requirement    | Version                    |
| -------------- | -------------------------- |
| **Node.js**    | 18+                        |
| **Python**     | 3.11+                      |
| **PostgreSQL** | 14+ (for `mcp-server-web`) |

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/assistantdost/dost.git
cd dost
```

### 2. Set up environment variables

Each component has a `.env.default` template file. To configure a component, copy its `.env.default` to a new `.env` file in the same folder and fill in the credentials:

```bash
# In each component folder (e.g. mcp-desktop-client, mcp-server-web, etc.):
cp .env.default .env
```

<details>
<summary><b><code>mcp-desktop-client/.env</code></b> — Desktop client config</summary>

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_WEB_URL=http://localhost:3000
VITE_PUBLIC_API_URL=http://localhost:5599
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_SUMMARY_MAX_TOKENS=700
VITE_SUMMARY_TRIGGER_TOKENS=6000
VITE_SUMMARY_WINDOW_CONVERSATIONS=2
```

</details>

<details>
<summary><b><code>mcp-server-web/.env</code></b> — Central Backend config</summary>

```env
DATABASE_URL=postgres://username:password@host:port/dbname
JWT_SECRET=your_jwt_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
ACCESS_TOKEN_SECRET=your_access_token_secret_here
ALGORITHM=HS256
GMAIL_SENDER=your_email@gmail.com
REDIS_URL=redis://username:password@host:port
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
DEV_MODE=true
PORT=5000
DOMAIN="localhost"
DOMAIN_ADDRESS="http://localhost:5173"
EMAIL_ADDRESS="your_email@gmail.com"
```

</details>

<details>
<summary><b><code>mcp-server-remote/.env</code></b> — Remote server & OAuth</summary>

```env
GROQ_API_KEY=your_groq_api_key
WEATHER_API_KEY=your_openweathermap_api_key
DATABASE_URL=postgres://username:password@host:port/dbname?sslmode=require
VALKEY_CONNECTION_STRING=redis://username:password@host:port
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
MAIN_SERVER_URL=http://localhost:5000/api/v1
```

</details>

---

### 3. Start the components

You can run any combination of these depending on your use case.

#### Remote MCP Server (HTTP tools)

```bash
cd mcp-server-remote
python -m venv .remotevenv && .remotevenv\Scripts\activate   # Windows
pip install -r requirements.txt
python server.py
# → Runs at http://localhost:8000
# → MCP endpoint: http://localhost:8000/remote_mcp
# → API docs: http://localhost:8000/docs
```

#### Local MCP Server (stdio / Windows tools)

```bash
cd mcp-server-package
python -m venv .packagevenv && .packagevenv\Scripts\activate
pip install -r requirements.txt
python server.py
# → Communicates via stdio (launched by the desktop client)
```

#### Web Backend (auth, chat history, user management)

```bash
cd mcp-server-web
python -m venv .webserver && .webserver\Scripts\activate
pip install -r requirements.txt
python main.py
# → Runs at http://localhost:8000 (configure PORT in .env)
```

#### Desktop Client (Electron app)

```bash
cd mcp-desktop-client
npm run install:all   # Installs root, client, and electron deps
npm run dev           # Starts Vite dev server + Electron
```

#### Web Frontend (Next.js)

```bash
cd mcp-frontend-web
npm install
npm run dev
# → Runs at http://localhost:3000
```

#### CLI Client (Python)

```bash
cd mcp-client
pip install -r requirements.txt   # if applicable
python client.py
```

---

## 🛠️ Registered MCP Tools

### Remote Server (`mcp-server-remote`) — HTTP

| Category    | Tool                                            | Description                             |
| ----------- | ----------------------------------------------- | --------------------------------------- |
| **Weather** | `get_weather`                                   | Current weather for any city            |
| **Finance** | `get_stock_data`                                | Real-time stock quotes                  |
|             | `get_crypto_price`                              | Cryptocurrency prices + history         |
|             | `get_metal_price`                               | Precious metal prices (gold, silver, …) |
|             | `convert_currency`                              | Live currency conversion                |
| **Math**    | `calculator`                                    | Sum, product, min, max, average         |
| **Google**  | `read_recent_emails`                            | Read Gmail inbox (OAuth)                |
|             | `send_email`                                    | Send emails via Gmail (OAuth)           |
|             | `list_calendar_events`                          | View Google Calendar (OAuth)            |
|             | `create_calendar_event`                         | Create calendar events (OAuth)          |
|             | `list_contacts`                                 | Browse Google Contacts (OAuth)          |
| **Spotify** | `get_current_playback`                          | Now playing info (OAuth)                |
|             | `play_spotify` / `pause_spotify`                | Playback control (OAuth)                |
|             | `next_track_spotify` / `previous_track_spotify` | Track navigation (OAuth)                |
|             | `start_spotify_playback`                        | Start playing a track/playlist (OAuth)  |
|             | `search_spotify`                                | Search tracks, albums, artists (OAuth)  |
|             | `list_spotify_devices` / `set_spotify_device`   | Device management (OAuth)               |

### Local Server (`mcp-server-package`) — stdio

| Category       | Tool                                                                    | Description                        |
| -------------- | ----------------------------------------------------------------------- | ---------------------------------- |
| **Apps**       | `open_app`                                                              | Launch desktop applications        |
|                | `open_webpage`                                                          | Open URLs in default browser       |
|                | `search_web`                                                            | Search Google/Bing                 |
|                | `play_song`                                                             | Play a song on YouTube             |
| **Windows**    | `list_open_windows`                                                     | List visible windows               |
|                | `focus_window` / `minimize_window` / `maximize_window` / `close_window` | Window management                  |
| **System**     | `volume_control`                                                        | Adjust system volume               |
|                | `brightness_control`                                                    | Adjust screen brightness           |
|                | `system_power`                                                          | Shutdown, restart, hibernate, lock |
|                | `get_system_info`                                                       | OS, CPU, RAM, disk info            |
| **Desktop**    | `screenshot`                                                            | Capture the screen                 |
|                | `clipboard_manager`                                                     | Get/set clipboard text             |
|                | `show_notification`                                                     | Show Windows toast notifications   |
| **Files**      | `create_note`                                                           | Create text/note files             |
|                | `find_files`                                                            | Search files on disk               |
| **Scheduling** | `schedule_task` / `list_scheduled_tasks` / `delete_scheduled_task`      | Windows Task Scheduler             |
|                | `set_reminder`                                                          | Time-based alerts                  |
| **Time**       | `get_time`                                                              | Current time for any timezone      |

---

## 🧠 Smart Tool Selection (RAG)

The desktop client uses a **vector-store-based Retrieval-Augmented Generation (RAG)** system to semantically match user queries to the most relevant MCP tools. This means the LLM only receives tools that are actually relevant to the query, keeping token usage low and accuracy high.

See [`mcp-desktop-client/electron/mcp/TOOL_RAG.md`](mcp-desktop-client/electron/mcp/TOOL_RAG.md) for implementation details.

---

## 🔒 Security

The local Windows automation server includes a multi-layered security model:

- **Input validation** — All tool inputs are sanitized and validated
- **Rate limiting** — Prevents abuse of system-level operations
- **Path sandboxing** — File operations are restricted to allowed directories
- **Command whitelisting** — Only pre-approved applications and commands can be executed
- **Configurable** — Security settings in `mcp-server-package/tools/settings.json`

---

## 📡 OAuth Integration

Google and Spotify integrations use OAuth 2.0 flows managed by the remote server:

1. **Start** — `POST /auth/start` (Google) or `POST /auth/start_spotify` (Spotify)
2. **Callback** — Browser redirects back to `/auth/callback` or `/auth/spotify_callback`
3. **Status** — `GET /auth/status/google/{service}` or `GET /auth/status/spotify`

Tokens are stored per-user and auto-refreshed when expired.

---

## 🔍 Inspecting MCP Servers

You can inspect any MCP server using the official inspector:

```bash
npx @modelcontextprotocol/inspector
```

---

## 🏗️ Building the Desktop App

```bash
cd mcp-desktop-client

# Unpacked build (for testing)
npm run dist:dir

# Full NSIS installer (.exe)
npm run dist
```

Output is written to `mcp-desktop-client/release/`.

> ⚠️ Make sure `.env` contains real values before packaging — it is bundled into the app resources.

---

## 📄 License

This project is open-source. See individual component directories for specific license information.

---

<p align="center">
  Made with ❤️ — <em>Your AI dost (friend) that actually gets things done.</em>
</p>
