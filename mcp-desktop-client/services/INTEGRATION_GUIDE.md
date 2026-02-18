# ToolRAG Integration Guide

## What It Does

`ToolRAG` pre-filters MCP tools for each LLM call using semantic search + conversation context, reducing ~42 tools down to ~5-8 relevant ones.

## File Structure

```
services/
├── toolRAG.js              ← Single module (class-based, ESM)
├── testVectorStore.cjs     ← Semantic search tests (33 queries)
└── testToolSelector.cjs    ← Sticky context tests (7 scenarios)
```

## API

```js
import { ToolRAG } from "../services/toolRAG.js";
// or use the default singleton:
import { toolRAG } from "../services/toolRAG.js";

const rag = new ToolRAG({
  semanticLimit: 5, // max tools from vector search (default: 5)
  stickyWindow: 3, // recent turns to scan for sticky tools (default: 3)
  debounceMs: 500, // reindex debounce delay (default: 500)
});
```

| Method                             | Returns                    | Purpose                                           |
| ---------------------------------- | -------------------------- | ------------------------------------------------- |
| `init()`                           | `Promise<void>`            | Load embedding model (~0.25s from cache)          |
| `index(tools)`                     | `Promise<{count, timeMs}>` | Index array of `{name, description, inputSchema}` |
| `search(query, limit?)`            | `Promise<Array>`           | Semantic search only                              |
| `select(query, history, allTools)` | `Promise<Array>`           | Semantic + sticky merged                          |
| `reindex(activeTools)`             | `void`                     | Debounced bridge for mcpStore format              |
| `extractSticky(history)`           | `Set<string>`              | Tool names from recent turns                      |
| `status`                           | `{ready, indexed, model}`  | Current state                                     |

## Integration Steps

### 1. Initialize on app startup (`main.js`)

```js
import { toolRAG } from "../services/toolRAG.js";

app.whenReady().then(async () => {
  createWindow();
  await createServer(mainWindow);
  await toolRAG.init(); // Load embedding model
  await initializeMcpOnStartup(); // Servers connect → triggers reindex
});
```

### 2. Auto-reindex on tool changes (`mcpStore.js`)

```js
import { toolRAG } from "../services/toolRAG.js";

export function addMcpServer(serverName, client, tools, metadata) {
  // ...existing code...
  Object.assign(mcpStore.activeTools, tools);
  toolRAG.reindex(mcpStore.activeTools); // <- add this line
  // ...
}

export function removeMcpServer(serverName) {
  // ...existing code (rebuild activeTools)...
  toolRAG.reindex(mcpStore.activeTools); // <- add this line
  // ...
}
```

### 3. Pre-filter tools per chat request (`routes.js` + `agent.js`)

**In `routes.js`** — extract query and get filtered tool names:

```js
import { toolRAG } from "../../services/toolRAG.js";
import { getActiveTools } from "../mcpStore.js";

server.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  // Get the latest user message text
  const lastUser = messages.filter((m) => m.role === "user").pop();
  const query = lastUser?.parts?.find((p) => p.type === "text")?.text || "";

  // Pre-filter tools
  const allTools = getActiveTools();
  const filtered = await toolRAG.select(query, messages, allTools);
  const toolFilter = new Set(filtered.map((t) => t.name));

  const agent = await chatAgent(toolFilter);
  const stream = agent.stream({
    /* ... */
  });
});
```

**In `agent.js`** — accept a filter set:

```js
export async function chatAgent(toolFilter = null) {
  const tools = getActiveTools();
  const filtered = toolFilter
    ? Object.fromEntries(
        Object.entries(tools).filter(([name]) => toolFilter.has(name)),
      )
    : tools;

  // Use `filtered` instead of `tools`
  cachedAgent.tools = {
    ...filtered,
    browser_search: groq.tools.browserSearch({}),
  };
  return cachedAgent;
}
```

## Running Tests

```bash
cd mcp-desktop-client
node services/testVectorStore.cjs      # 31/33 pass
node services/testToolSelector.cjs     # 14/14 pass
```
