from fastapi import APIRouter, HTTPException
from typing import Dict, Any

router = APIRouter()

# Default MCP server configurations
DEFAULT_SERVERS = {
    "desktop_server": {
        "command": "python",
        "args": ["../mcp-server-package/server.py"],
        "transport": "stdio",
        "enabled": True,
        "description": "Local desktop automation server"
    },
    "remote_server": {
        "url": "http://127.0.0.1:8000/remote_mcp/mcp",
        "transport": "streamable_http",
        "enabled": True,
        "description": "Remote MCP server (calendar, gmail, etc.)"
    },
}


@router.get("/default-servers")
async def get_default_servers() -> Dict[str, Any]:
    """
    Default route called upon login to retrieve default MCP server configurations.
    Returns a dictionary of server names mapped to their configurations.
    """
    try:
        return DEFAULT_SERVERS
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error retrieving default servers: {str(e)}")
