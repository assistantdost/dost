import path from "path";
import { fileURLToPath } from "url";
import { app } from "electron";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = app.isPackaged === false;

const envPath = isDev
	? path.resolve(__dirname, "../.env") // dev: project root
	: path.resolve(process.resourcesPath, ".env"); // prod: extraResources dir (outside asar)

dotenv.config({ path: envPath });

export const config = {
	API_URL: process.env.VITE_API_URL || "http://localhost:5000/api/v1",
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
	SUMMARY_MAX_TOKENS: parseInt(process.env.VITE_SUMMARY_MAX_TOKENS) || 800,
};
