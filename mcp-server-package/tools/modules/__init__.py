"""
Secure Windows MCP Tools Modules

This package provides modularized, security-enhanced tools for Windows automation
through the Model Context Protocol (MCP).

Modules:
- security: Input validation, sanitization, and security decorators
- application_manager: Secure application launching and web operations
- system_control: Volume, brightness, and power management
- file_operations: Secure file system operations

All modules implement comprehensive security controls including:
- Input validation and sanitization
- Rate limiting
- Path traversal protection
- Command injection prevention
- Comprehensive logging
"""

from .security import SecurityError, security_config
from .application_manager import open_app, open_webpage, search_web, play_song
from .system_control import volume_control, brightness_control, system_power
from .file_operations import create_note, find_files

__all__ = [
    # Security
    'SecurityError',
    'security_config',

    # Application Management
    'open_app',
    'open_webpage',
    'search_web',
    'play_song',

    # System Control
    'volume_control',
    'brightness_control',
    'system_power',

    # File Operations
    'create_note',
    'find_files',
]

__version__ = "1.0.0"
__author__ = "MCP Windows Assistant"
