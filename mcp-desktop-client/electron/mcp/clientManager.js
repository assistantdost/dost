import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
	addMcpServer,
	removeMcpServer,
	getActiveTools,
	mcpStore,
} from "../mcpStore.js";

/**
 * Initialize MCP clients from configuration
 * @param {Object} config - Server configuration object from mcp.json
 * @returns {Promise<Object>} - Object with client instances and tools
 */
export async function initializeMcpClients(config) {
	const results = {
		success: [],
		failed: [],
		tools: {},
	};

	console.log("🔄 Initializing MCP clients from config...");

	// Filter enabled servers
	const enabledServers = Object.entries(config).filter(
		([_, serverConfig]) => serverConfig.enabled === true,
	);

	console.log(`📊 Found ${enabledServers.length} enabled servers`);

	// Optimization: Parallel loading with Promise.allSettled
	const connectionPromises = enabledServers.map(
		async ([serverName, serverConfig]) => {
			try {
				console.log(`🔌 Connecting to ${serverName}`);

				let client;
				let transport;

				// Create transport based on type
				if (serverConfig.transport === "stdio") {
					transport = new StdioClientTransport({
						command: serverConfig.command,
						args: serverConfig.args || [],
					});
				} else if (
					serverConfig.transport === "streamable_http" ||
					serverConfig.transport === "http"
				) {
					const headers = serverConfig.headers || {};
					transport = new StreamableHTTPClientTransport(
						new URL(serverConfig.url),
						{ headers },
					);
				} else if (serverConfig.transport === "sse") {
					transport = {
						type: "sse",
						url: serverConfig.url,
						headers: serverConfig.headers || {},
					};
				} else {
					throw new Error(
						`Unsupported transport type: ${serverConfig.transport}`,
					);
				}

				client = await createMCPClient({ transport });
				const tools = await client.tools();

				// Add to store
				addMcpServer(serverName, client, tools, {
					description: serverConfig.description || "",
					transport: serverConfig.transport,
					url: serverConfig.url || null,
				});

				console.log(
					`✅ ${serverName} connected (${Object.keys(tools).length} tools)`,
				);

				return { serverName, success: true, tools: Object.keys(tools) };
			} catch (error) {
				console.error(
					`❌ Failed to connect to ${serverName}:`,
					error.message,
				);
				return { serverName, success: false, error: error.message };
			}
		},
	);

	// Wait for all connections to complete
	const connectionResults = await Promise.allSettled(connectionPromises);

	// Process results from Promise.allSettled
	connectionResults.forEach((result) => {
		if (result.status === "fulfilled") {
			const { serverName, success, tools } = result.value;
			if (success) {
				results.success.push(serverName);
				results.tools[serverName] = tools;
			} else {
				results.failed.push({ serverName, error: result.value.error });
			}
		} else {
			// This shouldn't happen since we handle errors inside the promises
			console.error("Unexpected promise rejection:", result.reason);
		}
	});

	console.log(
		`✅ MCP initialization complete: ${results.success.length} success, ${results.failed.length} failed`,
	);

	return results;
}

/**
 * Disconnect all MCP clients
 */
export function disconnectAllClients() {
	console.log("🔌 Disconnecting all MCP clients...");

	// Disconnect all clients
	const serverNames = Object.keys(mcpStore.mcpServers);
	serverNames.forEach((serverName) => {
		removeMcpServer(serverName);
	});

	// Clear active tools
	mcpStore.activeTools = {};
	mcpStore._cacheInvalidated = true;

	console.log("✅ All clients disconnected");
}

export async function connectSingleServer(serverName, serverConfig) {
	try {
		console.log(`🔌 Connecting to ${serverName}...`);

		let client;
		let transport;

		if (serverConfig.transport === "stdio") {
			transport = new StdioClientTransport({
				command: serverConfig.command,
				args: serverConfig.args || [],
			});
		} else if (
			serverConfig.transport === "streamable_http" ||
			serverConfig.transport === "http"
		) {
			const headers = serverConfig.headers || {};
			transport = new StreamableHTTPClientTransport(
				new URL(serverConfig.url),
				{ headers },
			);
		} else {
			throw new Error(
				`Unsupported transport type: ${serverConfig.transport}`,
			);
		}

		client = await createMCPClient({ transport });
		const tools = await client.tools();

		addMcpServer(serverName, client, tools, {
			description: serverConfig.description || "",
			transport: serverConfig.transport,
			url: serverConfig.url || null,
		});

		console.log(
			`✅ ${serverName} connected (${Object.keys(tools).length} tools)`,
		);

		return { success: true, tools: Object.keys(tools) };
	} catch (error) {
		console.error(`❌ Failed to connect to ${serverName}:`, error.message);
		return { success: false, error: error.message };
	}
}

/**
 * Disconnect a single server
 * @param {string} serverName - Name of the server to disconnect
 */
export function disconnectSingleServer(serverName) {
	removeMcpServer(serverName);
	console.log(`✅ ${serverName} disconnected`);
}

/**
 * Get all active tools from connected servers
 */
export function getAllActiveTools() {
	return getActiveTools();
}
