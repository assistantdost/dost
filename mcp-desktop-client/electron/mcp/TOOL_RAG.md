# ToolRAG Implementation Guide

## Overview

`ToolRAG` is a comprehensive RAG (Retrieval-Augmented Generation) system for MCP (Model Context Protocol) tool discovery and selection. It combines **hybrid search (BM25 + vector similarity)** with conversation-history-aware "sticky" tool selection to intelligently filter and prioritize relevant tools for LLM calls.

**Search strategy:** BM25 handles exact keyword matches (e.g. tool names, parameter names), vector similarity handles semantic matches (e.g. "temperature" → `get_weather`). Orama merges both scores via RRF (Reciprocal Rank Fusion). Sticky context adds tools used in recent turns regardless of search score.

**Location:** `electron/mcp/toolRAG.js`  
**Dependencies:** `@xenova/transformers`, `@orama/orama`  
**Model:** Xenova/all-MiniLM-L6-v2 (384-dimensional embeddings)

## Architecture

### Core Components

1. **Hybrid Search Engine** - BM25 keyword search + vector similarity, merged via RRF
2. **Richer Tool Embeddings** - Embeds `name + description + parameter names` for better semantic coverage
3. **Sticky Context Extractor** - Conversation history analysis for tool continuity
4. **Debounced Re-indexing** - Automatic tool database updates with batching
5. **Unified Selection Algorithm** - Combines hybrid search + sticky results with fallback

### Schema Fields

| Field         | Type        | Purpose                              | BM25 indexed?          |
| ------------- | ----------- | ------------------------------------ | ---------------------- |
| `name`        | string      | Tool name                            | ✅ Yes                 |
| `description` | string      | Tool description                     | ✅ Yes                 |
| `schemaText`  | string      | Readable param names (`city, units`) | ✅ Yes                 |
| `schemaJson`  | string      | Raw JSON inputSchema                 | ❌ No — retrieval only |
| `embedding`   | vector[384] | Semantic embedding                   | — vector field         |

### Data Flow

```
User Query ──┬──→ BM25 keyword match ──────────┐
             │                                  ├──→ RRF merge → Hybrid Hits
             └──→ Embed → Vector similarity ───┘
                                                        ↓
Conversation History ──→ Sticky Extraction ──→ Sticky Tools
                                                        ↓
                              Merge & Deduplicate → Filtered Tools Object → LLM Agent
```

## Class Definition

```javascript
export class ToolRAG {
	constructor(options = {}) {
		this.semanticLimit = options.semanticLimit ?? 5; // Max semantic search results
		this.stickyWindow = options.stickyWindow ?? 3; // Recent assistant turns to scan
		this.debounceMs = options.debounceMs ?? 100; // Reindex debounce delay

		this._pipeline = null; // Transformer.js pipeline
		this._db = null; // Orama vector database
		this._reindexTimer = null; // Debounce timer
	}
}
```

## API Reference

### Constructor Options

| Option          | Type     | Default | Description                                               |
| --------------- | -------- | ------- | --------------------------------------------------------- |
| `semanticLimit` | `number` | `5`     | Maximum tools returned from semantic search               |
| `stickyWindow`  | `number` | `3`     | Number of recent assistant turns to scan for sticky tools |
| `debounceMs`    | `number` | `100`   | Milliseconds to debounce reindexing operations            |

### Lifecycle Methods

#### `async init()`

Loads the embedding model and prepares the system for operation.

```javascript
async init() {
    if (this._pipeline) return;

    const { pipeline, env } = await import("@xenova/transformers");

    env.cacheDir = CACHE_DIR;
    env.allowLocalModels = true;
    env.allowRemoteModels = true;

    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    this._pipeline = await pipeline("feature-extraction", MODEL, {
        quantized: true,
    });
}
```

**Details:**

- Downloads ~80MB model on first run
- Subsequent loads: ~0.25s from cache
- Sets up quantized model for performance
- Thread-safe (idempotent)

#### `async index(tools)`

Creates/recreates the vector database with tool embeddings.

```javascript
async index(tools) {
    this._assertReady();
    if (!tools?.length) return { count: 0, timeMs: 0 };

    const { create, insert } = await import("@orama/orama");
    const start = Date.now();

    this._db = create({
        schema: {
            name: "string",
            description: "string",
            schemaText: "string",  // human-readable param names for BM25
            schemaJson: "string",  // raw JSON for retrieval only (excluded from BM25)
            embedding: `vector[${DIMS}]`,
        },
    });

    for (const tool of tools) {
        const desc = tool.description || "";

        // Richer embedding: name + description + parameter names
        const paramNames = Object.keys(
            tool.inputSchema?.properties ||
            tool.inputSchema?.jsonSchema?.properties || {}
        ).join(", ");
        const embedText = paramNames
            ? `${tool.name}: ${desc}. Parameters: ${paramNames}`
            : `${tool.name}: ${desc}`;

        const vec = await this._embed(embedText);
        insert(this._db, {
            name: tool.name,
            description: desc,
            schemaText: paramNames,                       // clean readable — BM25 indexes this
            schemaJson: JSON.stringify(tool.inputSchema || {}), // raw JSON — retrieval only
            embedding: vec,
        });
    }

    console.log(`Indexed ${tools.length} tools in ${Date.now() - start}ms`);

    return { count: tools.length, timeMs: Date.now() - start };
}
```

