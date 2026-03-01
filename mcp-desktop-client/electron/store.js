import Store from "electron-store";
import pkg from "node-machine-id";
const { machineId } = pkg;
import crypto from "crypto";

async function getEncryptionKey() {
	const id = await machineId(); // Unique per device, persistent
	const key = crypto.createHash("sha256").update(id).digest("hex"); // Hash for 64-char key
	console.log("Generated encryption key from machine ID", key);
	return key;
}

const store = new Store({
	encryptionKey: await getEncryptionKey(),
});

export default store;
