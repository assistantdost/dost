# MCP Project - CLI

This project demonstrates a Model Context Protocol (MCP) setup with:

- One local stdio MCP server
- One remote HTTP MCP server
- One MCP client

## Setup & Installation

1. **Install dependencies**
    - Make sure you have Python 3.11+
    - (Recommended) Create and activate a virtual environment:
        ```sh
        python -m venv .venv
        # On Windows:
        .venv\Scripts\activate
        # On Linux/macOS:
        source .venv/bin/activate
        ```
    - Install required packages:
        ```sh
        pip install -r requirements.txt
        ```
    - Env required
        ```
        GROQ_API_KEY
        WEATHER_API_KEY
        ```

## How to Run

### Start the MCP Server (HTTP)

```sh
cd mcp-server-remote
python server.py
```

### Start the MCP Client

```sh
cd mcp-client
python client.py
```

The client will connect to both the local stdio server and the remote HTTP server.

## Inspect the MCP Server

You can inspect the MCP server using the Model Context Protocol Inspector:

```sh
npx @modelcontextprotocol/inspector
```

## Notes

- The MCP client supports natural language queries and tool calls.
- The MCP server exposes tools such as `hello`,`echo`,`weather`,`datetime`, `sum`, `product`, and `calculator`.
- For development, you can run both the server and client locally.

---

For more details, see the source code in the respective folders.
