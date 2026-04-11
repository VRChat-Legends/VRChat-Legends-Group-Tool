import os
import sys
import shutil

# Configuration
USER_AGENT = "VRChatAutoAccept/2.0 (contact: jp2014n@vrchatlegends.com)"  # *** CHANGE TO YOUR REAL EMAIL ***
GROUP_ID = ""  # Set via Settings page

POLL_INTERVAL_BASE = 20
JITTER_RANGE = 8

def _copy_bundled_frontend_to_install_dir(install_dir):
    """When frozen, copy embedded frontend/dist to install folder (alongside exe)."""
    if not getattr(sys, "frozen", False):
        return
    _MEIPASS = getattr(sys, "_MEIPASS", "")
    src = os.path.join(_MEIPASS, "frontend", "dist")
    dst = os.path.join(install_dir, "frontend", "dist")
    if not os.path.isdir(src):
        return
    try:
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        if os.path.isdir(dst):
            for name in os.listdir(src):
                src_item = os.path.join(src, name)
                dst_item = os.path.join(dst, name)
                if os.path.isdir(src_item):
                    if os.path.exists(dst_item):
                        shutil.rmtree(dst_item, ignore_errors=True)
                    shutil.copytree(src_item, dst_item)
                else:
                    shutil.copy2(src_item, dst_item)
        else:
            shutil.copytree(src, dst)
    except Exception:
        pass

if getattr(sys, "frozen", False):
    # PyInstaller: install folder = exe location (e.g. %appdata%\VRChat Legends Group Tool)
    # All app data, assets, db live alongside the exe like real apps
    _MEIPASS = getattr(sys, "_MEIPASS", "")
    REPO_ROOT = _MEIPASS
    INSTALL_DIR = os.path.dirname(os.path.abspath(sys.executable))
    DATA_DIR = INSTALL_DIR
    os.makedirs(DATA_DIR, exist_ok=True)
    _copy_bundled_frontend_to_install_dir(INSTALL_DIR)
    FRONTEND_DIST = os.path.join(INSTALL_DIR, "frontend", "dist")
    if not os.path.isfile(os.path.join(FRONTEND_DIST, "index.html")):
        FRONTEND_DIST = os.path.join(_MEIPASS, "frontend", "dist")
else:
    REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    INSTALL_DIR = REPO_ROOT
    DATA_DIR = os.path.join(REPO_ROOT, "data")
    FRONTEND_DIST = os.path.join(REPO_ROOT, "frontend", "dist")

USE_REACT_UI = os.path.exists(os.path.join(FRONTEND_DIST, "index.html"))


def _data_path(filename):
    preferred = os.path.join(DATA_DIR, filename)
    if getattr(sys, "frozen", False):
        os.makedirs(DATA_DIR, exist_ok=True)
        return preferred
    legacy = os.path.join(REPO_ROOT, filename)
    if os.path.exists(preferred):
        return preferred
    if os.path.exists(legacy):
        return legacy
    os.makedirs(DATA_DIR, exist_ok=True)
    return preferred


USER_IDS_FILE = _data_path("user_ids.json")
LOG_FILE = _data_path("log.json")
DB_PATH = _data_path("vrchat_auth.db")
APP_FAVORITES_FILE = _data_path("app_favorites.json")
BLOCKED_USERS_FILE = _data_path("blocked_users.json")
