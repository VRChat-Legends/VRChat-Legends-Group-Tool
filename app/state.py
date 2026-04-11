import threading
import time
from datetime import datetime

# App start time for uptime/active_time
app_start_time = time.time()

api_client = None
auth_api = None
notifications_api_instance = None
groups_api_instance = None
users_api_instance = None
friends_api_instance = None
current_user = None
current_room = None
known_users_in_room = set()
invited_users = set()
lobby_status = "unknown"
current_invite_batch = []

next_poll_time = 0.0

log_entries = []
log_lock = threading.Lock()

state_lock = threading.Lock()
lobby_users = []
lobby_summary = {"total": 0, "others": 0}
pending_friend_requests = 0
auto_invite_enabled = False
auto_accept_friend_enabled = False
auto_event_invite_enabled = False

threads_started = False
pending_2fa = None
crash_recovered = False

analytics_lock = threading.Lock()
analytics = {
    "invites_sent": 0,
    "invites_failed": 0,
    "invites_skipped_cooldown": 0,
    "friend_requests_accepted": 0,
    "friend_requests_failed": 0,
    "friend_requests_expired": 0,
    "rate_limit_events": 0,
    "last_invite_run": None,
    "last_friend_poll": None
}