**Parameters:**

- `tools`: `Array<{name: string, description: string, inputSchema?: object}>`

**Returns:** `Promise<{count: number, timeMs: number}>`

**Implementation Notes:**

- Recreates database on each call
- Embeds: `"${tool.name}: ${description}. Parameters: ${paramNames}"` — richer signal
- `schemaText` stores clean param names for BM25 — avoids noisy JSON token matching
- `schemaJson` stores raw JSON excluded from BM25, used only for retrieval

#### `reindex(activeTools)`

Debounced bridge for MCP store integration.

```javascript
reindex(activeTools) {
    if (this._reindexTimer) clearTimeout(this._reindexTimer);

    this._reindexTimer = setTimeout(async () => {
        if (!this._pipeline) return;

        const tools = Object.entries(activeTools).map(([name, def]) => ({
            name,
            description: def.description || "",
            inputSchema: def.parameters || def.inputSchema || {},
        }));

        if (!tools.length) {
            this._db = null;
            return;
        }

        await this.index(tools);
    }, this.debounceMs);
}
```

**Parameters:**

- `activeTools`: `Object<string, object>` - MCP store format `{name: {description, parameters, execute}}`

**Implementation Notes:**

- Converts MCP format to internal format
- Debounces rapid updates during batch server connections
- Clears database if no tools available

### Search Methods

#### `async search(query, limit?)`

Performs **hybrid BM25 + vector search** over indexed tools. Orama merges both scores via RRF.

```javascript
async search(query, limit = this.semanticLimit) {
    this._assertReady();
    if (!this._db) return [];

    const { search } = await import("@orama/orama");
    const vec = await this._embed(query);

    // Hybrid: BM25 text search + vector similarity, scores merged by Orama
    // properties scoped to avoid BM25 over raw schemaJson tokens
    const results = search(this._db, {
        mode: "hybrid",
        term: query,
        properties: ["name", "description", "schemaText"],
        vector: { value: vec, property: "embedding" },
        limit,
        includeVectors: false,
    });

    return (results.hits || []).map((h) => ({
        name: h.document.name,
        description: h.document.description,
        inputSchema: JSON.parse(h.document.schemaJson || "{}"),
        score: Math.round(h.score * 1000) / 1000,
    }));
}
```

**Parameters:**

- `query`: `string` - Search query text
- `limit`: `number` - Maximum results (default: `this.semanticLimit`)

**Returns:** `Promise<Array<{name, description, inputSchema, score}>>`

**Implementation Notes:**

- `mode: "hybrid"` — runs BM25 and vector in parallel, merges via RRF
- `properties` scoped to `["name", "description", "schemaText"]` — prevents BM25 matching raw JSON tokens in `schemaJson`
- No hard similarity threshold — RRF handles relevance naturally
- Rounds scores to 3 decimal places

**Why hybrid over pure vector?**

| Query type                         | BM25                     | Vector      |
| ---------------------------------- | ------------------------ | ----------- |
| `"get_weather"` (exact name)       | ✅ Strong                | ⚠️ Moderate |
| `"temperature celsius"` (semantic) | ⚠️ Weak                  | ✅ Strong   |
| `"city units"` (param name)        | ✅ Strong (`schemaText`) | ✅ Strong   |

Hybrid covers both cases.

### Sticky Context Methods

#### `extractSticky(history, window?)`

Extracts tool names from recent conversation history.

```javascript
extractSticky(history, window = this.stickyWindow) {
    const names = new Set();
    if (!history?.length) return names;

    let turns = 0;
    for (let i = history.length - 1; i >= 0 && turns < window; i--) {
        const msg = history[i];

        if (msg.role === "assistant") {
            turns++;
            // Parse content array for tool-call types
            if (msg.content && Array.isArray(msg.content)) {
                for (const item of msg.content) {
                    if (item.type === "tool-call" && item.toolName) {
                        names.add(item.toolName);
                    }
                }
            }
        }

        if (msg.role === "tool") {
            // Parse content array for tool-result types
            if (msg.content && Array.isArray(msg.content)) {
                for (const item of msg.content) {
                    if (item.type === "tool-result" && item.toolName) {
                        names.add(item.toolName);
                    }
                }
            }
        }
    }

    names.delete(undefined);
    return names;
}
```

