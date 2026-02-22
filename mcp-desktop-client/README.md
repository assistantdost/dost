# Dost — Desktop Client

Electron + React desktop app for the Dost AI assistant.

## Structure

```
mcp-desktop-client/
├── client/       # React frontend (Vite)
├── electron/     # Electron main process + Express server
├── resources/    # Bundled assets (desktop_server.exe, etc.)
├── release/      # Build output (gitignored)
└── .env          # Secrets — never committed
```

## Setup

```bash
# Install all dependencies
npm run install:all
```

## .env

Create a `.env` file at the root (`mcp-desktop-client/.env`):

```env
VITE_API_URL=http://localhost:5000/api/v1
GROQ_API_KEY=gsk_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
VITE_SUMMARY_MAX_TOKENS=800
VITE_SUMMARY_TOKEN_THRESHOLD=1500
```

## Development

```bash
npm run dev
```

Starts the Vite dev server and Electron concurrently.

## Build & Package

```bash
# Test build (unpacked, no installer)
npm run dist:dir

# Full NSIS installer
npm run dist
```

Output is in `release/`.

> Before packaging, ensure `.env` is filled with real values — it is copied into `resources/` at build time.
