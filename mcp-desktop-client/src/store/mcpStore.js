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

	// Read config from mcp.json
	readConfig: async () => {
		if (!isRenderer) return {};

		try {
			const config = await window.electron.mcp.readConfig();
			set({ serverConfig: config });
			console.log("📖 Config read from mcp.json:", config);
			return config;
		} catch (error) {
			console.error("❌ Error reading config:", error);
			return {};
		}
	},

	// Add server to config
	addServerToConfig: async (serverName, serverConfig) => {
		if (!isRenderer) return { success: false };

		try {
			const result = await window.electron.mcp.addServer(
				serverName,
				serverConfig,
			);

			if (result.success) {
				// Update local state
				set((state) => ({
					serverConfig: {
						...state.serverConfig,
						[serverName]: serverConfig,
					},
				}));
				toast.success(`Server "${serverName}" added`);
				console.log(`✅ Added server to config: ${serverName}`);

				// Auto-connect if enabled
				if (serverConfig.enabled !== false) {
					console.log(`🔄 Auto-connecting ${serverName}...`);
					await get().connectToServers();
				}

				return { success: true };
			} else {
				toast.error(`Failed to add server: ${result.error}`);
				return { success: false, error: result.error };
			}
		} catch (error) {
			console.error("❌ Error adding server:", error);
			toast.error("Failed to add server");
			return { success: false, error: error.message };
		}
	},

	// Remove server from config
	removeServerFromConfig: async (serverName) => {
		if (!isRenderer) return { success: false };

		try {
			const result = await window.electron.mcp.removeServer(serverName);

			if (result.success) {
				// Update local state
				set((state) => {
					const newConfig = { ...state.serverConfig };
					delete newConfig[serverName];

					// Also remove from mcpServers
					const newMcpServers = { ...state.mcpServers };
					delete newMcpServers[serverName];

					return {
						serverConfig: newConfig,
						mcpServers: newMcpServers,
					};
				});
				toast.success(`Server "${serverName}" removed`);
				console.log(`✅ Removed server from config: ${serverName}`);
				return { success: true };
			} else {
				toast.error(`Failed to remove server: ${result.error}`);
				return { success: false, error: result.error };
			}
		} catch (error) {
			console.error("❌ Error removing server:", error);
			toast.error("Failed to remove server");
			return { success: false, error: error.message };
		}
	},

	// Update server in config
	updateServerInConfig: async (serverName, updates) => {
		if (!isRenderer) return { success: false };

		try {
			const result = await window.electron.mcp.updateServer(
				serverName,
				updates,
			);

			if (result.success) {
				// Update local state
				set((state) => ({
					serverConfig: {
						...state.serverConfig,
						[serverName]: {
							...state.serverConfig[serverName],
							...updates,
						},
					},
				}));
				toast.success(`Server "${serverName}" updated`);
				console.log(`✅ Updated server in config: ${serverName}`);

				// If enabled state changed, reconnect servers
				if (updates.hasOwnProperty("enabled")) {
					console.log(
						`🔄 Enabled state changed for ${serverName}, reconnecting...`,
					);
					await get().connectToServers();
				}

				return { success: true };
			} else {
				toast.error(`Failed to update server: ${result.error}`);
				return { success: false, error: result.error };
			}
		} catch (error) {
			console.error("❌ Error updating server:", error);
			toast.error("Failed to update server");
			return { success: false, error: error.message };
		}
	},

	// ========== CONNECTION MANAGEMENT ==========

	// Connect to all enabled servers
	connectToServers: async () => {
		if (!isRenderer) return { success: false };

		set({ isConnecting: true });

		try {
			// Read config first if not loaded
			let config = get().serverConfig;
			if (Object.keys(config).length === 0) {
				config = await get().readConfig();
			}

			console.log("🔌 Connecting to MCP servers...");

			// Filter enabled servers
			const enabledServers = Object.entries(config).filter(
				([_, server]) => server.enabled === true,
			);

			if (enabledServers.length === 0) {
				toast.warning("No servers enabled");
				set({ isConnecting: false });
				return { success: false, error: "No servers enabled" };
			}

			// ✅ Call main process to actually connect
			const connectResult = await window.electron.mcp.connect();

			if (connectResult.success) {
				set({
					isConnecting: false,
					isConnected: true,
				});
				toast.success(
					`Connected to ${enabledServers.length} server${enabledServers.length > 1 ? "s" : ""}`,
				);
				console.log("✅ Connected successfully:", connectResult);
				return { success: true };
			} else {
				throw new Error(connectResult.error);
			}
		} catch (error) {
			console.error("❌ Error connecting to servers:", error);
			set({ isConnecting: false, isConnected: false });
			toast.error("Failed to connect to servers");
			return { success: false, error: error.message };
		}
	},

	// Disconnect from all servers
	disconnectFromServers: async () => {
		if (!isRenderer) return;

		try {
			console.log("🔌 Disconnecting from all servers...");

			// Call main process to disconnect
			await window.electron.mcp.disconnect();

			// Clear local state
			set({
				mcpServers: {},
				activeTools: [],
				isConnected: false,
			});

			toast.info("Disconnected from all servers");
			console.log("✅ Disconnected successfully");
		} catch (error) {
			console.error("❌ Error disconnecting:", error);
			toast.error("Failed to disconnect");
		}
	},

	// ========== DIAGNOSTICS & DEBUGGING ==========

	// Get initialization status
	getInitStatus: async () => {
		if (!isRenderer) return null;

		try {
			const status = await window.electron.mcp.getInitStatus();
			console.log("📊 Init status:", status);
			return status;
		} catch (error) {
			console.error("❌ Error getting init status:", error);
			return null;
		}
	},

	// Force re-initialization
	forceReinitialize: async () => {
		if (!isRenderer) return { success: false };

		try {
			console.log("🔄 Force re-initializing MCP...");
			const result = await window.electron.mcp.forceReinitialize();
			toast.success("MCP re-initialized successfully");
			console.log("✅ Force re-initialization complete:", result);
			return { success: true, data: result };
		} catch (error) {
			console.error("❌ Error force re-initializing:", error);
			toast.error("Failed to re-initialize MCP");
			return { success: false, error: error.message };
		}
	},

	// Add or update MCP server
	addMcpServer: (serverName, serverData) => {
		set((state) => ({
			mcpServers: {
				...state.mcpServers,
				[serverName]: {
					tools: serverData.tools || [],
					toolsCount: serverData.toolsCount || 0,
					metadata: serverData.metadata || {},
					connected: serverData.connected !== false,
				},
			},
		}));

		const updatedServers = {
			...get().mcpServers,
			[serverName]: {
				tools: serverData.tools || [],
				toolsCount: serverData.toolsCount || 0,
				metadata: serverData.metadata || {},
				connected: serverData.connected !== false,
			},
		};

		if (isRenderer) {
			window.electron.invoke(
				"mcp-set-state",
				"mcpServers",
				updatedServers,
			);
		}
	},

	// Remove MCP server
	removeMcpServer: (serverName) => {
		set((state) => {
			const { [serverName]: removed, ...rest } = state.mcpServers;
			return { mcpServers: rest };
		});

		const updatedServers = { ...get().mcpServers };
		delete updatedServers[serverName];

		if (isRenderer) {
			window.electron.invoke(
				"mcp-set-state",
				"mcpServers",
				updatedServers,
			);
		}
	},

	// Update tools for a specific server
	updateMcpServerTools: (serverName, tools) => {
		set((state) => ({
			mcpServers: {
				...state.mcpServers,
				[serverName]: {
					...state.mcpServers[serverName],
					tools,
				},
			},
		}));

		const updatedServers = {
			...get().mcpServers,
			[serverName]: {
				...get().mcpServers[serverName],
				tools,
			},
		};

		if (isRenderer) {
			window.electron.invoke(
				"mcp-set-state",
				"mcpServers",
				updatedServers,
			);
		}
	},

	// Get all tools from all servers
	getAllTools: () => {
		const state = get();
		return state.activeTools || [];
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

	// Clean up listeners
	cleanup: () => {
		if (isRenderer) {
			window.electron.removeAllListeners("mcp-state-updated");
		}
	},
}));
