"""
Application management module for MCP Windows Assistant.

This module provides secure application launching and web operations with
proper validation and security controls.
"""

import webbrowser
import subprocess
from pathlib import Path

try:
    import pywhatkit
    _PYWHATKIT_AVAILABLE = True
except ImportError:
    _PYWHATKIT_AVAILABLE = False

try:
    from ..config import config
except ImportError:
    from config import config

from .security import (
    _secure_operation, _rate_limit, CommandValidator,
    SecurityError, logger
)


class ApplicationManager:
    """Handles secure application launching and management"""

    def __init__(self):
        self.validator = CommandValidator()

    @_secure_operation(require_validation=True, log_operation=True)
    @_rate_limit(max_calls=10, time_window=60)
    def open_application(self, app_name: str) -> str:
        """
        Opens a Windows application using a smart path resolver from the config.

        Args:
            app_name (str): The alias or name of the application to open.

        Returns:
            str: A confirmation message or an error string.
        """
        try:
            # Validate application name
            validated_app = self.validator.validate_application(app_name)

            # Get the application path from config
            app_path = config.get_app_path(validated_app)

            # Additional security check - ensure the path exists and is executable
            path_obj = Path(app_path)
            if not path_obj.exists():
                raise SecurityError(f"Application path does not exist: {app_path}")

            if not app_path.endswith('.exe'):
                # For system commands without .exe extension, ensure they're in allowed list
                if validated_app not in self.validator.ALLOWED_COMMANDS:
                    raise SecurityError(f"System command not allowed: {validated_app}")

            # Launch the application
            subprocess.Popen([app_path], shell=False)
            logger.info(f"Successfully launched application: {validated_app} at {app_path}")

            return f"Successfully launched: {validated_app} (Path: {app_path})"

        except SecurityError as e:
            logger.warning(f"Security error opening application '{app_name}': {e}")
            return f"Security error: {e}"
        except FileNotFoundError:
            logger.error(f"Application not found: '{app_name}'")
            return f"Application not found: '{app_name}'. Could not resolve path."
        except Exception as e:
            logger.error(f"Failed to open application '{app_name}': {e}")
            return f"Failed to open '{app_name}'. Error: {e}"


class WebManager:
    """Handles secure web operations"""

    # Whitelist of allowed domains for additional security
    ALLOWED_DOMAINS = {
        'google.com', 'bing.com', 'duckduckgo.com', 'youtube.com',
        'github.com', 'stackoverflow.com', 'gmail.com', 'microsoft.com',
        'wikipedia.org', 'w3schools.com'
    }

    @_secure_operation(require_validation=True, log_operation=True)
    @_rate_limit(max_calls=20, time_window=60)
    def open_webpage(self, url: str) -> str:
        """
        Opens a given URL in the default web browser with security validation.

        Args:
            url (str): The URL of the webpage to open.

        Returns:
            str: A confirmation message or error.
        """
        try:
            # Validate and sanitize URL
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url  # Prefer HTTPS

            # Basic URL validation
            if not self._is_valid_url(url):
                raise SecurityError("Invalid URL format")

            # Check against domain whitelist for additional security
            if not self._is_domain_allowed(url):
                logger.warning(f"Attempted to access non-whitelisted domain: {url}")
                return f"Domain not in whitelist. Please contact administrator to add: {url}"

            webbrowser.open(url)
            logger.info(f"Opened webpage: {url}")

            return f"Opened webpage: {url}"

        except SecurityError as e:
            return f"Security error: {e}"
        except Exception as e:
            logger.error(f"Failed to open webpage '{url}': {e}")
            return f"Failed to open webpage: {e}"

    @_secure_operation(require_validation=True, log_operation=True)
    @_rate_limit(max_calls=15, time_window=60)
    def search_web(self, query: str, engine: str = "google") -> str:
        """
        Performs a web search using a specified search engine from the config.

        Args:
            query (str): The search term.
            engine (str, optional): The search engine to use. Defaults to "google".

        Returns:
            str: A confirmation message or an error if the engine is not configured.
        """
        try:
            # Validate search engine
            engine_lower = engine.lower()
            search_url = config.get(f"web.search_engines.{engine_lower}")

            if not search_url:
                return f"Search engine '{engine}' not configured."

            # Construct search URL
            formatted_url = search_url.format(query)

            # Use the secure webpage opening method
            return self.open_webpage(formatted_url)

        except Exception as e:
            logger.error(f"Search error: {e}")
            return f"Search failed: {e}"

    @_secure_operation(require_validation=True, log_operation=True)
    @_rate_limit(max_calls=5, time_window=300)  # More restrictive for YouTube
    def play_song(self, song: str) -> str:
        """
        Searches for and plays a song on YouTube in the default browser.

        Args:
            song (str): The name of the song to play.

        Returns:
            str: A confirmation message or an error string if dependencies are missing.
        """
        if not _PYWHATKIT_AVAILABLE:
            return ("ERROR: The 'Play Song' feature requires the 'pywhatkit' library. "
                    "Please install it by running: pip install pywhatkit")

        try:
            # Additional validation for song names
            if len(song) > 100:
                raise SecurityError("Song name too long")

            if not song.strip():
                raise SecurityError("Song name cannot be empty")

            pywhatkit.playonyt(song)
            logger.info(f"Playing song on YouTube: {song}")

            return f"Playing song on YouTube: {song}"

        except SecurityError as e:
            return f"Security error: {e}"
        except Exception as e:
            logger.error(f"Failed to play song '{song}': {e}")
            return f"Failed to play song: {e}"

    def _is_valid_url(self, url: str) -> bool:
        """Validate URL format"""
        import re
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        return url_pattern.match(url) is not None

    def _is_domain_allowed(self, url: str) -> bool:
        """Check if domain is in whitelist"""
        try:
            from urllib.parse import urlparse
            domain = urlparse(url).netloc.lower()

            # Remove www. prefix if present
            if domain.startswith('www.'):
                domain = domain[4:]

            # Check if domain or its parent domain is in whitelist
            for allowed_domain in self.ALLOWED_DOMAINS:
                if domain == allowed_domain or domain.endswith('.' + allowed_domain):
                    return True

            return False

        except Exception:
            return False


# Global instances
app_manager = ApplicationManager()
web_manager = WebManager()


# Public functions for compatibility
def open_app(app_name: str) -> str:
    """
    Launches a desktop application executable. Use this to start or run programs like 'Firefox', 'Spotify', 'Calculator', 'Notepad', or 'Chrome'.
    Use this to open the app window, not to control content inside it.
    """
    return app_manager.open_application(app_name)


def open_webpage(url: str) -> str:
    """
    Navigates to a specific URL or website address (e.g., google.com, youtube.com). Use this to visit a page directly, NOT to search for information.
    """
    return web_manager.open_webpage(url)


def search_web(query: str, engine: str = "google") -> str:
    """
    Queries a search engine (Google/Bing) to find answers, pasta recipes, or information. Use this when looking for facts or unknown websites.
    """
    return web_manager.search_web(query, engine)


def play_song(song: str) -> str:
    """
    Searches for and plays a song on YouTube in the browser. Use this to listen to specific music or videos on the web.
    """
    return web_manager.play_song(song)
