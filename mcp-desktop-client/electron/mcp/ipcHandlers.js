import { ipcMain } from "electron";
import {
	readMcpConfig,
	loadDefaultServers,
	addServer,
	removeServer,
	updateServer,
} from "./configManager.js";
import { initializeMcpClients } from "./clientManager.js";

/**
 * Register all MCP-related IPC handlers
 */
export function registerMcpIpcHandlers() {
	// Load default servers from API and save to mcp.json
	ipcMain.handle("mcp-login-load-defaults", async (event, apiUrl) => {
		return await loadDefaultServers(apiUrl);
	});

	// Read mcp.json config
	ipcMain.handle("mcp-read-config", async () => {
		try {
			return await readMcpConfig();
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
			const config = await readMcpConfig();
			const result = await initializeMcpClients(config);

			// Flatten tools from all servers into a single array
			const allTools = Object.values(result.tools).flat();

			console.log("✅ MCP clients connected:", result);
			return { success: true, tools: allTools };
		} catch (error) {
			console.error("❌ Error connecting MCP clients:", error);
			return { success: false, error: error.message };
		}
	});

	console.log("✅ MCP IPC handlers registered");
}
