# Setup & Execution Guide

This document provides step-by-step instructions for installing, configuring, and executing the DOST ecosystem on Windows. DOST is built as a multi-component distributed system consisting of desktop applications, web frontends, central databases, and multiple Model Context Protocol (MCP) servers.

Following this guide in the exact order specified ensures all dependencies are compiled correctly, credentials are isolated, and the agent loop connects to the local and remote servers.

---

## 1. System Prerequisites & Installation

Before running any component, you must install the runtime engines and databases on your local Windows system.

### A. Core Runtimes

1. **Python 3.11+**
    - Download the Python installer from the official website.
    - **CRITICAL:** Check the box **"Add Python.exe to PATH"** during installation.
2. **Node.js 18+ (LTS recommended)**
    - Download and run the Node.js installer. This will automatically install `npm`.
    - Verify runtime installations in a new command prompt:
        ```cmd
        python --version
        node --version
        npm --version
        ```

### B. Database Services

1. **PostgreSQL 14+**
    - Download the PostgreSQL interactive installer for Windows (by EnterpriseDB).
    - Note the password you set for the default `postgres` superuser during setup.
    - Open the PostgreSQL SQL Shell (`psql`) or pgAdmin and create the application database:
        ```sql
        CREATE DATABASE dost;
        ```
2. **Valkey or Redis (For OTP & Email Verification)**
    - You can run a local Redis container or sign up for a free cloud service instance (such as [Aiven](https://aiven.io)).
    - Obtain the connection string (e.g., `redis://localhost:6379` or `rediss://default:password@host:port`).

---

## 2. Environment Variables Specification

You must create and populate `.env` files in the directories of each service component.

### A. Central Web Backend (`mcp-server-web/.env`)

Create `d:\Python Save files\dost-mcp\mcp-server-web\.env` and paste:

```env
# Database Connections
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_DB_PASSWORD@localhost:5432/dost

# Valkey/Redis Connection
REDIS_URL=redis://localhost:6379

# JWT Cryptographic Secrets (Use strong random strings)
JWT_SECRET=SG98dC_RR2zfDWISXZW_VA6EIskrbjwk3Enj3_8AqZ0
REFRESH_TOKEN_SECRET=j9Ogf9dQRAkLw4LPCQjDXETDy89bJ4CcJA41uJ-8ktE
ACCESS_TOKEN_SECRET=9PnjIwqDXcKlwjj4Ot3wjQO_4iKwHyrX4-hH6wMhGio
ALGORITHM=HS256

# Expiry Configurations
REFRESH_TOKEN_EXPIRE_DAYS=7
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Verification (Gmail SMTP)
GMAIL_SENDER=assistant.dost@gmail.com
EMAIL_ADDRESS=assistant.dost@gmail.com

# OAuth Client Credentials (Google Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Server Port and Domains
DEV_MODE=true
PORT=5000
DOMAIN=localhost
DOMAIN_ADDRESS=http://localhost:5173
```

### B. Remote MCP Server (`mcp-server-remote/.env`)

Create `d:\Python Save files\dost-mcp\mcp-server-remote\.env` and paste:

```env
# Weather API Key (From openweathermap.org)
WEATHER_API_KEY=your_openweathermap_api_key

# Database and Redis links (Match backend configs)
DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@localhost:5432/dost?sslmode=disable
VALKEY_CONNECTION_STRING=redis://localhost:6379

# OAuth Integrations
# Spotify (Spotify Developer Dashboard: https://developer.spotify.com)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/auth/spotify_callback

# Google (Google Cloud Console: https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Main Web Server Reference
MAIN_SERVER_URL=http://localhost:5000/api/v1
```

### C. Desktop Client (`mcp-desktop-client/.env`)

Create `d:\Python Save files\dost-mcp\mcp-desktop-client/.env` (Note: in development, this is located at the project root `d:\Python Save files\dost-mcp\.env`) and paste:

```env
# Core API link to mcp-server-web
VITE_API_URL=http://localhost:5000/api/v1

# Google OAuth Credentials for Client Sign-In
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Summarization Trigger Constraints
VITE_SUMMARY_TRIGGER_TOKENS=1500
VITE_SUMMARY_WINDOW_CONVERSATIONS=2
```

---

## 3. Setup Phase 1: Web Enrollment (One-Time Setup)

To use the desktop application, you must first register an account and configure your model API credentials. This requires launching the database, backend server, and the Next.js web portal.

### Step 1: Initialize the Central Backend (`mcp-server-web`)

1. Open a terminal and navigate to the directory:
    ```cmd
    cd "d:\Python Save files\dost-mcp\mcp-server-web"
    ```
2. Create a Python virtual environment:
    ```cmd
    python -m venv .webserver
    ```
3. Activate the virtual environment:
    ```cmd
    .webserver\Scripts\activate
    ```
4. Install all Python dependencies:
    ```cmd
    pip install -r requirements.txt
    ```
5. Launch the backend server:

    ```cmd
    python main.py
    ```

    - _Verify: The terminal should output `Running in development mode on port 5000`. SQLAlchemy will automatically create tables in your PostgreSQL database._

### Step 2: Start the Web Portal (`mcp-frontend-web`)

1. Open a new terminal window and navigate to the web directory:
    ```cmd
    cd "d:\Python Save files\dost-mcp\mcp-frontend-web"
    ```
2. Install npm dependencies:
    ```cmd
    npm install
    ```
3. Start the Next.js development server:

    ```cmd
    npm run dev
    ```

    - _Verify: The terminal will indicate that the portal is running at `http://localhost:3000`._

### Step 3: Register Account & Configure Keys

1. Open your browser and navigate to `http://localhost:3000/signup`.
2. Enter your email, set a password, and complete the registration.
3. Log in and go to profile page.
4. **Create DOST API Key:** On the profile page, locate the API Keys manager and click **"Create API Key"** (or Generate Key).
    - _Copy the generated key (formatted as `dost__...`) and save it securely. You will use this key in the next phase to authenticate the desktop client with the remote MCP server._
5. Close the browser window and terminate the `mcp-frontend-web` terminal process. You do not need to run the web frontend again.

---

## 4. Setup Phase 2: Desktop Client Execution (Run Workspace)

Once enrollment is complete, you can launch the desktop assistant workspace. This requires three terminals running concurrently in the following order.

### Terminal 1: Launch Backend Server (`mcp-server-web`)

_Why:_ Provides the active session storage, chats persistence, and api keys verification layer.

1. Open a terminal.
2. Navigate and activate the virtual environment:
    ```cmd
    cd "d:\Python Save files\dost-mcp\mcp-server-web"
    .webserver\Scripts\activate
    ```
3. Execute the server:
    ```cmd
    python main.py
    ```

### Terminal 2: Launch Remote Server (`mcp-server-remote`)

_Why:_ Provides the live HTTP/SSE tools (Weather, Stocks, Spotify, Google APIs).

1. Open a second terminal.
2. Navigate to the directory:
    ```cmd
    cd "d:\Python Save files\dost-mcp\mcp-server-remote"
    ```
3. Create and activate the Python virtual environment:
    ```cmd
    python -m venv .remotevenv
    .remotevenv\Scripts\activate
    ```
4. Install dependencies:
    ```cmd
    pip install -r requirements.txt
    ```
5. Run the remote server:

    ```cmd
    python server.py
    ```

    - _Verify: The terminal should output `Uvicorn running on http://0.0.0.0:8000`._

### Terminal 3: Setup Local Package & Launch Desktop Client

_Why:_ Spawns the Electron assistant window. It must be run from a shell containing the active Python virtual environment for local package execution so that the Electron node process can load package imports.

1. **Compile Local Package Server Dependencies (`mcp-server-package`):**
   Open a third terminal, navigate to the local package folder, and create the environment:
    ```cmd
    cd "d:\Python Save files\dost-mcp\mcp-server-package"
    python -m venv .packagevenv
    .packagevenv\Scripts\activate
    pip install -r requirements.txt
    ```
2. **Launch Desktop App inside that active Virtual Environment:**
   _Keep `.packagevenv` active in this terminal window._ Navigate to the desktop client and run it:

    ```cmd
    # Navigate to the desktop app folder
    cd "d:\Python Save files\dost-mcp\mcp-desktop-client"

    # Install desktop dependencies
    npm run install:all

    # Start the application
    npm run dev
    ```

    - _Verify: Electron will open the DOST dashboard window. Log in using your email and password._

3. **Configure Remote Server Authentication:**
    - In the desktop application sidebar, navigate to the **Tools** view (or click on "MCP Control Center").
    - Locate the **Server Configuration** list.
    - Under the `remote_server` card, click **Edit** (or inspect the configuration).
    - Paste your copied **DOST API Key** into the JSON configuration under `headers.Authorization` following the Bearer token format:
        ```json
        {
        	"url": "http://127.0.0.1:8000/remote_mcp/mcp",
        	"transport": "streamable_http",
        	"enabled": true,
        	"description": "Remote MCP server (calendar, gmail, etc.)",
        	"headers": {
        		"Authorization": "Bearer YOUR_GENERATED_DOST_API_KEY"
        	}
        }
        ```
    - Click **Save** and select **Connect**. The server status should switch to **Active**, indicating that the desktop client has successfully authenticated with the remote server.

---

## 5. Troubleshooting & Verification

- **Connection Failures (500/404 errors):** Ensure `mcp-server-web` is running on Port 5000 and `mcp-server-remote` is running on Port 8000. Verify the ports in your `.env` configs.
- **Database Connection Timeout:** Verify that your PostgreSQL database service is running on Windows (open `services.msc`, locate `postgresql-x64`, and ensure its status is `Running`).
- **Local Package Import Errors in Electron:** If Electron throws python errors (e.g. `ModuleNotFoundError: No module named 'pygetwindow'`), verify that you activated `.packagevenv` inside the terminal window _before_ executing `npm run dev`.