**Parameters:**

- `history`: `Array<object>` - Conversation messages in model format
- `window`: `number` - Assistant turns to scan (default: `this.stickyWindow`)

**Returns:** `Set<string>` - Unique tool names

**Message Format Support:**

- Assistant messages: Scans `content` array for `{"type": "tool-call", "toolName": "..."}`
- Tool messages: Scans `content` array for `{"type": "tool-result", "toolName": "..."}`

### Main Selection Method

#### `async select(query, history, allTools, options?)`

Combines semantic search and sticky context to select relevant tools.

```javascript
async select(query, history, allTools, options = {}) {
    const limit = options.semanticLimit ?? this.semanticLimit;
    const window = options.stickyWindow ?? this.stickyWindow;

    // Fallback: if RAG not ready, return all tools
    if (!this._pipeline || !this._db) {
        console.warn("ToolRAG not ready, returning all tools");
        return allTools;
    }

    // 1. Hybrid search hits (BM25 + vector)
    const hits = await this.search(query, limit);
    const selected = new Set();

    for (const t of hits) {
        selected.add(t.name);
    }

    // 2. Sticky context — tools used in recent turns
    const sticky = this.extractSticky(history, window);

    for (const name of sticky) {
        selected.add(name);
    }

    // 3. Build result object in exact tools format
    const result = {};
    for (const name of selected) {
        if (allTools[name]) {
            result[name] = allTools[name];
        }
    }

    return result;
}
```

**Parameters:**

- `query`: `string` - Current user message
- `history`: `Array<object>` - Conversation messages
- `allTools`: `Object<string, object>` - Full tools map (MCP format)
- `options`: `object` - Override `semanticLimit`/`stickyWindow`

**Returns:** `Promise<Object<string, object>>` - Tools in MCP format, ready for agent

**Algorithm:**

1. **Fallback check** — if not initialized or not indexed, return `allTools` immediately
2. **Hybrid search** — BM25 + vector on current query → top N tool names
3. **Sticky extraction** — scan last K assistant turns for tool calls → tool names
4. **Merge** — union of both sets, deduplicated
5. **Build result** — return matching tools in original MCP format

### Utility Methods

#### `async _embed(text)`

Generates embeddings for text using the transformer pipeline.

```javascript
async _embed(text) {
    const out = await this._pipeline(text, {
        pooling: "mean",
        normalize: true,
    });
    return Array.from(out.data);
}
```

**Parameters:** `text: string`  
**Returns:** `Promise<Array<number>>` - 384-dimensional embedding vector

#### `_assertReady()`

Throws if the system hasn't been initialized.

```javascript
_assertReady() {
    if (!this._pipeline) {
        throw new Error("ToolRAG not initialized. Call init() first.");
    }
}
```

### Status Properties

#### `ready` (getter)

```javascript
get ready() {
    return !!this._pipeline;
}
```

#### `indexed` (getter)

```javascript
get indexed() {
    return !!this._db;
}
```

#### `status` (getter)

```javascript
get status() {
    return { ready: this.ready, indexed: this.indexed, model: MODEL };
}
```

## Integration Examples

### Electron Main Process Setup

```javascript
import { ToolRAG } from "./electron/mcp/toolRAG.js";

const toolRAG = new ToolRAG({
	semanticLimit: 5,
	stickyWindow: 10,
	debounceMs: 500,
});

// Initialize on app ready
app.whenReady().then(async () => {
	await toolRAG.init();
	console.log("ToolRAG ready:", toolRAG.status);
});
```

### MCP Store Integration

```javascript
// In tools.js proxy setter
if (prop === "mcpServers") {
	toolRAG.reindex(this.getTools());
}
```

### Chat Route Integration

```javascript
// In routes.js
const filteredTools = await toolRAG.select(query, modelMessages, activeTools);

// filteredTools is ready for agent
const agent = await chatAgent(filteredTools);
```

## Performance Characteristics

- **Initialization:** ~80MB download (first run), ~0.25s (cached)
- **Indexing:** ~50ms per tool (embedding + DB insert)
- **Search:** ~10-20ms per query (embedding + vector search)
- **Selection:** ~20-50ms total (search + sticky extraction)

## Error Handling

- `init()`: Throws on model loading failures
- `index()`: Throws on embedding failures
- `search()`: Returns empty array if no database
- `select()`: Gracefully handles missing tools/history

## Testing

Run the test files to validate functionality:

```bash
# Vector search tests
node electron/mcp/testVectorStore.cjs

# Sticky context tests
node electron/mcp/testToolSelector.cjs
```

## Default Instance

A pre-configured singleton is available:

```javascript
import { toolRAG } from "./electron/mcp/toolRAG.js";

// Uses stickyWindow: 10 (increased from default 3)
```

This provides a ready-to-use instance with optimized defaults for production use.
