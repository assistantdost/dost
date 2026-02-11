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
