import { ipcMain, app, shell } from "electron";

import { config } from "./config.js";

// Test IPC handlers
ipcMain.handle("get-app-version", () => {
	return app.getVersion();
});

ipcMain.handle("get-platform", () => {
	return process.platform;
});

// Google Sign-In IPC handlers (minimal: just open external URL)
ipcMain.handle("google:signin", async () => {
	const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.GOOGLE_CLIENT_ID}&redirect_uri=http://localhost:5599/oauth/google/callback&response_type=code&scope=openid email profile&prompt=consent`;
	shell.openExternal(oauthUrl); // Open in external browser
});
