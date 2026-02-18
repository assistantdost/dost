/**
 * testVectorStore.js — Standalone test harness for the vector store module
 *
 * Reads tools from tools_enriched.json, indexes them, and runs
 * sample queries to validate search relevance.
 *
 * Usage:
 *   node services/testVectorStore.js
 */

const path = require("path");
const fs = require("fs");

// Dynamic import for ESM module
let ToolRAG;
async function loadModules() {
  const mod = await import("./toolRAG.js");
  ToolRAG = mod.ToolRAG;
}

// ─── Log Capture ────────────────────────────────────────────────────────────

const logLines = [];
const _origLog = console.log;
const _origWarn = console.warn;
const _origError = console.error;

function log(...args) {
  const line = args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a, null, 2)))
    .join(" ");
  logLines.push(line);
  _origLog(...args);
}

// Override console methods to capture everything
console.log = log;
console.warn = (...args) => {
  log("[WARN]", ...args);
};
console.error = (...args) => {
  log("[ERROR]", ...args);
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function printDivider(label) {
  log(`\n${"═".repeat(60)}`);
  log(`  ${label}`);
  log(`${"═".repeat(60)}\n`);
}

function printResults(query, results) {
  console.log(`\n  Query: "${query}"`);
  console.log(`  ${"─".repeat(50)}`);
  if (results.length === 0) {
    console.log("  ⚠️  No results found.");
  } else {
    results.forEach((r, i) => {
      console.log(`  ${i + 1}. [${r.score}] ${r.name}`);
      // Truncate long descriptions
      const desc =
        r.description.length > 100
          ? r.description.substring(0, 100) + "..."
          : r.description;
      console.log(`     ${desc}`);
    });
  }
  console.log();
}

// ─── Load Tools ─────────────────────────────────────────────────────────────

function loadToolsFromSnapshot() {
  // tools_enriched.json is at the dost project root
  const snapshotPath = path.resolve(
    __dirname,
    "..",
    "..",
    "tools_enriched.json",
  );

  if (!fs.existsSync(snapshotPath)) {
    console.error(`❌ tools_enriched.json not found at: ${snapshotPath}`);
    console.error(
      "   Make sure you run this from the mcp-desktop-client directory.",
    );
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(snapshotPath, "utf-8"));

  // Convert from { toolName: { description, inputSchema, type } } → array
  const tools = Object.entries(raw).map(([name, data]) => ({
    name,
    description: data.description || "",
    inputSchema: data.inputSchema || {},
  }));

  console.log(`📂 Loaded ${tools.length} tools from tools_enriched.json`);
  return tools;
}

// ─── Test Queries ───────────────────────────────────────────────────────────

const TEST_QUERIES = [
  // --- EXISTING BASELINE TESTS ---
  { query: "send an email to someone", expectTopHit: "send_email" },
  { query: "play some music", expectContains: "spotify" }, // Matches generic music intent
  { query: "what time is it right now", expectTopHit: "get_time" },
  {
    query: "check my schedule for tomorrow",
    expectTopHit: "list_calendar_events",
  },
  { query: "find a file on my computer", expectTopHit: "find_files" },
  {
    query: "read my recent messages from inbox",
    expectTopHit: "read_recent_emails",
  },
  { query: "copy text to clipboard", expectTopHit: "clipboard_manager" },

  // --- GROUP 1: MEDIA CONTROLS (Ambiguity: YouTube vs Spotify) ---
  {
    query: "skip this song",
    expectTopHit: "next_track_spotify",
  },
  {
    query: "pause the music",
    expectTopHit: "pause_spotify",
  },
  {
    query: "listen to Bohemian Rhapsody on YouTube",
    expectTopHit: "play_song", // Should pick YouTube tool, not Spotify
  },
  {
    query: "transfer music to my speaker",
    expectTopHit: "set_spotify_device",
  },

  // --- GROUP 2: SYSTEM AUTOMATION (The "Schedule" Trap) ---
  {
    query: "run a python script every day at 9am",
    expectTopHit: "schedule_task", // Should NOT be calendar
  },
  {
    query: "cancel the backup job",
    expectTopHit: "delete_scheduled_task",
  },
  {
    query: "list all running background automation",
    expectTopHit: "list_scheduled_tasks",
  },

  // --- GROUP 3: WINDOW MANAGEMENT (Ambiguity: "Close" vs "Minimize") ---
  {
    query: "hide this window",
    expectTopHit: "minimize_window",
  },
  {
    query: "bring firefox to the front",
    expectTopHit: "focus_window",
  },
  {
    query: "kill this application",
    expectTopHit: "close_window",
  },
  {
    query: "make this full screen",
    expectTopHit: "maximize_window",
  },

  // --- GROUP 4: HARDWARE CONTROL (Volume vs Brightness) ---
  {
    query: "screen is too bright",
    expectTopHit: "brightness_control",
  },
  {
    query: "dim the display",
    expectTopHit: "brightness_control",
  },
  {
    query: "mute the audio",
    expectTopHit: "sound_control",
  },
  {
    query: "turn up the volume",
    expectTopHit: "sound_control",
  },

  // --- GROUP 5: PRODUCTIVITY (Notes vs Files) ---
  {
    query: "jot down a quick reminder",
    expectTopHit: "create_note",
  },
  {
    query: "calculate the average of these numbers",
    expectTopHit: "calculator",
  },
  {
    query: "search for a PDF named invoice",
    expectTopHit: "find_files",
  },
  {
    query: "take a picture of my screen",
    expectTopHit: "screenshot",
  },

  // --- GROUP 6: WEB & INFORMATION ---
  {
    query: "how much is Apple stock today?",
    expectTopHit: "get_stock_data",
  },
  {
    query: "what is the temperature of Durgapur?",
    expectTopHit: "get_weather",
  },
  {
    query: "open google.com",
    expectTopHit: "open_webpage",
  },
  {
    query: "launch the spotify app",
    expectTopHit: "open_app", // Should be open_app, not a spotify control tool
  },
  {
    query: "search google for pasta recipes",
    expectTopHit: "search_web",
  },

  // --- GROUP 7: SYSTEM POWER (High Risk) ---
  {
    query: "shut down the pc",
    expectTopHit: "system_power",
  },
  {
    query:
      "schedule a meet with anirban and also mail them the meet information",
    expectTopHit: "create_calendar_event",
  },
];

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  await loadModules(); // Load ESM modules
  const rag = new ToolRAG();
  const totalStart = Date.now();

  printDivider("VECTOR STORE TEST HARNESS");

  // Step 1: Initialize
  printDivider("STEP 1: Initialize Embedding Pipeline");
  await rag.init();
  console.log("Status:", rag.status);

  // Step 2: Load and index tools
  printDivider("STEP 2: Load & Index Tools");
  const tools = loadToolsFromSnapshot();
  const indexResult = await rag.index(tools);
  console.log("Index result:", indexResult);

  // Step 3: Run test queries
  printDivider("STEP 3: Search Queries");

  let passed = 0;
  let failed = 0;

  for (const test of TEST_QUERIES) {
    const results = await rag.search(test.query, 5);
    printResults(test.query, results);

    // Validate relevance
    if (results.length > 0) {
      const topHitName = results[0].name.toLowerCase();

      if (test.expectTopHit) {
        if (topHitName === test.expectTopHit.toLowerCase()) {
          console.log(
            `  ✅ PASS — Top hit matches expected: ${test.expectTopHit}`,
          );
          passed++;
        } else {
          console.log(
            `  ❌ FAIL — Expected top hit "${test.expectTopHit}", got "${results[0].name}"`,
          );
          failed++;
        }
      } else if (test.expectContains) {
        const anyMatch = results.some((r) =>
          r.name.toLowerCase().includes(test.expectContains.toLowerCase()),
        );
        if (anyMatch) {
          console.log(`  ✅ PASS — Results contain "${test.expectContains}"`);
          passed++;
        } else {
          console.log(
            `  ❌ FAIL — No result contains "${test.expectContains}"`,
          );
          failed++;
        }
      }
    } else {
      console.log(`  ❌ FAIL — No results returned`);
      failed++;
    }
  }

  // Summary
  printDivider("TEST SUMMARY");
  const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(2);
  console.log(`  Total queries:  ${TEST_QUERIES.length}`);
  console.log(`  Passed:         ${passed}`);
  console.log(`  Failed:         ${failed}`);
  console.log(`  Total time:     ${totalElapsed}s`);
  console.log(
    `  Status:         ${failed === 0 ? "🎉 ALL PASSED" : "⚠️  SOME FAILED"}`,
  );
  console.log();

  // Write results to file
  const outputPath = path.resolve(__dirname, "..", "test_results.txt");
  fs.writeFileSync(outputPath, logLines.join("\n"), "utf-8");
  _origLog(`📄 Results saved to: ${outputPath}`);
}

main().catch((err) => {
  console.error("💥 Test harness failed:", err);
  process.exit(1);
});
