import time
from vrchatapi.exceptions import ApiException

from . import state
from .logging_store import log_and_print


def invite_user_to_event(event_id, user_id, display_name):
    """Invite a user to a VRChat event"""
    try:
        # VRChat events use instance IDs similar to worlds
        # The event ID format is typically like: eventId~region(instanceId):nonce~hidden(userId)~region(instanceId)
        # For simplicity, we'll use the invite API with the event instance
        from vrchatapi.api import invite_api
        from vrchatapi.models.invite_request import InviteRequest
        
        if not state.api_client:
            return False, "Not logged in"
        
        invite_api_instance = invite_api.InviteApi(state.api_client)
        
        # Create invite request for the event instance
        invite_request = InviteRequest(
            instance_id=event_id,
            message_slot=0
        )
        
        invite_api_instance.invite_user(user_id, invite_request=invite_request)
        return True, "Success"
    except ApiException as e:
        error_msg = str(e.body) if hasattr(e, "body") else str(e)
        if e.status == 403:
            return False, "Cannot invite (privacy/permissions)"
        return False, error_msg
    except Exception as e:
        return False, str(e)


def batch_invite_to_event(event_id, user_list):
    """Invite multiple users to an event in batches"""
    if not event_id:
        log_and_print("No event ID provided", "error")
        return
    
    count = len(user_list)
    log_and_print(f"Inviting {count} user(s) to event...", "event_invite_start")
    
    invited = 0
    failed = 0
    batch_size = 10
    
    for i in range(0, len(user_list), batch_size):
        batch = user_list[i:i + batch_size]
        
        for user in batch:
            user_id = user.get("id")
            display_name = user.get("name", "Unknown")
            
            try:
                success, msg = invite_user_to_event(event_id, user_id, display_name)
                if success:
                    log_and_print(f"✓ Event invite sent to {display_name}", "event_invite_success")
                    invited += 1
                else:
                    log_and_print(f"✗ Event invite failed for {display_name}: {msg}", "event_invite_fail")
                    failed += 1
            except Exception as e:
                log_and_print(f"✗ Event invite error for {display_name}: {str(e)}", "event_invite_error")
                failed += 1
            
            time.sleep(1.5)
        
        # Cool down between batches
        if i + batch_size < len(user_list):
            log_and_print("Event invite batch sent. Cooling down 60s.", "rate_limit")
            time.sleep(60)
    
    log_and_print(f"Event invites finished: {invited}/{count} invited", "event_invite_done")
