import { ipcMain, BrowserWindow } from "electron";
import { tools } from "./tools.js";
/**
 * Register all MCP-related IPC handlers
 */
export function registerMcpIpcHandlers() {
	// Load default servers from API and save to mcp.json
	ipcMain.handle("mcp-login-load-defaults", async () => {
		return await tools.loadDefaultServers();
	});

	// Read mcp.json config (with indefinite caching)
	ipcMain.handle("mcp-read-config", async () => {
		return tools.getConfig();
	});

	// Add server to mcp.json
	ipcMain.handle("mcp-add-server", async (serverName, serverConfig) => {
		return await tools.addServer(serverName, serverConfig);
	});

	// Remove server from mcp.json
	ipcMain.handle("mcp-remove-server", async (serverName) => {
		return await tools.removeServer(serverName);
	});

	// Update server in mcp.json
	ipcMain.handle("mcp-update-server", async (serverName, updates) => {
		return await tools.updateServer(serverName, updates);
	});

	ipcMain.handle("mcp-initialize", async (state) => {
		return await tools.initializeMcpClients(state);
	});

	// Connect to MCP servers
	ipcMain.handle("mcp-connect", async () => {
		return await tools.connectAllServers();
	});

	// Disconnect from all MCP servers
	ipcMain.handle("mcp-disconnect", async () => {
		return await tools.disconnectAllServers();
	});

	ipcMain.handle("mcp-connect-one", async (serverName) => {
		return await tools.connectOneServer(serverName);
	});

	ipcMain.handle("mcp-disconnect-one", async (serverName) => {
		return await tools.disconnectOneServer(serverName);
	});

	ipcMain.handle("mcp-get-full-state", async () => {
		return tools.getFullState();
	});

	// Optimization: Get state with caching
	ipcMain.handle("mcp-get-state", () => {
		return tools.getState();
	});

	tools.on("mcp-state-changed", (newState) => {
		// Broadcast to all renderer windows
		BrowserWindow.getAllWindows().forEach((win) => {
			win.webContents.send("mcp-state-updated", newState);
		});
	});

	console.log("✅ MCP IPC handlers registered");
}
