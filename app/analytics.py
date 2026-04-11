import json
import os
from datetime import datetime

from . import state
from .config import DATA_DIR

ANALYTICS_FILE = os.path.join(DATA_DIR, "analytics.json")
HISTORY_FILE = os.path.join(DATA_DIR, "analytics_history.json")
_HISTORY_METRICS = [
    "invites_sent", "invites_failed", "invites_skipped_cooldown",
    "friend_requests_accepted", "friend_requests_failed", "friend_requests_expired",
    "rate_limit_events",
]
_MAX_HISTORY_POINTS = 168  # 7 days of hourly snapshots


def _default_analytics():
    return {
        "invites_sent": 0,
        "invites_failed": 0,
        "invites_skipped_cooldown": 0,
        "friend_requests_accepted": 0,
        "friend_requests_failed": 0,
        "friend_requests_expired": 0,
        "rate_limit_events": 0,
        "last_invite_run": None,
        "last_friend_poll": None,
    }


def load_analytics():
    """Load analytics from JSON file so you can move it if needed."""
    try:
        if os.path.exists(ANALYTICS_FILE):
            with open(ANALYTICS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                with state.analytics_lock:
                    defaults = _default_analytics()
                    for k, v in defaults.items():
                        if k in data:
                            state.analytics[k] = data[k]
                        elif k not in state.analytics:
                            state.analytics[k] = v
                    for k, v in data.items():
                        if k not in state.analytics:
                            state.analytics[k] = v
    except Exception as e:
        from .logging_store import log_and_print
        log_and_print(f"Analytics load error: {str(e)}", "error")


def save_analytics():
    """Persist current analytics to JSON file."""
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with state.analytics_lock:
            data = dict(state.analytics)
        with open(ANALYTICS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        from .logging_store import log_and_print
        log_and_print(f"Analytics save error: {str(e)}", "error")


def increment_metric(name, count=1):
    with state.analytics_lock:
        state.analytics[name] = state.analytics.get(name, 0) + count
    save_analytics()


def set_metric(name, value):
    with state.analytics_lock:
        state.analytics[name] = value
    save_analytics()


def snapshot_metrics():
    with state.analytics_lock:
        return dict(state.analytics)


def mark_last_invite_run():
    set_metric("last_invite_run", datetime.utcnow().isoformat())


def mark_last_friend_poll():
    set_metric("last_friend_poll", datetime.utcnow().isoformat())


# ── Hourly history for charts ────────────────────────────────────────────────

def _load_history():
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return []


def _save_history(history):
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f)
    except Exception:
        pass


def record_hourly_snapshot():
    """Take a snapshot of current metrics and append to history. Call once per hour."""
    snap = snapshot_metrics()
    point = {"ts": datetime.utcnow().isoformat()}
    for k in _HISTORY_METRICS:
        point[k] = snap.get(k, 0)
    history = _load_history()
    history.append(point)
    if len(history) > _MAX_HISTORY_POINTS:
        history = history[-_MAX_HISTORY_POINTS:]
    _save_history(history)


def get_history():
    """Return the list of hourly snapshots for charting."""
    return _load_history()
