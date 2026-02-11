"""
Configuration settings for Windows MCP Tools
"""
import os
import json
import glob
from pathlib import Path
from typing import Dict, Optional


def _find_executable(name: str) -> Optional[str]:
    """
    Finds an executable's full path by searching common locations.
    Handles wildcards for versioned paths (e.g., Discord).
    """
    # 1. Check if the name itself is a valid file path
    if Path(name).is_file() and name.endswith('.exe'):
        return name

    # 2. Search in common directories
    # Add the executable extension if not present
    exe_name = name if name.endswith(".exe") else f"{name}.exe"

    search_dirs = [
        os.environ.get("ProgramFiles", "C:\\Program Files"),
        os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)"),
        os.path.join(os.environ.get("LOCALAPPDATA", ""), name),
        os.path.join(os.environ.get("APPDATA", ""), name),
        os.path.join(os.environ.get("LOCALAPPDATA", ""), f"{name}\\app-*"),  # For apps like Discord
    ]

    for directory in search_dirs:
        # Use glob to handle wildcards in paths (like 'app-*')
        for expanded_dir in glob.glob(directory):
            # Recursively search for the executable in the directory
            for root, _, files in os.walk(expanded_dir):
                if exe_name in files:
                    return os.path.join(root, exe_name)

    # 3. If not found, return the original name and let the system PATH handle it
    return name


class Config:
    def __init__(self):
        self.config_file = Path(__file__).parent / "settings.json"
        self.load_config()

    def get_default_config(self) -> Dict:
        """Get default configuration settings"""
        username = os.getenv('USERNAME', 'User')
        return {
            "screenshot": {
                "directory": f"C:\\Users\\{username}\\Pictures\\Screenshots",
                "filename_format": "screenshot_%Y-%m-%d_%H-%M-%S",
                "file_format": "png"
            },
            "applications": {
                "common_apps": {
                    # System tools that are usually in PATH
                    "notepad": "notepad.exe",
                    "calculator": "calc.exe",
                    "paint": "mspaint.exe",
                    "explorer": "explorer.exe",
                    "cmd": "cmd.exe",
                    "powershell": "powershell.exe",
                    "task_manager": "taskmgr.exe",
                    "control_panel": "control.exe",
                    # Apps we will try to find
                    "chrome": "chrome.exe",
                    "firefox": "firefox.exe",
                    "edge": "msedge.exe",
                    "vs_code": "code.exe",
                    "spotify": "Spotify.exe",
                    "discord": "Discord.exe",
                    "steam": "steam.exe",
                    "word": "winword.exe",
                    "excel": "excel.exe",
                    "powerpoint": "powerpnt.exe"
                },
                "custom_apps": {}
            },
            "web": {
                "search_engines": {
                    "google": "https://www.google.com/search?q={}",
                    "bing": "https://www.bing.com/search?q={}",
                    "duckduckgo": "https://duckduckgo.com/?q={}",
                    "youtube": "https://www.youtube.com/results?search_query={}",
                    "github": "https://github.com/search?q={}"
                },
                "quick_links": {
                    "gmail": "https://mail.google.com",
                    "github": "https://github.com",
                    "stackoverflow": "https://stackoverflow.com"
                }
            },
            "system": {
                "volume": {"default_step": 10, "max_volume": 100, "min_volume": 0},
                "brightness": {"default_step": 10, "max_brightness": 100, "min_brightness": 0}
            },
            "files": {
                "downloads": f"C:\\Users\\{username}\\Downloads",
                "documents": f"C:\\Users\\{username}\\Documents",
                "desktop": f"C:\\Users\\{username}\\Desktop"
            },
            "productivity": {
                "notes_directory": f"C:\\Users\\{username}\\Documents\\MCP_Notes",
                "default_editor": "notepad.exe"
            }
        }

    def load_config(self):
        """Load configuration from file or create default"""
        try:
            if self.config_file.exists():
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    self.config = json.load(f)
                default_config = self.get_default_config()
                self.config = self._merge_configs(default_config, self.config)
            else:
                self.config = self.get_default_config()
            self.save_config()
        except Exception as e:
            print(f"Error loading config: {e}")
            self.config = self.get_default_config()

    def save_config(self):
        """Save configuration to file"""
        try:
            self.config_file.parent.mkdir(exist_ok=True)
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=4, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving config: {e}")

    def _merge_configs(self, default: Dict, user: Dict) -> Dict:
        """Recursively merge user config with defaults"""
        for key, value in default.items():
            if key not in user:
                user[key] = value
            elif isinstance(value, dict) and isinstance(user.get(key), dict):
                user[key] = self._merge_configs(value, user[key])
        return user

    def get(self, path: str, default=None):
        """Get configuration value using dot notation (e.g., 'screenshot.directory')"""
        keys = path.split('.')
        value = self.config
        try:
            for key in keys:
                value = value[key]
            return value
        except (KeyError, TypeError):
            return default

    def set(self, path: str, value):
        """Set configuration value using dot notation"""
        keys = path.split('.')
        config_ref = self.config
        for key in keys[:-1]:
            config_ref = config_ref.setdefault(key, {})
        config_ref[keys[-1]] = value
        self.save_config()

    def get_app_path(self, app_name: str) -> str:
        """
        Get application path by name.
        It intelligently finds the executable if not in PATH.
        """
        app_name_lower = app_name.lower()
        apps = self.list_apps()

        if app_name_lower in apps:
            # Find the executable path for the registered app
            return _find_executable(apps[app_name_lower])

        # If not a registered app, assume it's a direct command or path
        return _find_executable(app_name)

    def list_apps(self) -> Dict[str, str]:
        """Get all available applications"""
        apps = {}
        apps.update(self.config["applications"]["common_apps"])
        apps.update(self.config["applications"].get("custom_apps", {}))
        return {k.lower(): v for k, v in apps.items()}


# Global config instance
config = Config()
