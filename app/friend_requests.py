import random
import time

from vrchatapi.exceptions import ApiException

from . import state
from .config import POLL_INTERVAL_BASE, JITTER_RANGE
from .logging_store import log_and_print
from .analytics import increment_metric, mark_last_friend_poll


def poll_friend_requests():
    while True:
        if not state.notifications_api_instance:
            time.sleep(5)
            continue

        try:
            notifications = state.notifications_api_instance.get_notifications(
                hidden=False,
                n=100
            )

            pending = [n for n in notifications if n.type == "friendRequest" and n.id]
            pending.reverse()

            with state.state_lock:
                state.pending_friend_requests = len(pending)
                auto_accept = state.auto_accept_friend_enabled

            if not auto_accept:
                interval = POLL_INTERVAL_BASE + random.uniform(-JITTER_RANGE, JITTER_RANGE)
                state.next_poll_time = time.time() + interval
                time.sleep(interval)
                continue

            accepted = 0
            expired = 0
            failed = 0

            batch_size = 10
            for i in range(0, len(pending), batch_size):
                batch = pending[i:i + batch_size]
                for n in batch:
                    sender = n.sender_username or "Unknown"
                    notif_id = n.id

                    try:
                        state.notifications_api_instance.accept_friend_request(notif_id)
                        log_and_print(f"✓ Accepted friend request from {sender}", "friend_accept")
                        accepted += 1
                    except ApiException as e:
                        if e.status == 404:
                            log_and_print(f"Request from {sender} expired (normal)", "expired")
                            expired += 1
                        else:
                            log_and_print(f"✗ Failed to accept {sender}: {e.status}", "friend_fail")
                            failed += 1

                    time.sleep(0.5)

                if i + batch_size < len(pending):
                    log_and_print("Friend request batch sent. Cooling down 60s.", "rate_limit")
                    time.sleep(60)

            if accepted > 0:
                log_and_print(f"Auto-accepted {accepted} friend request(s)!", "success")
            if expired > 0:
                log_and_print(f"{expired} request(s) expired before accept", "info")
            if failed > 0:
                log_and_print(f"{failed} request(s) failed to accept", "friend_fail")

            if accepted:
                increment_metric("friend_requests_accepted", accepted)
            if expired:
                increment_metric("friend_requests_expired", expired)
            if failed:
                increment_metric("friend_requests_failed", failed)
            mark_last_friend_poll()

        except ApiException as e:
            if e.status == 429:
                log_and_print("Rate limited — backing off 2 minutes", "rate_limit")
                time.sleep(120)
                state.next_poll_time = time.time() + 120
                increment_metric("rate_limit_events", 1)
                continue
            log_and_print(f"API error {e.status}", "error")
        except Exception as e:
            log_and_print(f"Polling error: {str(e)}", "error")

        interval = POLL_INTERVAL_BASE + random.uniform(-JITTER_RANGE, JITTER_RANGE)
        state.next_poll_time = time.time() + interval
        time.sleep(interval)
