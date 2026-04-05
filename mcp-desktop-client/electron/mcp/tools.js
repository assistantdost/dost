import { app } from "electron";
import { EventEmitter } from "events";
import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { toolRAG } from "./toolRAG.js";
import { config } from "../config.js";
import path from "path";
import fs from "fs/promises";

const DEFAULT_SERVERS_URL = config.API_URL + "/mcp_store/default-servers";

export class Tools extends EventEmitter {
	constructor() {
		super();

		// ✅ Centralized state with Proxy for automatic change detection
		this.state = new Proxy(
			{
				config: {},
				mcpServers: {},
				isMcpConnected: false,
			},
			{
				set: (target, prop, value) => {
					const oldValue = target[prop];
					target[prop] = value;

					// Only emit if value actually changed
					console.log(`State change: ${prop} updated`);
					if (oldValue !== value) {
						this.emit(
							"mcp-state-changed",
							this._transformStateForUI(),
						);
					}

					// Auto-reindex tools in RAG when servers change
					if (prop === "mcpServers") {
						toolRAG.reindex(this.getTools());
					}
					return true;
				},
			},
		);

		this.initialized = false;
		this.activeUserId = null;
	}

	getMcpConfigPath() {
		if (!this.activeUserId) {
			return null;
		}

		return path.join(
			app.getPath("userData"),
			"users",
			String(this.activeUserId),
			"mcp.json",
		);
	}

	async ensureUserProfilePath() {
		const configPath = this.getMcpConfigPath();
		if (!configPath) {
			throw new Error("User context not initialized");
		}

		await fs.mkdir(path.dirname(configPath), { recursive: true });
		return configPath;
	}

	setActiveUserId(userId) {
		if (this.activeUserId === userId) {
			return;
		}

		this.activeUserId = userId || null;
		this.initialized = false;
		this.state.config = {};
		this.state.mcpServers = {};
		this.state.isMcpConnected = false;
	}

	async resetForLogout() {
		this.activeUserId = null;
		this.initialized = false;
		this.state.config = {};
		this.state.mcpServers = {};
		this.state.isMcpConnected = false;
	}

	// ✅ Helper to update nested state immutably (triggers proxy)
	_updateState(updates) {
		Object.entries(updates).forEach(([key, value]) => {
			this.state[key] = value;
		});
	}

