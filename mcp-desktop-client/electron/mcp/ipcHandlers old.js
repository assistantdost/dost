import { ipcMain } from "electron";
import {
	readMcpConfig,
	loadDefaultServers,
	addServer,
	removeServer,
	updateServer,
} from "./configManager.js";
import { initializeMcpClients } from "./clientManager.js";
import { getSerializedState, getConnectionStats } from "../mcpStore.js";
import { getInitStatus, forceReinitialize } from "./initializer.js";

// IPC handlers use configManager's indefinite caching
async function getConfig() {
	return await readMcpConfig();
}

/**
 * Register all MCP-related IPC handlers
 */
export function registerMcpIpcHandlers() {
	// Load default servers from API and save to mcp.json
	ipcMain.handle("mcp-login-load-defaults", async (event, apiUrl) => {
		return await loadDefaultServers(apiUrl);
	});

	// Read mcp.json config (with indefinite caching)
	ipcMain.handle("mcp-read-config", async () => {
		try {
			return await getConfig();
		} catch (error) {
			console.error("❌ Error reading mcp.json:", error);
			return {};
		}
	});

	// Add server to mcp.json
	ipcMain.handle(
		"mcp-add-server",
		async (event, serverName, serverConfig) => {
			return await addServer(serverName, serverConfig);
		},
	);

	// Remove server from mcp.json
	ipcMain.handle("mcp-remove-server", async (event, serverName) => {
		return await removeServer(serverName);
	});

	// Update server in mcp.json
	ipcMain.handle("mcp-update-server", async (event, serverName, updates) => {
		return await updateServer(serverName, updates);
	});

	// Connect to MCP servers
	ipcMain.handle("mcp-connect", async () => {
		try {
			console.log("🔌 Connecting MCP clients from IPC...");
			const config = await getConfig();
			const result = await initializeMcpClients(config);

			// Optimization: Return structured data instead of flattening
			const stats = getConnectionStats();

			console.log("✅ MCP clients connected:", result);
			return {
				success: true,
				tools: Object.keys(result.tools).flat(),
				stats,
				results: result,
			};
		} catch (error) {
			console.error("❌ Error connecting MCP clients:", error);
			return { success: false, error: error.message };
		}
	});

	// Disconnect from all MCP servers
	ipcMain.handle("mcp-disconnect", async () => {
		try {
			console.log("🔌 Disconnecting MCP clients from IPC...");
			const { disconnectAllClients } = await import("./clientManager.js");
			disconnectAllClients();
			console.log("✅ MCP clients disconnected");
			return { success: true };
		} catch (error) {
			console.error("❌ Error disconnecting MCP clients:", error);
			return { success: false, error: error.message };
		}
	});

	// Optimization: Get state with caching
	ipcMain.handle("mcp-get-state", () => {
		return getSerializedState();
	});

	// Get connection stats
	ipcMain.handle("mcp-get-stats", () => {
		return getConnectionStats();
	});

	// Get initialization status
	ipcMain.handle("mcp-get-init-status", () => {
		return getInitStatus();
	});

	// Force re-initialization
	ipcMain.handle("mcp-force-reinitialize", async () => {
		return await forceReinitialize();
	});

	console.log("✅ MCP IPC handlers registered");
}
