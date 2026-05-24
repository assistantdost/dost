# ToolRAG Implementation Guide

## Overview

`ToolRAG` is a RAG (Retrieval-Augmented Generation) system for MCP (Model Context Protocol) tool discovery and selection. It combines **vector semantic search** with conversation-history-aware "sticky" tool selection to intelligently filter and prioritize relevant tools for LLM calls.

**Search strategy:** Combines vector semantic search with BM25 full-text search to handle all query types — exact names, partial name words, semantic phrases (e.g. "temperature" → `get_weather`), and keyword matches. Tool embeddings are enriched with name variations and parameter names for broad coverage. Vague follow-up queries (e.g. "do it", "set it to 8") are automatically enriched with the previous user message as context before searching. Sticky context adds tools used in recent turns regardless of search score.

**Location:** `electron/mcp/toolRAG.js`  
**Dependencies:** `@xenova/transformers`, `@orama/orama`  
**Model:** Xenova/all-MiniLM-L6-v2 (384-dimensional embeddings, quantized)  
**Cache Directory:** `~/.cache/dost-models` (downloads ~80MB on first run)

## Model Selection

The system uses **Xenova/all-MiniLM-L6-v2**, a compact sentence transformer optimized for semantic similarity tasks.

**Specifications:**

- **Dimensions:** 384
- **Architecture:** 6-layer transformer (MiniLM)
- **Training Data:** General-purpose sentence pairs
- **Performance:** High accuracy on semantic similarity benchmarks (e.g., STS tasks)
- **Size:** ~80MB quantized model
- **Inference Speed:** Fast on CPU (~10-20ms per embedding)

**Why this model:**

- **Efficiency:** Small footprint suitable for desktop applications
- **Accuracy:** Strong performance on semantic search without large model overhead
- **Compatibility:** Works well with @xenova/transformers for client-side inference
- **Quantization:** Supports quantized loading for reduced memory usage
- **Task Fit:** Designed for sentence similarity, perfect for tool discovery queries

Alternatives considered: Larger models like all-mpnet-base-v2 (768 dims, ~400MB) were too heavy for desktop use. Smaller models like all-MiniLM-L12-v2 (12 layers) offered marginal gains over L6-v2 but with higher latency.

## Architecture

### Core Components

1. **Vector Search Engine** - Semantic similarity via 384-dim embeddings
2. **BM25 Text Search Engine** - Keyword-based full-text search over tool names, descriptions, and parameters
3. **Enriched Tool Embeddings** - Embeds `name + name variations + description + parameter names` for broad query coverage
4. **Vague Query Enrichment** - Detects short/low-confidence queries and enriches with previous user message as context
5. **Sticky Context Extractor** - Conversation history analysis for tool continuity
6. **Debounced Re-indexing** - Automatic tool database updates with batching
7. **Unified Selection Algorithm** - Combines vector search + text search + sticky results with fallback

### Schema Fields

| Field            | Type        | Purpose                                | Role                                  |
| ---------------- | ----------- | -------------------------------------- | ------------------------------------- |
| `name`           | string      | Tool name                              | Stored, in embedText, BM25 searchable |
| `description`    | string      | Tool description                       | Stored, in embedText, BM25 searchable |
| `schemaText`     | string      | Readable param names (`city, units`)   | BM25 searchable                       |
| `nameVariations` | string      | Individual words from name, lowercased | BM25 searchable                       |
| `embedding`      | vector[384] | Semantic embedding                     | Vector search target                  |

All string fields except `embedding` contribute to BM25 full-text search. `name`, `description`, and `schemaText` are also included in the `embedText` used to generate the embedding for vector similarity.

### Data Flow

```
User Query ──→ Vague? ──yes──→ _getLastUserQuery() ──→ Enriched Query
                 │                                            │
                no                                           │
                 └──────────────────────────────────────────→┤
                                                             ↓
                                           Embed → Vector similarity → Semantic Hits
                                                             ↓
User Query ────────────────────────────────────→ BM25 Text Search → Text Hits
                                                             ↓
Conversation History ──────────────────────────→ Sticky Extraction → Sticky Tools
                                                             ↓
                                                  Merge & Deduplicate → Filtered Tools Object → LLM Agent
```

**Vague detection:** query has ≤ 6 words **OR** top search score < 0.4

## Class Definition

```javascript
export class ToolRAG {
	constructor(options = {}) {
		this.semanticLimit = options.semanticLimit ?? 5; // Max semantic search results
		this.stickyWindow = options.stickyWindow ?? 3; // Recent assistant turns to scan
		this.debounceMs = options.debounceMs ?? 100; // Reindex debounce delay
		this.textSearchLimit = options.textSearchLimit ?? 3; // Max BM25 text search results

		this._pipeline = null; // Transformer.js pipeline
		this._db = null; // Orama vector database
		this._reindexTimer = null; // Debounce timer
	}
}
```

## API Reference

