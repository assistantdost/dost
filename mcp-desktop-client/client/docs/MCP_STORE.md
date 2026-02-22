# MCP Store Implementation

## Overview

The MCP Store is a shared state management system for MCP (Model Context Protocol) servers and tools, synced between Electron's main process and the React renderer process.

## Architecture

### Main Process (`electron/main.js`)

- Stores the source of truth for MCP state
- Exports functions: `updateMcpStore()`, `addMcpServer()`, `getAllMcpTools()`
- Broadcasts state updates to all renderer windows via IPC

### Renderer Process (`src/store/mcpStore.js`)

- Zustand store for reactive state management
- Syncs with main process via IPC
- Provides actions: `setActiveTools()`, `addMcpServer()`, `removeMcpServer()`, `updateMcpServerTools()`

### Preload Script (`electron/preload.js`)

- Exposes IPC methods to renderer: `invoke()`, `on()`, `removeAllListeners()`
- Whitelists channels: `mcp-get-state`, `mcp-set-state`, `mcp-state-updated`

## Usage

### In Renderer (React Components)

```javascript
import { useMcpStore } from '@/store/mcpStore';

function MyComponent() {
  const { mcpServers, activeTools, addMcpServer, getAllTools } = useMcpStore();

  // Get all tools from all servers
  const allTools = getAllTools();

  // Add a server
  addMcpServer('my-server', {
    tools: { tool1: {...}, tool2: {...} },
    metadata: { url: 'http://localhost:3000' },
    connected: true,
  });

  return <div>...</div>;
}
```

### In Main Process (Node.js)

```javascript
import { addMcpServer, updateMcpStore, getAllMcpTools } from './main.js';

// Add a server (syncs to renderer automatically)
addMcpServer('my-server', {
  tools: { tool1: {...}, tool2: {...} },
  metadata: { url: 'http://localhost:3000' },
  connected: true,
});

// Update state
updateMcpStore('activeTools', ['tool1', 'tool2']);

// Get all tools
const allTools = getAllMcpTools();
```

## State Structure

```javascript
{
  activeTools: ['tool1', 'tool2'],
  mcpServers: {
    'remote': {
      tools: { ... },
      metadata: { url: '...', type: 'http' },
      connected: true,
    },
    'local': {
      tools: { ... },
      metadata: { command: '...', args: [...], type: 'stdio' },
      connected: true,
    },
  },
}
```

## Features

- ✅ Bidirectional sync between main and renderer
- ✅ Reactive updates in React components
- ✅ Automatic broadcasting to all windows
- ✅ Type-safe (with TypeScript, if added)
- ✅ Supports multiple MCP servers
- ✅ Tracks server connection status
- ✅ Aggregates tools from all servers

## Initialization

The store automatically initializes when the React app loads (see `App.jsx`):

```javascript
const { init, listenForUpdates, cleanup } = useMcpStore();

useEffect(() => {
	init(); // Load initial state from main
	listenForUpdates(); // Start listening for updates

	return () => cleanup(); // Clean up listeners
}, []);
```
