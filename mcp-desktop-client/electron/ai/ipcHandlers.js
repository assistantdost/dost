import { ipcMain, BrowserWindow } from "electron";
import { aiModel } from "./models.js";

export function registerAiIpcHandlers() {
	// Handler for init
	ipcMain.handle("ai-init", async () => {
		try {
			await aiModel.init();
			return { success: true };
		} catch (error) {
			console.error("Error initializing AI model:", error);
			return { success: false, error: error.message };
		}
	});

	// Handler for setEnvStore
	ipcMain.handle("ai-set-env-store", async (event, envData) => {
		try {
			aiModel.setEnvStore(envData);
			return { success: true };
		} catch (error) {
			console.error("Error setting env store:", error);
			return { success: false, error: error.message };
		}
	});

	// Handler for getEnvStore
	ipcMain.handle("ai-get-env-store", async (event, key) => {
		try {
			const value = aiModel.getEnvStore(key);
			return { success: true, value };
		} catch (error) {
			console.error("Error getting env store:", error);
			return { success: false, error: error.message };
		}
	});

	// Handler for deleteEnvStore
	ipcMain.handle("ai-delete-env-store", async (event, key) => {
		try {
			aiModel.deleteEnvStore(key);
			return { success: true };
		} catch (error) {
			console.error("Error deleting env store:", error);
			return { success: false, error: error.message };
		}
	});

	// Handler for selectChatModel
	ipcMain.handle("ai-select-chat-model", async (event, provider, model) => {
		try {
			aiModel.selectChatModel(provider, model);
			return { success: true };
		} catch (error) {
			console.error("Error selecting chat model:", error);
			return { success: false, error: error.message };
		}
	});

	// Handler for get AI state
	ipcMain.handle("ai-get-state", () => {
		return aiModel.getState();
	});

	// Listen to aiModel state changes and broadcast to renderer windows
	aiModel.on("ai-state-changed", (newState) => {
		BrowserWindow.getAllWindows().forEach((win) => {
			win.webContents.send("ai-state-updated", newState);
		});
	});

	console.log("✅ AI IPC handlers registered");
}
