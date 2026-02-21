"""
Secure Windows automation functions for the MCP Assistant - Refactored Version.

This module now imports from secure, modularized components that provide
comprehensive security controls including input validation, rate limiting,
path traversal protection, and command injection prevention.

Legacy compatibility is maintained for existing function signatures.
"""

# Import all secure functions from modularized components
from .modules import (
    # Security
    SecurityError, security_config,

    # Application Management
    open_app, open_webpage, search_web, play_song,

    # System Control
    volume_control, brightness_control, system_power,

    # File Operations
    create_note, find_files,
)

# Import additional modules for remaining functionality
from .modules.desktop_interaction import screenshot, clipboard_manager, show_notification

# Additional modules that weren't fully converted yet - keeping original imports for now
import subprocess
import threading

try:
    import pygetwindow as gw
    _PYGETWINDOW_AVAILABLE = True
except ImportError:
    _PYGETWINDOW_AVAILABLE = False

try:
    import psutil
    import platform
    _PSUTIL_AVAILABLE = True
except ImportError:
    _PSUTIL_AVAILABLE = False

from .modules.security import _secure_operation, _rate_limit, InputValidator, logger


# Maintain backward compatibility - export all functions
__all__ = [
    # Security
    'SecurityError', 'security_config',

    # Application Management
    'open_app', 'open_webpage', 'search_web', 'play_song',

    # System Control
    'volume_control', 'brightness_control', 'system_power',

    # File Operations
    'create_note', 'find_files',

    # Desktop Interaction
    'screenshot', 'clipboard_manager', 'show_notification',

    # Window Management
    'list_open_windows', 'focus_window', 'minimize_window', 'maximize_window', 'close_window',

    # Task Scheduling
    'schedule_task', 'list_scheduled_tasks', 'delete_scheduled_task', 'set_reminder',

    # System Information
    'get_system_info'
]


# --- WINDOW MANAGEMENT (To be modularized in next iteration) ---
def _handle_import_error(module_name: str, feature_name: str) -> str:
    """
    Generates a user-friendly error message for a missing dependency.
    """
    return (f"ERROR: The '{feature_name}' feature requires the '{module_name}' library. "
            f"Please install it by running: pip install {module_name}")


def _get_window_by_title(title: str):
    """
    Internal helper to find a window by its title using a partial match.
    """
    if not _PYGETWINDOW_AVAILABLE:
        return None
    windows = gw.getWindowsWithTitle(title)
    return windows[0] if windows else None


@_secure_operation(require_validation=True, log_operation=True)
@_rate_limit(max_calls=20, time_window=60)
def list_open_windows() -> str:
    """
    Lists all currently open application windows. Use this to see what programs are running and visible on the desktop.
    """
    if not _PYGETWINDOW_AVAILABLE:
        return _handle_import_error("PyGetWindow", "Window Management")
    try:
        windows = [win.title for win in gw.getAllWindows() if win.title]
        if not windows:
            return "No open application windows found."
        return "Open Windows:\n- " + "\n- ".join(windows[:50])  # Limit to 50 windows
    except Exception as e:
        logger.error(f"Error listing windows: {e}")
        return f"Error listing windows: {e}"


@_secure_operation(require_validation=True, log_operation=True)
@_rate_limit(max_calls=30, time_window=60)
def focus_window(title: str) -> str:
    """
    Brings an open window to the foreground. Use this to bring apps like 'Firefox', 'Chrome', or 'Spotify' to the front/focus.
    """
    if not _PYGETWINDOW_AVAILABLE:
        return _handle_import_error("PyGetWindow", "Window Management")
    try:
        window = _get_window_by_title(title)
        if window:
            window.activate()
            return f"Focused window: {window.title}"
        return f"Window with title '{title}' not found."
    except Exception as e:
        logger.error(f"Error focusing window: {e}")
        return f"Error focusing window: {e}"


@_secure_operation(require_validation=True, log_operation=True)
@_rate_limit(max_calls=20, time_window=60)
def minimize_window(title: str) -> str:
    """
    Minimizes a window to the taskbar. Use this to hide an application window without closing it.
    """
    if not _PYGETWINDOW_AVAILABLE:
        return _handle_import_error("PyGetWindow", "Window Management")
    try:
        window = _get_window_by_title(title)
        if window:
            window.minimize()
            return f"Minimized window: {window.title}"
        return f"Window with title '{title}' not found."
    except Exception as e:
        logger.error(f"Error minimizing window: {e}")
        return f"Error minimizing window: {e}"


@_secure_operation(require_validation=True, log_operation=True)
@_rate_limit(max_calls=20, time_window=60)
def maximize_window(title: str) -> str:
    """
    Maximizes a window to fill the screen. Use this to expand an application window.
    """
    if not _PYGETWINDOW_AVAILABLE:
        return _handle_import_error("PyGetWindow", "Window Management")
    try:
        window = _get_window_by_title(title)
        if window:
            window.maximize()
            return f"Maximized window: {window.title}"
        return f"Window with title '{title}' not found."
    except Exception as e:
        logger.error(f"Error maximizing window: {e}")
        return f"Error maximizing window: {e}"


