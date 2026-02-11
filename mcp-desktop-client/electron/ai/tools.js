import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { groq } from "@ai-sdk/groq";

export async function getTools() {
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

	const toolsRemote = await mcpClient.tools();
	const toolsLocal = await localMcpClient.tools();
	const tools = { ...toolsRemote, ...toolsLocal };

	return tools;
}
