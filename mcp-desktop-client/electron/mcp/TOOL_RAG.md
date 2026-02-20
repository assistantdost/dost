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

| Field            | Type        | Purpose                                | BM25 indexed?       |
| ---------------- | ----------- | -------------------------------------- | ------------------- |
| `name`           | string      | Tool name                              | ✅ Yes (boost ×3)   |
| `description`    | string      | Tool description                       | ❌ No — vector only |
| `schemaText`     | string      | Readable param names (`city, units`)   | ✅ Yes (boost ×1.5) |
| `nameVariations` | string      | Individual words from name, lowercased | ✅ Yes (boost ×2)   |
| `embedding`      | vector[384] | Semantic embedding                     | — vector field      |

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
            schemaText: "string",     // human-readable param names for BM25
            nameVariations: "string", // individual words from name, lowercased for BM25
            embedding: `vector[${DIMS}]`,
        },
    });

    for (const tool of tools) {
        const desc = tool.description || "";

        // Richer embedding: name variations + description + parameter names
        const paramNames = Object.keys(
            tool.inputSchema?.properties ||
            tool.inputSchema?.jsonSchema?.properties || {}
        ).join(", ");
        const nameVariations = this._generateNameVariations(tool.name);
        const embedText = paramNames
            ? `${tool.name}. ${nameVariations.join(". ")}: ${desc}. Parameters: ${paramNames}`
            : `${tool.name}. ${nameVariations.join(". ")}: ${desc}`;

        const vec = await this._embed(embedText);
        insert(this._db, {
            name: tool.name,
            description: desc,
            schemaText: paramNames,                          // clean readable — BM25 indexes this
            nameVariations: nameVariations.join(" ").toLowerCase(), // lowercased — BM25 indexes this
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
- Calls `_generateNameVariations()` to break name into individual words (e.g. `list_calendar_events` → `["list", "calendar", "events"]`)
- Embeds: `"${tool.name}. ${nameVariations.join(". ")}: ${description}. Parameters: ${paramNames}"` — full name + individual words + description + params
- `schemaText` stores clean param names for BM25 — avoids noisy JSON token matching
- `nameVariations` stored **lowercased** for case-insensitive BM25 matching (e.g. query "calendar" matches `list_calendar_events`)
- `description` excluded from BM25 — handled entirely by vector search

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
    // description excluded from BM25 — handled by vector search
    const results = await search(this._db, {
        mode: "hybrid",
        term: query,
        properties: ["name", "nameVariations", "schemaText"], // description handled by vector
        boost: {
            name: 3,           // exact name match ranks highest
            nameVariations: 2, // partial word match ranks second
            schemaText: 1.5,   // param name match ranks third
        },
        vector: { value: vec, property: "embedding" },
        limit,
        includeVectors: false,
    });

    return (results.hits || []).map((h) => ({
        name: h.document.name,
        description: h.document.description,
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
- `properties` scoped to `["name", "nameVariations", "schemaText"]` — `description` excluded from BM25, handled entirely by vector
- `boost` — BM25 field weights: `name ×3 > nameVariations ×2 > schemaText ×1.5` for ranked exact/partial/param matching
- No hard similarity threshold — RRF handles relevance naturally
- Rounds scores to 3 decimal places

**BM25 vs Vector responsibilities:**

| Query type                         | BM25                   | Vector      |
| ---------------------------------- | ---------------------- | ----------- |
| `"get_weather"` (exact name)       | ✅ Strong (boost ×3)   | ⚠️ Moderate |
| `"calendar"` (partial name word)   | ✅ Strong (boost ×2)   | ✅ Strong   |
| `"city units"` (param name)        | ✅ Strong (boost ×1.5) | ✅ Strong   |
| `"temperature celsius"` (semantic) | ❌ Not indexed         | ✅ Strong   |
| `"show my schedule"` (semantic)    | ❌ Not indexed         | ✅ Strong   |

Clean separation: BM25 owns names/params, vector owns description semantics.

> **Tool authoring tip:** For best retrieval, keep tool **names specific and action-oriented** (e.g. `get_weather`, `list_calendar_events`) and write **descriptions semantically** — use natural language, intent phrases, and synonyms (e.g. `"raining, snowing, sunny, temperature"`) rather than API documentation style (`Args:`, `Returns:`, type annotations). See [Tool Authoring Strategy](#tool-authoring-strategy) for details.

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

#### `_generateNameVariations(name)`

Breaks a tool name into individual words by splitting on `_`, `-`, space, and camelCase/PascalCase boundaries.

```javascript
_generateNameVariations(name) {
    const words = new Set();

    // Split by common separators: _ - space
    const separators = /[_-\s]+/;
    const sepWords = name.split(separators).filter(w => w.length > 0);
    for (const word of sepWords) {
        words.add(word);
    }

    // Also split the whole name on camelCase/PascalCase boundaries
    const camelWords = name.split(/(?=[A-Z])/).filter(w => w.length > 0);
    for (const cw of camelWords) {
        words.add(cw);
    }

    return Array.from(words);
}
```

**Parameters:** `name: string` — tool name in any convention

**Returns:** `Array<string>` — individual words

**Examples:**

| Input                  | Output                           |
| ---------------------- | -------------------------------- |
| `list_calendar_events` | `["list", "calendar", "events"]` |
| `list-calendar-events` | `["list", "calendar", "events"]` |
| `listCalendarEvents`   | `["list", "Calendar", "Events"]` |
| `ListCalendarEvents`   | `["List", "Calendar", "Events"]` |

Enables partial-name BM25 matching — query `"calendar"` matches `list_calendar_events`.

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

## Tool Authoring Strategy

ToolRAG's hybrid search has a clean division of responsibility — **names feed BM25, descriptions feed vector**. Writing tools with this in mind maximises retrieval accuracy.

### Tool Names — Be Specific

Names are BM25-indexed with high boost. Users often type tool names or fragments directly.

| ✅ Good                | ❌ Avoid        | Why                        |
| ---------------------- | --------------- | -------------------------- |
| `get_weather`          | `weather_tool`  | Verb + noun — clear action |
| `list_calendar_events` | `calendar`      | Full intent in the name    |
| `send_email`           | `email_handler` | Unambiguous verb           |
| `search_spotify`       | `spotify`       | Scoped to the action       |

Name words are broken down (e.g. `list_calendar_events` → `list`, `calendar`, `events`) and stored in `nameVariations` — so partial queries like `"calendar"` or `"events"` match via BM25.

### Tool Descriptions — Be Semantic

Descriptions are **not BM25-indexed** — they feed vector embeddings only. Write them how users **think and speak**, not how code is documented.

| ✅ Good (semantic)                                                                                                                           | ❌ Avoid (API docs)                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `"Retrieves the current weather forecast. Use this to check if it is raining, snowing, sunny, or to get the temperature in a specific city"` | `"Gets weather info. Args: city (str): Name of the city. Returns: dict"` |
| `"Retrieves the user's personal daily agenda, upcoming meetings, and appointments"`                                                          | `"Calls Google Calendar API to list events"`                             |
| `"Skips to the next song or track in the Spotify queue"`                                                                                     | `"Calls next_track endpoint"`                                            |

**Tips:**

- Include **synonyms and intent phrases** (`"warm or cold"`, `"is it raining"`, `"what's the weather like"`)
- Use `"Use this to..."` phrasing — mirrors how users frame requests
- Avoid `Args:`, `Returns:`, type annotations, and implementation details
- Keep the first sentence the core intent — it carries the most embedding weight

### Why This Matters

```
Query: "whats the feel in durgapur? warm or cold"

  BM25:   no match ("warm", "cold" not in name/params)
  Vector: "warm or cold" → "temperature, weather forecast" → ✅ get_weather

Query: "list calendar"

  BM25:   "calendar" → nameVariations of list_calendar_events → ✅ strong match
  Vector: "list calendar" → "daily agenda, upcoming meetings" → ✅ strong match

Query: "get_weather"

  BM25:   exact name match → ✅ boost ×3
  Vector: name in embedding → ✅ strong match
```

The combination ensures coverage for **exact**, **partial**, and **semantic** queries without any query preprocessing.
