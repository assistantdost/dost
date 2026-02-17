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
    this.debounceMs = options.debounceMs ?? 500;

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
        schemaJson: "string",
        embedding: `vector[${DIMS}]`,
      },
    });

    for (const tool of tools) {
      const desc = tool.description || "";
      const vec = await this._embed(`${tool.name}: ${desc}`);
      insert(this._db, {
        name: tool.name,
        description: desc,
        schemaJson: JSON.stringify(tool.inputSchema || {}),
        embedding: vec,
      });
    }

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

    const results = search(this._db, {
      mode: "vector",
      vector: { value: vec, property: "embedding" },
      similarity: 0.25,
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
        for (const tc of msg.toolCalls || []) {
          if (tc.name) names.add(tc.name);
        }
        for (const tc of msg.tool_calls || []) {
          names.add(tc.name || tc.function?.name);
        }
      }

      if (msg.role === "tool" && msg.toolName) {
        names.add(msg.toolName);
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
   * Returns a merged, deduplicated list. Each tool has a `source` tag:
   *   "semantic" | "sticky" | "both"
   *
   * @param {string} query - Current user message
   * @param {Array<object>} history - Conversation messages
   * @param {Object<string, object>} allTools - Full tools map (keyed by name)
   * @param {object} [options] - Override semanticLimit / stickyWindow
   * @returns {Promise<Array<{name, description, inputSchema, score, source}>>}
   */
  async select(query, history, allTools, options = {}) {
    const limit = options.semanticLimit ?? this.semanticLimit;
    const window = options.stickyWindow ?? this.stickyWindow;

    // 1. Semantic hits
    const hits = await this.search(query, limit);
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
export const toolRAG = new ToolRAG();
