import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { setupRoutes } from "./routes.js";

export async function createServer(mainWindow) {
	const server = express();
	server.use(cors());
	server.use(bodyParser.json());

	setupRoutes(server, mainWindow);

	const PORT = 5599;
	server.listen(PORT, () => {
		console.log(`Server is running on http://localhost:${PORT}`);
	});
}
