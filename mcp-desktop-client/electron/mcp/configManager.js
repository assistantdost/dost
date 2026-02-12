import { app } from "electron";
import path from "path";
import fs from "fs/promises";

// MCP configuration file path
export const MCP_CONFIG_PATH = path.join(app.getPath("userData"), "mcp.json");

// Optimization: In-memory cache for config (indefinite - no expiration)
let configCache = null;

/**
 * Read MCP configuration from mcp.json (with indefinite caching)
 * @returns {Promise<Object>} Configuration object
 */
export async function readMcpConfig() {
	if (configCache) {
		return JSON.parse(JSON.stringify(configCache)); // Deep clone
	}

	try {
		const data = await fs.readFile(MCP_CONFIG_PATH, "utf8");
		configCache = JSON.parse(data);
		return configCache;
	} catch (error) {
		// Return empty object if file doesn't exist or is invalid
		configCache = {};
		configCacheTime = now;
		return configCache;
	}
}

/**
 * Write MCP configuration to mcp.json
 * @param {Object} config - Configuration object to write
 * @returns {Promise<void>}
 */
export async function writeMcpConfig(config) {
	// Update cache (indefinite caching)
	configCache = config;

	await fs.writeFile(MCP_CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * Load default servers from API and save to mcp.json
 * @param {string} apiUrl - API endpoint URL (optional, uses default if not provided)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function loadDefaultServers(apiUrl) {
	try {
		// Optimization: Add timeout to prevent hanging
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

		const response = await fetch(
			apiUrl || "http://localhost:5000/api/v1/mcp_store/default-servers",
			{ signal: controller.signal },
		);

		clearTimeout(timeoutId);

		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const defaults = await response.json();
		await writeMcpConfig(defaults);
		console.log("✅ Default MCP servers saved to:", MCP_CONFIG_PATH);
		return { success: true, data: defaults };
	} catch (error) {
		console.error("❌ Error loading defaults:", error);
		return { success: false, error: error.message };
	}
}

/**
 * Add a server to the configuration
 * @param {string} serverName - Name of the server
 * @param {Object} serverConfig - Server configuration object
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function addServer(serverName, serverConfig) {
	try {
		const config = await readMcpConfig();

		// Optimization: Validate config before saving
		if (!serverConfig.transport) {
			throw new Error("Server config must include transport type");
		}

		config[serverName] = serverConfig;
		await writeMcpConfig(config);
		console.log(`✅ Added server: ${serverName}`);
		return { success: true };
	} catch (error) {
		console.error("❌ Error adding server:", error);
		return { success: false, error: error.message };
	}
}

/**
 * Remove a server from the configuration
 * @param {string} serverName - Name of the server to remove
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function removeServer(serverName) {
	try {
		const config = await readMcpConfig();
		delete config[serverName];
		await writeMcpConfig(config);
		console.log(`✅ Removed server: ${serverName}`);
		return { success: true };
	} catch (error) {
		console.error("❌ Error removing server:", error);
		return { success: false, error: error.message };
	}
}

/**
 * Update a server's configuration
 * @param {string} serverName - Name of the server to update
 * @param {Object} updates - Updates to apply
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateServer(serverName, updates) {
	try {
		const config = await readMcpConfig();
		if (config[serverName]) {
			config[serverName] = { ...config[serverName], ...updates };
			await writeMcpConfig(config);
			console.log(`✅ Updated server: ${serverName}`);
			return { success: true };
		}
		return { success: false, error: "Server not found" };
	} catch (error) {
		console.error("❌ Error updating server:", error);
		return { success: false, error: error.message };
	}
}

/**
 * Validate configuration
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result
 */
export function validateConfig(config) {
	const errors = [];
	const warnings = [];

	Object.entries(config).forEach(([name, server]) => {
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
