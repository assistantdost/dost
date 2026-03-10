# Dost - Desktop Client

Electron + React desktop app for the Dost AI assistant. This is the primary client - a full-featured chat interface that connects to MCP servers, manages AI models, and lets you interact with all Dost tools through natural language.

## Features

- **AI Chat** - Conversational UI with markdown rendering, code highlighting (Shiki), LaTeX (KaTeX), and Mermaid diagrams
- **Multi-Model Support** - Switch between LLM providers and models on-the-fly
- **MCP Tool Management** - Connect/disconnect MCP servers, view available tools
- **Smart Tool Selection (RAG)** - Semantic matching routes queries to the right tools
- **Conversation Summaries** - Auto-summarizes long conversations to stay within token limits
- **User Auth** - Login via the web backend, JWT-based session management
- **Chat History** - Persistent conversations synced with the backend
- **Settings** - Configure API keys, AI model preferences, MCP server connections
- **Build & Package** - Produces a Windows `.exe` installer via electron-builder

## Structure

```
mcp-desktop-client/
├── client/                # React frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── components/    #   UI components (chat, sidebar, tools, AI, code-block, diagrams)
│   │   ├── pages/         #   Home, Chat, Login, Account, Settings, Tools
│   │   ├── store/         #   Zustand stores (auth, chat, mcp, ai, global)
│   │   ├── api/           #   Backend API client
│   │   └── hooks/         #   Custom React hooks
│   └── package.json       #   Frontend dependencies
│
├── electron/              # Electron main process
│   ├── main.js            #   App entry, window creation, IPC setup
│   ├── preload.js         #   Context bridge (renderer <-> main)
│   ├── config.js          #   Runtime config
│   ├── store.js           #   Persistent settings (electron-store)
│   ├── ai/                #   AI model management
│   │   ├── models.js      #     Multi-provider model registry
│   │   └── ipcHandlers.js #     AI-related IPC handlers
│   ├── mcp/               #   MCP integration
│   │   ├── tools.js       #     MCP client manager (connect/disconnect servers)
│   │   ├── toolRAG.js     #     Semantic tool selection via vector store
│   │   ├── ipcHandlers.js #     MCP-related IPC handlers
│   │   └── TOOL_RAG.md    #     RAG implementation docs
│   └── server/            #   Embedded Express server
│       ├── server.js      #     Express entry point
│       └── routes.js      #     AI chat route (streaming responses)
│
├── resources/             # Bundled assets (desktop_server.exe, etc.)
├── release/               # Build output (gitignored)
├── package.json           # Root scripts & electron-builder config
└── .env                   # Secrets (never committed)
```

## Setup

### 1. Install Dependencies

```bash
cd mcp-desktop-client
npm run install:all   # Installs root + client + electron deps
```

### 2. Environment Variables

Create `.env` at `mcp-desktop-client/.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
GROQ_API_KEY=gsk_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
VITE_SUMMARY_MAX_TOKENS=800
VITE_SUMMARY_TOKEN_THRESHOLD=1500
```

### 3. Run in Development

```bash
npm run dev
```

This starts the Vite dev server (`localhost:5173`) and Electron concurrently. Hot-reload is enabled for the React frontend.

## Build & Package

```bash
# Unpacked build (no installer, for testing)
npm run dist:dir

# Full NSIS installer (.exe)
npm run dist
```

Output goes to `release/`.

> **Important**: Ensure `.env` is filled with real values before packaging - it gets copied into `resources/` at build time.

## Architecture

```
┌─────────────────────────────────────────────┐
│  Electron Main Process                       │
│  ┌──────────────┐  ┌────────────────────┐   │
│  │ AI Models    │  │ MCP Tool Manager   │   │
│  │ (models.js)  │  │ (tools.js)         │   │
│  └──────┬───────┘  └────────┬───────────┘   │
│         │                   │               │
│  ┌──────┴───────────────────┴───────────┐   │
│  │         Express Server               │   │
│  │   POST /api/v1/chat (streaming)      │   │
│  └──────────────────────────────────────┘   │
│         ▲  IPC Bridge (preload.js)          │
├─────────┼───────────────────────────────────┤
│         ▼                                    │
│  ┌──────────────────────────────────────┐   │
│  │    React Frontend (Vite)              │   │
│  │    Chat UI, Settings, Tools, Auth     │   │
│  └──────────────────────────────────────┘   │
│  Electron Renderer Process                   │
└─────────────────────────────────────────────┘
```

## Pages

| Route       | Description                      |
| ----------- | -------------------------------- |
| `/`         | Home - welcome screen + new chat |
| `/chat/:id` | Chat conversation view           |
| `/login`    | Authentication                   |
| `/account`  | User profile                     |
| `/settings` | API keys, model config           |
| `/tools`    | MCP server & tool management     |

## Key Dependencies

| Package                    | Purpose                      |
| -------------------------- | ---------------------------- |
| `@ai-sdk/react`            | AI streaming UI hooks        |
| `react-markdown` + `shiki` | Markdown + code highlighting |
| `mermaid`                  | Diagram rendering            |
| `katex` + `rehype-katex`   | LaTeX math rendering         |
| `zustand`                  | State management             |
| `@tanstack/react-query`    | Server state & caching       |
| `gpt-tokenizer`            | Token counting for summaries |
| `electron-store`           | Persistent settings          |
