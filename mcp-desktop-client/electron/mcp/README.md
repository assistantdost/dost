# MCP Module

This folder contains all MCP (Model Context Protocol) related functionality for the Electron application.

## Structure

```
mcp/
├── configManager.js    # Configuration file management (read/write mcp.json)
├── ipcHandlers.js      # IPC handlers for MCP operations
├── initializer.js      # Startup initialization logic
├── clientManager.js    # MCP client connection management
└── tools.js           # Tool access interface
```

## Files

### `configManager.js`

**Purpose**: Core configuration file operations

**Exports**:

- `MCP_CONFIG_PATH` - Path to mcp.json in userData
- `readMcpConfig()` - Read configuration from mcp.json
- `writeMcpConfig(config)` - Write configuration to mcp.json
- `loadDefaultServers(apiUrl)` - Fetch defaults from API and save
- `addServer(serverName, config)` - Add a server to config
- `removeServer(serverName)` - Remove a server from config
- `updateServer(serverName, updates)` - Update server properties

All functions return promises and include proper error handling.

### `ipcHandlers.js`

**Purpose**: IPC communication layer between main and renderer

**Exports**:

- `registerMcpIpcHandlers()` - Register all MCP IPC handlers

**IPC Channels**:

- `mcp-login-load-defaults` - Load defaults from API
- `mcp-read-config` - Read current configuration
- `mcp-add-server` - Add new server
- `mcp-remove-server` - Remove existing server
- `mcp-update-server` - Update server settings

### `initializer.js`

**Purpose**: Startup initialization logic

**Exports**:

- `initializeMcpOnStartup()` - Initialize MCP clients on app startup

**Behavior**:

- Reads mcp.json configuration
- Connects to all enabled servers via clientManager
- Handles errors gracefully (failed servers don't crash app)
- Returns initialization results (success/failed servers)

### `clientManager.js`

**Purpose**: MCP client connection and lifecycle management

**Exports**:

- `initializeMcpClients(config)` - Connect to servers from config
- `connectSingleServer(name, config)` - Connect one server
- `disconnectSingleServer(name)` - Disconnect one server
- `disconnectAllClients()` - Disconnect all servers
- `getAllActiveTools()` - Get all active tools

**Features**:

- Supports stdio and streamable_http transports
- PUsage in agent.js

```javascript
import { getActiveTools } from "../mcpStore.js";

// Get tools directly from store (already populated by initializer)
const tools = getActiveTools();
```

## Benefits of This Structure

1. **Separation of Concerns**: Each file has a single, clear responsibility
2. **Testability**: Pure functions can be tested in isolation
3. **Maintainability**: Easy to locate and modify specific functionality
4. **Reusability**: Functions can be imported where needed
5. **Clarity**: main.js is cleaner and more focused
6. **Single Source of Truth**: All tools come from mcp.json configuration

## Adding New MCP Functionality

1. **Configuration changes**: Add to `configManager.js`
2. **New IPC operations**: Add to `ipcHandlers.js`
3. **Startup logic**: Modify `initializer.js`
4. **Client management**: Update `clientManager.js`

## Error Handling

All functions follow consistent error handling:

- Try-catch blocks for async operations
- Return `{ success: boolean, error?: string }` format
- Console logging for debugging
- Graceful fallbacks (e.g., empty config if file doesn't exist)

## Migration Notes

### Old Files (Deprecated)

- `electron/ai/tools.js` - Now redirects to `mcp/tools.js`
- `electron/ai/mcpInitializer.js` - Now redirects to `mcp/clientManager.js`

These old files now only export from the new locations for backward compatibility.

### Key Changes

- **Before**: Manual tool loading with hardcoded server configs
- **After**: All tools loaded from mcp.json via initializer
- **Agent**: Now uses `getActiveTools()` directly from mcpStore
- **Tools**: Simplified to just return tools from store

// Initialize on startup (in app.whenReady)
app.whenReady().then(async () => {
await initializeMcpOnStartup();
});

```

## Benefits of This Structure

1. **Separation of Concerns**: Each file has a single, clear responsibility
2. **Testability**: Pure functions can be tested in isolation
3. **Maintainability**: Easy to locate and modify specific functionality
4. **Reusability**: Functions can be imported where needed
5. **Clarity**: main.js is cleaner and more focused

## Adding New MCP Functionality

1. **Configuration changes**: Add to `configManager.js`
2. **New IPC operations**: Add to `ipcHandlers.js`
3. **Startup logic**: Modify `initializer.js`

## Error Handling

All functions follow consistent error handling:

- Try-catch blocks for async operations
- Return `{ success: boolean, error?: string }` format
- Console logging for debugging
- Graceful fallbacks (e.g., empty config if file doesn't exist)
```
