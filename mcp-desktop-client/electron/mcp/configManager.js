import { app } from "electron";
import path from "path";
import fs from "fs/promises";

// MCP configuration file path
export const MCP_CONFIG_PATH = path.join(app.getPath("userData"), "mcp.json");

/**
 * Read MCP configuration from mcp.json
 * @returns {Promise<Object>} Configuration object
 */
export async function readMcpConfig() {
	try {
		const data = await fs.readFile(MCP_CONFIG_PATH, "utf8");
		return JSON.parse(data);
	} catch (error) {
		// Return empty object if file doesn't exist or is invalid
		return {};
	}
}

/**
 * Write MCP configuration to mcp.json
 * @param {Object} config - Configuration object to write
 * @returns {Promise<void>}
 */
export async function writeMcpConfig(config) {
	await fs.writeFile(MCP_CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * Load default servers from API and save to mcp.json
 * @param {string} apiUrl - API endpoint URL (optional, uses default if not provided)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function loadDefaultServers(apiUrl) {
	try {
		const response = await fetch(
			apiUrl || "http://localhost:5000/api/v1/mcp_store/default-servers",
		);
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
