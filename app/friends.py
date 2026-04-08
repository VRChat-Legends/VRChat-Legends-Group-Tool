import threading
import time
from vrchatapi.exceptions import ApiException

from . import state
from .logging_store import log_and_print


def get_online_friends():
    """Get list of currently online friends (paginated; excludes offline/private)."""
    try:
        if not state.friends_api_instance:
            return []
        out = []
        n = 100
        offset = 0
        try:
            while True:
                batch = state.friends_api_instance.get_friends(offline=False, n=n, offset=offset)
                if not batch:
                    break
                for f in batch:
                    loc = getattr(f, "location", "") or ""
                    if loc and str(loc).lower() not in ("offline", "private", ""):
                        out.append(
                            {"id": f.id, "displayName": f.display_name, "location": loc}
                        )
                if len(batch) < n:
                    break
                offset += n
        except TypeError:
            batch = state.friends_api_instance.get_friends(offline=False, n=n)
            for f in batch or []:
                loc = getattr(f, "location", "") or ""
                if loc and str(loc).lower() not in ("offline", "private", ""):
                    out.append({"id": f.id, "displayName": f.display_name, "location": loc})
        return out
    except ApiException as e:
        log_and_print(f"Error fetching online friends: {e.status}", "error")
        return []
    except Exception as e:
        log_and_print(f"Error fetching friends: {str(e)}", "error")
        return []


def invite_all_online_friends_to_lobby():
    """Invite all online friends to current lobby"""
    try:
        from vrchatapi.api import invite_api
        from vrchatapi.models.invite_request import InviteRequest
        
        if not state.api_client:
            log_and_print("Not logged in", "error")
            return False
        
        # Get current world location
        if not state.current_room:
            log_and_print("Not in a world", "error")
            return False
        
        # Get online friends
        friends = get_online_friends()
        if not friends:
            log_and_print("No online friends found", "info")
            return False
        
        log_and_print(f"Inviting {len(friends)} online friend(s) to lobby...", "invite_start")
        
        invite_api_instance = invite_api.InviteApi(state.api_client)
        
        invited = 0
        failed = 0
        batch_size = 10
        
        for i in range(0, len(friends), batch_size):
            batch = friends[i:i + batch_size]
            for friend in batch:
                try:
                    invite_request = InviteRequest(
                        instance_id=state.current_room,
                        message_slot=0
                    )
                    invite_api_instance.invite_user(friend["id"], invite_request=invite_request)
                    log_and_print(f"✓ Invited {friend['displayName']}", "invite_success")
                    invited += 1
                except ApiException as e:
                    if e.status == 403:
                        log_and_print(f"✗ Cannot invite {friend['displayName']} (privacy settings)", "invite_fail")
                    else:
                        log_and_print(f"✗ Failed {friend['displayName']}: {e.status}", "invite_fail")
                    failed += 1
                except Exception as e:
                    log_and_print(f"✗ Error {friend['displayName']}: {str(e)}", "invite_error")
                    failed += 1
                time.sleep(1.5)
            
            if i + batch_size < len(friends):
                log_and_print("Friend invite batch sent. Cooling down 60s.", "rate_limit")
                time.sleep(60)
        
        log_and_print(f"Finished: {invited}/{len(friends)} friends invited", "invite_done")
        return True
    except Exception as e:
        log_and_print(f"Invite all error: {str(e)}", "error")
        return False
