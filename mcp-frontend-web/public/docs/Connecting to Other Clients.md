# Connecting to Other Clients

This guide explains how to connect DOST's two built-in MCP servers (`mcp-server-package` and `mcp-server-remote`) to external MCP-compatible AI clients, such as **Claude Desktop**, **Cursor IDE**, and **VS Code (via Continue)**.

---

## 1. Overview of DOST MCP Servers

DOST contains two primary Model Context Protocol servers:

1. **Local Package Server (`mcp-server-package`)**:
   - **Type**: Local (Stdio)
   - **Capabilities**: Window automation, system actions, calculator, local scraper.
   - **Requirement**: Must run inside its Python virtual environment (`.packagevenv`) to resolve dependencies.

2. **Remote Server (`mcp-server-remote`)**:
   - **Type**: Remote (HTTP/SSE or Stdio adapter)
   - **Capabilities**: Weather, stock market indices, crypto, currency, Google Calendar/Gmail, and Spotify playback.
   - **Requirement**: Must run inside its Python virtual environment (`.remotevenv`). 
   - > [!IMPORTANT]
     > Even when connecting to this server via a stdio command in external clients, the background FastAPI web server (**Terminal 2** running `python server.py` on port 8000) **must be active** so that Google and Spotify OAuth callbacks (`http://localhost:8000/auth/...`) can be successfully routed.

---

## 2. Configuration for Claude Desktop

Claude Desktop stores its configuration in a JSON file. Open it by navigating to:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Replace or merge your configuration with the following JSON structure. Use absolute backslash paths (`\\`) on Windows:

```json
{
  "mcpServers": {
    "dost-local-package": {
      "command": "d:\\Python Save files\\dost-mcp\\mcp-server-package\\.packagevenv\\Scripts\\python.exe",
      "args": [
        "d:\\Python Save files\\dost-mcp\\mcp-server-package\\server.py"
      ]
    },
    "dost-remote-server": {
      "command": "d:\\Python Save files\\dost-mcp\\mcp-server-remote\\.remotevenv\\Scripts\\python.exe",
      "args": [
        "-c",
        "import sys; sys.path.insert(0, r'd:\\Python Save files\\dost-mcp\\mcp-server-remote'); from server import mcp; mcp.run(transport='stdio')"
      ]
    }
  }
}
```

> [!TIP]
> Make sure to replace `d:\\Python Save files\\dost-mcp` with the actual absolute path to your DOST installation directory.

---

## 3. Configuration for Cursor IDE

Cursor allows adding MCP servers dynamically through its settings interface.

### A. Add Local Package Server (`dost-local-package`)
1. Open Cursor and navigate to **Settings > Features > MCP**.
2. Click **"+ Add New MCP Server"**.
3. Configure the fields:
   - **Name**: `dost-local-package`
   - **Type**: `command`
   - **Command**: `d:\Python Save files\dost-mcp\mcp-server-package\.packagevenv\Scripts\python.exe`
   - **Arguments**: `d:\Python Save files\dost-mcp\mcp-server-package\server.py`
4. Click **Save**. Cursor will start the server and query its tool list.

### B. Add Remote Server (`dost-remote-server`)
1. Click **"+ Add New MCP Server"**.
2. Configure the fields:
   - **Name**: `dost-remote-server`
   - **Type**: `command`
   - **Command**: `d:\Python Save files\dost-mcp\mcp-server-remote\.remotevenv\Scripts\python.exe`
   - **Arguments**: `-c "import sys; sys.path.insert(0, r'd:\Python Save files\dost-mcp\mcp-server-remote'); from server import mcp; mcp.run(transport='stdio')"`
3. Click **Save**.

---

## 4. Configuration for VS Code (Continue Extension)

If you are using the **Continue** extension in VS Code, you can specify your MCP servers in the global configuration file.

1. Open VS Code.
2. Click the gear icon on the Continue panel (or open `~/.continue/config.json`).
3. Add the following to the `mcpServers` list:

```json
{
  "mcpServers": [
    {
      "name": "dost-local-package",
      "provider": "stdio",
      "command": "d:\\Python Save files\\dost-mcp\\mcp-server-package\\.packagevenv\\Scripts\\python.exe",
      "args": [
        "d:\\Python Save files\\dost-mcp\\mcp-server-package\\server.py"
      ]
    },
    {
      "name": "dost-remote-server",
      "provider": "stdio",
      "command": "d:\\Python Save files\\dost-mcp\\mcp-server-remote\\.remotevenv\\Scripts\\python.exe",
      "args": [
        "-c",
        "import sys; sys.path.insert(0, r'd:\\Python Save files\\dost-mcp\\mcp-server-remote'); from server import mcp; mcp.run(transport='stdio')"
      ]
    }
  ]
}
```

---

## 5. How OAuth Flows Work with External Clients

When you connect to `dost-remote-server` in Claude, Cursor, or VS Code, OAuth credentials function seamlessly due to DOST's shared caching layer:

1. **Active Web Server**: Make sure your local FastAPI remote server is running in a terminal:
   ```cmd
   cd mcp-server-remote
   .remotevenv\Scripts\activate
   python server.py
   ```
   This keeps port `8000` listening for authorization redirects.
2. **Tool Execution**: When you ask Claude or Cursor to perform a Spotify or Google action, the stdio MCP bridge queries the local database/cache for tokens.
3. **Trigger Auth Link**: If the token is missing or expired, the tool will return a response containing an OAuth URL. The AI client will render this link for you.
4. **Browser Redirect**: Clicking the link opens your browser, completes Google or Spotify login, and redirects back to `http://localhost:8000/auth/callback`.
5. **Token Synchronization**: The uvicorn server receives the code, exchanges it for a refresh/access token, and writes it to `token_cache.json` (or Redis). The stdio process in Cursor/Claude will pick up the saved credentials on the next tool call.
