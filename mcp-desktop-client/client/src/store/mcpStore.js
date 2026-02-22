import { create } from "zustand";
import { toast } from "sonner";

// Check if we're in renderer process
const isRenderer = typeof window !== "undefined" && window.mcp;

// Renderer store (with Zustand and IPC sync)
export const useMcpStore = create((set, get) => ({
	mcpServers: {},
	toolCount: 0,
	config: {},
	isMcpConnected: false,

	// ========== INITIALIZATION ==========

	// Initialize store from main process
	initialize: async () => {
		if (!isRenderer) return;
		try {
			const { success, failed } = await window.mcp.initialize();

			failed.forEach((fail) => {
				toast.error(
					`MCP server ${fail.serverName} failed to initialize`,
					{
						description: fail.error,
					},
				);
				console.error("MCP Initialization error:", fail);
			});
		} catch (error) {
			console.error("❌ Error initializing MCP Store:", error);
			toast.error("Failed to initialize MCP Store");
		}
	},

	// ========== CONFIG MANAGEMENT ==========

	// Load default servers from API on login
	loadDefaultServers: async () => {
		if (!isRenderer) return { success: false };

		try {
			console.log("📥 Loading default MCP servers...");
			const res = await window.mcp.loginLoadDefaults();

			const { success, failed } = res.results || {};
			success.forEach((s) => {
				toast.success(`MCP server ${s.serverName} loaded successfully`);
				console.log("✅ MCP server loaded:", s.serverName);
			});

			failed.forEach((fail) => {
				toast.error(
					`MCP server ${fail.serverName} failed to initialize`,
					{
						description: fail.error,
					},
				);
				console.error("MCP Initialization error:", fail);
			});
		} catch (error) {
			console.error("❌ Error loading defaults:", error);
			toast.error("Failed to load default servers");
			return { success: false, error: error.message };
		}
	},

	// Listen for updates from main process
	listenForUpdates: () => {
		if (!isRenderer) return;

		console.log("👂 Listening for MCP state updates from main process...");

		window.mcp.onStateUpdated((state) => {
			set({
				mcpServers: state.mcpServers || {},
				toolCount: state.toolCount || 0,
				config: state.config || {},
				isMcpConnected: state.isMcpConnected || false,
			});
			console.log("🔄 MCP state updated:", state);
		});
	},

	// ========== SERVER MANAGEMENT ==========

	// Add server to config and connect
	addServer: async (serverName, serverConfig) => {
		if (!isRenderer) return { success: false };

		try {
			const result = await window.mcp.addServer(serverName, serverConfig);
			if (result.success) {
				toast.success(`Server "${serverName}" added`);
				console.log(`✅ Added server: ${serverName}`);
			} else {
				toast.error(`Failed to add server: ${result.error}`);
			}
			return result;
		} catch (error) {
			console.error("❌ Error adding server:", error);
			toast.error("Failed to add server");
			return { success: false, error: error.message };
		}
	},

	// Update server in config and reconnect
	updateServer: async (serverName, updates) => {
		if (!isRenderer) return { success: false };

		try {
			const result = await window.mcp.updateServer(serverName, updates);
			if (result.success) {
				toast.success(`Server "${serverName}" updated`);
				console.log(`✅ Updated server: ${serverName}`);
			} else {
				toast.error(`Failed to update server: ${result.error}`);
			}
			return result;
		} catch (error) {
			console.error("❌ Error updating server:", error);
			toast.error("Failed to update server");
			return { success: false, error: error.message };
		}
	},

	// Remove server from config and disconnect
	removeServer: async (serverName) => {
		if (!isRenderer) return { success: false };

		try {
			await window.mcp.removeServer(serverName);
			toast.success(`Server "${serverName}" removed`);
			console.log(`✅ Removed server: ${serverName}`);
		} catch (error) {
			console.error("❌ Error removing server:", error);
			toast.error("Failed to remove server");
			return { success: false, error: error.message };
		}
	},

	// Connect to all enabled servers
	connectAllServers: async () => {
		if (!isRenderer) return { success: false };

		try {
			const result = await window.mcp.connect();
			if (result.success) {
				toast.success("Connected to all servers");
				console.log("✅ Connected to all servers");
			} else {
				toast.error("Failed to connect to all servers");
			}
			return result;
		} catch (error) {
			console.error("❌ Error connecting to all servers:", error);
			toast.error("Failed to connect to all servers");
			return { success: false, error: error.message };
		}
	},

	// Disconnect from all servers
	disconnectAllServers: async () => {
		if (!isRenderer) return { success: false };

		try {
			const result = await window.mcp.disconnect();
			toast.success("Disconnected from all servers");
			return result;
		} catch (error) {
			console.error("❌ Error disconnecting from all servers:", error);
			toast.error("Failed to disconnect from all servers");
			return { success: false, error: error.message };
		}
	},

	// Connect to one server
	connectOneServer: async (serverName) => {
		if (!isRenderer) return { success: false };

		try {
			const result = await window.mcp.connectOne(serverName);
			if (result.success) {
				toast.success(`Connected to "${serverName}"`);
				console.log(`✅ Connected to server: ${serverName}`);
			} else {
				toast.error(
					`Failed to connect to "${serverName}": ${result.error}`,
				);
			}
			return result;
		} catch (error) {
			console.error(
				`❌ Error connecting to server ${serverName}:`,
				error,
			);
			toast.error(`Failed to connect to "${serverName}"`);
			return { success: false, error: error.message };
		}
	},

	// Disconnect from one server
	disconnectOneServer: async (serverName) => {
		if (!isRenderer) return { success: false };

		try {
			await window.mcp.disconnectOne(serverName);
			toast.success(`Disconnected from "${serverName}"`);
		} catch (error) {
			console.error(
				`❌ Error disconnecting from server ${serverName}:`,
				error,
			);
			toast.error(`Failed to disconnect from "${serverName}"`);
			return { success: false, error: error.message };
		}
	},

	// Clean up listeners
	// cleanup: () => {
	// 	if (isRenderer) {
	// 		window.mcp.removeAllListeners("mcp-state-updated");
	// 	}
	// },
}));
