import { convertToModelMessages, pipeAgentUIStreamToResponse } from "ai";
// import { chatAgent } from "../ai/agent.js";
import { aiModel } from "../ai/models.js";
import { tools } from "../mcp/tools.js";
import { toolRAG } from "../mcp/toolRAG.js";
import { generateText } from "ai";

import { config } from "../config.js";
import getStore from "../store.js";

const DEFAULT_SUMMARY_MAX_TOKENS = 700;

function getSummaryMaxTokens() {
	const settingsStore = getStore().get("settingsStore") || {};
	const numericValue = Number(settingsStore?.state?.summaryMaxTokens);

	if (Number.isFinite(numericValue)) {
		return Math.min(Math.max(Math.round(numericValue), 200), 2000);
	}

	return DEFAULT_SUMMARY_MAX_TOKENS;
}

export async function setupRoutes(server, mainWindow) {
	// Await the agents

	// Handle /api/chat endpoint
	server.post("/api/chat", async (req, res) => {
		try {
			// Ensure AI model is initialized
			if (!aiModel.state.provider || !aiModel.state.chatModel) {
				console.log("AI model not initialized, initializing...");
				await aiModel.init();
			}

			const { messages } = req.body;

			res.setHeader("Content-Type", "text/event-stream");
			res.setHeader("Cache-Control", "no-cache");
			res.setHeader("Connection", "keep-alive");

			// ============= Preprocess messages for Optimal Tool Selection============
			// Filter messages to only include role and parts
			const filteredMessages = messages.map((msg) => ({
				role: msg.role,
				parts: msg.parts,
			}));

			const modelMessages =
				await convertToModelMessages(filteredMessages);

			const activeTools = tools.getTools();

			const query =
				modelMessages[modelMessages.length - 1].content[0].text || "";

			// Optimal Tool Selection
			const filteredTools = await toolRAG.select(
				query,
				modelMessages,
				activeTools,
			);

			// ============================================================================

			const agent = await aiModel.chatAgent(filteredTools);

			await pipeAgentUIStreamToResponse({
				response: res,
				agent,
				uiMessages: messages,
			});
		} catch (error) {
			console.error("Error in /api/chat:", error);
			if (!res.headersSent) {
				res.status(500).json({ error: "Internal Server Error" });
			}
		}
	});

	// Handle /api/summarize endpoint
	server.post("/api/summarize", async (req, res) => {
		try {
			// Ensure AI model is initialized
			if (!aiModel.state.provider || !aiModel.state.summaryModel) {
				console.log("AI model not initialized, initializing...");
				await aiModel.init();
			}

			const { messages } = req.body;

			if (!messages || !Array.isArray(messages)) {
				return res
					.status(400)
					.json({ error: "Messages array required" });
			}

			// ✅ Extract only text content from all parts (reasoning, tool-call, tool-result, text)
			const extractTextFromParts = (parts) => {
				return parts
					.map((part) => {
						switch (part.type) {
							case "text":
								return part.text;
							case "reasoning":
								return `Reasoning: ${part.text}`;
							case "tool-call":
								return `Tool used: ${part.toolName} with input ${JSON.stringify(part.input)}`;
							case "tool-result":
								const output =
									part.output?.content?.[0]?.text ||
									part.output?.structuredContent?.result ||
									JSON.stringify(part.output);
								return `Tool result: ${output}`;
							default:
								return "";
						}
					})
					.filter(Boolean)
					.join("\n");
			};

			// ✅ Convert messages to simple text format for summarization
			const simplifiedMessages = messages
				.map((msg) => {
					if (!msg.parts || msg.parts.length === 0) return null;

					const textContent = extractTextFromParts(msg.parts);
					if (!textContent) return null;

					// ✅ Handle different roles properly
					let role = "user";
					if (msg.role === "assistant" || msg.role === "tool") {
						role = "assistant"; // Tool results are from assistant's actions
					}
					// "system" would stay as "system" if present, but default to "user"

					return {
						role,
						content: textContent,
					};
				})
				.filter(Boolean);

			// ✅ Create summary prompt with simple text messages
			const summaryPrompt = [
				{
					role: "system",
					content: `You are an exacting Data Extraction and Summarization AI. Your primary directive is the comprehensive, lossless retention of all hard facts, figures, and context from the conversation. 

You must extract and preserve EVERY specific detail: numbers, dates, IDs, financial figures, names, and exact measurements. Do not paraphrase or generalize hard data.

Format your response STRICTLY using the following sections:
- NARRATIVE SUMMARY: A thorough overview of the interaction, detailing the core topics discussed, the user's intent, and the overall conversational context.
- CRITICAL DATA: A comprehensive bulleted list of every specific number, metric, constraint, and factual entity mentioned in the conversation.`,
				},
				...simplifiedMessages,
				{
					role: "user",
					content:
						"Please process the conversation above. Generate a comprehensive summary and extract all key data following the required structure. Ensure absolutely no loss of numbers, figures, or specific factual details.",
				},
			];

			// ✅ Use llama-3.1-8b-instant with simple text messages
			const summaryResponse = await generateText({
				model: await aiModel.getSummaryModel(),
				messages: summaryPrompt,
				maxTokens: getSummaryMaxTokens(),
				temperature: 0.3, // Lower temperature for more focused summaries
			});

			// Return in message format
			const summaryMessage = {
				role: "system",
				parts: [
					{
						type: "text",
						text: "[SUMMARY] " + summaryResponse.text,
					},
				],
				created_at: new Date().toISOString(),
			};

			res.json(summaryMessage);
		} catch (error) {
			console.error("Error in /api/summarize:", error);
			if (!res.headersSent) {
				res.status(500).json({ error: "Internal Server Error" });
			}
		}
	});

	// OAuth callback route
	server.get("/oauth/google/callback", async (req, res) => {
		const code = req.query.code;
		if (!code) {
			return res.status(400).send("Missing authorization code");
		}

		try {
			const tokenResponse = await fetch(
				"https://oauth2.googleapis.com/token",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: new URLSearchParams({
						client_id: config.GOOGLE_CLIENT_ID,
						client_secret: config.GOOGLE_CLIENT_SECRET,
						code,
						grant_type: "authorization_code",
						redirect_uri:
							"http://localhost:5599/oauth/google/callback",
					}),
				},
			);
			const tokens = await tokenResponse.json();

			if (tokens.access_token && mainWindow) {
				mainWindow.webContents.send("oauth-tokens", tokens);
				res.send(`
                    <html>
                        <head><title>Sign-In Success</title></head>
                        <body>
                            <h1>Google Sign-In successful!</h1>
                            <p>This window will close automatically.</p>
                            <script>
                                setTimeout(() => window.close(), 1000);
                            </script>
                        </body>
                    </html>
                `);
			} else {
				res.status(400).send("Token exchange failed");
			}
		} catch (error) {
			console.error("OAuth callback error:", error);
			res.status(500).send("Internal server error");
		}
	});

	// Handle /api/health endpoint
	server.get("/api/health", (req, res) => {
		res.status(200).json({ status: "ok" });
	});
}
