import { getActiveTools } from "../mcpStore.js";

/**
 * Get all active MCP tools from connected servers.
 * Tools are loaded via the MCP initializer (configManager + clientManager).
 * This ensures all tools come from mcp.json configuration.
 *
 * @returns {Promise<Object>} - Object containing all tools from all connected servers
 */
export async function getTools() {
	const tools = getActiveTools();

	if (!tools || Object.keys(tools).length === 0) {
		console.warn(
			"⚠️ No tools loaded. Make sure MCP servers are initialized.",
		);
		return {};
	}

	return tools;
}
