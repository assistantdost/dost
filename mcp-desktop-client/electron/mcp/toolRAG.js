/**
 * toolRAG.js — Unified RAG module for MCP tool discovery + sticky context.
 *
 * Combines vector-based semantic search with conversation-history-aware
 * "sticky" tools. Single class, single file, ready for Electron integration.
 *
 * Dependencies: @xenova/transformers, @orama/orama
 */

import path from "path";
import os from "os";
import fs from "fs";

const MODEL = "Xenova/all-MiniLM-L6-v2";
const DIMS = 384;
const CACHE_DIR = path.join(os.homedir(), ".cache", "dost-models");

export class ToolRAG {
  constructor(options = {}) {
    this.semanticLimit = options.semanticLimit ?? 5;
    this.stickyWindow = options.stickyWindow ?? 3;
    this.debounceMs = options.debounceMs ?? 100;

    this._pipeline = null;
    this._db = null;
    this._reindexTimer = null;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  /**
   * Load the embedding model. Call once on app startup.
   * Downloads ~80MB on first run, then loads from cache (~0.25s).
   */
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

  /**
   * Index tools into the vector database. Recreates the DB each time.
   * @param {Array<{name: string, description: string, inputSchema?: object}>} tools
   * @returns {Promise<{count: number, timeMs: number}>}
   */
  async index(tools) {
    this._assertReady();
    if (!tools?.length) return { count: 0, timeMs: 0 };

    const { create, insert } = await import("@orama/orama");
    const start = Date.now();

    this._db = create({
      schema: {
        name: "string",
        description: "string",
        schemaText: "string", // human-readable param names for BM25
        nameVariations: "string", // individual words from name, lowercased for BM25
        embedding: `vector[${DIMS}]`,
      },
    });

    for (const tool of tools) {
      const desc = tool.description || "";

      // Richer embedding: name + description + parameter names
      const paramNames = Object.keys(
        tool.inputSchema?.properties ||
          tool.inputSchema?.jsonSchema?.properties ||
          {},
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

  /**
   * Bridge for mcpStore integration. Accepts activeTools object format
   * ({name: {description, parameters, execute}}) and re-indexes.
   * Debounced to avoid rapid re-indexing during batch server connections.
   * @param {Object<string, object>} activeTools - mcpStore.activeTools
   */
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

  // ── Search ──────────────────────────────────────────────────────────────────

  /**
   * Semantic vector search over indexed tools.
   * @param {string} query
   * @param {number} [limit]
   * @returns {Promise<Array<{name, description, inputSchema, score}>>}
   */

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

  // ── Sticky Context ──────────────────────────────────────────────────────────

  /**
   * Extract tool names from recent conversation history.
   * Scans the last N assistant turns for tool calls.
   * @param {Array<object>} history - Conversation messages
   * @param {number} [window]
   * @returns {Set<string>}
   */
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

  // ── Main Entry Point ────────────────────────────────────────────────────────

  /**
   * Select tools for an LLM call. Combines:
   *   1. Semantic search on the current query
   *   2. Sticky tools from recent conversation turns
   *
   * Returns a merged, deduplicated object in the exact tools format.
   * Keys are tool names, values are tool definitions.
   *
   * @param {string} query - Current user message
   * @param {Array<object>} history - Conversation messages
   * @param {Object<string, object>} allTools - Full tools map (keyed by name)
   * @param {object} [options] - Override semanticLimit / stickyWindow
   * @returns {Promise<Object<string, object>>}
   */

  async select(query, history, allTools, options = {}) {
    const limit = options.semanticLimit ?? this.semanticLimit;
    const window = options.stickyWindow ?? this.stickyWindow;

    if (!this._pipeline || !this._db) {
      console.warn("ToolRAG not ready, returning all tools");
      return allTools;
    }

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

    console.log("-------------------------------------");
    console.log(
      "Semantic tools",
      Array.from(hits, (h) => `${h.name} `),
    );

    for (const t of hits) {
      selected.add(t.name);
    }

    // 2. Sticky context (tool calls from previous turns)
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

    return result;
  }
  async testSelect(query, history, allTools, options = {}) {
    const limit = options.semanticLimit ?? this.semanticLimit;
    const window = options.stickyWindow ?? this.stickyWindow;

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
        const seen = new Set(enrichedHits.map((h) => h.name));
        for (const h of hits) {
          if (!seen.has(h.name)) enrichedHits.push(h);
        }
        hits.length = 0;
        hits.push(...enrichedHits);
      }
    }

    const map = new Map();

    for (const t of hits) {
      map.set(t.name, { ...t, source: "semantic" });
    }

    // 2. Sticky context
    const sticky = this.extractSticky(history, window);

    for (const name of sticky) {
      if (map.has(name)) {
        map.get(name).source = "both";
        continue;
      }
      const def = allTools[name];
      if (def) {
        map.set(name, {
          name,
          description: def.description || "",
          inputSchema: def.inputSchema || {},
          score: 0,
          source: "sticky",
        });
      }
    }

    // 3. Sort: semantic/both first (by score desc), then sticky
    return [...map.values()].sort((a, b) => {
      if (a.source === "sticky" && b.source !== "sticky") return 1;
      if (a.source !== "sticky" && b.source === "sticky") return -1;
      return b.score - a.score;
    });
  }

  // ── Status ──────────────────────────────────────────────────────────────────

  get ready() {
    return !!this._pipeline;
  }

  get indexed() {
    return !!this._db;
  }

  get status() {
    return { ready: this.ready, indexed: this.indexed, model: MODEL };
  }

  // ── Internals ───────────────────────────────────────────────────────────────
  /**
   * Get the previous user message from conversation history.
   * Used to enrich vague follow-up queries ("do it", "set it to 8")
   * with the original user query that correctly matched tools.
   * Skips the current (latest) user message since that's the query itself.
   * @param {Array<object>} history
   * @returns {string|null}
   */
  _getLastUserQuery(history) {
    if (!history?.length) return null;

    let userTurnsSeen = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      if (msg.role !== "user") continue;

      userTurnsSeen++;
      // Skip the first user message we find — that's the current query
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

  /**
   * Generate name variations with common separators.
   * @param {string} name
   * @returns {Array<string>}
   */
  _generateNameVariations(name) {
    const words = new Set();

    // Split by common separators: _ - space
    const separators = /[_-\s]+/;
    const sepWords = name.split(separators).filter((w) => w.length > 0);
    for (const word of sepWords) {
      words.add(word);
    }

    // Also split the whole name on camelCase/PascalCase boundaries
    const camelWords = name.split(/(?=[A-Z])/).filter((w) => w.length > 0);
    for (const cw of camelWords) {
      words.add(cw);
    }

    return Array.from(words);
  }

  async _embed(text) {
    const out = await this._pipeline(text, {
      pooling: "mean",
      normalize: true,
    });
    return Array.from(out.data);
  }

  _assertReady() {
    if (!this._pipeline) {
      throw new Error("ToolRAG not initialized. Call init() first.");
    }
  }
}

// Default singleton for convenience
export const toolRAG = new ToolRAG({
  stickyWindow: 10,
});
