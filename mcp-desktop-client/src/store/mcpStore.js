import { create } from "zustand";
import { toast } from "sonner";

// Check if we're in renderer process
const isRenderer = typeof window !== "undefined" && window.electron;

// Renderer store (with Zustand and IPC sync)
export const useMcpStore = create((set, get) => ({
	activeTools: [], // Array of tool names
	mcpServers: {},
	serverConfig: {}, // mcp.json config
	isInitialized: false,
	isConnecting: false,
	isConnected: false,

	// ========== INITIALIZATION ==========

	// Initialize store from main process
	init: async () => {
		if (!isRenderer) return;

		try {
			console.log("🔄 Initializing MCP store from main process...");
			const state = await window.electron.invoke("mcp-get-state");
			console.log("📦 Received state from main:", state);
			set({ ...state, isInitialized: true });

			// ✅ Auto-connect on refresh if config exists but not connected
			const currentState = get();
			if (
				Object.keys(currentState.serverConfig).length > 0 &&
				!currentState.isConnected
			) {
				console.log("🔄 Auto-connecting on refresh...");
				await get().connectToServers();
			}

			console.log("✅ MCP store initialized successfully");
		} catch (error) {
			console.error("❌ Failed to initialize MCP store:", error);
		}
	},

	// ========== CONFIG MANAGEMENT ==========

	// Load default servers from API on login
	loadDefaultServers: async (apiUrl) => {
		if (!isRenderer) return { success: false };

		try {
			console.log("📥 Loading default MCP servers...");
			const result = await window.electron.mcp.loginLoadDefaults(apiUrl);

			if (result.success) {
				set({ serverConfig: result.data });
				toast.success("Default servers loaded successfully");
				console.log("✅ Default servers loaded:", result.data);

				// ✅ Auto-connect after loading defaults
				await get().connectToServers();

				return { success: true, data: result.data };
			} else {
				toast.error(`Failed to load defaults: ${result.error}`);
				return { success: false, error: result.error };
			}
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
					return { serverConfig: newConfig };
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
				// Update local state with connected tools
				// set({
				// 	activeTools: connectResult.tools,
				// 	isConnecting: false,
				// 	isConnected: true,
				// });
				// toast.success(
				// 	`Connected to ${enabledServers.length} server${enabledServers.length > 1 ? "s" : ""}`,
				// );
				// console.log("✅ Connected successfully:", connectResult);
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
	disconnectFromServers: () => {
		if (!isRenderer) return;

		try {
			console.log("🔌 Disconnecting from all servers...");

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

	// ========== EXISTING STORE METHODS ==========

	// Set active tools
	setActiveTools: (tools) => {
		set({ activeTools: tools });
		if (isRenderer) {
			window.electron.invoke("mcp-set-state", "activeTools", tools);
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

		console.log("👂 Setting up listener for MCP state updates...");
		window.electron.on("mcp-state-updated", (data) => {
			const { key, value } = data;
			console.log(`📨 Received update from main: ${key}`, value);
			set({ [key]: value });
		});
		console.log("✅ Listener setup complete");
	},

	// Clean up listeners
	cleanup: () => {
		if (isRenderer) {
			window.electron.removeAllListeners("mcp-state-updated");
		}
	},
}));
