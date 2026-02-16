import { app } from "electron";
import path from "path";
import fs from "fs/promises";
import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const MCP_CONFIG_PATH = path.join(app.getPath("userData"), "mcp.json");
const API_URL =
	process.env.VITE_API_URL || "http://localhost:3000/api/defaults";

export class Tools {
	constructor() {
		// ✅ Sync constructor - no async operations
		this.config = {};
		this.mcpServers = {};
		this.initialized = false;
		this.isMcpConnected = false;
	}

	// ✅ Async initialization method
	async init() {
		try {
			const data = await fs.readFile(MCP_CONFIG_PATH, "utf8");
			this.config = JSON.parse(data);
			this.initialized = true;
		} catch (error) {
			console.error("Failed to load MCP config:", error);
			// Fallback to empty config
			this.config = {};
			this.initialized = true;
		}
	}

	// ✅ Helper method to ensure initialization
	async ensureInitialized() {
		if (!this.initialized) {
			await this.init();
		}
	}

	// ✅ Extracted transport creation to eliminate duplication
	_createTransport(serverConfig) {
		if (serverConfig.transport === "stdio") {
			return new StdioClientTransport({
				command: serverConfig.command,
				args: serverConfig.args || [],
			});
		} else if (
			serverConfig.transport === "streamable_http" ||
			serverConfig.transport === "http"
		) {
			const headers = serverConfig.headers || {};
			return new StreamableHTTPClientTransport(
				new URL(serverConfig.url),
				{ headers },
			);
		} else if (serverConfig.transport === "sse") {
			return {
				type: "sse",
				url: serverConfig.url,
				headers: serverConfig.headers || {},
			};
		} else {
			throw new Error(
				`Unsupported transport type: ${serverConfig.transport}`,
			);
		}
	}

	async initializeMcpClients() {
		await this.ensureInitialized();
		// Clear existing clients before re-initializing
		this.mcpServers = {};
		this.activeTools = {};

		console.log("---------- Initializing MCP clients from config...");

		// Filter enabled servers
		const enabledServers = Object.entries(this.config).filter(
			([_, serverConfig]) => serverConfig.enabled === true,
		);

		const connectionPromises = enabledServers.map(
			async ([serverName, serverConfig]) => {
				try {
					console.log(`🔌 Connecting to ${serverName}-----------`);

					let client;
					let transport = this._createTransport(serverConfig); // ✅ Use extracted method

					client = await createMCPClient({ transport });
					const tools = await client.tools();

					return {
						success: true,
						data: {
							serverName,
							client,
							tools,
							metadata: {
								description: serverConfig.description || "",
								transport: serverConfig.transport,
								url: serverConfig.url || null,
							},
						},
					};
				} catch (error) {
					console.error(
						`❌ Failed to connect to ${serverName}:`,
						error.message,
					);
					return {
						success: false,
						error: error.message,
						data: {
							serverName,
							metadata: {
								description: serverConfig.description || "",
								transport: serverConfig.transport,
								url: serverConfig.url || null,
							},
						},
					};
				}
			},
		);

		const connectionResults = await Promise.allSettled(connectionPromises);

		let results = {
			success: [],
			failed: [],
		};

		connectionResults.forEach((result) => {
			if (result.status === "fulfilled") {
				const { success, data } = result.value;
				if (success) {
					const { serverName, client, tools, metadata } = data;
					this.mcpServers[serverName] = {
						client,
						tools,
						metadata,
						connected: true,
						connectedAt: new Date(),
					};
					results.success.push({ serverName, metadata });
				} else {
					results.failed.push({
						serverName: data.serverName,
						error: result.value.error,
						metadata: data.metadata,
					});
					console.warn(
						`⚠️ Failed to connect to ${data.serverName}: ${result.value.error}`,
					);
				}
			}
		});

		// After processing results
		this.isMcpConnected = results.success.length > 0;

		return results;
	}

