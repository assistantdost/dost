import { BrowserWindow } from "electron";

// ✅ MCP Store - Single source of truth with optimizations
const mcpStore = {
	activeTools: {},
	mcpServers: {},
	// Optimization: Cache for serialized state
	_serializedCache: null,
	_cacheInvalidated: true,
};

// Add MCP server with client and tools
export function addMcpServer(serverName, client, tools, metadata) {
	// Optimization: Check if already exists to avoid duplicates
	if (mcpStore.mcpServers[serverName]) {
		console.warn(`⚠️ Server ${serverName} already exists, updating...`);
		removeMcpServer(serverName);
	}

	mcpStore.mcpServers[serverName] = {
		client,
		tools,
		metadata: metadata || {},
		connected: true,
		connectedAt: Date.now(), // Track connection time
	};

	// Optimization: Incremental tool merging instead of full rebuild
	Object.assign(mcpStore.activeTools, tools);

	// Invalidate cache
	mcpStore._cacheInvalidated = true;

	// Broadcast updates
	broadcastUpdate("mcpServers", getSerializedServers());
	broadcastUpdate("activeTools", Object.keys(mcpStore.activeTools));
}

// Remove MCP server
export function removeMcpServer(serverName) {
	if (mcpStore.mcpServers[serverName]) {
		// Optimization: Clean up client resources
		const server = mcpStore.mcpServers[serverName];
		if (server.client && typeof server.client.disconnect === "function") {
			server.client.disconnect().catch(console.error);
		}

		delete mcpStore.mcpServers[serverName];

		// Optimization: Incremental tool removal
		Object.keys(server.tools).forEach((toolName) => {
			delete mcpStore.activeTools[toolName];
		});

		// Invalidate cache
		mcpStore._cacheInvalidated = true;

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
	const server = mcpStore.mcpServers[serverName];
	return server?.connected ? server.client : null;
}

// Get serialized state (for IPC) - with caching
export function getSerializedState() {
	if (!mcpStore._cacheInvalidated && mcpStore._serializedCache) {
		return mcpStore._serializedCache;
	}

	mcpStore._serializedCache = {
		activeTools: Object.keys(mcpStore.activeTools),
		mcpServers: getSerializedServers(),
	};
	mcpStore._cacheInvalidated = false;

	return mcpStore._serializedCache;
}

// Get serialized servers (without clients - they can't be cloned)
function getSerializedServers() {
	return Object.entries(mcpStore.mcpServers).reduce((acc, [name, server]) => {
		acc[name] = {
			tools: Object.keys(server.tools),
			toolsCount: Object.keys(server.tools).length,
			metadata: server.metadata,
			connected: server.connected,
			connectedAt: server.connectedAt,
		};
		return acc;
	}, {});
}

// Broadcast update to all renderer windows (immediate)
function broadcastUpdate(key, value) {
	BrowserWindow.getAllWindows().forEach((win) => {
		win.webContents.send("mcp-state-updated", { key, value });
	});
}

// Update store from renderer (if needed)
export function updateMcpStore(key, value) {
	if (key === "activeTools") {
		console.warn(
			"⚠️ activeTools cannot be modified directly from renderer",
		);
		return;
	}
	mcpStore[key] = value;
	mcpStore._cacheInvalidated = true;
	broadcastUpdate(key, value);
}

// Optimization: Bulk operations
export function bulkUpdateServers(updates) {
	Object.entries(updates).forEach(([serverName, update]) => {
		if (mcpStore.mcpServers[serverName]) {
			Object.assign(mcpStore.mcpServers[serverName], update);
		}
	});
	mcpStore._cacheInvalidated = true;
	broadcastUpdate("mcpServers", getSerializedServers());
}

// Get connection stats
export function getConnectionStats() {
	const servers = Object.values(mcpStore.mcpServers);
	return {
		total: servers.length,
		connected: servers.filter((s) => s.connected).length,
		tools: Object.keys(mcpStore.activeTools).length,
		uptime: servers
			.filter((s) => s.connectedAt)
			.map((s) => Date.now() - s.connectedAt),
	};
}
// Export the store for direct access (for health checks, etc.)
export { mcpStore };
