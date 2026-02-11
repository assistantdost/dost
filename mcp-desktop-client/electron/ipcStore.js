import { ipcMain, app, shell } from "electron";
import { jsonStore } from "./jsonStore.js";

// Store IPC handlers
ipcMain.handle("store:get", (_, key) => {
	return jsonStore.get(key);
});

ipcMain.handle("store:set", (_, key, value) => {
	jsonStore.set(key, value);
});

ipcMain.handle("store:delete", (_, key) => {
	jsonStore.delete(key);
});

// Test IPC handlers
ipcMain.handle("get-app-version", () => {
	return app.getVersion();
});

ipcMain.handle("get-platform", () => {
	return process.platform;
});

// Google Sign-In IPC handlers (minimal: just open external URL)
ipcMain.handle("google:signin", async () => {
	const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=http://localhost:5599/oauth/google/callback&response_type=code&scope=openid email profile&prompt=consent`;
	shell.openExternal(oauthUrl); // Open in external browser
});
