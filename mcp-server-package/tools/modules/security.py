"""
Security module for MCP Windows Assistant.

This module provides security utilities including input validation, sanitization,
path validation, and secure operation decorators to prevent common security vulnerabilities.
"""

import os
import re
import logging
import functools
from pathlib import Path
from typing import List, Callable, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SecurityError(Exception):
    """Custom exception for security-related errors"""
    pass


class InputValidator:
    """Handles input validation and sanitization"""

    # Patterns for common injection attempts
    DANGEROUS_PATTERNS = [
        r'[;&|`$()]',  # Command injection characters
        r'\.\.[/\\]',  # Path traversal
        r'^\s*\|',     # Pipe at start
        r'>\s*[/\\]',  # Redirect to file
        r'<\s*[/\\]',  # Input redirect
    ]

    SAFE_FILENAME_PATTERN = re.compile(r'^[a-zA-Z0-9._\-\s]+$')
    SAFE_PATH_PATTERN = re.compile(r'^[a-zA-Z0-9._\-\s/\\:]+$')

    @classmethod
    def sanitize_string(cls, input_str: str, max_length: int = 1000) -> str:
        """
        Sanitize a string input by removing dangerous characters.

        Args:
            input_str (str): The input string to sanitize
            max_length (int): Maximum allowed length

        Returns:
            str: Sanitized string

        Raises:
            SecurityError: If input contains dangerous patterns
        """
        if not isinstance(input_str, str):
            raise SecurityError("Input must be a string")

        if len(input_str) > max_length:
            raise SecurityError(f"Input too long (max {max_length} characters)")

        # Check for dangerous patterns
        for pattern in cls.DANGEROUS_PATTERNS:
            if re.search(pattern, input_str, re.IGNORECASE):
                logger.warning(f"Dangerous pattern detected: {pattern} in input: {input_str[:50]}...")
                raise SecurityError("Input contains potentially dangerous characters")

        return input_str.strip()

    @classmethod
    def validate_filename(cls, filename: str) -> str:
        """
        Validate and sanitize a filename.

        Args:
            filename (str): The filename to validate

        Returns:
            str: Validated filename

        Raises:
            SecurityError: If filename is invalid
        """
        if not filename or len(filename) > 255:
            raise SecurityError("Invalid filename length")

        if not cls.SAFE_FILENAME_PATTERN.match(filename):
            raise SecurityError("Filename contains invalid characters")

        # Check for reserved Windows filenames
        reserved_names = {
            'CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4',
            'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2',
            'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
        }

        if filename.upper().split('.')[0] in reserved_names:
            raise SecurityError("Filename uses reserved Windows name")

        return filename

    @classmethod
    def validate_path(cls, path: str, allowed_roots: List[str] = None) -> Path:
        """
        Validate and normalize a file path.

        Args:
            path (str): The path to validate
            allowed_roots (List[str]): List of allowed root directories

        Returns:
            Path: Validated and normalized path

        Raises:
            SecurityError: If path is invalid or outside allowed roots
        """
        if not path:
            raise SecurityError("Path cannot be empty")

        # Normalize the path to prevent traversal attacks
        normalized_path = Path(os.path.normpath(path)).resolve()

        # Check if path contains traversal attempts
        if '..' in str(normalized_path):
            raise SecurityError("Path traversal attempt detected")

        # If allowed roots are specified, ensure path is within them
        if allowed_roots:
            allowed = False
            for root in allowed_roots:
                root_path = Path(root).resolve()
                try:
                    normalized_path.relative_to(root_path)
                    allowed = True
                    break
                except ValueError:
                    continue

            if not allowed:
                raise SecurityError(f"Path outside allowed directories: {normalized_path}")

        return normalized_path


