from fastapi import FastAPI
from fastmcp import FastMCP
import requests
import os
import dotenv
import inspect
from tools import stock, crypto, metal, currency, gmail_tool, calendar_tool, spotify_tool, contacts_tool
from auth.endpoints import router as auth_router

dotenv.load_dotenv()

# ---------------- MCP Server ----------------
# Remove host/port from FastMCP - they're deprecated when mounting in FastAPI
mcp = FastMCP(name="mcp-server-web")

API_KEY = os.getenv("WEATHER_API_KEY", "YOUR_API_KEY")
BASE_URL = "http://api.openweathermap.org/data/2.5/weather"


@mcp.tool()
def calculator(numbers: list[float], operation: str) -> dict:
    """
    Perform mathematical calculations on a list of numbers.
    Use this for finding the sum, product, minimum, maximum, or average (mean) of a dataset. Useful for basic statistics and arithmetic.
    """
    if not numbers:
        return {"error": "No numbers provided."}
    if operation == "sum":
        result = sum(numbers)
    elif operation == "product":
        result = 1
        for n in numbers:
            result *= n
    elif operation == "min":
        result = min(numbers)
    elif operation == "max":
        result = max(numbers)
    elif operation == "average":
        result = sum(numbers) / len(numbers)
    else:
        return {"error": f"Unsupported operation: {operation}"}
    return {"result": result}


@mcp.tool()
def get_weather(city: str, units: str = "metric") -> dict:
    """
    Retrieves the current weather forecast.
    Use this to check if it is raining, snowing, sunny, or to get the temperature in a specific city (e.g., Tokyo).
    """
    params = {
        "q": city,
        "appid": API_KEY,
        "units": units
    }

    try:
        response = requests.get(BASE_URL, params=params, timeout=5)
        data = response.json()

        if response.status_code == 200:
            return {
                "city": data["name"],
                "country": data["sys"]["country"],
                "temperature": data["main"]["temp"],
                "feels_like": data["main"]["feels_like"],
                "humidity": data["main"]["humidity"],
                "weather": data["weather"][0]["description"],
                "wind_speed": data["wind"]["speed"]
            }
        else:
            return {"error": data.get("message", "Failed to fetch weather")}
    except Exception as e:
        return {"error": str(e)}


def register_tools(module):
    """
    Register all public tools with the MCP server.

    This function inspects a module and registers all functions that do not
    start with an underscore ('_') as tools.
    """
    for name, func in inspect.getmembers(module, inspect.isfunction):
        if not name.startswith("_"):
            mcp.tool()(func)


# ---------------- Register Tools ----------------
register_tools(stock)
register_tools(crypto)
register_tools(metal)
register_tools(currency)

# Register Gmail and Calendar tools with OAuth
mcp.tool()(gmail_tool.read_recent_emails)
mcp.tool()(gmail_tool.send_email)
mcp.tool()(calendar_tool.list_calendar_events)
mcp.tool()(calendar_tool.create_calendar_event)

# Register Contacts tool
mcp.tool()(contacts_tool.list_contacts)

# Register Spotify tools
mcp.tool()(spotify_tool.get_current_playback)
mcp.tool()(spotify_tool.play_spotify)
mcp.tool()(spotify_tool.pause_spotify)
mcp.tool()(spotify_tool.next_track_spotify)
mcp.tool()(spotify_tool.previous_track_spotify)
mcp.tool()(spotify_tool.start_spotify_playback)
mcp.tool()(spotify_tool.list_spotify_devices)
mcp.tool()(spotify_tool.set_spotify_device)
mcp.tool()(spotify_tool.search_spotify)

# Create the streamable app *first* to get its lifespan
mcp_app = mcp.streamable_http_app()


# ---------------- FastAPI App ----------------
# Pass the mcp_app.lifespan to the FastAPI constructor
app = FastAPI(
    title="MCP Remote Server",
    description="Remote MCP server with OAuth support",
    version="1.0.0",
    lifespan=mcp_app.lifespan  # <-- FIX IS HERE
)

# Add OAuth endpoints
app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "MCP Remote Server with OAuth",
        "endpoints": {
            "oauth_start": "/auth/start (POST)",
            "oauth_callback": "/auth/callback (GET)",
            "oauth_status": "/auth/status/{service} (GET)",
            "mcp": "/mcp (POST)",  # This key seems wrong, endpoint is /mcp
            "docs": "/docs"
        },
        "tools_registered": [
            "calculator",
            "get_weather",
            "get_stock_data",
            "get_crypto_price",
            "get_metal_price",
            "convert_currency",
            "read_recent_emails",
            "send_email",
            "list_calendar_events",
            "list_contacts",
            "create_calendar_event",
            "get_current_playback",
            "play_spotify",
            "pause_spotify",
            "next_track_spotify",
            "previous_track_spotify",
            "start_spotify_playback",
            "list_spotify_devices",
            "set_spotify_device",
            "search_spotify"
        ]
    }


# Mount MCP using the app we already created
app.mount("/remote_mcp", mcp_app)  # <-- FIX IS HERE


# ---------------- Inspector and Tester ----------------
# npx @modelcontextprotocol/inspector


if __name__ == "__main__":
    import uvicorn

    print("🚀 Starting MCP Remote Server...")
    print("📡 Server running at: http://0.0.0.0:8000")
    print("\n📋 Available Endpoints:")
    print("   ✅ Google OAuth Authorization: POST http://localhost:8000/auth/start")
    print("   ✅ Spotify OAuth Authorization: POST http://localhost:8000/auth/start_spotify")
    print("   ✅ OAuth Callback: GET http://localhost:8000/auth/callback")
    print("   ✅ Spotify Callback: GET http://localhost:8000/auth/spotify_callback")
    print("   ✅ OAuth Status: GET http://localhost:8000/auth/status/{service}")
    print("   ✅ API Docs: http://localhost:8000/docs")
    print("   ✅ MCP Endpoint: http://localhost:8000/mcp (Streamable HTTP)")    # Corrected path
    print("\n🔧 Registered MCP Tools:")
    print("   - calculator")
    print("   - get_weather")
    print("   - get_stock_data (from stock module)")
    print("   - get_crypto_price (from crypto module)")
    print("   - get_metal_price (from metal module)")
    print("   - convert_currency (from currency module)")
    print("   - read_recent_emails (requires OAuth)")
    print("   - send_email (requires Google OAuth)")
    print("   - list_calendar_events (requires OAuth)")
    print("   - create_calendar_event (requires Google OAuth)")
    print("   - list_contacts (requires Google OAuth)")
    print("   - get_current_playback (Spotify - requires OAuth)")
    print("   - play_spotify (requires OAuth)")
    print("   - pause_spotify (requires OAuth)")
    print("   - next_track_spotify (requires OAuth)")
    print("   - previous_track_spotify (requires OAuth)")
    print("   - start_spotify_playback (requires OAuth)")
    print("   - list_spotify_devices (requires OAuth)")
    print("   - set_spotify_device (requires OAuth)")
    print("\n" + "="*60)

    uvicorn.run(app, host="0.0.0.0", port=8000)
