import { app, BrowserWindow, shell, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Store from "electron-store";
import "./ipcStore.js";
import { createServer } from "./server/server.js";
import { getSerializedState, updateMcpStore } from "./mcpStore.js";

const store = new Store();

// IPC listeners
ipcMain.on("electron-store-get", async (event, val) => {
	event.returnValue = store.get(val);
});
ipcMain.on("electron-store-set", async (event, key, val) => {
	store.set(key, val);
});
ipcMain.on("electron-store-delete", async (event, key) => {
	store.delete(key);
});
ipcMain.on("electron-store-get-all", async (event) => {
	event.returnValue = store.store;
});

ipcMain.on("electron-store-delete-all", (event) => {
	store.clear(); // Clears all data
});

// ✅ MCP Store IPC handlers
ipcMain.handle("mcp-get-state", () => {
	const state = getSerializedState();
	console.log("📤 Sending MCP state to renderer:", state);
	return state;
});

ipcMain.handle("mcp-set-state", (event, key, value) => {
	updateMcpStore(key, value);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

let mainWindow;

function createWindow() {
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		minWidth: 900,
		minHeight: 700,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
		},
	});

	win.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: "deny" };
	});

	mainWindow = win;

	if (process.env.VITE_DEV_SERVER_URL) {
		win.loadURL(process.env.VITE_DEV_SERVER_URL);
	} else {
		win.loadFile(path.join(__dirname, "../dist/index.html"));
	}
}

app.whenReady().then(async () => {
	createWindow();
	await createServer(mainWindow);

	// ✅ Pre-load MCP tools on startup
	try {
		const { getTools } = await import("./ai/tools.js");
		await getTools();
		console.log("✅ MCP tools loaded on startup");
	} catch (error) {
		console.error("❌ Failed to pre-load MCP tools:", error);
	}
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
