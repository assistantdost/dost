
# server.py
from datetime import datetime
from mcp.server.fastmcp import FastMCP
from tools import windows
import inspect
import pytz
from pytz import country_timezones, country_names

# Create the FastMCP server instance
mcp = FastMCP("mcp-server-package")


# Register tools

@mcp.tool()
def get_time(location: str = "") -> str:
    """
    Retrieves the current local time for a specific location, city, or timezone. Use this to check 'What time is it in Tokyo?' or 'current time'.
    """
    try:
        if not location or location.strip() == "":
            now = datetime.now()
            return f"The local time is: {now.strftime('%Y-%m-%d %H:%M:%S')}"
        location = location.strip()
        # Try as timezone
        try:
            tz = pytz.timezone(location)
        except pytz.UnknownTimeZoneError:
            # Try as country
            country = location.lower()
            for code, name in country_names.items():
                if name.lower() == country:
                    tz_names = country_timezones.get(code)
                    if tz_names:
                        tz = pytz.timezone(tz_names[0])
                        break
            else:
                return f"Error: Unknown timezone or country '{location}'."
        now = datetime.now(tz)
        return f"The time in {location.title()} is: {now.strftime('%Y-%m-%d %H:%M:%S %Z%z')}"
    except Exception as e:
        return f"Failed to get time for '{location}': {e}"


def register_tools(module):
    """
    Register all public tools with the MCP server.

    This function inspects a module and registers all functions that do not
    start with an underscore ('_') as tools.
    """
    for name, func in inspect.getmembers(module, inspect.isfunction):
        if not name.startswith("_"):
            mcp.tool()(func)


if __name__ == "__main__":
    register_tools(windows)
    mcp.run(transport='stdio')
