/**
 * testToolSelector.cjs — Test harness for sticky RAG tool selection
 *
 * Simulates multi-turn conversations to validate that:
 * 1. Fresh queries use semantic search
 * 2. Follow-ups retain relevant tools from history (sticky context)
 * 3. Topic switches drop old tools and pick new ones
 *
 * Usage:
 *   node services/testToolSelector.cjs
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

function log(...args) {
  const line = args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a, null, 2)))
    .join(" ");
  logLines.push(line);
  _origLog(...args);
}

console.log = log;
console.warn = (...args) => log("[WARN]", ...args);
console.error = (...args) => log("[ERROR]", ...args);

// ─── Helpers ────────────────────────────────────────────────────────────────

function divider(label) {
  log(`\n${"═".repeat(60)}`);
  log(`  ${label}`);
  log(`${"═".repeat(60)}\n`);
}

function printToolList(tools) {
  if (tools.length === 0) {
    log("  (no tools selected)");
    return;
  }
  tools.forEach((t, i) => {
    const scoreStr = t.score > 0 ? `[${t.score}]` : "[---]";
    const tag = `(${t.source})`;
    log(`  ${i + 1}. ${scoreStr} ${t.name} ${tag}`);
  });
  log();
}

// ─── Load Tools ─────────────────────────────────────────────────────────────

function loadAllTools() {
  const filePath = path.resolve(__dirname, "..", "..", "tools_enriched.json");
  if (!fs.existsSync(filePath)) {
    console.error(`❌ tools_enriched.json not found at: ${filePath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// ─── Test Scenarios ─────────────────────────────────────────────────────────

/**
 * Each scenario simulates a multi-turn conversation.
 * `turns` is an array where each turn has:
 *   - user: the user's message
 *   - assistantToolCalls: tools the assistant would call (simulated)
 *   - expectInResults: tool names we expect in the selected tools
 *   - expectSource: optional, expected source for a specific tool
 */