@_secure_operation(require_validation=True, log_operation=True)
@_rate_limit(max_calls=10, time_window=60)
def close_window(title: str) -> str:
    """
    Closes a specific application window. Use this to terminate or quit a window by its title.
    """
    if not _PYGETWINDOW_AVAILABLE:
        return _handle_import_error("PyGetWindow", "Window Management")
    try:
        window = _get_window_by_title(title)
        if window:
            window.close()
            return f"Closed window: {window.title}"
        return f"Window with title '{title}' not found."
    except Exception as e:
        logger.error(f"Error closing window: {e}")
        return f"Error closing window: {e}"


# --- TASK SCHEDULING (Secured) ---
@_secure_operation(require_validation=True, log_operation=True)
@_rate_limit(max_calls=5, time_window=300)
def schedule_task(task_name: str, command: str, time_str: str, date_str: str = "") -> str:
    """
    Schedules a command or script to run at a specific time. Use this to automate tasks using Windows Task Scheduler.
    """
    try:
        # Validate inputs
        validator = InputValidator()
        task_name = validator.sanitize_string(task_name, 50)
        command = validator.sanitize_string(command, 200)
        time_str = validator.sanitize_string(time_str, 10)

        if date_str:
            date_str = validator.sanitize_string(date_str, 15)

        # Validate time format
        import re
        if not re.match(r'^\d{2}:\d{2}$', time_str):
            raise SecurityError("Invalid time format. Use HH:MM")

        # Validate date format if provided
        if date_str and not re.match(r'^\d{2}/\d{2}/\d{4}$', date_str):
            raise SecurityError("Invalid date format. Use DD/MM/YYYY")

        # Build command securely
        cmd = ["schtasks", "/create", "/tn", task_name, "/tr", command, "/st", time_str, "/f"]
        if date_str:
            cmd.extend(["/sc", "once", "/sd", date_str])
        else:
            cmd.extend(["/sc", "daily"])

        # Execute with security controls
        subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True,
            shell=False,  # Don't use shell for security
            timeout=30
        )

        logger.info(f"Task scheduled: {task_name}")

        if date_str:
            return f"Task '{task_name}' scheduled for {date_str} at {time_str}."
        else:
            return f"Daily task '{task_name}' scheduled for {time_str}."

    except SecurityError as e:
        return f"Security error: {e}"
    except subprocess.TimeoutExpired:
        return "Task scheduling timed out"
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to schedule task: {e}")
        return f"Failed to schedule task: {e.stderr.strip() if e.stderr else str(e)}"
    except Exception as e:
        logger.error(f"Task scheduling error: {e}")
        return f"Failed to schedule task: {str(e)}"


@_secure_operation(require_validation=True, log_operation=True)
@_rate_limit(max_calls=10, time_window=60)
def list_scheduled_tasks(filter_name: str = "") -> str:
    """
    Lists technical background jobs and automated scripts in the Windows Task Scheduler.
    Use this to manage system automation and cron-like tasks, NOT for personal meetings.
    """
    try:
        if filter_name:
            validator = InputValidator()
            filter_name = validator.sanitize_string(filter_name, 50)

        result = subprocess.run(
            ["schtasks", "/query", "/fo", "csv"],
            capture_output=True,
            text=True,
            check=True,
            shell=False,
            timeout=30
        )

        lines = result.stdout.strip().split('\n')[1:]  # Skip header
        if not lines:
            return "No scheduled tasks found."

        tasks = []
        for line in lines[:100]:  # Limit to 100 tasks
            parts = line.strip().split('","')
            task_name = parts[0].strip('"')
            if not filter_name or filter_name.lower() in task_name.lower():
                tasks.append(task_name)

        if not tasks:
            return f'No scheduled tasks found matching "{filter_name}".'

        return "Scheduled Tasks:\n- " + "\n- ".join(tasks)

    except subprocess.TimeoutExpired:
        return "Task listing timed out"
    except subprocess.CalledProcessError as e:
        return f"Failed to list scheduled tasks: {e.stderr.strip() if e.stderr else str(e)}"
    except Exception as e:
        logger.error(f"Error listing tasks: {e}")
        return f"Failed to list scheduled tasks: {str(e)}"


@_secure_operation(require_validation=True, log_operation=True)
@_rate_limit(max_calls=5, time_window=300)
def delete_scheduled_task(task_name: str) -> str:
    """
    Removes a scheduled task from Windows Task Scheduler. Use this to cancel future automated actions.
    """
    try:
        validator = InputValidator()
        task_name = validator.sanitize_string(task_name, 50)

        subprocess.run(
            ["schtasks", "/delete", "/tn", task_name, "/f"],
            check=True,
            capture_output=True,
            text=True,
            shell=False,
            timeout=30
        )

        logger.info(f"Deleted scheduled task: {task_name}")
        return f"Successfully deleted scheduled task: {task_name}"

    except subprocess.TimeoutExpired:
        return "Task deletion timed out"
    except subprocess.CalledProcessError as e:
        return f"Failed to delete task '{task_name}': {e.stderr.strip() if e.stderr else str(e)}"
    except Exception as e:
        logger.error(f"Error deleting task: {e}")
        return f"Failed to delete task '{task_name}': {str(e)}"


