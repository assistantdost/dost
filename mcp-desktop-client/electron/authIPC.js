import { ipcMain } from "electron";

let authToken = null;

export { authToken };

export function setupAuthIPC() {
	console.log("✅ Auth IPC handlers registered");
	ipcMain.handle("auth:set-token", (event, token) => {
		authToken = token;
		console.log("Token set in main process : ", token);
		return true; // Acknowledge
	});

	ipcMain.handle("auth:clear-token", () => {
		authToken = null;
		console.log("Token cleared in main process");
		return true;
	});

	ipcMain.handle("auth:get-token", () => {
		return authToken;
	});
}
