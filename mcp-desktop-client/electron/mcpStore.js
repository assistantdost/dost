import { BrowserWindow } from "electron";

// ✅ MCP Store - Single source of truth
const mcpStore = {
	activeTools: {},
	mcpServers: {},
};

// Add MCP server with client and tools
export function addMcpServer(serverName, client, tools, metadata) {
	// console.log(`➕ Adding MCP server: ${serverName}`, {
	// 	toolsCount: Object.keys(tools).length,
	// });

	mcpStore.mcpServers[serverName] = {
		client,
		tools,
		metadata: metadata || {},
		connected: true,
	};

	// Merge tools into activeTools
	Object.assign(mcpStore.activeTools, tools);

	// console.log(
	// 	`📊 Total active tools: ${Object.keys(mcpStore.activeTools).length}`,
	// );

	// Broadcast update to renderer
	broadcastUpdate("mcpServers", getSerializedServers());
	broadcastUpdate("activeTools", Object.keys(mcpStore.activeTools));
}

// Remove MCP server
export function removeMcpServer(serverName) {
	if (mcpStore.mcpServers[serverName]) {
		delete mcpStore.mcpServers[serverName];

		// Rebuild activeTools from remaining servers
		mcpStore.activeTools = {};
		Object.values(mcpStore.mcpServers).forEach((server) => {
			Object.assign(mcpStore.activeTools, server.tools);
		});

		broadcastUpdate("mcpServers", getSerializedServers());
		broadcastUpdate("activeTools", Object.keys(mcpStore.activeTools));
	}
}

// Get active tools (for agent usage)
export function getActiveTools() {
	return mcpStore.activeTools;
}

// Get MCP client by server name
export function getMcpClient(serverName) {
	return mcpStore.mcpServers[serverName]?.client;
}

// Get serialized state (for IPC)
export function getSerializedState() {
	return {
		activeTools: Object.keys(mcpStore.activeTools),
		mcpServers: getSerializedServers(),
	};
}

// Get serialized servers (without clients - they can't be cloned)
function getSerializedServers() {
	return Object.entries(mcpStore.mcpServers).reduce((acc, [name, server]) => {
		acc[name] = {
			tools: Object.keys(server.tools),
			toolsCount: Object.keys(server.tools).length,
			metadata: server.metadata,
			connected: server.connected,
		};
		return acc;
	}, {});
}

// Broadcast update to all renderer windows
function broadcastUpdate(key, value) {
	BrowserWindow.getAllWindows().forEach((win) => {
		win.webContents.send("mcp-state-updated", { key, value });
	});
}

// Update store from renderer (if needed)
export function updateMcpStore(key, value) {
	if (key === "activeTools") {
		// Don't allow direct modification of activeTools from renderer
		// console.warn(
		// 	"⚠️ activeTools cannot be modified directly from renderer",
		// );
		return;
	}
	mcpStore[key] = value;
	broadcastUpdate(key, value);
}