	// ✅ Async initialization method
	async init() {
		if (!this.activeUserId) {
			this.state.config = {};
			this.initialized = true;
			return;
		}

		try {
			const configPath = await this.ensureUserProfilePath();
			const data = await fs.readFile(configPath, "utf8");

			this.state.config = JSON.parse(data);
			this.initialized = true;
		} catch (error) {
			if (error.code !== "ENOENT") {
				console.error("Failed to load MCP config:", error);
			}
			this.state.config = {};
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
				{ requestInit: { headers } },
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

	_transformStateForUI() {
		return {
			mcpServers: Object.entries(this.state.mcpServers).reduce(
				(acc, [serverName, server]) => {
					acc[serverName] = {
						...server.metadata,
						tools: Object.entries(server.tools).map(
							([toolName, tool]) => ({
								name: toolName,
								description: tool.description || "",
								// Add more tool metadata here if needed
							}),
						),
						toolCount: Object.keys(server.tools).length,
						connected: server.connected,
					};
					return acc;
				},
				{},
			),
			toolCount: Object.values(this.state.mcpServers).reduce(
				(count, server) => count + Object.keys(server.tools).length,
				0,
			),
			config: this.state.config,
			isMcpConnected: this.state.isMcpConnected,
		};
	}

	async initializeMcpClients() {
		await this.ensureInitialized();

		// Clear existing clients before re-initializing
		this.state.mcpServers = {};

		console.log("---------- Initializing MCP clients from config...");

		// Filter enabled servers
		const enabledServers = Object.entries(this.state.config).filter(
			([_, serverConfig]) => serverConfig.enabled === true,
		);

		const connectionPromises = enabledServers.map(
			async ([serverName, serverConfig]) => {
				try {
					console.log(`🔌 Connecting to ${serverName}-----------`);

					let client;
					let transport = this._createTransport(serverConfig);

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

		const newMcpServers = {};

		connectionResults.forEach((result) => {
			if (result.status === "fulfilled") {
				const { success, data } = result.value;
				if (success) {
					const { serverName, client, tools, metadata } = data;
					newMcpServers[serverName] = {
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

		// Update state immutably to trigger proxy
		this.state.mcpServers = newMcpServers;
		this.state.isMcpConnected = results.success.length > 0;

		return results;
	}

	async loadDefaultServers() {
		if (!this.activeUserId) {
			return {
				success: false,
				error: "User not authenticated",
			};
		}

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);

			const response = await fetch(DEFAULT_SERVERS_URL, {
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
			const results = await this.initializeMcpClients();
			return { success: true, results };
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
			// console.log("Server config:", serverConfig);

			let client;
			let transport = this._createTransport(serverConfig);

			client = await createMCPClient({ transport });
			const tools = await client.tools();

			// Update state immutably
			this.state.mcpServers = {
				...this.state.mcpServers,
				[serverName]: {
					client,
					tools,
					metadata: {
						description: serverConfig.description || "",
						transport: serverConfig.transport,
						url: serverConfig.url || null,
					},
					connected: true,
					connectedAt: new Date(),
				},
			};

			await this.updateConfig({
				...this.state.config,
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

	async updateServer(serverName, updates) {
		// if (!this.state.mcpServers[serverName]) {
		// 	return { success: false, error: "Server not found" };
		// }
		const existingConfig = this.state.config[serverName] || {};
		const newConfig = { ...existingConfig, ...updates };
		return await this.addServer(serverName, newConfig);
	}

	async removeServer(serverName) {
		const newConfig = { ...this.state.config };
		delete newConfig[serverName];
		await this.updateConfig(newConfig);

		// Update state immutably
		const newMcpServers = { ...this.state.mcpServers };
		delete newMcpServers[serverName];
		this.state.mcpServers = newMcpServers;

		return { success: true };
	}

	async updateConfig(newConfig) {
		if (!this.activeUserId) {
			throw new Error("User not authenticated");
		}

		const validation = this.validateConfig(newConfig);
		if (!validation.valid) {
			throw new Error(`Invalid config: ${validation.errors.join(", ")}`);
		}
		this.state.config = newConfig;
		const configPath = await this.ensureUserProfilePath();
		await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2));
	}

	validateConfig(configToValidate = this.state.config) {
		const errors = [];
		const warnings = [];

		Object.entries(configToValidate).forEach(([name, server]) => {
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
		const newConfig = Object.entries(this.state.config).reduce(
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
		const newConfig = Object.entries(this.state.config).reduce(
			(acc, [name, server]) => {
				acc[name] = { ...server, enabled: false };
				return acc;
			},
			{},
		);
		await this.updateConfig(newConfig);
		this.state.mcpServers = {};
		this.state.isMcpConnected = false;
		return { success: true };
	}

	async connectOneServer(serverName) {
		const serverConfig = this.state.config[serverName];
		if (!serverConfig) {
			throw new Error(`Server ${serverName} not found`);
		}
		try {
			console.log(`🔌 Connecting to ${serverName}-----------`);

			let client;
			let transport = this._createTransport(serverConfig);

			client = await createMCPClient({ transport });
			const tools = await client.tools();

			// Update state immutably
			this.state.mcpServers = {
				...this.state.mcpServers,
				[serverName]: {
					client,
					tools,
					metadata: {
						description: serverConfig.description || "",
						transport: serverConfig.transport,
						url: serverConfig.url || null,
					},
					connected: true,
					connectedAt: new Date(),
				},
			};

			await this.updateConfig({
				...this.state.config,
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
		const serverConfig = this.state.config[serverName];
		if (!serverConfig) {
			throw new Error(`Server ${serverName} not found`);
		}
		await this.updateConfig({
			...this.state.config,
			[serverName]: { ...this.state.config[serverName], enabled: false },
		});

		// Update state immutably
		const newMcpServers = { ...this.state.mcpServers };
		delete newMcpServers[serverName];
		this.state.mcpServers = newMcpServers;

		return { success: true };
	}

	getTools() {
		const tools = {};
		Object.values(this.state.mcpServers).forEach((server) => {
			Object.entries(server.tools).forEach(([toolName, tool]) => {
				tools[toolName] = { ...tool, server: server.metadata };
			});
		});
		return tools;
	}

	getConfig() {
		return this.state.config;
	}

	getState() {
		return this.state.mcpServers;
	}

	// ✅ Get full state snapshot
	getFullState() {
		return structuredClone(this.state);
	}
}

export const tools = new Tools();
