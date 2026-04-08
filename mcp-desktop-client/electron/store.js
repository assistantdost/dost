import Store from "electron-store";
import { app } from "electron";
import pkg from "node-machine-id";
const { machineId } = pkg;
import crypto from "crypto";
import path from "path";
import fs from "fs";

async function getEncryptionKey() {
	const id = await machineId(); // Unique per device, persistent
	const key = crypto.createHash("sha256").update(id).digest("hex"); // Hash for 64-char key
	console.log("Generated encryption key from machine ID", key);
	return key;
}

const encryptionKey = await getEncryptionKey();

// TODO : Re Enable encyprtion.
// Future plan for per-user config encryption (kept disabled intentionally):
// function deriveConfigEncryptionKey(userId) {
// 	// Combines machine-scoped key material with user scope.
// 	return crypto
// 		.createHash("sha256")
// 		.update(`${encryptionKey}:${String(userId)}`)
// 		.digest("hex");
// }

const metaStore = new Store({
	name: "profile-meta",
	// encryptionKey,
});

const stores = new Map();
let activeUserId = metaStore.get("lastUserId", null);

const ephemeralState = {};
const ephemeralStore = {
	get(key, defaultValue = undefined) {
		return Object.prototype.hasOwnProperty.call(ephemeralState, key)
			? ephemeralState[key]
			: defaultValue;
	},
	set(key, value) {
		ephemeralState[key] = value;
	},
	delete(key) {
		delete ephemeralState[key];
	},
	clear() {
		Object.keys(ephemeralState).forEach(
			(key) => delete ephemeralState[key],
		);
	},
	get store() {
		return { ...ephemeralState };
	},
};

function ensureDir(dirPath) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
}

function getUserStoreDir(userId) {
	return path.join(app.getPath("userData"), "users", userId);
}

function getStoreForUser(userId) {
	if (!userId) {
		return ephemeralStore;
	}

	const resolvedUserId = userId;

	const cacheKey = `user:${resolvedUserId}`;
	if (!stores.has(cacheKey)) {
		const cwd = getUserStoreDir(resolvedUserId);
		ensureDir(cwd);
		stores.set(
			cacheKey,
			new Store({
				name: "config",
				cwd,
				// encryptionKey: deriveConfigEncryptionKey(resolvedUserId),
				// encryptionKey,
			}),
		);
	}

	return stores.get(cacheKey);
}

export function setActiveUser(userId) {
	activeUserId = userId || null;
	if (activeUserId) {
		metaStore.set("lastUserId", activeUserId);
	} else {
		metaStore.delete("lastUserId");
	}
}

export function clearActiveUser() {
	activeUserId = null;
	metaStore.delete("lastUserId");
}

export function getActiveUserId() {
	return activeUserId;
}

export function getStore() {
	return getStoreForUser(activeUserId);
}

export function getMetaStore() {
	return metaStore;
}

export function getScopedStore(key) {
	if (key === "globalStore") {
		return metaStore;
	}

	return getStore();
}

export default getStore;
