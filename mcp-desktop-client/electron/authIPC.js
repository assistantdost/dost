import { ipcMain } from "electron";
import { clearActiveUser, setActiveUser } from "./store.js";
import { tools } from "./mcp/tools.js";

let authToken = null;
let authUserId = null;

function decodeUserIdFromToken(token) {
	if (!token || typeof token !== "string") {
		return null;
	}

	try {
		const parts = token.split(".");
		if (parts.length < 2) {
			return null;
		}

		const payload = parts[1]
			.replace(/-/g, "+")
			.replace(/_/g, "/")
			.padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
		const decodedPayload = JSON.parse(
			Buffer.from(payload, "base64").toString("utf8"),
		);
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
		tools.setActiveUserId(decodedUserId);
		return true; // Acknowledge
	});

	ipcMain.handle("auth:clear-token", async () => {
		await tools.resetForLogout();
		clearActiveUser();
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
