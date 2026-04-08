import { ipcMain } from "electron";
import jwt from "jsonwebtoken";
import { clearActiveUser, getMetaStore, setActiveUser } from "./store.js";
import { tools } from "./mcp/tools.js";
import { aiModel } from "./ai/models.js";

let authToken = null;
let authUserId = null;

function decodeUserIdFromToken(token) {
	if (!token || typeof token !== "string") {
		return null;
	}

	try {
		const decodedPayload = jwt.decode(token);
		if (!decodedPayload || typeof decodedPayload !== "object") {
			return null;
		}

		return decodedPayload?.id || null;
	} catch (error) {
		console.warn("Failed to decode JWT payload:", error.message);
		return null;
	}
}

export { authToken, authUserId };

export function hasAuthContext() {
	return Boolean(authToken && authUserId);
}

function setPersistedLogged(logged) {
	const metaStore = getMetaStore();
	const globalStoreState = metaStore.get("globalStore") || {};

	metaStore.set("globalStore", {
		...globalStoreState,
		state: {
			...(globalStoreState.state || {}),
			logged,
		},
	});
}

export function setupAuthIPC() {
	console.log("✅ Auth IPC handlers registered");
	ipcMain.handle("auth:set-token", async (event, token) => {
		const decodedUserId = decodeUserIdFromToken(token);
		if (!decodedUserId) {
			throw new Error("Invalid token payload: user id not found");
		}

		authToken = token;
		authUserId = decodedUserId;
		setActiveUser(decodedUserId);
		setPersistedLogged(true);
		tools.setActiveUserId(decodedUserId);
		await aiModel.init();
		return true; // Acknowledge
	});

	ipcMain.handle("auth:clear-token", async () => {
		setPersistedLogged(false);
		await tools.resetForLogout();
		clearActiveUser();
		await aiModel.init();
		authToken = null;
		authUserId = null;
		console.log("Token cleared in main process");
		return true;
	});

	ipcMain.handle("auth:get-token", () => {
		return authToken;
	});

	ipcMain.handle("auth:get-user-id", () => {
		return authUserId;
	});
}
