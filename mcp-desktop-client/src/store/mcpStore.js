import { create } from "zustand";

// Check if we're in renderer process
const isRenderer = typeof window !== "undefined" && window.electron;

// Renderer store (with Zustand and IPC sync)
export const useMcpStore = create((set, get) => ({
	activeTools: [], // Array of tool names
	mcpServers: {},
	isInitialized: false,

	// Initialize store from main process
	init: async () => {
		if (!isRenderer) return;

		try {
			// console.log("🔄 Initializing MCP store from main process...");
			const state = await window.electron.invoke("mcp-get-state");
			// console.log("📦 Received state from main:", state);
			set({ ...state, isInitialized: true });
			// console.log("✅ MCP store initialized successfully");
		} catch (error) {
			// console.error("❌ Failed to initialize MCP store:", error);
		}
	},

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
					tools: serverData.tools || [], // Now just tool names array
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

	// Get all tools from all servers (returns array of tool names)
	getAllTools: () => {
		const state = get();
		// Return activeTools directly (it's already an array of all tool names)
		return state.activeTools || [];
	},

	// Listen for updates from main process
	listenForUpdates: () => {
		if (!isRenderer) return;

		// console.log("👂 Setting up listener for MCP state updates...");
		window.electron.on("mcp-state-updated", (data) => {
			const { key, value } = data;
			// console.log(`📨 Received update from main: ${key}`, value);
			set({ [key]: value });
		});
		// console.log("✅ Listener setup complete");
	},

	// Clean up listeners
	cleanup: () => {
		if (isRenderer) {
			window.electron.removeAllListeners("mcp-state-updated");
		}
	},
}));
