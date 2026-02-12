import { readMcpConfig } from "./configManager.js";
import { initializeMcpClients } from "./clientManager.js";

/**
 * Initialize MCP clients from configuration file
 * Called on app startup
 * @returns {Promise<void>}
 */
export async function initializeMcpOnStartup() {
	try {
		const config = await readMcpConfig();

		// Only initialize if config exists
		if (Object.keys(config).length > 0) {
			console.log("🚀 Initializing MCP clients from mcp.json...");
			const results = await initializeMcpClients(config);

			console.log(
				`✅ MCP initialization complete: ${results.success.length} connected, ${results.failed.length} failed`,
			);

			if (results.failed.length > 0) {
				console.warn("⚠️ Failed servers:", results.failed);
			}

			return results;
		} else {
			console.log(
				"ℹ️ No MCP config found. Waiting for login to load defaults.",
			);
			return { success: [], failed: [], tools: {} };
		}
	} catch (error) {
		console.error("❌ Failed to initialize MCP tools on startup:", error);
		throw error;
	}
}
