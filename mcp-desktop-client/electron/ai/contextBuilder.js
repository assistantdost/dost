/**
 * Context Builder - Build context with summary + sliding window
 */

/**
 * Build context for AI call
 * Context = System Prompt + Summary (if exists) + Recent Messages (sliding window)
 *
 * @param {Array} messages - All messages from frontend
 * @param {string|null} summary - Current chat summary
 * @returns {Array} Context messages for AI
 */
export function buildContext(messages, summary) {
	let contextMessages = messages;

	// Add summary as system message if exists
	if (summary) {
		contextMessages = [
			messages[0], // System prompt
			{
				role: "system",
				content: `Previous conversation summary:\n${summary}`,
			},
			...messages.slice(1),
		];
	}

	// Apply sliding window: keep first (system) + last 5 messages
	if (contextMessages.length > 6) {
		contextMessages = [
			contextMessages[0], // System prompt
			...(summary ? [contextMessages[1]] : []), // Summary if exists
			...contextMessages.slice(-5), // Last 5 messages
		];
	}

	return contextMessages;
}