	async loadDefaultServers() {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

			const response = await fetch(API_URL, {
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const defaults = await response.json();
			const validation = this.validateConfig(defaults);
			if (!validation.valid) {
				return {
					success: false,
					error: validation.errors,
				};
			}
			await this.updateConfig(defaults);
			await this.initializeMcpClients();
			return { success: true, data: defaults };
		} catch (error) {
			console.error("Failed to load defaults:", error);
			return { success: false, error: error.message };
		}
	}

	async addServer(serverName, serverConfig) {
		try {
			const validation = this.validateServer(serverName, serverConfig);
			if (!validation.valid) {
				return {
					success: false,
					error: validation.error,
				};
			}
			console.log(`🔌 Connecting to ${serverName}-----------`);

			let client;
			let transport = this._createTransport(serverConfig); // ✅ Use extracted method

			client = await createMCPClient({ transport });
			const tools = await client.tools();

			this.mcpServers[serverName] = {
				client,
				tools,
				metadata: {
					description: serverConfig.description || "",
					transport: serverConfig.transport,
					url: serverConfig.url || null,
				},
				connected: true,
				connectedAt: new Date(),
			};

			await this.updateConfig({
				...this.config,
				[serverName]: serverConfig,
			});

			return {
				success: true,
				message: `Connected to ${serverName} with ${Object.keys(tools).length} tools`,
			};
		} catch (error) {
			console.error(
				`❌ Failed to connect to ${serverName}:`,
				error.message,
			);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	async updateServer(serverName, updates) {
		if (!this.mcpServers[serverName]) {
			return { success: false, error: "Server not found" };
		}
		const existingConfig = this.config[serverName] || {};
		const newConfig = { ...existingConfig, ...updates };
		return await this.addServer(serverName, newConfig);
	}

	async removeServer(serverName) {
		const newConfig = { ...this.config };
		delete newConfig[serverName];
		await this.updateConfig(newConfig);
		if (this.mcpServers[serverName]) {
			delete this.mcpServers[serverName];
		}
	}

	async updateConfig(newConfig) {
		const validation = this.validateConfig(newConfig);
		if (!validation.valid) {
			throw new Error(`Invalid config: ${validation.errors.join(", ")}`);
		}
		this.config = newConfig;
		await fs.writeFile(MCP_CONFIG_PATH, JSON.stringify(newConfig, null, 2));
	}

	validateConfig() {
		const errors = [];
		const warnings = [];

		Object.entries(this.config).forEach(([name, server]) => {
			if (!server.transport) {
				errors.push(`${name}: Missing transport type`);
			}
			if (server.transport === "stdio" && !server.command) {
				errors.push(`${name}: Stdio transport requires command`);
			}
			if (
				(server.transport === "http" || server.transport === "sse") &&
				!server.url
			) {
				errors.push(`${name}: HTTP/SSE transport requires url`);
			}
			if (server.enabled === undefined) {
				warnings.push(
					`${name}: enabled field not set, defaulting to false`,
				);
			}
		});

		return { valid: errors.length === 0, errors, warnings };
	}

	validateServer(name, server) {
		if (!server.transport) {
			return { valid: false, error: "Missing transport type" };
		}
		if (server.transport === "stdio" && !server.command) {
			return { valid: false, error: "Stdio transport requires command" };
		}
		if (
			(server.transport === "http" || server.transport === "sse") &&
			!server.url
		) {
			return { valid: false, error: "HTTP/SSE transport requires url" };
		}
		if (server.enabled === undefined) {
			return {
				valid: true,
				warning: "enabled field not set, defaulting to false",
			};
		}
		return { valid: true };
	}

	async connectAllServers() {
		const newConfig = Object.entries(this.config).reduce(
			(acc, [name, server]) => {
				acc[name] = { ...server, enabled: true };
				return acc;
			},
			{},
		);
		await this.updateConfig(newConfig);
		return await this.initializeMcpClients();
	}

	async disconnectAllServers() {
		const newConfig = Object.entries(this.config).reduce(
			(acc, [name, server]) => {
				acc[name] = { ...server, enabled: false };
				return acc;
			},
			{},
		);
		await this.updateConfig(newConfig);
		this.mcpServers = {};
		this.isMcpConnected = false;
	}

	async connectOneServer(serverName) {
		const serverConfig = this.config[serverName];
		if (!serverConfig) {
			throw new Error(`Server ${serverName} not found`);
		}
		try {
			console.log(`🔌 Connecting to ${serverName}-----------`);

			let client;
			let transport = this._createTransport(serverConfig); // ✅ Use extracted method

			client = await createMCPClient({ transport });
			const tools = await client.tools();

			this.mcpServers[serverName] = {
				client,
				tools,
				metadata: {
					description: serverConfig.description || "",
					transport: serverConfig.transport,
					url: serverConfig.url || null,
				},
				connected: true,
				connectedAt: new Date(),
			};

			await this.updateConfig({
				...this.config,
				[serverName]: { ...serverConfig, enabled: true },
			});

			return {
				success: true,
				message: `Connected to ${serverName} with ${Object.keys(tools).length} tools`,
			};
		} catch (error) {
			console.error(
				`❌ Failed to connect to ${serverName}:`,
				error.message,
			);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	async disconnectOneServer(serverName) {
		const serverConfig = this.config[serverName];
		if (!serverConfig) {
			throw new Error(`Server ${serverName} not found`);
		}
		await this.updateConfig({
			...this.config,
			[serverName]: { ...this.config[serverName], enabled: false },
		});
		delete this.mcpServers[serverName];
	}

	getTools() {
		const tools = {};
		Object.values(this.mcpServers).forEach((server) => {
			Object.entries(server.tools).forEach(([toolName, tool]) => {
				tools[toolName] = { ...tool, server: server.metadata };
			});
		});
		return tools;
	}

	getConfig() {
		return this.config;
	}

	getState() {
		return this.mcpServers;
	}
}

export const tools = new Tools();
