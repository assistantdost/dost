"""
System control module for MCP Windows Assistant.

This module provides secure system control functions including volume control,
brightness control, and power management with proper security validation.
"""

import subprocess
import sys
from typing import Literal

try:
    from comtypes import CLSCTX_ALL
    from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
    from ctypes import cast, POINTER
    _PYCAW_AVAILABLE = True
except ImportError:
    _PYCAW_AVAILABLE = False

try:
    import screen_brightness_control as sbc
    _SBC_AVAILABLE = True
except ImportError:
    _SBC_AVAILABLE = False

try:
    from ..config import config
except ImportError:
    from config import config

from .security import (
    secure_operation, rate_limit, SecurityError, logger
)


class SystemController:
    """Handles secure system control operations"""

    def __init__(self):
        self.min_volume = 0
        self.max_volume = 100
        self.min_brightness = 0
        self.max_brightness = 100

    @secure_operation(require_validation=True, log_operation=True)
    @rate_limit(max_calls=30, time_window=60)
    def control_volume(self, action: str, level: int = 0) -> str:
        """
        Controls the master system volume with security validation.

        Args:
            action (str): The action to perform ("SET", "INCREASE", "DECREASE").
            level (int, optional): The volume level (0-100) for "SET" or the amount
                                   to change for "INCREASE"/"DECREASE".

        Returns:
            str: A message indicating the result of the volume change.
        """
        if not _PYCAW_AVAILABLE:
            return ("ERROR: The 'Volume Control' feature requires the 'pycaw' library. "
                    "Please install it by running: pip install pycaw")

        try:
            # Validate action
            action_upper = action.upper()
            valid_actions = {'SET', 'INCREASE', 'DECREASE'}

            if action_upper not in valid_actions:
                raise SecurityError(f"Invalid action '{action}'. Use: {', '.join(valid_actions)}")

            # Validate level
            if level < 0 or level > 100:
                raise SecurityError(f"Volume level must be between 0 and 100, got: {level}")

            # Get audio device
            devices = AudioUtilities.GetSpeakers()
            interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
            volume = cast(interface, POINTER(IAudioEndpointVolume))
            current_scalar = volume.GetMasterVolumeLevelScalar()

            if action_upper == "SET":
                target_scalar = max(0.0, min(1.0, level / 100.0))
                volume.SetMasterVolumeLevelScalar(target_scalar, None)
                logger.info(f"Volume set to {target_scalar:.0%}")
                return f"Volume set to {target_scalar:.0%}."

            # Get step size
            step = level if level > 0 else config.get("system.volume.default_step", 10)
            step_scalar = step / 100.0

            if action_upper == "INCREASE":
                new_scalar = min(1.0, current_scalar + step_scalar)
                volume.SetMasterVolumeLevelScalar(new_scalar, None)
                logger.info(f"Volume increased to {new_scalar:.0%}")
                return f"Volume increased to {new_scalar:.0%}."

            elif action_upper == "DECREASE":
                new_scalar = max(0.0, current_scalar - step_scalar)
                volume.SetMasterVolumeLevelScalar(new_scalar, None)
                logger.info(f"Volume decreased to {new_scalar:.0%}")
                return f"Volume decreased to {new_scalar:.0%}."

        except SecurityError as e:
            return f"Security error: {e}"
        except Exception as e:
            logger.error(f"Error controlling volume: {e}")
            return f"Error controlling volume: {e}"

    @secure_operation(require_validation=True, log_operation=True)
    @rate_limit(max_calls=20, time_window=60)
    def control_brightness(self, action: str, level: int = 0) -> str:
        """
        Controls the screen brightness with security validation.

        Args:
            action (str): The action to perform ("SET", "INCREASE", "DECREASE").
            level (int, optional): The brightness level (0-100) for "SET" or the
                                   amount to change for "INCREASE"/"DECREASE".

        Returns:
            str: A message indicating the result of the brightness change.
        """
        if not _SBC_AVAILABLE:
            return ("ERROR: The 'Brightness Control' feature requires the 'screen-brightness-control' library. "
                    "Please install it by running: pip install screen-brightness-control")

        try:
            # Validate action
            action_upper = action.upper()
            valid_actions = {'SET', 'INCREASE', 'DECREASE'}

            if action_upper not in valid_actions:
                raise SecurityError(f"Invalid action '{action}'. Use: {', '.join(valid_actions)}")

            # Validate level
            if level < 0 or level > 100:
                raise SecurityError(f"Brightness level must be between 0 and 100, got: {level}")

            current_brightness = sbc.get_brightness()[0]

            if action_upper == "SET":
                sbc.set_brightness(level)
                logger.info(f"Brightness set to {level}%")
                return f"Brightness set to {level}%."

            # Get step size
            step = level if level > 0 else config.get("system.brightness.default_step", 10)

            if action_upper == "INCREASE":
                new_brightness = min(100, current_brightness + step)
                sbc.set_brightness(new_brightness)
                logger.info(f"Brightness increased to {new_brightness}%")
                return f"Brightness increased to {new_brightness}%."

            elif action_upper == "DECREASE":
                new_brightness = max(0, current_brightness - step)
                sbc.set_brightness(new_brightness)
                logger.info(f"Brightness decreased to {new_brightness}%")
                return f"Brightness decreased to {new_brightness}%."

        except SecurityError as e:
            return f"Security error: {e}"
        except Exception as e:
            logger.error(f"Error controlling brightness: {e}")
            return f"Error controlling brightness: {e}"

    @secure_operation(require_validation=True, log_operation=True)
    @rate_limit(max_calls=5, time_window=300)  # Very restrictive for power operations
    def manage_power(self, action: str) -> str:
        """
        Performs a system power action like shutdown, restart, or lock with security validation.

        Args:
            action (str): The power action to perform ("shutdown", "restart", "hibernate", "lock").

        Returns:
            str: A confirmation or error message.
        """
        if sys.platform != "win32":
            return "System power functions are only available on Windows."

        try:
            # Validate action
            action_lower = action.lower()
            valid_actions = {'shutdown', 'restart', 'hibernate', 'lock'}

            if action_lower not in valid_actions:
                raise SecurityError(f"Invalid power action '{action}'. Valid actions: {', '.join(valid_actions)}")

            # Define secure command mappings
            commands = {
                "shutdown": ["shutdown", "/s", "/t", "10"],  # 10 second delay for safety
                "restart": ["shutdown", "/r", "/t", "10"],   # 10 second delay for safety
                "hibernate": ["shutdown", "/h"],
                "lock": ["rundll32.exe", "user32.dll,LockWorkStation"],
            }

            command = commands[action_lower]

            # Execute the command with security controls
            subprocess.run(
                command,
                check=True,
                shell=False,  # Don't use shell for security
                capture_output=True,
                text=True,
                timeout=30  # Timeout for safety
            )

            logger.info(f"System power action executed: {action_lower}")

            if action_lower in ['shutdown', 'restart']:
                return f"System will {action_lower} in 10 seconds. Use 'shutdown /a' to cancel."
            else:
                return f"System is performing action: {action_lower}"

        except SecurityError as e:
            return f"Security error: {e}"
        except subprocess.TimeoutExpired:
            logger.error(f"Power command timed out: {action}")
            return f"Power command timed out: {action}"
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to perform system action '{action}': {e}")
            return f"Failed to perform system action '{action}': {e.stderr if e.stderr else str(e)}"
        except Exception as e:
            logger.error(f"Unexpected error in power management: {e}")
            return f"Failed to perform system action '{action}': {e}"


# Global instance
system_controller = SystemController()


# Public functions for compatibility
def sound_control(action: Literal["SET", "INCREASE", "DECREASE"], value: int = 0) -> str:
    """Controls master volume. 'value' is the target % for SET, or the amount to change by."""
    return system_controller.control_volume(action, value)


def brightness_control(action: Literal["SET", "INCREASE", "DECREASE"], value: int = 0) -> str:
    """Controls screen brightness. 'value' is the target % for SET, or the amount to change by."""
    return system_controller.control_brightness(action, value)


def system_power(action: Literal["shutdown", "restart", "hibernate", "lock"]) -> str:
    """Executes a system power command (e.g., shutdown, restart)."""
    return system_controller.manage_power(action)
