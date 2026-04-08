import { app, BrowserWindow, shell, ipcMain, protocol, net } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import getStore, { getMetaStore, getScopedStore } from "./store.js";
import "./ipcStore.js";
import { setupAuthIPC } from "./authIPC.js";
import { createServer } from "./server/server.js";

// MCP imports
import { registerMcpIpcHandlers } from "./mcp/ipcHandlers.js";
import { toolRAG } from "./mcp/toolRAG.js";

// AI imports
import { registerAiIpcHandlers } from "./ai/ipcHandlers.js";
import { aiModel } from "./ai/models.js";

const isDev = app.isPackaged === false;

// 1. Register the scheme as privileged.
// THIS MUST BE BEFORE app.whenReady()
protocol.registerSchemesAsPrivileged([
	{
		scheme: "app",
		privileges: {
			standard: true,
			secure: false,
			supportFetchAPI: true,
			corsEnabled: true,
		},
	},
]);

// IPC listeners
ipcMain.on("electron-store-get", async (event, val) => {
	event.returnValue = getScopedStore(val).get(val);
});
ipcMain.on("electron-store-set", async (event, key, val) => {
	getScopedStore(key).set(key, val);
});
ipcMain.on("electron-store-delete", async (event, key) => {
	getScopedStore(key).delete(key);
});
ipcMain.on("electron-store-get-all", async (event) => {
	const userStore = getStore();
	event.returnValue = {
		...userStore.store,
		globalStore: getMetaStore().get("globalStore"),
	};
});

ipcMain.on("electron-store-delete-all", (event) => {
	getStore().clear(); // Clears all data
});

// ✅ Register MCP IPC handlers
registerMcpIpcHandlers();

// ✅ Register AI IPC handlers
registerAiIpcHandlers();

// ✅ Register Auth IPC handlers
setupAuthIPC();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = isDev
	? path.resolve(__dirname, "../.env") // dev: project root
	: path.resolve(process.resourcesPath, ".env"); // prod: extraResources dir (outside asar)

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
		// Load via custom protocol in production
		win.loadURL("app://localhost/");
	}
}

app.whenReady().then(async () => {
	// 2. Handle 'app://' requests and serve from dist folder
	protocol.handle("app", (request) => {
		const urlPath = request.url.replace("app://localhost/", "");
		const filePath = path.join(
			__dirname,
			"dist",
			urlPath || "index.html", // Serves index.html for root "/"
		);
		return net.fetch("file://" + filePath);
	});

	createWindow();
	await createServer(mainWindow);
	await aiModel.init();
	await toolRAG.init();
	// const results = await tools.initializeMcpClients(true);
	// console.log(
	// 	"MCP clients initialized on startup:",
	// 	JSON.stringify(results, null, 2),
	// );
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
