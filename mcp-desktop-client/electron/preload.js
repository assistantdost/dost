const { contextBridge, ipcRenderer } = require("electron");

// Chat API
contextBridge.exposeInMainWorld("api", {
	chat: (messages) => ipcRenderer.invoke("api/chat", messages),
});

// App Store
contextBridge.exposeInMainWorld("appStore", {
	get: (key) => ipcRenderer.invoke("store:get", key),
	set: (key, value) => ipcRenderer.invoke("store:set", key, value),
	delete: (key) => ipcRenderer.invoke("store:delete", key),
});

// Test IPC
contextBridge.exposeInMainWorld("electronAPI", {
	getAppVersion: () => ipcRenderer.invoke("get-app-version"),
	getPlatform: () => ipcRenderer.invoke("get-platform"),
});

// Google Sign-In IPC
contextBridge.exposeInMainWorld("googleAPI", {
	signin: () => ipcRenderer.invoke("google:signin"),
});

// OAuth Tokens Listener
contextBridge.exposeInMainWorld("oauthAPI", {
	onTokens: (callback) => ipcRenderer.on("oauth-tokens", callback),
	offTokens: (callback) => ipcRenderer.off("oauth-tokens", callback),
});

contextBridge.exposeInMainWorld("ipcRenderer", ipcRenderer);

contextBridge.exposeInMainWorld("electron", {
	store: {
		get(key) {
			return ipcRenderer.sendSync("electron-store-get", key);
		},
		set(property, val) {
			ipcRenderer.send("electron-store-set", property, val);
		},
		delete(key) {
			ipcRenderer.send("electron-store-delete", key);
		},
		getAll() {
			return ipcRenderer.sendSync("electron-store-get-all");
		},
		deleteAll() {
			ipcRenderer.send("electron-store-delete-all");
		},
	},
	// MCP Store API
	invoke: (channel, ...args) => {
		const validChannels = [
			"mcp-get-state",
			"mcp-set-state",
			"mcp-login-load-defaults",
			"mcp-read-config",
			"mcp-add-server",
			"mcp-remove-server",
			"mcp-update-server",
			"mcp-connect",
		];
		if (validChannels.includes(channel)) {
			return ipcRenderer.invoke(channel, ...args);
		}
	},
	on: (channel, func) => {
		const validChannels = ["mcp-state-updated"];
		if (validChannels.includes(channel)) {
			ipcRenderer.on(channel, (event, ...args) => func(...args));
		}
	},
	removeAllListeners: (channel) => {
		const validChannels = ["mcp-state-updated"];
		if (validChannels.includes(channel)) {
			ipcRenderer.removeAllListeners(channel);
		}
	},
	// MCP Config API - convenient wrappers
	mcp: {
		loginLoadDefaults: (apiUrl) =>
			ipcRenderer.invoke("mcp-login-load-defaults", apiUrl),
		readConfig: () => ipcRenderer.invoke("mcp-read-config"),
		addServer: (name, config) =>
			ipcRenderer.invoke("mcp-add-server", name, config),
		removeServer: (name) => ipcRenderer.invoke("mcp-remove-server", name),
		updateServer: (name, updates) =>
			ipcRenderer.invoke("mcp-update-server", name, updates),
		connect: () => ipcRenderer.invoke("mcp-connect"),
		getInitStatus: () => ipcRenderer.invoke("mcp-get-init-status"),
		forceReinitialize: () => ipcRenderer.invoke("mcp-force-reinitialize"),
	},
});
