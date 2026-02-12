import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { groq } from "@ai-sdk/groq";
import { addMcpServer, getActiveTools } from "../mcpStore.js";

// ✅ Simple cache with invalidation
const toolsCache = {
	isValid: false,

	async get() {
		if (this.isValid) {
			return getActiveTools();
		}

		// console.log("🔄 Initializing MCP clients and loading tools...");

		// Initialize clients in parallel
		const [mcpClient, localMcpClient] = await Promise.all([
			createMCPClient({
				transport: new StreamableHTTPClientTransport(
					new URL("http://127.0.0.1:8000/remote_mcp/mcp"),
				),
			}),

			createMCPClient({
				transport: new StdioClientTransport({
					command: "python",
					args: ["../mcp-server-package/server.py"],
				}),
			}),
		]);

		// Fetch tools from both servers
		const toolsRemote = await mcpClient.tools();
		const toolsLocal = await localMcpClient.tools();

		// Add servers to MCP store (stores client + tools)
		addMcpServer("remote", mcpClient, toolsRemote, {
			url: "http://127.0.0.1:8000/remote_mcp/mcp",
			type: "http",
		});

		addMcpServer("local", localMcpClient, toolsLocal, {
			command: "python",
			args: ["../mcp-server-package/server.py"],
			type: "stdio",
		});

		this.isValid = true;
		// console.log("✅ MCP tools loaded successfully");

		return getActiveTools();
	},

	invalidate() {
		this.isValid = false;
		// console.log("🔄 Tools cache invalidated");
	},
};

export async function getTools() {
	return await toolsCache.get();
}

export function invalidateToolsCache() {
	toolsCache.invalidate();
}
