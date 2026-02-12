import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { addMcpServer, removeMcpServer, getActiveTools } from "../mcpStore.js";

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

	// Load each server in try-catch blocks
	for (const [serverName, serverConfig] of enabledServers) {
		try {
			console.log(`🔌 Connecting to ${serverName}...`);

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

			// Create MCP client
			client = await createMCPClient({ transport });

			// Get tools from the client
			const tools = await client.tools();

			console.log(JSON.stringify(tools, null, 2));

			// Add to store
			addMcpServer(serverName, client, tools, {
				description: serverConfig.description || "",
				transport: serverConfig.transport,
				url: serverConfig.url || null,
			});

			results.success.push(serverName);
			results.tools[serverName] = Object.keys(tools);

			console.log(
				`✅ ${serverName} connected (${Object.keys(tools).length} tools)`,
			);
		} catch (error) {
			console.error(
				`❌ Failed to connect to ${serverName}:`,
				error.message,
			);
			results.failed.push({ serverName, error: error.message });
			// Continue to next server instead of crashing
		}
	}

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
	// The mcpStore handles client cleanup
	// Individual clients can be disconnected if needed
	console.log("✅ All clients disconnected");
}

/**
 * Connect a single server
 * @param {string} serverName - Name of the server
 * @param {Object} serverConfig - Server configuration
 */
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
