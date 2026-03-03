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
});

// MCP API - expose all handlers directly under "mcp"
contextBridge.exposeInMainWorld("mcp", {
	loginLoadDefaults: (apiUrl) =>
		ipcRenderer.invoke("mcp-login-load-defaults", apiUrl),
	readConfig: () => ipcRenderer.invoke("mcp-read-config"),
	addServer: (name, config) =>
		ipcRenderer.invoke("mcp-add-server", name, config),
	removeServer: (name) => ipcRenderer.invoke("mcp-remove-server", name),
	updateServer: (name, updates) =>
		ipcRenderer.invoke("mcp-update-server", name, updates),
	initialize: (state) => ipcRenderer.invoke("mcp-initialize", state),
	connect: () => ipcRenderer.invoke("mcp-connect"),
	disconnect: () => ipcRenderer.invoke("mcp-disconnect"),
	connectOne: (name) => ipcRenderer.invoke("mcp-connect-one", name),
	disconnectOne: (name) => ipcRenderer.invoke("mcp-disconnect-one", name),
	getFullState: () => ipcRenderer.invoke("mcp-get-full-state"),
	getState: () => ipcRenderer.invoke("mcp-get-state"),
	onStateUpdated: (callback) => {
		const wrapped = (event, ...args) => callback(...args);
		ipcRenderer.on("mcp-state-updated", wrapped);
		return () => ipcRenderer.removeListener("mcp-state-updated", wrapped);
	},
});

// AI API - expose all handlers directly under "ai"
contextBridge.exposeInMainWorld("ai", {
	init: () => ipcRenderer.invoke("ai-init"),
	selectChatModel: (provider, model) =>
		ipcRenderer.invoke("ai-select-chat-model", provider, model),
	setEnvStore: (key, value) =>
		ipcRenderer.invoke("ai-set-env-store", key, value),
	getEnvStore: (key) => ipcRenderer.invoke("ai-get-env-store", key),
	deleteEnvStore: (key) => ipcRenderer.invoke("ai-delete-env-store", key),
	getState: () => ipcRenderer.invoke("ai-get-state"),
	onStateUpdated: (callback) => {
		const wrapped = (event, ...args) => callback(...args);
		ipcRenderer.on("ai-state-updated", wrapped);
		return () => ipcRenderer.removeListener("ai-state-updated", wrapped);
	},
});
