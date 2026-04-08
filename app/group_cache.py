import json
import os
import threading
import time
from datetime import datetime

from . import state
from .config import DATA_DIR
from .auth import get_setting
from .logging_store import log_and_print

CACHE_FILE = os.path.join(DATA_DIR, "group_cache.json")

# Thread-safe cache
cache_lock = threading.Lock()
cached_member_count = None
last_update = None
cache_thread = None


def load_cache():
    """Load cached group member count from file"""
    global cached_member_count, last_update
    try:
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                with cache_lock:
                    cached_member_count = data.get("member_count")
                    last_update = data.get("last_update")
                log_and_print(f"Group cache loaded: {cached_member_count} members", "info")
    except Exception as e:
        log_and_print(f"Group cache load error: {str(e)}", "error")


def save_cache(member_count):
    """Save group member count to cache file"""
    global cached_member_count, last_update
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with cache_lock:
            cached_member_count = member_count
            last_update = datetime.utcnow().isoformat()
            data = {
                "member_count": cached_member_count,
                "last_update": last_update
            }
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        log_and_print(f"Group cache save error: {str(e)}", "error")


def get_cached_member_count():
    """Get cached group member count (never returns None/blank)"""
    with cache_lock:
        return cached_member_count if cached_member_count is not None else 0


def update_group_cache():
    """Fetch fresh group member count from API and cache it"""
    try:
        from .config import GROUP_ID
        
        if not state.groups_api_instance:
            return
        
        group_id = get_setting("group_id", GROUP_ID)
        if not group_id:
            return
        
        group = state.groups_api_instance.get_group(group_id)
        member_count = getattr(group, "member_count", 0)
        
        if member_count > 0:
            save_cache(member_count)
            log_and_print(f"Group cache updated: {member_count} members", "debug")
        
    except Exception as e:
        log_and_print(f"Group cache update error: {str(e)}", "error")


def group_cache_loop():
    """Background thread to update group member count every 10 minutes (low priority)"""
    while True:
        try:
            if state.current_user and state.groups_api_instance:
                update_group_cache()
            time.sleep(600)  # 10 minutes
        except Exception as e:
            log_and_print(f"Group cache loop error: {str(e)}", "error")
            time.sleep(600)


def start_group_cache_thread():
    """Start the background thread for caching group member count"""
    global cache_thread
    
    # Load existing cache first
    load_cache()
    
    # Initial update if logged in
    if state.current_user and state.groups_api_instance:
        update_group_cache()
    
    # Start background thread
    if cache_thread is None or not cache_thread.is_alive():
        cache_thread = threading.Thread(target=group_cache_loop, daemon=True)
        cache_thread.start()
        log_and_print("Group cache thread started", "info")
