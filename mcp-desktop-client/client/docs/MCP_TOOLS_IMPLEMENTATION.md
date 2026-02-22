# MCP Tools Load Algorithm - Implementation Guide

## Overview

This implementation provides a complete system for managing MCP (Model Context Protocol) server configurations and tool loading in the Electron + React application.

## Architecture

### 1. Backend (FastAPI)

**File**: `mcp-server-web/routers/mcp_store.py`

- **Endpoint**: `GET /api/v1/mcp_store/default-servers`
- **Purpose**: Provides default MCP server configurations on login
- **Response**: JSON object with server configurations including Google Agent

### 2. Electron Main Process

**File**: `mcp-desktop-client/electron/main.js`

#### IPC Handlers:

- `mcp-login-load-defaults`: Fetches default servers from API and saves to `mcp.json`
- `mcp-read-config`: Reads current configuration from `mcp.json`
- `mcp-add-server`: Adds a new server to configuration
- `mcp-remove-server`: Removes a server from configuration
- `mcp-update-server`: Updates server properties (e.g., enable/disable)

#### Storage Location:

- **Path**: `app.getPath('userData')/mcp.json`
- **Platform-specific locations**:
    - Windows: `%APPDATA%\your-app-name\mcp.json`
    - macOS: `~/Library/Application Support/your-app-name/mcp.json`
    - Linux: `~/.config/your-app-name/mcp.json`

### 3. Electron Preload

**File**: `mcp-desktop-client/electron/preload.js`

Exposes safe IPC APIs to renderer process:

```javascript
window.electron.mcp = {
  loginLoadDefaults: (apiUrl) => ...,
  readConfig: () => ...,
  addServer: (name, config) => ...,
  removeServer: (name) => ...,
  updateServer: (name, updates) => ...,
}
```

### 4. MCP Initializer

**File**: `mcp-desktop-client/electron/ai/mcpInitializer.js`

Core functions:

- `initializeMcpClients(config)`: Loads all enabled servers
- `connectSingleServer(name, config)`: Connects one server
- `disconnectSingleServer(name)`: Disconnects one server
- `getAllActiveTools()`: Returns all active tools

**Error Handling**: Each server loads in a try-catch block to prevent cascade failures.

### 5. Zustand Store

**File**: `mcp-desktop-client/src/store/mcpStore.js`

#### State:

```javascript
{
  activeTools: [],        // Array of tool names
  mcpServers: {},         // Connected servers with metadata
  serverConfig: {},       // Full mcp.json config
  isInitialized: false,
  isConnecting: false,
  isConnected: false
}
```

#### Actions:

**Config Management:**

- `loadDefaultServers(apiUrl)`: Load defaults from API (called on login)
- `readConfig()`: Read mcp.json
- `addServerToConfig(name, config)`: Add server to config
- `removeServerFromConfig(name)`: Remove server from config
- `updateServerInConfig(name, updates)`: Update server properties

**Connection Management:**

- `connectToServers()`: Connect to all enabled servers
- `disconnectFromServers()`: Disconnect all servers

**Store Sync:**

- `init()`: Initialize from main process
- `listenForUpdates()`: Listen for main process updates
- `cleanup()`: Remove listeners

### 6. React Integration

#### Login Page

**File**: `mcp-desktop-client/src/pages/Login.jsx`

After successful login (both email/password and Google OAuth):

```javascript
await login(formData);
await loadDefaultServers(); // Load defaults from API
navigate("/");
```

#### App Component

**File**: `mcp-desktop-client/src/App.jsx`

On app load:

1. Initialize MCP store
2. Listen for updates
3. If logged in, read config and sync state

## Usage Flow

### First-Time User (Login)

```
1. User logs in
   ↓
2. Login handler calls loadDefaultServers()
   ↓
3. API fetches default-servers
   ↓
4. Electron saves to mcp.json in userData
   ↓
5. User navigates to app
   ↓
6. Main process reads mcp.json on startup
   ↓
7. Initializer connects to enabled servers
   ↓
8. Tools loaded and synced to store
```

