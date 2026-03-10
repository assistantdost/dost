# MCP Server Package

Local MCP server that runs over **stdio** transport. Provides Windows desktop automation tools - app launching, window management, volume/brightness control, file operations, screenshots, notifications, task scheduling, and more.

Designed to be spawned as a child process by an MCP client (e.g., the desktop client or CLI client).

## Tools

### Application Management

| Tool           | Description                                                   |
| -------------- | ------------------------------------------------------------- |
| `open_app`     | Launch desktop applications (Firefox, Spotify, Notepad, etc.) |
| `open_webpage` | Open a URL in the default browser                             |
| `search_web`   | Search Google/Bing                                            |
| `play_song`    | Play a song on YouTube                                        |

### Window Management

| Tool                | Description                          |
| ------------------- | ------------------------------------ |
| `list_open_windows` | List all visible application windows |
| `focus_window`      | Bring a window to the foreground     |
| `minimize_window`   | Minimize a window to taskbar         |
| `maximize_window`   | Maximize a window to fill the screen |
| `close_window`      | Close a window by title              |

### System Control

| Tool                 | Description                                  |
| -------------------- | -------------------------------------------- |
| `volume_control`     | Set, increase, or decrease system volume     |
| `brightness_control` | Set, increase, or decrease screen brightness |
| `system_power`       | Shutdown, restart, hibernate, or lock the PC |
| `get_system_info`    | OS, CPU, RAM, and disk information           |

### Desktop Interaction

| Tool                | Description                          |
| ------------------- | ------------------------------------ |
| `screenshot`        | Capture the entire screen            |
| `clipboard_manager` | Read or write clipboard text         |
| `show_notification` | Display a Windows toast notification |

### File Operations

| Tool          | Description              |
| ------------- | ------------------------ |
| `create_note` | Create a text/note file  |
| `find_files`  | Search for files on disk |

### Task Scheduling

| Tool                    | Description                                   |
| ----------------------- | --------------------------------------------- |
| `schedule_task`         | Schedule a command via Windows Task Scheduler |
| `list_scheduled_tasks`  | List scheduled tasks                          |
| `delete_scheduled_task` | Remove a scheduled task                       |
| `set_reminder`          | Set a time-based alert/notification           |

### Time

| Tool       | Description                              |
| ---------- | ---------------------------------------- |
| `get_time` | Current time for any timezone or country |

## Project Structure

```
mcp-server-package/
├── server.py              # MCP server entry point (stdio transport)
├── requirements.txt       # Python dependencies
└── tools/
    ├── windows.py         # Window mgmt, scheduling, reminders, system info
    ├── config.py          # App paths, search engines, security settings
    ├── settings.json      # Configurable settings (app aliases, paths, etc.)
    └── modules/
        ├── application_manager.py   # App launching, web browsing
        ├── system_control.py        # Volume, brightness, power
        ├── desktop_interaction.py   # Screenshots, clipboard, notifications
        ├── file_operations.py       # Notes, file search, directory listing
        └── security.py             # Input validation, rate limiting, sandboxing
```

## Setup

```bash
cd mcp-server-package
python -m venv .packagevenv
.packagevenv\Scripts\activate       # Windows only (this server is Windows-specific)
pip install -r requirements.txt
```

> **Note:** This server uses Windows-specific APIs (`pywin32`, `pycaw`, `screen_brightness_control`, `win10toast`, etc.) and will not run on Linux/macOS.

## Running

### Standalone (for testing)

```bash
python server.py
# Communicates via stdio - type MCP messages to interact
```

### As a child process (typical usage)

MCP clients spawn this server as a subprocess:

```json
{
  "command": "python",
  "args": ["path/to/mcp-server-package/server.py"],
  "transport": "stdio"
}
```

## Security Model

All tools go through a multi-layered security system:

- **Input validation** - Arguments are sanitized against injection attacks
- **Rate limiting** - Prevents rapid-fire abuse of system-level operations
- **Path sandboxing** - File operations restricted to allowed directories
- **Command whitelisting** - Only pre-approved apps/commands can execute
- **Configurable** - Tune settings in `tools/settings.json`

## Configuration

Edit `tools/settings.json` to customize:

- **App aliases** - Map friendly names to executable paths (e.g., `"chrome"` -> `"C:/Program Files/Google/.../chrome.exe"`)
- **Search engines** - Configure which search engines are available
- **Default paths** - Screenshot directory, notes directory, etc.
- **Security rules** - Allowed directories, max file sizes, rate limits
