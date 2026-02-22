import { app, BrowserWindow, shell, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Store from "electron-store";
import "./ipcStore.js";
import { createServer } from "./server/server.js";
import { registerMcpIpcHandlers } from "./mcp/ipcHandlers.js";

import { tools } from "./mcp/tools.js";
import { toolRAG } from "./mcp/toolRAG.js";

const isDev = app.isPackaged === false;

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

// ✅ Register MCP IPC handlers
registerMcpIpcHandlers();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = isDev
	? path.resolve(__dirname, "../.env")
	: path.resolve(__dirname, ".env");

dotenv.config({ path: envPath });

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

	if (isDev) {
		win.loadURL(process.env.VITE_DEV_SERVER_URL);
	} else {
		win.loadFile(path.join(__dirname, "../dist/index.html"));
	}
}

app.whenReady().then(async () => {
	createWindow();
	await createServer(mainWindow);
	await toolRAG.init();
	await tools.init();
	// const results = await tools.initializeMcpClients(true);
	// console.log(
	// 	"MCP clients initialized on startup:",
	// 	JSON.stringify(results, null, 2),
	// );
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
