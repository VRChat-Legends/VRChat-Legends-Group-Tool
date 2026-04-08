import json
import os
from datetime import datetime

from . import state
from .config import LOG_FILE


def log_to_file(event_type, details):
    entry = {"timestamp": datetime.now().isoformat(), "type": event_type, "details": details}
    try:
        logs = []
        if os.path.exists(LOG_FILE):
            with open(LOG_FILE, "r", encoding="utf-8") as f:
                logs = json.load(f)
        logs.append(entry)
        with open(LOG_FILE, "w", encoding="utf-8") as f:
            json.dump(logs, f, indent=2)
    except Exception:
        pass


def log_and_print(message, event_type="info", details=None, avatar_url=None, user_id=None, display_name=None):
    """Log with optional richer format (avatar link, user_id)."""
    ts = datetime.now().strftime("%H:%M:%S")
    full = f"[{ts}] {message}"
    entry = full
    if avatar_url or user_id or display_name:
        entry = {"raw": full, "avatar_url": avatar_url or "", "user_id": user_id or "", "display_name": display_name or ""}
    with state.log_lock:
        state.log_entries.append(entry)
        if len(state.log_entries) > 500:
            state.log_entries[:] = state.log_entries[-500:]
    print(full)
    file_details = details or message
    if isinstance(file_details, str) and (avatar_url or user_id):
        file_details = {"message": file_details, "avatar_url": avatar_url, "user_id": user_id, "display_name": display_name}
    log_to_file(event_type, file_details)


def clear_logs():
    with state.log_lock:
        state.log_entries.clear()
    try:
        if os.path.exists(LOG_FILE):
            os.remove(LOG_FILE)
    except Exception:
        pass
