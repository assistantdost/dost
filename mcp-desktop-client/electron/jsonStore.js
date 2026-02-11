import fs from "fs";
import path from "path";
import { app } from "electron";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORE_PATH = path.join(
	path.resolve(__dirname, "../assets"),
	"store.json"
);

let cache = {};

// Load on boot
function load() {
	if (fs.existsSync(STORE_PATH)) {
		try {
			cache = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
		} catch {
			cache = {};
		}
	}
}

function persist() {
	fs.writeFileSync(STORE_PATH, JSON.stringify(cache, null, 2));
}

load();

export const jsonStore = {
	get(key) {
		return cache[key] ?? null;
	},
	set(key, value) {
		cache[key] = value;
		persist();
	},
	delete(key) {
		delete cache[key];
		persist();
	},
};