class CommandValidator:
    """Handles validation of system commands"""

    # Whitelist of allowed commands
    ALLOWED_COMMANDS = {
        'shutdown', 'schtasks', 'tasklist', 'taskkill', 'dir', 'type',
        'notepad.exe', 'calc.exe', 'mspaint.exe', 'explorer.exe',
        'cmd.exe', 'powershell.exe', 'taskmgr.exe', 'control.exe'
    }

    # Whitelist of allowed applications (extensible via config)
    ALLOWED_APPLICATIONS = {
        'notepad', 'calculator', 'paint', 'explorer', 'cmd', 'powershell',
        'task_manager', 'control_panel', 'chrome', 'firefox', 'edge',
        'vs_code', 'spotify', 'discord', 'steam', 'word', 'excel', 'powerpoint'
    }

    @classmethod
    def validate_command(cls, command: str) -> str:
        """
        Validate a system command against whitelist.

        Args:
            command (str): Command to validate

        Returns:
            str: Validated command

        Raises:
            SecurityError: If command is not allowed
        """
        command = command.strip().lower()

        if not command:
            raise SecurityError("Command cannot be empty")

        # Extract base command (first word)
        base_command = command.split()[0]

        if base_command not in cls.ALLOWED_COMMANDS:
            logger.warning(f"Attempted to execute disallowed command: {base_command}")
            raise SecurityError(f"Command '{base_command}' is not allowed")

        return command

    @classmethod
    def validate_application(cls, app_name: str) -> str:
        """
        Validate an application name against whitelist.

        Args:
            app_name (str): Application name to validate

        Returns:
            str: Validated application name

        Raises:
            SecurityError: If application is not allowed
        """
        app_name = app_name.strip().lower()

        if not app_name:
            raise SecurityError("Application name cannot be empty")

        if app_name not in cls.ALLOWED_APPLICATIONS:
            logger.warning(f"Attempted to open disallowed application: {app_name}")
            raise SecurityError(f"Application '{app_name}' is not allowed")

        return app_name


def secure_operation(require_validation: bool = True, log_operation: bool = True):
    """
    Decorator for securing operations with input validation and logging.

    Args:
        require_validation (bool): Whether to validate string inputs
        log_operation (bool): Whether to log the operation

    Returns:
        Callable: Decorated function
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            if log_operation:
                logger.info(f"Executing secured operation: {func.__name__}")

            try:
                # Validate string arguments if required
                if require_validation:
                    validated_args = []
                    for arg in args:
                        if isinstance(arg, str):
                            validated_args.append(InputValidator.sanitize_string(arg))
                        else:
                            validated_args.append(arg)
                    args = tuple(validated_args)

                    # Validate string keyword arguments
                    for key, value in kwargs.items():
                        if isinstance(value, str):
                            kwargs[key] = InputValidator.sanitize_string(value)

                result = func(*args, **kwargs)

                if log_operation:
                    logger.info(f"Successfully completed operation: {func.__name__}")

                return result

            except SecurityError as e:
                logger.error(f"Security error in {func.__name__}: {e}")
                return f"Security error: {e}"
            except Exception as e:
                logger.error(f"Error in {func.__name__}: {e}")
                return f"Operation failed: {e}"

        return wrapper
    return decorator


def rate_limit(max_calls: int, time_window: int):
    """
    Decorator for rate limiting operations.

    Args:
        max_calls (int): Maximum number of calls allowed
        time_window (int): Time window in seconds

    Returns:
        Callable: Decorated function
    """
    import time
    from collections import defaultdict, deque

    call_times = defaultdict(deque)

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            current_time = time.time()
            func_name = func.__name__

            # Clean old calls outside time window
            while call_times[func_name] and call_times[func_name][0] <= current_time - time_window:
                call_times[func_name].popleft()

            # Check if rate limit exceeded
            if len(call_times[func_name]) >= max_calls:
                logger.warning(f"Rate limit exceeded for {func_name}")
                return "Rate limit exceeded. Please wait before trying again."

            # Record this call
            call_times[func_name].append(current_time)

            return func(*args, **kwargs)

        return wrapper
    return decorator


class SecurityConfig:
    """Security configuration management"""

    def __init__(self):
        self.allowed_directories = self._get_default_allowed_directories()

    def _get_default_allowed_directories(self) -> List[str]:
        """Get default allowed directories for file operations"""
        username = os.getenv('USERNAME', 'User')
        return [
            f"C:\\Users\\{username}\\Documents",
            f"C:\\Users\\{username}\\Pictures",
            f"C:\\Users\\{username}\\Desktop",
            f"C:\\Users\\{username}\\Downloads",
            f"C:\\Users\\{username}\\Documents\\MCP_Notes",
            os.getcwd(),  # Current working directory
        ]

    def add_allowed_directory(self, directory: str) -> None:
        """Add a directory to the allowed list"""
        normalized_dir = str(Path(directory).resolve())
        if normalized_dir not in self.allowed_directories:
            self.allowed_directories.append(normalized_dir)
            logger.info(f"Added allowed directory: {normalized_dir}")

    def remove_allowed_directory(self, directory: str) -> None:
        """Remove a directory from the allowed list"""
        normalized_dir = str(Path(directory).resolve())
        if normalized_dir in self.allowed_directories:
            self.allowed_directories.remove(normalized_dir)
            logger.info(f"Removed allowed directory: {normalized_dir}")


# Global security configuration instance
security_config = SecurityConfig()