@_secure_operation(require_validation=True, log_operation=True)
@_rate_limit(max_calls=10, time_window=300)
def set_reminder(time_string: str, message: str) -> str:
    """
    Sets a time-based alert or notification. Use this to get reminded at a specific time or after a duration. NOT for writing notes.
    """
    try:
        validator = InputValidator()
        time_string = validator.sanitize_string(time_string, 10)
        message = validator.sanitize_string(message, 200)

        # Parse time string
        if not time_string or len(time_string) < 2:
            raise SecurityError("Invalid time format")

        time_val = int(time_string[:-1])
        time_unit = time_string[-1].lower()

        if time_val <= 0 or time_val > 24:
            raise SecurityError("Time value must be between 1 and 24")

        delay_seconds = 0
        if time_unit == 's':
            delay_seconds = time_val
            max_seconds = 3600  # 1 hour max
        elif time_unit == 'm':
            delay_seconds = time_val * 60
            max_seconds = 3600 * 24  # 24 hours max
        elif time_unit == 'h':
            delay_seconds = time_val * 3600
            max_seconds = 3600 * 24  # 24 hours max
        else:
            raise SecurityError("Invalid time unit. Use 's' for seconds, 'm' for minutes, or 'h' for hours")

        if delay_seconds > max_seconds:
            raise SecurityError(f"Reminder time too long (max {max_seconds // 3600} hours)")

        def reminder_action():
            show_notification("Reminder!", message, 10)

        timer_thread = threading.Timer(delay_seconds, reminder_action)
        timer_thread.daemon = True  # Make thread daemon for proper cleanup
        timer_thread.start()

        logger.info(f"Reminder set for {time_val}{time_unit}: {message[:50]}...")
        return f"OK, I will remind you to '{message}' in {time_val}{time_unit}."

    except ValueError:
        return "Invalid time format. Use format like '30s', '10m', '1h'"
    except SecurityError as e:
        return f"Security error: {e}"
    except Exception as e:
        logger.error(f"Failed to set reminder: {e}")
        return f"Failed to set reminder: {e}"


# --- SYSTEM INFORMATION (Secured) ---
@_secure_operation(require_validation=False, log_operation=True)
@_rate_limit(max_calls=5, time_window=60)
def get_system_info() -> str:
    """
    Retrieves detailed hardware and software specifications. Use this to get information about the OS, CPU, memory (RAM), and disk space.
    """
    # if not _PSUTIL_AVAILABLE:
    #     return _handle_import_error("psutil", "System Information")

    try:
        info = ["--- System Information ---"]

        # --- START: MODIFIED OS DETECTION ---
        os_details = f"{platform.system()} {platform.release()} ({platform.version()})"
        if platform.system() == "Windows":
            try:
                import winreg
                key_path = r"SOFTWARE\Microsoft\Windows NT\CurrentVersion"
                key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, key_path)

                product_name, _ = winreg.QueryValueEx(key, "ProductName")
                build_num, _ = winreg.QueryValueEx(key, "CurrentBuildNumber")

                # Check build number for Windows 11 (starts at 22000)
                if int(build_num) >= 22000:
                    product_name = product_name.replace("Windows 10", "Windows 11")

                os_details = f"{product_name} (Build {build_num})"
                winreg.CloseKey(key)
            except Exception:
                # Fallback to the default if registry access fails
                pass
        info.append(f"OS: {os_details}")
        # --- END: MODIFIED OS DETECTION ---

        # CPU Info
        info.append(f"CPU: {platform.processor()}")
        info.append(f"Cores: {psutil.cpu_count(logical=False)} Physical, {psutil.cpu_count(logical=True)} Logical")
        info.append(f"CPU Usage: {psutil.cpu_percent(interval=1)}%")

        # Memory Info
        mem = psutil.virtual_memory()
        info.append(f"RAM: {mem.used/1024**3:.2f} GB / {mem.total/1024**3:.2f} GB ({mem.percent}%)")

        # Disk Info
        info.append("Disk Usage:")
        disk_count = 0
        for part in psutil.disk_partitions():
            if disk_count >= 5:  # Limit disk info
                info.append("  - (additional disks not shown)")
                break
            try:
                usage = psutil.disk_usage(part.mountpoint)
                info.append(
                    f"  - {part.device} {usage.used/1024**3:.1f}/{usage.total/1024**3:.1f} GB ({usage.percent}%)"
                )
                disk_count += 1
            except PermissionError:
                continue

        # logger.info("System information retrieved")
        return "\n".join(info)

    except Exception as e:
        # logger.error(f"Error getting system info: {e}")
        return f"Error getting system info: {e}"


if __name__ == '__main__':
    print("--- Secure MCP Windows Assistant Demo ---")
    print(get_system_info())
    print("\n" + list_open_windows())
