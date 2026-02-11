"""
Flet MCP Chat Client
A cross-platform chat interface that connects to MCP servers using langchain-mcp-adapters
Supports: Desktop, Web, Mobile
"""

import flet as ft
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
import os
from dotenv import load_dotenv
import json
from pathlib import Path

# Load environment variables
load_dotenv()

# Configuration file path
CONFIG_FILE = Path(__file__).parent / "server_config.json"

# Default MCP server configuration
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
    }
}

# Available models organized by tier
MODEL_TIERS = {
    "Tier 1: Heavyweights (Complex/Multi-Step)": [
        "openai/gpt-oss-120b",
        "meta-llama/llama-3.3-70b-versatile",
        "qwen/qwen3-32b",
    ],
    "Tier 2: Next-Gen Efficient (Balanced)": [
        "meta-llama/llama-4-maverick-17b-128e-instruct",
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "moonshotai/kimi-k2-instruct",
        "moonshotai/kimi-k2-instruct-0905",
    ],
    "Tier 3: Speedsters (Simple/Fast)": [
        "openai/gpt-oss-20b",
        "meta-llama/llama-3.1-8b-instant",
    ]
}

# Flatten model options for dropdown
MODEL_OPTIONS = []
for tier_name, models in MODEL_TIERS.items():
    MODEL_OPTIONS.extend(models)

# Discord-like color scheme
COLORS = {
    "bg_dark": "#36393f",
    "bg_darker": "#2f3136",
    "bg_light": "#40444b",
    "accent": "#5865f2",
    "accent_hover": "#4752c4",
    "text_primary": "#ffffff",
    "text_secondary": "#b9bbbe",
    "text_muted": "#72767d",
    "success": "#3ba55d",
    "danger": "#ed4245",
    "warning": "#faa61a",
}


def load_server_config():
    """Load server configuration from file or use defaults"""
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return DEFAULT_SERVERS.copy()


def save_server_config(config):
    """Save server configuration to file"""
    try:
        with open(CONFIG_FILE, "w") as f:
            json.dump(config, f, indent=2)
        return True
    except Exception:
        return False


def get_active_server_config(server_config):
    """Get only enabled servers in the format expected by MultiServerMCPClient"""
    active_servers = {}
    for name, config in server_config.items():
        if config.get("enabled", True):
            server_entry = {}
            if "command" in config:
                server_entry["command"] = config["command"]
                server_entry["args"] = config.get("args", [])
                server_entry["transport"] = config.get("transport", "stdio")
            elif "url" in config:
                server_entry["url"] = config["url"]
                server_entry["transport"] = config.get("transport", "streamable_http")
                if "headers" in config:
                    server_entry["headers"] = config["headers"]

            if server_entry:
                active_servers[name] = server_entry
    return active_servers


def extract_response_info(response):
    """Extract AI message, reasoning, and metadata from agent response"""
    messages = response.get('messages', [])

    tool_calls = []
    ai_message = None

    for msg in messages:
        msg_type = msg.__class__.__name__
        if msg_type == "ToolMessage":
            tool_calls.append({
                "name": getattr(msg, 'name', 'Unknown Tool'),
                "content": str(getattr(msg, 'content', ''))[:500]
            })
        elif msg_type == "AIMessage":
            ai_message = msg

    result = {
        "content": "",
        "reasoning": "",
        "tool_calls": tool_calls,
        "token_usage": {},
        "model_name": "",
        "finish_reason": ""
    }

    if ai_message:
        result["content"] = getattr(ai_message, 'content', '')
        result["reasoning"] = ai_message.additional_kwargs.get('reasoning_content', '')

        meta = getattr(ai_message, 'response_metadata', {})
        result["token_usage"] = meta.get('token_usage', {})
        result["model_name"] = meta.get('model_name', '')
        result["finish_reason"] = meta.get('finish_reason', '')

    return result


