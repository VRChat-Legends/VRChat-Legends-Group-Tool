"""Auto-backup and crash recovery."""
import os
import shutil
import threading
import time
from datetime import datetime

from .config import DATA_DIR, DB_PATH, LOG_FILE, USER_IDS_FILE, BLOCKED_USERS_FILE, APP_FAVORITES_FILE
from .auth import get_setting


BACKUP_DIR = os.path.join(DATA_DIR, "backups")
RUNNING_MARKER = os.path.join(DATA_DIR, ".running")
MAX_BACKUPS = 5


def mark_running():
    """Mark app as running (for crash detection)."""
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(RUNNING_MARKER, "w") as f:
            f.write(datetime.utcnow().isoformat())
    except Exception:
        pass


def mark_stopped():
    """Remove running marker on clean shutdown."""
    try:
        if os.path.exists(RUNNING_MARKER):
            os.remove(RUNNING_MARKER)
    except Exception:
        pass


def was_crash():
    """Return True if last run did not exit cleanly."""
    return os.path.exists(RUNNING_MARKER)


def do_backup():
    """Create a timestamped backup of critical data files."""
    try:
        if get_setting("auto_backup_enabled", "1") != "1":
            return
        os.makedirs(BACKUP_DIR, exist_ok=True)
        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(BACKUP_DIR, ts)
        os.makedirs(backup_path, exist_ok=True)
        files = [
            (DB_PATH, "vrchat_auth.db"),
            (LOG_FILE, "log.json"),
            (USER_IDS_FILE, "user_ids.json"),
            (BLOCKED_USERS_FILE, "blocked_users.json"),
            (APP_FAVORITES_FILE, "app_favorites.json"),
        ]
        for src, name in files:
            if src and os.path.isfile(src):
                shutil.copy2(src, os.path.join(backup_path, name))
        # Trim old backups
        subs = sorted([d for d in os.listdir(BACKUP_DIR) if os.path.isdir(os.path.join(BACKUP_DIR, d))])
        while len(subs) > MAX_BACKUPS:
            shutil.rmtree(os.path.join(BACKUP_DIR, subs[0]), ignore_errors=True)
            subs = subs[1:]
    except Exception:
        pass


def start_backup_thread():
    """Run backup every hour."""
    def loop():
        time.sleep(300)  # First backup after 5 min
        while True:
            do_backup()
            time.sleep(3600)  # Every hour
    threading.Thread(target=loop, daemon=True).start()
