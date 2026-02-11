/**
 * Summarizer - Token counting and summarization logic
 */

import { encode } from "gpt-tokenizer";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000/api/v1";
const SUMMARY_TOKEN_THRESHOLD = 2000;

/**
 * Count tokens in messages
 * @param {Array} messages - Messages to count
 * @returns {number} Total token count
 */
function countTokens(messages) {
	let tokenCount = 0;
	for (const msg of messages) {
		const text =
			typeof msg.content === "string"
				? msg.content
				: JSON.stringify(msg.content);
		tokenCount += encode(text).length;
	}
	return tokenCount;
}

/**
 * Generate summary using LLM
 * @param {Array} messages - Messages to summarize
 * @param {string|null} existingSummary - Current summary
 * @returns {Promise<string>} New summary
 */
async function generateSummary(messages, existingSummary) {
	const summaryText = messages
		.map((m) => `${m.role}: ${m.content}`)
		.join("\n\n");

	const prompt = existingSummary
		? `Existing summary:\n${existingSummary}\n\nNew messages:\n${summaryText}\n\nCreate updated summary (max 500 words):`
		: `Summarize this conversation (max 500 words):\n${summaryText}`;

	const { text } = await generateText({
		model: groq("llama-3.3-70b-versatile"),
		prompt,
		temperature: 0.3,
		maxTokens: 1000,
	});

	return text;
}

/**
 * Save summary to backend
 * @param {string} chatId
 * @param {string} summary
 * @param {string} lastMessageId
 * @param {string} token - Auth token
 */
async function saveSummary(chatId, summary, lastMessageId, token) {
	await axios.patch(
		`${BACKEND_URL}/chats/${chatId}/summary`,
		{
			summary,
			last_summarized_message_id: lastMessageId,
		},
		{
			headers: { Authorization: `Bearer ${token}` },
		},
	);
}

/**
 * Check if summarization is needed and perform it
 * @param {Object} params
 * @param {Array} params.messages - All messages
 * @param {string} params.chatId - Chat ID
 * @param {string} params.token - Auth token
 * @param {string|null} params.summary - Current summary
 * @param {Object} params.mainWindow - Electron main window for IPC
 * @returns {Promise<void>}
 */
export async function summarizeIfNeeded({
	messages,
	chatId,
	token,
	summary,
	mainWindow,
}) {
	if (!chatId || !token) return;

	try {
		// Count tokens in recent messages (last 10)
		const recentMessages = messages.slice(-10);
		const tokenCount = countTokens(recentMessages);

		// Only summarize if threshold exceeded
		if (tokenCount <= SUMMARY_TOKEN_THRESHOLD) return;

		console.log(
			`[Summarizer] Token threshold exceeded (${tokenCount}/${SUMMARY_TOKEN_THRESHOLD}), generating summary...`,
		);

		// Generate new summary
		const newSummary = await generateSummary(recentMessages, summary);

		// Get last message ID
		const lastMessageId =
			messages[messages.length - 1].id || Date.now().toString();

		// Save to backend
		await saveSummary(chatId, newSummary, lastMessageId, token);

		// Notify frontend via IPC
		if (mainWindow) {
			mainWindow.webContents.send("summary-updated", {
				chatId,
				summary: newSummary,
			});
		}

		console.log(
			`[Summarizer] Summary updated successfully for chat ${chatId}`,
		);
	} catch (error) {
		console.error("[Summarizer] Error:", error);
	}
}
