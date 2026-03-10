# MCP Server Web

FastAPI backend that handles user authentication, chat persistence, API key management, and MCP server store. This is the central backend that the desktop client and web frontend connect to for account-related operations.

## Features

- **User Authentication** - Sign up, login, JWT access + refresh tokens
- **Chat Persistence** - Store and retrieve chat conversations with messages
- **API Key Management** - Per-user API key storage for LLM providers
- **MCP Store** - Registry of available MCP servers
- **LLM Models** - Model metadata and configuration
- **Async PostgreSQL** - Non-blocking database via asyncpg + SQLAlchemy

## API Routes

| Prefix               | Tag        | Description                                |
| -------------------- | ---------- | ------------------------------------------ |
| `/api/v1/auth`       | auth       | Login, signup, token refresh, Google OAuth |
| `/api/v1/users`      | users      | User profile operations                    |
| `/api/v1/api-keys`   | api-keys   | Store/retrieve LLM provider API keys       |
| `/api/v1/chats`      | chats      | CRUD for chat conversations and messages   |
| `/api/v1/mcp_store`  | mcp_store  | Available MCP server registry              |
| `/api/v1/llm_models` | llm_models | LLM model metadata                         |

## Project Structure

```
mcp-server-web/
├── main.py              # Uvicorn entry point (dev/prod mode)
├── server.py            # FastAPI app, CORS, router registration
├── database.py          # Async engine + session (PostgreSQL via asyncpg)
├── requirements.txt     # Python dependencies
├── routers/             # API route handlers
│   ├── auth.py          #   Authentication endpoints
│   ├── users.py         #   User profile
│   ├── api_keys.py      #   API key management
│   ├── chat.py          #   Chat CRUD
│   ├── mcp_store.py     #   MCP server registry
│   └── llm_models.py    #   LLM model metadata
├── models/              # SQLAlchemy ORM models
│   ├── user.py          #   User model
│   └── chat.py          #   Chat + message models
├── schemas/             # Pydantic request/response schemas
├── crud/                # Database query functions
├── middleware/           # Auth middleware, helpers
├── auth/                # Google OAuth integration
└── config/              # App configuration
```

## Setup

### 1. Database

You need a running PostgreSQL instance. Create a database:

```sql
CREATE DATABASE dost;
```

Tables are auto-created on startup via SQLAlchemy.

### 2. Install dependencies

```bash
cd mcp-server-web
python -m venv .webserver
.webserver\Scripts\activate          # Windows
# source .webserver/bin/activate     # Linux/macOS
pip install -r requirements.txt
```

### 3. Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgres://user:password@localhost:5432/dost
DEV_MODE=true
PORT=8000
SECRET_KEY=your-jwt-secret-key
GOOGLE_CLIENT_ID=...         # For Google OAuth
```

## Running

```bash
# Development (hot reload, single worker)
python main.py

# Or directly with uvicorn
uvicorn server:app --host localhost --port 8000 --reload
```

In production mode (`DEV_MODE=false`), the server uses multiple workers (`2 * CPU cores + 1`) and binds to `0.0.0.0`.

### API Docs

Once running, visit:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## CORS

The server allows requests from these origins by default:

| Origin                  | Use Case                          |
| ----------------------- | --------------------------------- |
| `http://localhost:5173` | Vite dev server (desktop client)  |
| `http://localhost:5599` | Electron Express server           |
| `app://localhost`       | Packaged Electron app             |
| `http://localhost:3000` | Next.js dev server (web frontend) |

To add more origins, edit `server.py`.
