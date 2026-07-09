# Adding Custom MCP Servers

This guide details how to integrate your own custom Model Context Protocol (MCP) servers into the DOST assistant. By adding custom servers, you can expand the tool catalog available to your LLM agent, allowing it to interface with company APIs, private databases, custom DevOps pipelines, or local scripts.

---

## 1. Accessing the MCP Control Center

To manage tool servers, open the DOST desktop application:
1. Locate the sidebar menu on the left side of the window.
2. Click on **Tools** (or navigate to the "MCP Control Center" in settings).
3. Click the **"+ Add Server"** button in the upper-right corner. This opens the configuration modal.

---

## 2. Server Configuration Types

DOST supports the two standard protocol transport mechanisms defined by the Model Context Protocol: **Local (Stdio)** and **Remote (HTTP/SSE)**.

### A. Local Stdio Servers (`transport: "stdio"`)
Local servers are executed as direct background subprocesses of the Electron application. They communicate using standard input and output streams.

In the configuration modal, insert a unique **Server Name** (e.g. `filesystem-mcp`) and paste the JSON configuration:

```json
{
  "description": "Local file browser tool",
  "transport": "stdio",
  "command": "node",
  "args": [
    "C:\\Users\\Username\\.nvm\\versions\\node\\v18.16.0\\node_modules\\@modelcontextprotocol\\server-filesystem\\dist\\index.js",
    "C:\\Users\\Username\\Documents"
  ],
  "enabled": true
}
```

#### JSON Fields for Stdio:
* `description` (string): Summary description of the tool server.
* `transport` (string): Must be set to `"stdio"`.
* `command` (string): The executable CLI command to run (e.g., `node`, `python`, `npx`).
* `args` (array of strings): Command arguments, including the path to the script and any target parameters (use double backslashes `\\` for folder paths on Windows).
* `enabled` (boolean): Set to `true` to active immediately.

---

### B. Remote HTTP/SSE Servers (`transport: "streamable_http"` or `"sse"`)
Remote servers run independently (e.g., in a Docker container, cloud instance, or remote cluster) and stream tool requests over HTTP.

In the modal, set the name and paste the JSON config:

```json
{
  "description": "Product Inventory Database Tool",
  "transport": "streamable_http",
  "url": "http://localhost:3000/mcp",
  "headers": {
    "Authorization": "Bearer your-secure-api-key-here"
  },
  "enabled": true
}
```

#### JSON Fields for HTTP/SSE:
* `transport` (string): Set to `"streamable_http"` (for streamable HTTP endpoints) or `"sse"` (for standard Server-Sent Events gateways).
* `url` (string): The HTTP API endpoint of the MCP server.
* `headers` (object): Optional dictionary of headers. Use this to pass API Keys (e.g. `"Authorization": "Bearer ..."`).

---

## 3. Dynamic RAG Re-indexing

When you click **"Add Server"** in the Control Center:
1. Electron establishes the client transport connection immediately.
2. If successful, the server state updates, and the system triggers the **ToolRAG Indexer**.
3. ToolRAG fetches all tool schemas from the new server, generates vector embeddings, and registers them in the local semantic index.
4. **Result:** The new tools are immediately available to the LLM agent during conversations. No application restart is required.
