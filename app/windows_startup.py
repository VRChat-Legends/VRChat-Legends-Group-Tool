"""Register the frozen app in Windows Startup (HKCU Run)."""
import os
import sys

RUN_VALUE_NAME = "VRChatLegendsGroupTool"


def _exe_path():
    return os.path.abspath(sys.executable) if getattr(sys, "frozen", False) else ""


def get_start_with_windows():
    if sys.platform != "win32":
        return False
    try:
        import winreg

        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Run",
            0,
            winreg.KEY_READ,
        )
        try:
            winreg.QueryValueEx(key, RUN_VALUE_NAME)
            return True
        except OSError:
            return False
        finally:
            winreg.CloseKey(key)
    except Exception:
        return False


def set_start_with_windows(enabled):
    """Add or remove HKCU Run entry. Returns True if registry was updated."""
    if sys.platform != "win32":
        return False
    exe = _exe_path()
    if not exe:
        return False
    try:
        import winreg

        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Run",
            0,
            winreg.KEY_SET_VALUE,
        )
        try:
            if enabled:
                winreg.SetValueEx(key, RUN_VALUE_NAME, 0, winreg.REG_SZ, f'"{exe}"')
            else:
                try:
                    winreg.DeleteValue(key, RUN_VALUE_NAME)
                except OSError:
                    pass
            return True
        finally:
            winreg.CloseKey(key)
    except Exception:
        return False
