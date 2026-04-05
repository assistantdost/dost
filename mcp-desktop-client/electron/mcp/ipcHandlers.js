import { ipcMain, BrowserWindow } from "electron";
import { tools } from "./tools.js";
import { hasAuthContext } from "../authIPC.js";

function notAuthenticatedResponse() {
	return {
		success: false,
		error: "User not authenticated",
	};
}
/**
 * Register all MCP-related IPC handlers
 */
export function registerMcpIpcHandlers() {
	// Load default servers from API and save to mcp.json
	ipcMain.handle("mcp-login-load-defaults", async () => {
		if (!hasAuthContext()) {
			return notAuthenticatedResponse();
		}
		return await tools.loadDefaultServers();
	});

	// Read mcp.json config (with indefinite caching)
	ipcMain.handle("mcp-read-config", async () => {
		if (!hasAuthContext()) {
			return {};
		}
		return tools.getConfig();
	});

	// Add server to mcp.json
	ipcMain.handle(
		"mcp-add-server",
		async (event, serverName, serverConfig) => {
			if (!hasAuthContext()) {
				return notAuthenticatedResponse();
			}
			return await tools.addServer(serverName, serverConfig);
		},
	);

	// Remove server from mcp.json
	ipcMain.handle("mcp-remove-server", async (event, serverName) => {
		if (!hasAuthContext()) {
			return notAuthenticatedResponse();
		}
		return await tools.removeServer(serverName);
	});

	// Update server in mcp.json
	ipcMain.handle("mcp-update-server", async (event, serverName, updates) => {
		if (!hasAuthContext()) {
			return notAuthenticatedResponse();
		}
		return await tools.updateServer(serverName, updates);
	});

	ipcMain.handle("mcp-initialize", async (event, state) => {
		if (!hasAuthContext()) {
			return {
				success: [],
				failed: [
					{
						serverName: "auth",
						error: "User not authenticated",
					},
				],
			};
		}
		return await tools.initializeMcpClients(state);
	});

	// Connect to MCP servers
	ipcMain.handle("mcp-connect", async () => {
		if (!hasAuthContext()) {
			return notAuthenticatedResponse();
		}
		return await tools.connectAllServers();
	});

	// Disconnect from all MCP servers
	ipcMain.handle("mcp-disconnect", async () => {
		if (!hasAuthContext()) {
			return notAuthenticatedResponse();
		}
		return await tools.disconnectAllServers();
	});

	ipcMain.handle("mcp-connect-one", async (event, serverName) => {
		if (!hasAuthContext()) {
			return notAuthenticatedResponse();
		}
		return await tools.connectOneServer(serverName);
	});

	ipcMain.handle("mcp-disconnect-one", async (event, serverName) => {
		if (!hasAuthContext()) {
			return notAuthenticatedResponse();
		}
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
