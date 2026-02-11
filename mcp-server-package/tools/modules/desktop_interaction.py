"""
Desktop interaction module for MCP Windows Assistant.

This module provides secure desktop interaction capabilities including screenshots,
clipboard management, and notifications with proper security validation.
"""

import datetime
from typing import Literal, Optional

try:
    import pyautogui
    _PYAUTOGUI_AVAILABLE = True
except ImportError:
    _PYAUTOGUI_AVAILABLE = False

try:
    import pyperclip
    _PYPERCLIP_AVAILABLE = True
except ImportError:
    _PYPERCLIP_AVAILABLE = False

try:
    import win10toast
    _WIN10TOAST_AVAILABLE = True
except ImportError:
    _WIN10TOAST_AVAILABLE = False

try:
    from ..config import config
except ImportError:
    from config import config

from .security import (
    secure_operation, rate_limit, InputValidator,
    SecurityError, security_config, logger
)


class DesktopManager:
    """Handles secure desktop interaction operations"""

    def __init__(self):
        self.validator = InputValidator()

    @secure_operation(require_validation=True, log_operation=True)
    @rate_limit(max_calls=10, time_window=60)
    def take_screenshot(self, custom_path: str = "") -> str:
        """
        Takes a screenshot of the entire screen and saves it to a file with security validation.

        Args:
            custom_path (str, optional): A full custom path to save the screenshot.
                                        If empty, uses default path from config.

        Returns:
            str: The path where the screenshot was saved or an error message.
        """
        if not _PYAUTOGUI_AVAILABLE:
            return ("ERROR: The 'Screenshot' feature requires the 'PyAutoGUI' library. "
                    "Please install it by running: pip install PyAutoGUI")

        try:
            screenshot_img = pyautogui.screenshot()

            if custom_path:
                # Validate custom path
                validated_path = self.validator.validate_path(
                    custom_path,
                    security_config.allowed_directories
                )
                filepath = validated_path
            else:
                # Use default screenshot directory
                screenshot_dir = config.get("screenshot.directory")
                validated_dir = self.validator.validate_path(
                    screenshot_dir,
                    security_config.allowed_directories
                )

                # Create directory if it doesn't exist
                validated_dir.mkdir(parents=True, exist_ok=True)

                # Generate filename
                filename = datetime.datetime.now().strftime(
                    config.get("screenshot.filename_format", "screenshot_%Y-%m-%d_%H-%M-%S")
                )
                file_format = config.get("screenshot.file_format", "png")
                filepath = validated_dir / f"{filename}.{file_format}"

            # Save screenshot
            screenshot_img.save(str(filepath))
            logger.info(f"Screenshot saved successfully: {filepath}")

            return f"Screenshot saved to: {filepath}"

        except SecurityError as e:
            return f"Security error: {e}"
        except Exception as e:
            logger.error(f"Failed to take screenshot: {e}")
            return f"Failed to take screenshot: {e}"

    @secure_operation(require_validation=True, log_operation=True)
    @rate_limit(max_calls=30, time_window=60)
    def manage_clipboard(self, action: str, text: str = "") -> str:
        """
        Manages the system clipboard to get or set its content with security validation.

        Args:
            action (str): The action to perform ("GET" or "SET").
            text (str, optional): The text to set to the clipboard if action is "SET".

        Returns:
            str: The clipboard content for "GET" or a confirmation for "SET".
        """
        if not _PYPERCLIP_AVAILABLE:
            return ("ERROR: The 'Clipboard Manager' feature requires the 'pyperclip' library. "
                    "Please install it by running: pip install pyperclip")

        try:
            action_upper = action.upper()

            if action_upper == "GET":
                content = pyperclip.paste()

                # Limit output size for security
                if len(content) > 1000:
                    content = content[:1000] + "... (truncated for security)"

                logger.info("Clipboard content retrieved")
                return content

            elif action_upper == "SET":
                if not text:
                    raise SecurityError("Text cannot be empty for SET operation")

                # Validate text size
                if len(text) > 10000:  # 10KB limit
                    raise SecurityError("Text too large for clipboard (max 10KB)")

                pyperclip.copy(text)
                logger.info("Clipboard content set")

                # Return truncated confirmation for security
                display_text = text if len(text) <= 50 else text[:50] + "..."
                return f"Clipboard set to: {display_text}"

            else:
                return "Invalid action. Use GET or SET."

        except SecurityError as e:
            return f"Security error: {e}"
        except Exception as e:
            logger.error(f"Clipboard error: {e}")
            return f"Clipboard error: {e}"

    @secure_operation(require_validation=True, log_operation=True)
    @rate_limit(max_calls=5, time_window=60)
    def show_notification(self, title: str, message: str, duration: int = 5) -> str:
        """
        Displays a Windows toast notification with security validation.

        Args:
            title (str): The title of the notification.
            message (str): The main content/message of the notification.
            duration (int, optional): How long the notification stays on screen in seconds.
                                     Defaults to 5.

        Returns:
            str: A confirmation or error message.
        """
        if not _WIN10TOAST_AVAILABLE:
            return ("ERROR: The 'Notifications' feature requires the 'win10toast' library. "
                    "Please install it by running: pip install win10toast")

        try:
            # Validate inputs
            if not title.strip():
                raise SecurityError("Notification title cannot be empty")

            if not message.strip():
                raise SecurityError("Notification message cannot be empty")

            # Limit lengths for security
            if len(title) > 100:
                raise SecurityError("Notification title too long (max 100 characters)")

            if len(message) > 500:
                raise SecurityError("Notification message too long (max 500 characters)")

            # Validate duration
            if duration < 1 or duration > 30:
                raise SecurityError("Notification duration must be between 1 and 30 seconds")

            toaster = win10toast.ToastNotifier()
            toaster.show_toast(
                title=title,
                msg=message,
                duration=duration,
                threaded=True
            )

            logger.info(f"Notification displayed: '{title}' - '{message[:50]}...'")
            return f"Notification '{title}' sent."

        except SecurityError as e:
            return f"Security error: {e}"
        except Exception as e:
            logger.error(f"Failed to show notification: {e}")
            return f"Failed to show notification: {e}"


# Global instance
desktop_manager = DesktopManager()


# Public functions for compatibility
def screenshot() -> str:
    """Captures the entire screen and returns the saved file path."""
    return desktop_manager.take_screenshot()


def clipboard_manager(action: Literal["GET", "SET"], text_to_set: Optional[str] = "") -> str:
    """Gets or sets the system clipboard's text content."""
    return desktop_manager.manage_clipboard(action, text_to_set)


def show_notification(title: str, message: str, duration_seconds: int = 5) -> str:
    """Displays a desktop notification with a title and message."""
    return desktop_manager.show_notification(title, message, duration_seconds)