class MCPChatClient:
    """Main MCP Chat Client Application"""

    def __init__(self, page: ft.Page):
        self.page = page
        self.setup_page()

        # State
        self.server_config = load_server_config()
        self.tools = []
        self.client_initialized = False
        self.agent = None
        self.messages = []  # Chat history
        self.mcp_client = None

        # Settings
        self.api_key = os.getenv("GROQ_API_KEY", "")
        self.selected_model = MODEL_OPTIONS[0]
        self.system_prompt = (
            "You are a helpful assistant. You can use multiple tools in sequence to solve complex tasks. "
            "If a tool's output suggests another tool should be used, do so. "
            "Always explain your reasoning and show intermediate steps. "
            "Keep responses concise and focused."
        )

        # UI Components
        self.chat_list = None
        self.message_input = None
        self.status_text = None
        self.server_list = None
        self.settings_dialog = None
        self.tool_count_text = None
        self.connect_btn = None

        # Build UI
        self.build_ui()

    def setup_page(self):
        """Configure page settings"""
        self.page.title = "MCP Chat Client"
        self.page.theme_mode = ft.ThemeMode.DARK
        self.page.padding = 0
        self.page.bgcolor = COLORS["bg_darker"]
        self.page.window.width = 1400
        self.page.window.height = 900
        self.page.window.min_width = 1000
        self.page.window.min_height = 700

    def build_ui(self):
        """Build the main UI layout"""
        # Sidebar with server list
        sidebar = self.build_sidebar()

        # Main chat area
        chat_area = self.build_chat_area()

        # Main layout
        main_layout = ft.Row(
            controls=[sidebar, chat_area],
            expand=True,
            spacing=0,
        )

        self.page.add(main_layout)
        self.page.overlay.append(self.build_settings_dialog())

    def build_sidebar(self):
        """Build the sidebar with server management"""
        # Header with settings button
        header = ft.Container(
            content=ft.Row([
                ft.Text(
                    "MCP SERVERS",
                    size=12,
                    weight=ft.FontWeight.BOLD,
                    color=COLORS["text_muted"],
                ),
                ft.IconButton(
                    icon=ft.Icons.SETTINGS_ROUNDED,
                    icon_size=20,
                    icon_color=COLORS["text_secondary"],
                    on_click=self.open_settings,
                    tooltip="Settings",
                ),
            ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
            padding=ft.padding.only(left=15, right=10, top=15, bottom=10),
        )

        # Server list
        self.server_list = ft.Column(
            controls=[],
            spacing=2,
            scroll=ft.ScrollMode.AUTO,
        )
        self.rebuild_server_list()

        # Add server button
        add_server_btn = ft.Container(
            content=ft.Row([
                ft.Icon(ft.Icons.ADD_ROUNDED, size=18, color=COLORS["success"]),
                ft.Text("Add Server", size=14, color=COLORS["text_secondary"]),
            ], spacing=8),
            padding=10,
            margin=ft.margin.only(left=10, right=10, bottom=10, top=5),
            border_radius=8,
            bgcolor=COLORS["bg_light"],
            ink=True,
            on_click=self.add_server_dialog,
        )

        # Connection status
        self.status_text = ft.Container(
            content=ft.Row([
                ft.Icon(ft.Icons.CIRCLE, size=10, color=COLORS["warning"]),
                ft.Text("Disconnected", size=12, color=COLORS["text_secondary"]),
            ], spacing=8),
            padding=10,
            margin=10,
            border_radius=8,
            bgcolor=COLORS["bg_light"],
        )

        # Connect button
        self.connect_btn = ft.Container(
            content=ft.Row([
                ft.Icon(ft.Icons.POWER_SETTINGS_NEW_ROUNDED, size=18, color=COLORS["text_primary"]),
                ft.Text("Connect", size=14, weight=ft.FontWeight.W_500, color=COLORS["text_primary"]),
            ], spacing=8, alignment=ft.MainAxisAlignment.CENTER),
            padding=12,
            margin=10,
            border_radius=8,
            bgcolor=COLORS["accent"],
            ink=True,
            on_click=self.toggle_connection,
            data={"connected": False},
        )

        # Assemble sidebar
        sidebar = ft.Container(
            content=ft.Column(
                controls=[
                    header,
                    ft.Divider(height=1, color=COLORS["bg_darker"]),
                    ft.Container(
                        content=self.server_list,
                        expand=True,
                    ),
                    add_server_btn,
                    self.status_text,
                    self.connect_btn,
                ],
                spacing=0,
                expand=True,
            ),
            width=280,
            bgcolor=COLORS["bg_dark"],
            expand=False,
        )

        return sidebar

    def rebuild_server_list(self):
        """Rebuild the server list UI"""
        self.server_list.controls.clear()

        for server_name, config in self.server_config.items():
            enabled = config.get("enabled", True)
            server_type = "Local" if "command" in config else "Remote"

            server_card = ft.Container(
                content=ft.Row([
                    ft.Column([
                        ft.Text(
                            server_name,
                            size=14,
                            weight=ft.FontWeight.W_500,
                            color=COLORS["text_primary"] if enabled else COLORS["text_muted"],
                        ),
                        ft.Text(
                            f"{server_type} • {config.get('description', 'No description')[:30]}",
                            size=11,
                            color=COLORS["text_muted"],
                        ),
                    ], spacing=2, expand=True),
                    ft.Row([
                        ft.IconButton(
                            icon=ft.Icons.EDIT_ROUNDED,
                            icon_size=16,
                            icon_color=COLORS["text_secondary"],
                            on_click=lambda e, name=server_name: self.edit_server(name),
                            tooltip="Edit",
                        ),
                        ft.Switch(
                            value=enabled,
                            active_color=COLORS["success"],
                            on_change=lambda e, name=server_name: self.toggle_server(name, e.control.value),
                        ),
                    ], spacing=0),
                ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                padding=ft.padding.only(left=15, right=10, top=8, bottom=8),
                border_radius=6,
                bgcolor=COLORS["bg_light"] if enabled else COLORS["bg_dark"],
                margin=ft.margin.only(left=10, right=10, bottom=2),
            )
            self.server_list.controls.append(server_card)

    def build_tool_count_badge(self):
        """Build the tool count badge"""
        self.tool_count_text = ft.Text(
            f"Tools: {len(self.tools)}",
            size=12,
            color=COLORS["text_secondary"],
        )
        return ft.Container(
            content=self.tool_count_text,
            padding=ft.padding.symmetric(horizontal=12, vertical=6),
            border_radius=12,
            bgcolor=COLORS["bg_light"],
        )

    def update_tool_count(self):
        """Update the tool count display"""
        if self.tool_count_text:
            self.tool_count_text.value = f"Tools: {len(self.tools)}"
            self.tool_count_text.update()

    def build_chat_area(self):
        """Build the main chat area with Discord-like styling"""
        # Chat header
        header = ft.Container(
            content=ft.Row([
                ft.Row([
                    ft.Icon(ft.Icons.TAG_ROUNDED, color=COLORS["text_muted"], size=24),
                    ft.Text(
                        "general-chat",
                        size=16,
                        weight=ft.FontWeight.BOLD,
                        color=COLORS["text_primary"],
                    ),
                ], spacing=8),
                ft.Row([
                    ft.IconButton(
                        icon=ft.Icons.DELETE_OUTLINE_ROUNDED,
                        icon_size=20,
                        icon_color=COLORS["text_secondary"],
                        on_click=self.clear_chat,
                        tooltip="Clear chat",
                    ),
                    self.build_tool_count_badge(),
                ], spacing=10),
            ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
            padding=15,
            bgcolor=COLORS["bg_dark"],
            border=ft.border.only(bottom=ft.BorderSide(1, COLORS["bg_darker"])),
        )

        # Chat messages list
        self.chat_list = ft.ListView(
            controls=[],
            expand=True,
            spacing=8,
            padding=20,
            auto_scroll=False,
        )

        # Message input area
        self.message_input = ft.TextField(
            hint_text="Message #general-chat",
            hint_style=ft.TextStyle(color=COLORS["text_muted"]),
            border=ft.InputBorder.NONE,
            text_style=ft.TextStyle(color=COLORS["text_primary"], size=14),
            expand=True,
            multiline=True,
            min_lines=1,
            max_lines=6,
            on_submit=self.send_message,
            shift_enter=True,
        )

        send_btn = ft.Container(
            content=ft.Icon(ft.Icons.SEND_ROUNDED, size=20, color=COLORS["text_primary"]),
            padding=10,
            border_radius=20,
            bgcolor=COLORS["accent"],
            ink=True,
            on_click=self.send_message,
        )

        input_area = ft.Container(
            content=ft.Row([
                ft.Container(
                    content=self.message_input,
                    expand=True,
                    padding=ft.padding.only(left=15, right=10, top=10, bottom=10),
                    border_radius=8,
                    bgcolor=COLORS["bg_light"],
                ),
                send_btn,
            ], spacing=10),
            padding=20,
            bgcolor=COLORS["bg_dark"],
        )

        # Assemble chat area
        chat_area = ft.Container(
            content=ft.Column([
                header,
                ft.Container(
                    content=self.chat_list,
                    expand=True,
                    bgcolor=COLORS["bg_darker"],
                ),
                input_area,
            ], spacing=0, expand=True),
            expand=True,
        )

        return chat_area

    def create_message_bubble(self, role: str, content: str, reasoning: str = None,
                              tool_calls: list = None, token_usage: dict = None):
        """Create a Discord-like chat message"""
        is_user = role == "user"

        # Avatar
        avatar = ft.Container(
            content=ft.Text(
                "U" if is_user else "AI",
                size=14,
                weight=ft.FontWeight.BOLD,
                color=COLORS["text_primary"],
            ),
            width=40,
            height=40,
            border_radius=20,
            bgcolor=COLORS["accent"] if is_user else COLORS["success"],
            alignment=ft.alignment.center,
        )

        # Username and timestamp
        username_row = ft.Row([
            ft.Text(
                "You" if is_user else "AI Assistant",
                size=14,
                weight=ft.FontWeight.W_500,
                color=COLORS["accent"] if is_user else COLORS["success"],
            ),
            ft.Text(
                "just now",
                size=11,
                color=COLORS["text_muted"],
            ),
        ], spacing=10)

        # Message content with improved markdown rendering
        message_content = ft.Markdown(
            content,
            selectable=True,
            extension_set=ft.MarkdownExtensionSet.GITHUB_WEB,
            on_tap_link=lambda e: self.page.launch_url(e.data),
            code_theme="monokai",
            auto_follow_links=False,
            # Prevent text overflow
            expand=True,
        )

        content_column = ft.Column(
            [username_row, message_content],
            spacing=5,
            expand=True,
            scroll=ft.ScrollMode.AUTO,
        )

        # Add tool calls and reasoning if present
        if tool_calls:
            tool_container = ft.Container(
                content=ft.Column([
                    ft.Text(f"⚙️ Used {len(tool_calls)} tool(s)", size=12, color=COLORS["text_muted"]),
                    *[ft.Container(
                        content=ft.Column([
                            ft.Text(tc['name'], size=12, weight=ft.FontWeight.W_500, color=COLORS["text_secondary"]),
                            ft.Text(tc['content'][:150], size=11, color=COLORS["text_muted"]),
                        ], spacing=4),
                        padding=8,
                        border_radius=4,
                        bgcolor=COLORS["bg_light"],
                        margin=ft.margin.only(top=4),
                    ) for tc in tool_calls[:3]]
                ], spacing=4),
                padding=10,
                border_radius=6,
                bgcolor=COLORS["bg_dark"],
                margin=ft.margin.only(top=8),
            )
            content_column.controls.append(tool_container)

        if token_usage:
            token_text = ft.Text(
                f"💬 {token_usage.get('total_tokens', 0)} tokens",
                size=10,
                color=COLORS["text_muted"],
            )
            content_column.controls.append(ft.Container(content=token_text, margin=ft.margin.only(top=4)))

        # Message row with proper width constraints
        message_row = ft.Row(
            controls=[avatar, content_column],
            spacing=12,
            alignment=ft.MainAxisAlignment.START,
            vertical_alignment=ft.CrossAxisAlignment.START,
            expand=True,
        )

        return ft.Container(
            content=message_row,
            padding=ft.padding.only(left=15, right=15, top=8, bottom=8),
            border_radius=0,
            on_hover=lambda e: self.on_message_hover(e),
            expand=False,
        )

    def on_message_hover(self, e):
        """Handle message hover effect"""
        if e.data == "true":
            e.control.bgcolor = COLORS["bg_light"]
        else:
            e.control.bgcolor = None
        e.control.update()

    def build_settings_dialog(self):
        """Build settings dialog"""
        api_key_field = ft.TextField(
            label="Groq API Key",
            value=self.api_key,
            password=True,
            can_reveal_password=True,
            border_color=COLORS["text_muted"],
            focused_border_color=COLORS["accent"],
            label_style=ft.TextStyle(color=COLORS["text_secondary"]),
            text_style=ft.TextStyle(color=COLORS["text_primary"]),
        )

        # Build model dropdown with tier separators
        model_options = []
        for tier_name, models in MODEL_TIERS.items():
            # Add tier header as disabled option
            model_options.append(ft.dropdown.Option(
                key=f"__tier_{tier_name}",
                text=tier_name,
                disabled=True,
            ))
            # Add models in this tier
            for model in models:
                model_options.append(ft.dropdown.Option(model))

        model_dropdown = ft.Dropdown(
            label="Select Model",
            value=self.selected_model,
            options=model_options,
            border_color=COLORS["text_muted"],
            focused_border_color=COLORS["accent"],
            label_style=ft.TextStyle(color=COLORS["text_secondary"]),
            text_style=ft.TextStyle(color=COLORS["text_primary"]),
        )

        system_prompt_field = ft.TextField(
            label="System Prompt",
            value=self.system_prompt,
            multiline=True,
            min_lines=4,
            max_lines=8,
            border_color=COLORS["text_muted"],
            focused_border_color=COLORS["accent"],
            label_style=ft.TextStyle(color=COLORS["text_secondary"]),
            text_style=ft.TextStyle(color=COLORS["text_primary"]),
        )

        def save_settings(e):
            self.api_key = api_key_field.value
            self.selected_model = model_dropdown.value
            self.system_prompt = system_prompt_field.value
            self.settings_dialog.open = False
            self.page.update()
            self.show_snackbar("Settings saved!", COLORS["success"])

        self.settings_dialog = ft.AlertDialog(
            modal=True,
            title=ft.Text("Settings", color=COLORS["text_primary"]),
            content=ft.Container(
                content=ft.Column([
                    ft.Text("API Configuration", size=14, weight=ft.FontWeight.BOLD, color=COLORS["text_secondary"]),
                    api_key_field,
                    ft.Divider(color=COLORS["bg_light"]),
                    ft.Text("Model Selection", size=14, weight=ft.FontWeight.BOLD, color=COLORS["text_secondary"]),
                    model_dropdown,
                    ft.Divider(color=COLORS["bg_light"]),
                    ft.Text("System Behavior", size=14, weight=ft.FontWeight.BOLD, color=COLORS["text_secondary"]),
                    system_prompt_field,
                ], spacing=15, scroll=ft.ScrollMode.AUTO),
                width=600,
                padding=20,
            ),
            bgcolor=COLORS["bg_dark"],
            actions=[
                ft.TextButton(
                    "Cancel",
                    on_click=lambda e: setattr(self.settings_dialog, 'open', False) or self.page.update(),
                    style=ft.ButtonStyle(color=COLORS["text_secondary"]),
                ),
                ft.ElevatedButton(
                    "Save",
                    on_click=save_settings,
                    bgcolor=COLORS["accent"],
                    color=COLORS["text_primary"],
                ),
            ],
            actions_alignment=ft.MainAxisAlignment.END,
        )

        return self.settings_dialog

    def open_settings(self, e):
        """Open settings dialog"""
        self.settings_dialog.open = True
        self.page.update()

    def add_server_dialog(self, e):
        """Show dialog to add new server"""
        server_name_field = ft.TextField(
            label="Server Name",
            hint_text="my_server",
            border_color=COLORS["text_muted"],
            focused_border_color=COLORS["accent"],
            label_style=ft.TextStyle(color=COLORS["text_secondary"]),
            text_style=ft.TextStyle(color=COLORS["text_primary"]),
            color=COLORS["text_primary"],
        )

        server_type = ft.Dropdown(
            label="Server Type",
            options=[
                ft.dropdown.Option("stdio", "Local (stdio)"),
                ft.dropdown.Option("streamable_http", "Remote (HTTP)"),
            ],
            value="stdio",
            border_color=COLORS["text_muted"],
            focused_border_color=COLORS["accent"],
            label_style=ft.TextStyle(color=COLORS["text_secondary"]),
            text_style=ft.TextStyle(color=COLORS["text_primary"]),
            color=COLORS["text_primary"],
        )

        command_field = ft.TextField(
            label="Command",
            hint_text="python",
            value="python",
            border_color=COLORS["text_muted"],
            focused_border_color=COLORS["accent"],
            label_style=ft.TextStyle(color=COLORS["text_secondary"]),
            text_style=ft.TextStyle(color=COLORS["text_primary"]),
            color=COLORS["text_primary"],
        )

        args_field = ft.TextField(
            label="Arguments (comma-separated)",
            hint_text="server.py, --port, 8000",
            border_color=COLORS["text_muted"],
            focused_border_color=COLORS["accent"],
            label_style=ft.TextStyle(color=COLORS["text_secondary"]),
            text_style=ft.TextStyle(color=COLORS["text_primary"]),
            color=COLORS["text_primary"],
        )

        url_field = ft.TextField(
            label="URL",
            hint_text="http://localhost:8000/mcp",
            border_color=COLORS["text_muted"],
            focused_border_color=COLORS["accent"],
            label_style=ft.TextStyle(color=COLORS["text_secondary"]),
            text_style=ft.TextStyle(color=COLORS["text_primary"]),
            color=COLORS["text_primary"],
            visible=False,
        )

        desc_field = ft.TextField(
            label="Description",
            hint_text="Server description",
            border_color=COLORS["text_muted"],
            focused_border_color=COLORS["accent"],
            label_style=ft.TextStyle(color=COLORS["text_secondary"]),
            text_style=ft.TextStyle(color=COLORS["text_primary"]),
            color=COLORS["text_primary"],
        )

        fields_container = ft.Column([command_field, args_field], spacing=10)

        def on_type_change(e):
            if e.control.value == "streamable_http":
                fields_container.controls = [url_field]
                url_field.visible = True
            else:
                fields_container.controls = [command_field, args_field]
                url_field.visible = False
            dialog.update()

        server_type.on_change = on_type_change

        def add_server(e):
            name = server_name_field.value.strip()
            if not name:
                self.show_snackbar("Server name required!", COLORS["danger"])
                return

            if name in self.server_config:
                self.show_snackbar("Server already exists!", COLORS["warning"])
                return

            if server_type.value == "stdio":
                args = [a.strip() for a in args_field.value.split(",") if a.strip()]
                self.server_config[name] = {
                    "command": command_field.value,
                    "args": args,
                    "transport": "stdio",
                    "enabled": True,
                    "description": desc_field.value,
                }
            else:
                self.server_config[name] = {
                    "url": url_field.value,
                    "transport": "streamable_http",
                    "enabled": True,
                    "description": desc_field.value,
                }

            save_server_config(self.server_config)
            self.rebuild_server_list()
            self.page.close(dialog)
            self.show_snackbar(f"Added server: {name}", COLORS["success"])

        def close_dialog(e):
            self.page.close(dialog)

        dialog = ft.AlertDialog(
            modal=True,
            title=ft.Text("Add MCP Server", color=COLORS["text_primary"], size=18, weight=ft.FontWeight.BOLD),
            content=ft.Container(
                content=ft.Column([
                    server_name_field,
                    server_type,
                    fields_container,
                    desc_field,
                ], spacing=15, tight=True),
                width=500,
                height=400,
                padding=20,
            ),
            bgcolor=COLORS["bg_dark"],
            actions=[
                ft.TextButton(
                    "Cancel",
                    on_click=close_dialog,
                    style=ft.ButtonStyle(color=COLORS["text_secondary"]),
                ),
                ft.ElevatedButton(
                    "Add Server",
                    on_click=add_server,
                    bgcolor=COLORS["success"],
                    color=COLORS["text_primary"],
                ),
            ],
            actions_alignment=ft.MainAxisAlignment.END,
        )

        self.page.open(dialog)

    def edit_server(self, server_name: str):
        """Edit existing server"""
        config = self.server_config[server_name]

        desc_field = ft.TextField(
            label="Description",
            value=config.get("description", ""),
            border_color=COLORS["text_muted"],
            focused_border_color=COLORS["accent"],
            label_style=ft.TextStyle(color=COLORS["text_secondary"]),
            text_style=ft.TextStyle(color=COLORS["text_primary"]),
            color=COLORS["text_primary"],
        )

        # Show server details
        server_type = "Local (stdio)" if "command" in config else "Remote (HTTP)"
        server_details = []

        if "command" in config:
            server_details.append(ft.Text(f"Command: {config.get('command', '')}", color=COLORS["text_secondary"]))
            server_details.append(ft.Text(f"Args: {', '.join(config.get('args', []))}", color=COLORS["text_secondary"]))
        else:
            server_details.append(ft.Text(f"URL: {config.get('url', '')}", color=COLORS["text_secondary"]))

        def save_edit(e):
            config["description"] = desc_field.value
            save_server_config(self.server_config)
            self.rebuild_server_list()
            self.page.close(dialog)
            self.show_snackbar(f"Updated server: {server_name}", COLORS["success"])

        def delete_server(e):
            del self.server_config[server_name]
            save_server_config(self.server_config)
            self.rebuild_server_list()
            self.page.close(dialog)
            self.show_snackbar(f"Deleted server: {server_name}", COLORS["danger"])

        def close_dialog(e):
            self.page.close(dialog)

        dialog = ft.AlertDialog(
            modal=True,
            title=ft.Text(f"Edit Server: {server_name}", color=COLORS["text_primary"], size=18, weight=ft.FontWeight.BOLD),
            content=ft.Container(
                content=ft.Column([
                    ft.Container(
                        content=ft.Column([
                            ft.Text("Server Type:", size=12, weight=ft.FontWeight.BOLD, color=COLORS["text_secondary"]),
                            ft.Text(server_type, color=COLORS["text_primary"]),
                            ft.Divider(color=COLORS["bg_light"]),
                        ] + server_details + [
                            ft.Divider(color=COLORS["bg_light"]),
                        ], spacing=8),
                        padding=10,
                        border_radius=8,
                        bgcolor=COLORS["bg_light"],
                    ),
                    desc_field,
                ], spacing=15, tight=True),
                width=450,
                padding=20,
            ),
            bgcolor=COLORS["bg_dark"],
            actions=[
                ft.TextButton(
                    "Delete",
                    on_click=delete_server,
                    style=ft.ButtonStyle(color=COLORS["danger"]),
                ),
                ft.TextButton(
                    "Cancel",
                    on_click=close_dialog,
                    style=ft.ButtonStyle(color=COLORS["text_secondary"]),
                ),
                ft.ElevatedButton(
                    "Save",
                    on_click=save_edit,
                    bgcolor=COLORS["accent"],
                    color=COLORS["text_primary"],
                ),
            ],
            actions_alignment=ft.MainAxisAlignment.END,
        )

        self.page.open(dialog)

    def toggle_server(self, server_name: str, enabled: bool):
        """Toggle server enabled state"""
        self.server_config[server_name]["enabled"] = enabled
        save_server_config(self.server_config)
        # Immediately update just this card instead of rebuilding entire list
        for control in self.server_list.controls:
            if isinstance(control, ft.Container):
                # Find the text with server name
                try:
                    server_col = control.content.controls[0]
                    name_text = server_col.controls[0]
                    if name_text.value == server_name:
                        control.bgcolor = COLORS["bg_light"] if enabled else COLORS["bg_dark"]
                        name_text.color = COLORS["text_primary"] if enabled else COLORS["text_muted"]
                        control.update()
                        break
                except Exception:
                    pass

    async def toggle_connection(self, e):
        """Toggle between connect and disconnect"""
        is_connected = self.connect_btn.data.get("connected", False)

        if is_connected:
            # Disconnect
            await self.disconnect_from_servers()
        else:
            # Connect
            await self.connect_to_servers(e)

    async def disconnect_from_servers(self):
        """Disconnect from MCP servers"""
        self.client_initialized = False
        self.agent = None
        self.tools = []
        self.mcp_client = None

        # Update button
        self.connect_btn.content = ft.Row([
            ft.Icon(ft.Icons.POWER_SETTINGS_NEW_ROUNDED, size=18, color=COLORS["text_primary"]),
            ft.Text("Connect", size=14, weight=ft.FontWeight.W_500, color=COLORS["text_primary"]),
        ], spacing=8, alignment=ft.MainAxisAlignment.CENTER)
        self.connect_btn.bgcolor = COLORS["accent"]
        self.connect_btn.data["connected"] = False

        # Update status
        self.status_text.content = ft.Row([
            ft.Icon(ft.Icons.CIRCLE, size=10, color=COLORS["warning"]),
            ft.Text("Disconnected", size=12, color=COLORS["text_secondary"]),
        ], spacing=8)

        # Update tool count
        self.update_tool_count()

        self.page.update()
        self.show_snackbar("Disconnected from servers", COLORS["warning"])

    def scroll_to_bottom(self):
        """Scroll chat list to bottom"""
        if self.chat_list:
            self.chat_list.scroll_to(offset=-1, duration=300)

    async def connect_to_servers(self, e):
        """Connect to MCP servers"""
        # Update status
        self.status_text.content = ft.Row([
            ft.ProgressRing(width=10, height=10, stroke_width=2, color=COLORS["warning"]),
            ft.Text("Connecting...", size=12, color=COLORS["text_secondary"]),
        ], spacing=8)
        self.page.update()

        try:
            active_config = get_active_server_config(self.server_config)
            if not active_config:
                self.status_text.content = ft.Row([
                    ft.Icon(ft.Icons.ERROR_OUTLINE_ROUNDED, size=10, color=COLORS["danger"]),
                    ft.Text("No servers enabled", size=12, color=COLORS["text_secondary"]),
                ], spacing=8)
                self.page.update()
                return

            # Initialize MCP client
            self.mcp_client = MultiServerMCPClient(active_config)
            self.tools = await self.mcp_client.get_tools()
            self.client_initialized = True

            # Create agent if API key is available
            if self.api_key:
                model = ChatGroq(
                    model=self.selected_model,
                    api_key=self.api_key,
                    max_tokens=4000
                )
                self.agent = create_react_agent(
                    model=model,
                    tools=self.tools,
                    prompt=self.system_prompt
                )

            # Update status
            self.status_text.content = ft.Row([
                ft.Icon(ft.Icons.CHECK_CIRCLE_ROUNDED, size=10, color=COLORS["success"]),
                ft.Text(f"Connected ({len(self.tools)} tools)", size=12, color=COLORS["text_secondary"]),
            ], spacing=8)

            # Update button to show disconnect option
            self.connect_btn.content = ft.Row([
                ft.Icon(ft.Icons.POWER_OFF_ROUNDED, size=18, color=COLORS["text_primary"]),
                ft.Text("Disconnect", size=14, weight=ft.FontWeight.W_500, color=COLORS["text_primary"]),
            ], spacing=8, alignment=ft.MainAxisAlignment.CENTER)
            self.connect_btn.bgcolor = COLORS["danger"]
            self.connect_btn.data["connected"] = True

            # Update tool count in header
            self.update_tool_count()

            self.show_snackbar(f"Connected! {len(self.tools)} tools available.", COLORS["success"])

        except Exception as ex:
            self.status_text.content = ft.Row([
                ft.Icon(ft.Icons.ERROR_OUTLINE_ROUNDED, size=10, color=COLORS["danger"]),
                ft.Text("Connection failed", size=12, color=COLORS["text_secondary"]),
            ], spacing=8)
            self.client_initialized = False
            self.show_snackbar(f"Error: {str(ex)}", COLORS["danger"])

        self.page.update()

    async def send_message(self, e):
        """Send a message and get AI response"""
        message = self.message_input.value.strip()
        if not message:
            return

        # Validation
        if not self.client_initialized:
            self.show_snackbar("Please connect to servers first!", COLORS["warning"])
            return

        if not self.api_key:
            self.show_snackbar("Please enter your API key in settings!", COLORS["warning"])
            return

        # Recreate agent if needed
        if self.agent is None:
            model = ChatGroq(
                model=self.selected_model,
                api_key=self.api_key,
                max_tokens=4000
            )
            self.agent = create_react_agent(
                model=model,
                tools=self.tools,
                prompt=self.system_prompt
            )

        # Clear input
        self.message_input.value = ""
        self.page.update()

        # Add user message
        self.messages.append({"role": "user", "content": message})
        user_bubble = self.create_message_bubble("user", message)
        self.chat_list.controls.append(user_bubble)
        self.page.update()

        # Scroll to bottom
        self.scroll_to_bottom()

        # Add typing indicator
        typing_indicator = ft.Container(
            content=ft.Row([
                ft.Container(
                    content=ft.Text(
                        "AI",
                        size=14,
                        weight=ft.FontWeight.BOLD,
                        color=COLORS["text_primary"],
                    ),
                    width=40,
                    height=40,
                    border_radius=20,
                    bgcolor=COLORS["success"],
                    alignment=ft.alignment.center,
                ),
                ft.Column([
                    ft.Text("AI Assistant", size=14, weight=ft.FontWeight.W_500, color=COLORS["success"]),
                    ft.Row([
                        ft.ProgressRing(width=12, height=12, stroke_width=2),
                        ft.Text("Thinking...", size=13, color=COLORS["text_muted"], italic=True),
                    ], spacing=8),
                ], spacing=5),
            ], spacing=12),
            padding=ft.padding.only(left=15, right=15, top=8, bottom=8),
        )
        self.chat_list.controls.append(typing_indicator)
        self.page.update()

        # Scroll to bottom
        self.scroll_to_bottom()

        try:
            # Build message history
            agent_messages = []
            for msg in self.messages:
                agent_messages.append({"role": msg["role"], "content": msg["content"]})

            # Run agent
            response = await self.agent.ainvoke({"messages": agent_messages})
            print("Agent response:", response)

            # Extract response info
            result = extract_response_info(response)

            # Remove typing indicator
            self.chat_list.controls.remove(typing_indicator)

            # Add assistant message
            assistant_bubble = self.create_message_bubble(
                "assistant",
                result["content"],
                result.get("reasoning"),
                result.get("tool_calls"),
                result.get("token_usage"),
            )
            self.chat_list.controls.append(assistant_bubble)

            # Store in history
            self.messages.append({
                "role": "assistant",
                "content": result["content"],
                "reasoning": result.get("reasoning"),
                "tool_calls": result.get("tool_calls"),
                "token_usage": result.get("token_usage"),
            })

            # Scroll to bottom
            self.page.update()
            self.scroll_to_bottom()

        except Exception as ex:
            # Remove typing indicator
            if typing_indicator in self.chat_list.controls:
                self.chat_list.controls.remove(typing_indicator)

            # Add error message
            error_bubble = self.create_message_bubble(
                "assistant",
                f"❌ **Error occurred**\n\n```\n{str(ex)}\n```"
            )
            self.chat_list.controls.append(error_bubble)
            self.show_snackbar(f"Error: {str(ex)[:50]}", COLORS["danger"])

        self.page.update()

    def clear_chat(self, e):
        """Clear chat history"""
        self.messages.clear()
        self.chat_list.controls.clear()
        self.page.update()
        self.show_snackbar("Chat cleared!", COLORS["accent"])

    def show_snackbar(self, message: str, color: str = COLORS["accent"]):
        """Show a snackbar notification"""
        self.page.snack_bar = ft.SnackBar(
            content=ft.Text(message, color=COLORS["text_primary"]),
            bgcolor=color,
            duration=3000,
        )
        self.page.snack_bar.open = True
        self.page.update()


async def main(page: ft.Page):
    """Main entry point"""
    app = MCPChatClient(page)


# Run the app
if __name__ == "__main__":
    # ft.app(target=main)  # Desktop mode
    ft.app(target=main, view=ft.WEB_BROWSER)  # Web mode
    # ft.app(target=main, view=ft.FLET_APP_HIDDEN)  # Background mode