### Returning User (App Startup)

```
1. App starts
   ↓
2. Main process reads mcp.json
   ↓
3. Initializer connects to enabled servers
   ↓
4. React app initializes MCP store
   ↓
5. State syncs from main process
   ↓
6. UI displays connected servers and tools
```

### Managing Servers (Runtime)

```javascript
// In any React component:
import { useMcpStore } from "@/store/mcpStore";

const {
	addServerToConfig,
	removeServerFromConfig,
	updateServerInConfig,
	connectToServers,
	disconnectFromServers,
} = useMcpStore();

// Add a new server
await addServerToConfig("my-server", {
	url: "http://localhost:9000/mcp",
	transport: "streamable_http",
	enabled: true,
	description: "My custom server",
});

// Enable/disable a server
await updateServerInConfig("desktop_server", { enabled: false });

// Remove a server
await removeServerFromConfig("old-server");

// Reconnect with new config
await disconnectFromServers();
await connectToServers();
```

## Error Handling

### Server Connection Failures

- Each server loads independently in try-catch
- Failed servers are logged but don't block others
- Results object tracks success/failed servers:
    ```javascript
    {
      success: ['server1', 'server2'],
      failed: [{ serverName: 'server3', error: 'Connection timeout' }],
      tools: { server1: ['tool1', 'tool2'], server2: ['tool3'] }
    }
    ```

### File System Errors

- IPC handlers return `{ success: boolean, error?: string }`
- Store actions show toast notifications on errors
- State remains consistent (rollback on failure)

## Configuration Schema

### mcp.json Structure

```json
{
	"server_name": {
		"command": "python", // For stdio transport
		"args": ["path/to/server.py"], // For stdio transport
		"url": "http://...", // For HTTP transport
		"transport": "stdio|streamable_http",
		"headers": {
			// Optional for HTTP
			"X-API-KEY": "..."
		},
		"enabled": true, // Whether to load on startup
		"description": "Server description"
	}
}
```

## Testing

### Test Login Flow

1. Start backend: `cd mcp-server-web && python server.py`
2. Start Electron app
3. Login with test credentials
4. Check console for "✅ Default servers loaded"
5. Verify `mcp.json` created in userData

### Test Server Management

1. Open Settings/MCP page (to be created)
2. Toggle server enabled/disabled
3. Check console for config updates
4. Verify changes persist after app restart

### Test Tool Loading

1. Check console on startup for initialization logs
2. Verify activeTools in React DevTools (Zustand)
3. Test chat with tools to ensure they're callable

## Troubleshooting

### "No servers enabled" on startup

- Check mcp.json exists: `console.log(app.getPath('userData'))`
- Verify at least one server has `enabled: true`
- Check backend is running for remote servers

### "Failed to connect to server"

- Check server URL/command is correct
- Verify network connectivity for HTTP servers
- Check Python environment for stdio servers
- Review server logs for errors

### Tools not appearing in chat

- Verify server connection: check `mcpServers` in store
- Check `activeTools` array is populated
- Ensure agent is using tools from store
- Review main process console for errors

## Future Enhancements

1. **UI for Server Management**: Settings page to add/remove/configure servers
2. **Server Health Monitoring**: Periodic checks and reconnection
3. **Tool Filtering**: Allow users to enable/disable specific tools
4. **Server Templates**: Predefined configs for common servers
5. **Import/Export**: Share server configs between users
6. **Analytics**: Track tool usage and server performance

## Development Notes

- Always use try-catch when calling IPC APIs
- Show loading states during connection
- Provide clear error messages to users
- Log detailed errors to console for debugging
- Keep mcp.json in sync with actual connections
- Test with both stdio and HTTP transports
- Handle reconnection on network changes
