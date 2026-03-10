# MCP Client (Python CLI)

Minimal command-line MCP client built with [LangChain](https://www.langchain.com/) and [LangGraph](https://github.com/langchain-ai/langgraph). Connects to both the local stdio server and the remote HTTP server, then lets you chat with an AI agent that can call any registered tool.

## How It Works

1. Connects to **two MCP servers** simultaneously:
   - `mcp-server-package` via **stdio** (spawns it as a subprocess)
   - `mcp-server-remote` via **streamable HTTP** (must be running separately)
2. Discovers all available tools from both servers
3. Creates a LangGraph ReAct agent that can chain multiple tool calls
4. Runs an interactive REPL in the terminal

## Files

```
mcp-client/
├── client.py           # Main CLI client (LangGraph ReAct agent)
├── client_history.py   # Extended version with conversation history
└── client new.py       # Alternate version (experimental)
```

## Setup

```bash
cd mcp-client
pip install langchain-mcp-adapters langgraph langchain-groq python-dotenv
```

## Environment Variables

Set in the root `.env` or export directly:

```env
GROQ_API_KEY=gsk_...
```

## Running

First, start the remote server (in a separate terminal):

```bash
cd mcp-server-remote
python server.py
```

Then run the client:

```bash
cd mcp-client
python client.py
```

```
Agent ready! Type 'exit' to quit.

You: What's the weather in London?
AI: The current weather in London is...
```

## Features

- **Multi-server** - Talks to both local and remote MCP servers at once
- **Tool chaining** - Agent can call multiple tools in sequence to solve complex queries
- **Token tracking** - Displays token usage and model info after each response
- **Reasoning display** - Shows the model's reasoning process (when supported)
- **Colored output** - Blue for AI responses, green for reasoning, orange for metadata

## Customization

Edit `client.py` to change:

- **Model**: Swap `ChatGroq(model="...")` to use a different LLM
- **Server config**: Add/remove MCP servers in the `MultiServerMCPClient` dict
- **System prompt**: Modify the `prompt` parameter in `create_react_agent`
