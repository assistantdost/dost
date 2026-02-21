"""
File operations module for MCP Windows Assistant.

This module provides secure file system operations including file search,
note creation, and file management with proper path validation and security controls.
"""

import datetime
from pathlib import Path
from typing import Optional

try:
    from ..config import config
except ImportError:
    from config import config

from .security import (
    _secure_operation, _rate_limit, InputValidator,
    SecurityError, security_config, logger
)


class FileManager:
    """Handles secure file operations"""

    def __init__(self):
        self.validator = InputValidator()

    @_secure_operation(require_validation=True, log_operation=True)
    @_rate_limit(max_calls=10, time_window=60)
    def create_note(self, note_text: str, filename: str = "") -> str:
        """
        Creates a new text file with the provided content in the notes directory.

        Args:
            note_text (str): The content to write to the note.
            filename (str, optional): A custom name for the file. If empty, a
                                      timestamped name is generated.

        Returns:
            str: The path where the note was saved or an error message.
        """
        try:
            # Validate note content
            if not note_text.strip():
                raise SecurityError("Note content cannot be empty")

            if len(note_text) > 50000:  # 50KB limit
                raise SecurityError("Note content too large (max 50KB)")

            # Get and validate notes directory
            notes_dir = Path(config.get("productivity.notes_directory"))

            # Ensure notes directory is in allowed paths
            validated_notes_dir = self.validator.validate_path(
                str(notes_dir),
                security_config.allowed_directories
            )

            # Create directory if it doesn't exist
            validated_notes_dir.mkdir(parents=True, exist_ok=True)

            # Handle filename
            if filename:
                # Validate custom filename
                filename = self.validator.validate_filename(filename)
                if not filename.endswith('.txt'):
                    filename = f"{filename}.txt"
            else:
                # Generate timestamped filename
                timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
                filename = f"note_{timestamp}.txt"

            # Create full file path
            filepath = validated_notes_dir / filename

            # Additional check to prevent overwriting existing files without confirmation
            if filepath.exists():
                logger.warning(f"Attempted to overwrite existing file: {filepath}")
                return f"File already exists: {filename}. Please use a different name."

            # Write the note
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(note_text)

            logger.info(f"Note created successfully: {filepath}")
            return f"Note saved to: {filepath}"

        except SecurityError as e:
            return f"Security error: {e}"
        except Exception as e:
            logger.error(f"Failed to create note: {e}")
            return f"Failed to create note: {e}"

    @_secure_operation(require_validation=True, log_operation=True)
    @_rate_limit(max_calls=5, time_window=60)
    def find_files(self, name: str, search_dir: str) -> str:
        """
        Recursively searches for files or folders within a given directory.

        Args:
            name (str): The name of the file to search for.
            search_dir (str): The absolute path to the directory to start the search from.

        Returns:
            str: A formatted list of found file paths or a 'not found' message.
        """
        try:
            # Validate search parameters
            if not name.strip():
                raise SecurityError("Search name cannot be empty")

            if len(name) > 100:
                raise SecurityError("Search name too long (max 100 characters)")

            # Validate and normalize search directory
            validated_search_dir = self.validator.validate_path(
                search_dir,
                security_config.allowed_directories
            )

            if not validated_search_dir.is_dir():
                return f"Error: Search directory '{search_dir}' does not exist or is not a directory."

            # Perform the search with limits
            results = []
            count = 0
            max_results = 50  # Limit results to prevent overwhelming output

            try:
                for item in validated_search_dir.rglob(f"*{name}*"):
                    if count >= max_results:
                        results.append(f"... and more (showing first {max_results} results)")
                        break
                    results.append(str(item))
                    count += 1
            except PermissionError as e:
                logger.warning(f"Permission denied accessing some directories during search: {e}")
                # Continue with partial results

            if not results:
                return f"No files or folders matching '{name}' found in '{search_dir}'."

            logger.info(f"File search completed: found {count} items for '{name}' in '{search_dir}'")
            return f"Found {count} item(s):\n- " + "\n- ".join(results)

        except SecurityError as e:
            return f"Security error: {e}"
        except Exception as e:
            logger.error(f"Error finding files: {e}")
            return f"Error finding files: {e}"

    @_secure_operation(require_validation=True, log_operation=True)
    @_rate_limit(max_calls=20, time_window=60)
    def list_directory(self, directory: str = "") -> str:
        """
        Lists the contents of a directory with security validation.

        Args:
            directory (str): The directory to list. If empty, lists current directory.

        Returns:
            str: A formatted list of directory contents.
        """
        try:
            if not directory:
                directory = str(Path.cwd())

            # Validate directory path
            validated_dir = self.validator.validate_path(
                directory,
                security_config.allowed_directories
            )

            if not validated_dir.is_dir():
                return f"Error: '{directory}' is not a directory."

            # List contents with type information
            contents = []
            try:
                for item in validated_dir.iterdir():
                    if item.is_dir():
                        contents.append(f"📁 {item.name}/")
                    else:
                        size_mb = item.stat().st_size / (1024 * 1024)
                        if size_mb > 1:
                            contents.append(f"📄 {item.name} ({size_mb:.1f} MB)")
                        else:
                            size_kb = item.stat().st_size / 1024
                            contents.append(f"📄 {item.name} ({size_kb:.1f} KB)")
            except PermissionError:
                return f"Permission denied accessing directory: {directory}"

            if not contents:
                return f"Directory is empty: {directory}"

            # Limit output size
            if len(contents) > 100:
                contents = contents[:100]
                contents.append("... (showing first 100 items)")

            logger.info(f"Directory listed: {directory} ({len(contents)} items)")
            return f"Contents of {directory}:\n" + "\n".join(contents)

        except SecurityError as e:
            return f"Security error: {e}"
        except Exception as e:
            logger.error(f"Error listing directory: {e}")
            return f"Error listing directory: {e}"

    @_secure_operation(require_validation=True, log_operation=True)
    @_rate_limit(max_calls=10, time_window=60)
    def read_file_content(self, filepath: str, max_lines: int = 100) -> str:
        """
        Safely reads the content of a text file with size and security limits.

        Args:
            filepath (str): The path to the file to read.
            max_lines (int): Maximum number of lines to read.

        Returns:
            str: The file content or an error message.
        """
        try:
            # Validate file path
            validated_path = self.validator.validate_path(
                filepath,
                security_config.allowed_directories
            )

            if not validated_path.is_file():
                return f"Error: '{filepath}' is not a file or does not exist."

            # Check file size (limit to 1MB for safety)
            file_size = validated_path.stat().st_size
            if file_size > 1024 * 1024:  # 1MB
                return f"File too large to read safely (size: {file_size / 1024 / 1024:.1f} MB, max: 1MB)"

            # Read file content
            try:
                with open(validated_path, 'r', encoding='utf-8') as f:
                    lines = []
                    for i, line in enumerate(f):
                        if i >= max_lines:
                            lines.append(f"... (showing first {max_lines} lines)")
                            break
                        lines.append(line.rstrip())

                    content = '\n'.join(lines)

                logger.info(f"File read successfully: {filepath}")
                return f"Content of {filepath}:\n{content}"

            except UnicodeDecodeError:
                return f"Cannot read file: {filepath} (not a text file or unsupported encoding)"

        except SecurityError as e:
            return f"Security error: {e}"
        except Exception as e:
            logger.error(f"Error reading file: {e}")
            return f"Error reading file: {e}"


# Global instance
file_manager = FileManager()


# Public functions for compatibility
def create_note(content: str, custom_filename: Optional[str] = "") -> str:
    """
    Creates a new text file. Use this to jot down quick thoughts, save memos, or use as a scratchpad.
    Use this for text storage, NOT for time-based alerts.
    """
    return file_manager.create_note(content, custom_filename)


def find_files(query: str, start_directory: str) -> str:
    """
    Searches the hard drive for specific files. Use this to find PDFs, invoices, documents, images, or executables by name.
    """
    return file_manager.find_files(query, start_directory)