### Constructor Options

| Option            | Type     | Default | Description                                               |
| ----------------- | -------- | ------- | --------------------------------------------------------- |
| `semanticLimit`   | `number` | `5`     | Maximum tools returned from semantic search               |
| `stickyWindow`    | `number` | `3`     | Number of recent assistant turns to scan for sticky tools |
| `debounceMs`      | `number` | `100`   | Milliseconds to debounce reindexing operations            |
| `textSearchLimit` | `number` | `3`     | Maximum tools returned from BM25 text search              |

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

        // Richer embedding: name + description + parameter names
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
            schemaText: paramNames, // clean readable text — BM25 indexes this
            nameVariations: nameVariations.join(" ").toLowerCase(), // individual words, lowercased — BM25 indexes this
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
- `embedText` format: `"${tool.name}. ${nameVariations.join(". ")}: ${description}. Parameters: ${paramNames}"` — packs full name, individual name words, description, and param names into one string for vector similarity
- `schemaText` and `nameVariations` stored separately for BM25 full-text search
- `nameVariations` stored lowercased for case-insensitive BM25 matching

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

Performs **vector semantic search** over indexed tools.

```javascript
async search(query, limit = this.semanticLimit) {
    this._assertReady();
    if (!this._db) return [];

    const { search } = await import("@orama/orama");
    const vec = await this._embed(query);

    const results = await search(this._db, {
        mode: "vector",
        vector: { value: vec, property: "embedding" },
        similarity: 0.25,
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

**Returns:** `Promise<Array<{name, description, score}>>`

**Implementation Notes:**

- `mode: "vector"` — pure cosine similarity on 384-dim embeddings
- `similarity: 0.25` — minimum threshold; filters very weak matches
- Keyword queries (exact name, partial words, param names) are covered because those tokens are baked into the embedding at index time via `embedText`
- Rounds scores to 3 decimal places

> **Tool authoring tip:** Both **names** and **descriptions** feed the embedding. Keep names specific and action-oriented, and write descriptions using natural language and intent phrases rather than API documentation style. See [Tool Authoring Strategy](#tool-authoring-strategy) for details.

#### `async textSearch(query, limit?)`

Performs **BM25 full-text search** over indexed tools.

```javascript
async textSearch(query, limit = this.textSearchLimit) {
    this._assertReady();
    if (!this._db) return [];

    const { search } = await import("@orama/orama");

    const results = await search(this._db, {
        mode: "fulltext",
        term: query,
        properties: ["name", "description", "schemaText", "nameVariations"],
        limit,
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
- `limit`: `number` - Maximum results (default: `this.textSearchLimit`)

**Returns:** `Promise<Array<{name, description, score}>>`

**Implementation Notes:**

- `mode: "fulltext"` — BM25 ranking over specified properties
- Searches `name`, `description`, `schemaText` (parameter names), and `nameVariations` (individual words from name)
- Useful for exact keyword matches and partial name queries
- Rounds scores to 3 decimal places

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

Combines semantic search, BM25 text search, and sticky context to select relevant tools.

```javascript
async select(query, history, allTools, options = {}) {
    const limit = options.semanticLimit ?? this.semanticLimit;
    const window = options.stickyWindow ?? this.stickyWindow;

    if (!this._pipeline || !this._db) {
        console.warn("ToolRAG not ready, returning all tools");
        return allTools;
    }

    console.log("<<-------------------------------------");

    // 1. Semantic hits — enrich vague queries with conversation context
    let searchQuery = query;
    const hits = await this.search(query, limit);
    const topScore = hits.length > 0 ? hits[0].score : 0;
    const isVague = query.split(/\s+/).length <= 6 || topScore < 0.4;

    if (isVague) {
        const prevQuery = this._getLastUserQuery(history);
        if (prevQuery) {
            searchQuery = `${query}. Context: ${prevQuery}`;
            const enrichedHits = await this.search(searchQuery, limit);
            // Merge: keep enriched hits, add any original hits not already present
            const seen = new Set(enrichedHits.map((h) => h.name));
            for (const h of hits) {
                if (!seen.has(h.name)) enrichedHits.push(h);
            }
            hits.length = 0;
            hits.push(...enrichedHits);
            console.log(
                "[ToolRAG] Vague query enriched with previous user query:",
                prevQuery,
            );
        }
    }

    const selected = new Set();

    console.log(
        "Semantic tools",
        Array.from(hits, (h) => `${h.name} `),
    );

    for (const t of hits) {
        selected.add(t.name);
    }

    // 2. BM25 text search
    const textHits = await this.textSearch(query, this.textSearchLimit);
    console.log(
        "Text tools",
        Array.from(textHits, (h) => `${h.name} `),
    );

    for (const t of textHits) {
        selected.add(t.name);
    }

    // 3. Sticky context (tool calls from previous turns)
    const sticky = this.extractSticky(history, window);

    for (const name of sticky) {
        selected.add(name);
    }

    console.log("Sticky tools", sticky);

    // 3. Build result object in exact tools format
    const result = {};
    for (const name of selected) {
        if (allTools[name]) {
            result[name] = allTools[name];
        }
    }

    console.log("------------------------------------->>");

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
2. **Semantic search** — vector similarity on current query → top N hits
3. **Vague detection** — query is vague if it has ≤ 6 words **OR** top hit score < 0.4
4. **Query enrichment** (if vague) — fetches previous user message via `_getLastUserQuery()`, re-searches with `"${query}. Context: ${prevQuery}"`, merges results
5. **Text search** — BM25 full-text search on query → additional hits
6. **Sticky extraction** — scan last K assistant turns for tool calls → tool names
7. **Merge** — union of semantic + text + sticky, deduplicated
8. **Build result** — return matching tools in original MCP format

**Why enrichment matters:**

```
Turn 1 — User: "whats the weather in durgapur?"
          → get_weather selected ✅

Turn 2 — User: "do it for kolkata too"
          → query alone: 5 words, vague
          → enriched: "do it for kolkata too. Context: whats the weather in durgapur?"
          → get_weather selected ✅ (would have missed without context)
```

#### `async testSelect(query, history, allTools, options?)`

Debug/inspection variant of `select()`. Includes the same logic for semantic search, text search, vague query enrichment, and sticky context. Returns a sorted annotated array instead of the tools object, for evaluating retrieval quality.

**Returns:** `Promise<Array<{name, description, score, source}>>` — sorted by score descending (semantic/text first, then sticky), with `source` being `"semantic"`, `"text"`, `"sticky"`, or `"both"`

**Use this for:** Debugging retrieval, evaluating query coverage, tuning `semanticLimit`/`textSearchLimit`/`stickyWindow`, verifying enrichment is firing correctly.

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

Name variations are included in `embedText` — so partial queries like `"calendar"` match `list_calendar_events` through vector similarity.

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

#### `_getLastUserQuery(history)`

Returns the previous user message from conversation history. Used by `select()` to enrich vague follow-up queries.

```javascript
_getLastUserQuery(history) {
    if (!history?.length) return null;

    let userTurnsSeen = 0;
    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (msg.role !== "user") continue;

        userTurnsSeen++;
        // Skip the first user message — that's the current query
        if (userTurnsSeen < 2) continue;

        // Extract text from the previous user message
        if (Array.isArray(msg.content)) {
            const text = msg.content
                .filter((c) => c.type === "text")
                .map((c) => c.text)
                .join(" ")
                .trim();
            if (text) return text;
        }

        if (typeof msg.content === "string" && msg.content.trim()) {
            return msg.content.trim();
        }
    }

    return null;
}
```

**Parameters:** `history: Array<object>` — conversation messages

**Returns:** `string | null` — text of the previous user turn, or `null` if none exists

**Implementation Notes:**

- Scans history backwards, skipping the first user message found (the current query)
- Returns the second user message encountered — the previous turn
- Handles both array `content` format (`[{type: "text", text: "..."}]`) and plain string content
- Returns `null` on first message in conversation (no previous context exists)

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
- **Selection:** ~30-60ms total (semantic search + text search + sticky extraction)

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

// Uses stickyWindow: 10 (increased from default 3), textSearchLimit: 3
```

This provides a ready-to-use instance with optimized defaults for production use.

## Tool Authoring Strategy

All retrieval goes through vector similarity — both **names** and **descriptions** feed the embedding. Writing both well maximises coverage across all query types.

### Tool Names — Be Specific and Action-Oriented

Name words are split (e.g. `list_calendar_events` → `list`, `calendar`, `events`) and baked into `embedText`. Specific verb-noun names put the right words into the embedding.

| ✅ Good                | ❌ Avoid        | Why                        |
| ---------------------- | --------------- | -------------------------- |
| `get_weather`          | `weather_tool`  | Verb + noun — clear action |
| `list_calendar_events` | `calendar`      | Full intent in the name    |
| `send_email`           | `email_handler` | Unambiguous verb           |
| `search_spotify`       | `spotify`       | Scoped to the action       |

### Tool Descriptions — Be Semantic

Descriptions are embedded alongside the name. Write them how users **think and speak**, not how code is documented.

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

  Vector: "warm or cold" → "temperature, weather forecast" → ✅ get_weather
  BM25: "warm" matches description → ✅ get_weather

Query: "list calendar"

  Vector: "list calendar" + nameVariations ("list", "calendar", "events") in embedText → ✅ list_calendar_events
  BM25: "calendar" matches nameVariations → ✅ list_calendar_events

Query: "get_weather"

  Vector: exact name in embedText → ✅ strong match
  BM25: exact name match → ✅ strong match
```

The enriched `embedText` format ensures coverage for **exact**, **partial**, and **semantic** queries without any query preprocessing.