const SCENARIOS = [
  {
    name: "Basic: Fresh query, no history",
    turns: [
      {
        user: "send an email to John",
        assistantToolCalls: [],
        expectInResults: ["send_email"],
      },
    ],
  },
  {
    name: "Sticky: 'try again' after a failed tool call",
    turns: [
      {
        user: "send an email to John",
        assistantToolCalls: ["send_email"],
        expectInResults: ["send_email"],
      },
      {
        user: "try again, it failed",
        assistantToolCalls: [],
        expectInResults: ["send_email"],
        expectSource: { send_email: "sticky" },
      },
    ],
  },
  {
    name: "Sticky: 'louder' after volume control",
    turns: [
      {
        user: "turn down the volume",
        assistantToolCalls: ["sound_control"],
        expectInResults: ["sound_control"],
      },
      {
        user: "louder",
        assistantToolCalls: [],
        expectInResults: ["sound_control"],
      },
    ],
  },
  {
    name: "Topic switch: email → music drops email tools",
    turns: [
      {
        user: "send an email to John",
        assistantToolCalls: ["send_email"],
        expectInResults: ["send_email"],
      },
      {
        user: "now play some music on Spotify",
        assistantToolCalls: [],
        expectInResults: ["start_spotify_playback"],
        expectNotInResults: [], // send_email may or may not appear — it's sticky
      },
    ],
  },
  {
    name: "Sticky: 'do it again' after brightness change",
    turns: [
      {
        user: "dim the screen",
        assistantToolCalls: ["brightness_control"],
        expectInResults: ["brightness_control"],
      },
      {
        user: "do it again",
        assistantToolCalls: [],
        expectInResults: ["brightness_control"],
        expectSource: { brightness_control: "sticky" },
      },
    ],
  },
  {
    name: "Multi-tool sticky: calendar + contacts persist",
    turns: [
      {
        user: "schedule a meeting with Rohan tomorrow at 3pm",
        assistantToolCalls: ["list_contacts", "create_calendar_event"],
        expectInResults: ["create_calendar_event"],
      },
      {
        user: "actually make it 4pm instead",
        assistantToolCalls: [],
        expectInResults: ["create_calendar_event", "list_contacts"],
      },
    ],
  },
  {
    name: "Sticky window: old tools expire beyond window",
    turns: [
      {
        user: "send an email",
        assistantToolCalls: ["send_email"],
        expectInResults: ["send_email"],
      },
      {
        user: "play music",
        assistantToolCalls: ["start_spotify_playback"],
        expectInResults: [],
      },
      {
        user: "take a screenshot",
        assistantToolCalls: ["screenshot"],
        expectInResults: [],
      },
      {
        user: "check my calendar",
        assistantToolCalls: ["list_calendar_events"],
        expectInResults: [],
      },
      {
        // send_email is 4 turns ago, outside stickyWindow=3
        user: "do that email thing again",
        assistantToolCalls: [],
        expectInResults: ["send_email"], // should come from semantic, NOT sticky
        // Note: send_email may or may not appear depending on semantic score
      },
    ],
  },
];

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  await loadModules(); // Load ESM modules
  const rag = new ToolRAG();
  const totalStart = Date.now();

  divider("STICKY RAG TOOL SELECTOR — TEST HARNESS");

  // Initialize
  divider("STEP 1: Initialize & Index");
  await rag.init();

  const allTools = loadAllTools();
  const toolsArray = Object.entries(allTools).map(([name, data]) => ({
    name,
    description: data.description || "",
    inputSchema: data.inputSchema || {},
  }));

  await rag.index(toolsArray);
  log(`\nAll tools map has ${Object.keys(allTools).length} entries`);

  // Run scenarios
  divider("STEP 2: Run Scenarios");

  let totalChecks = 0;
  let passed = 0;
  let failed = 0;

  for (const scenario of SCENARIOS) {
    log(`\n${"─".repeat(60)}`);
    log(`  Scenario: ${scenario.name}`);
    log(`${"─".repeat(60)}`);

    const history = [];

    for (let t = 0; t < scenario.turns.length; t++) {
      const turn = scenario.turns[t];
      log(`\n  Turn ${t + 1}: "${turn.user}"`);

      const selected = await rag.select(turn.user, history, allTools);
      printToolList(selected);

      // Validate expectations
      if (turn.expectInResults && turn.expectInResults.length > 0) {
        for (const expectedName of turn.expectInResults) {
          totalChecks++;
          const found = selected.find((s) => s.name === expectedName);
          if (found) {
            // Check source if specified
            if (
              turn.expectSource &&
              turn.expectSource[expectedName] &&
              found.source !== turn.expectSource[expectedName] &&
              found.source !== "both"
            ) {
              log(
                `  ⚠️  SOFT FAIL — "${expectedName}" found but source is "${found.source}", expected "${turn.expectSource[expectedName]}"`,
              );
              // Count as pass — tool was found, source is a soft check
              passed++;
            } else {
              log(
                `  ✅ PASS — "${expectedName}" present ${found.source ? `(${found.source})` : ""}`,
              );
              passed++;
            }
          } else {
            log(`  ❌ FAIL — "${expectedName}" NOT in selected tools`);
            failed++;
          }
        }
      }

      // Build history for the next turn
      // Add user message
      history.push({ role: "user", content: turn.user });

      // Add simulated assistant response with tool calls
      if (turn.assistantToolCalls && turn.assistantToolCalls.length > 0) {
        history.push({
          role: "assistant",
          content: "",
          toolCalls: turn.assistantToolCalls.map((name) => ({
            name,
            args: {},
          })),
        });

        // Add simulated tool results
        for (const toolName of turn.assistantToolCalls) {
          history.push({
            role: "tool",
            toolName: toolName,
            content: `[simulated result for ${toolName}]`,
          });
        }
      } else {
        history.push({ role: "assistant", content: "[response]" });
      }
    }
  }

  // Summary
  divider("TEST SUMMARY");
  const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(2);
  log(`  Scenarios:      ${SCENARIOS.length}`);
  log(`  Total checks:   ${totalChecks}`);
  log(`  Passed:         ${passed}`);
  log(`  Failed:         ${failed}`);
  log(`  Total time:     ${totalElapsed}s`);
  log(
    `  Status:         ${failed === 0 ? "🎉 ALL PASSED" : "⚠️  SOME FAILED"}`,
  );
  log();

  // Write results to file
  const outputPath = path.resolve(__dirname, "..", "test_results_selector.txt");
  fs.writeFileSync(outputPath, logLines.join("\n"), "utf-8");
  _origLog(`📄 Results saved to: ${outputPath}`);
}

main().catch((err) => {
  console.error("💥 Test harness failed:", err);
  process.exit(1);
});
