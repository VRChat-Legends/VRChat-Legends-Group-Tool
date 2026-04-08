import sys

from .auth import init_db, try_login_with_stored_cookie, get_setting
from .web_ui import start_background_tasks, start_web_ui
from .osc_chatbox import start_chatbox_thread
from .discord_webhook import load_discord_config
from .group_cache import start_group_cache_thread
from .friends_cache import start_friends_cache_thread
from .analytics import load_analytics
from .backup import mark_running, mark_stopped, was_crash, start_backup_thread
from .updater import start_update_check_thread
from . import state


def main():
    if getattr(sys, "frozen", False):
        from .bootstrap_install import ensure_installed_via_wizard

        if not ensure_installed_via_wizard():
            sys.exit(0)

    init_db()
    if was_crash():
        state.crash_recovered = True
    mark_running()
    try:
        import atexit
        atexit.register(mark_stopped)
    except Exception:
        pass
    start_backup_thread()
    load_discord_config()
    load_analytics()
    start_chatbox_thread()

    vrchat_api_enabled = get_setting("vrchat_api_enabled", "true").lower() not in ("false", "0", "no")
    if vrchat_api_enabled:
        start_group_cache_thread()
        start_friends_cache_thread()

    if try_login_with_stored_cookie():
        print(f"Logged in as: {state.current_user.display_name}")
        if vrchat_api_enabled:
            start_background_tasks()
    start_update_check_thread()
    start_web_ui()
