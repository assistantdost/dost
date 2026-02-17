import { app, BrowserWindow, shell, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Store from "electron-store";
import "./ipcStore.js";
import { createServer } from "./server/server.js";
import { getSerializedState, updateMcpStore } from "./mcpStore.js";
import { registerMcpIpcHandlers } from "./mcp/ipcHandlers.js";
// import { initializeMcpOnStartup } from "./mcp/initializer.js";

import { tools } from "./mcp/tools.js";

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

	// ✅ Initialize MCP tools on startup from mcp.json
	// await initializeMcpOnStartup();

	await tools.init();
	// const results = await tools.initializeMcpClients(true);
	// console.log(
	// 	"MCP clients initialized on startup:",
	// 	JSON.parse(JSON.stringify(results)),
	// );
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
