import {
	convertToModelMessages,
	Experimental_Agent as Agent,
	stepCountIs,
} from "ai";
import { groq } from "@ai-sdk/groq";
import { getActiveTools } from "../mcpStore.js";

export const providerOptions = {
	groq: {
		reasoningFormat: "parsed",
		reasoningEffort: "low",
		parallelToolCalls: true,
		maxTokens: 3000,
	},
};

// ✅ Cache the agent to avoid recreating on every call
let cachedAgent = null;

export async function chatAgent() {
	// Always get fresh tools from store
	const tools = getActiveTools();

	// Check if tools have changed (compare tool names)
	const currentToolNames = Object.keys(tools || {});
	const cachedToolNames = cachedAgent
		? Object.keys(cachedAgent.tools || {}).filter(
				(name) => name !== "browser_search",
			)
		: [];

	const toolsChanged =
		currentToolNames.length !== cachedToolNames.length ||
		!currentToolNames.every((name) => cachedToolNames.includes(name));

	if (!cachedAgent || toolsChanged) {
		// Create new agent if it doesn't exist or tools changed
		cachedAgent = new Agent({
			model: groq("openai/gpt-oss-20b"),
			tools: {
				...tools,
				browser_search: groq.tools.browserSearch({}),
			},
			toolChoice: "auto",
			stopWhen: stepCountIs(10),
			system: `You are a helpful assistant. You can use multiple tools in sequence to solve complex tasks.
         If a tool's output suggests another tool should be used, do so.
         Always explain your reasoning and show intermediate steps.
         Keep reasoning small and focused until asked for more.
         Try to answer quickly and using fewer tokens.
         Address the user as "you" in all responses.
         Always answer in beautiful markdown format.
         Always format math in Markdown using $...$ for inline and $$...$$ for block equations.
         Diagram (Graphviz/DOT): Render compact, modern diagram (rounded nodes, pastel colors, Helvetica font, light grey edges, fits A4 width), just mention one line about it, nothing more info.
         Always give Authorization links as clickable hyperlinks in markdown format like - [link text](https://example.com)`,
		});
	}

	return cachedAgent;
}
