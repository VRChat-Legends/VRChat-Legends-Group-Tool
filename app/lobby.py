import glob
import json
import os
import re
import threading
import time
from datetime import datetime, timedelta
import psutil

import vrchatapi
from vrchatapi.api import groups_api
from vrchatapi.exceptions import ApiException
from vrchatapi.models.create_group_invite_request import CreateGroupInviteRequest

from . import state
from .config import GROUP_ID, USER_IDS_FILE, USER_AGENT
from .auth import get_setting
from .analytics import increment_metric, mark_last_invite_run
from .logging_store import log_and_print


def get_latest_log_file():
    log_dir = os.path.expanduser(r"~\AppData\LocalLow\VRChat\VRChat")
    if not os.path.exists(log_dir):
        raise Exception("VRChat log directory not found.")
    log_files = glob.glob(os.path.join(log_dir, "output_log_*.txt"))
    if not log_files:
        raise Exception("No VRChat log files found.")
    return max(log_files, key=os.path.getmtime)


def parse_current_lobby_info():
    try:
        with open(get_latest_log_file(), "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
    except Exception:
        return None, {}

    joining_regex = re.compile(r"Joining (wrld_.+)|Entering Room: (.+)")
    joined_regex = re.compile(r"OnPlayerJoined\s+(.+?)(?:\s+\((usr_[a-f0-9\-]+)\))?$")
    left_regex = re.compile(r"OnPlayerLeft\s+(.+?)(?:\s+\((usr_[a-f0-9\-]+)\))?$")

    last_join_index = -1
    current_room_str = None
    for i, line in enumerate(lines):
        match = joining_regex.search(line)
        if match:
            last_join_index = i
            current_room_str = match.group(1) if match.group(1) else match.group(2)

    if last_join_index == -1:
        return None, {}

    current_users = {}
    for line in lines[last_join_index + 1:]:
        joined_match = joined_regex.search(line)
        if joined_match:
            display_name = joined_match.group(1).strip()
            user_id = joined_match.group(2) if joined_match.lastindex >= 2 and joined_match.group(2) else None
            current_users[display_name] = user_id
            continue

        left_match = left_regex.search(line)
        if left_match:
            display_name = left_match.group(1).strip()
            current_users.pop(display_name, None)

    return current_room_str, current_users


def update_lobby_list(users_dict, self_name):
    others = sorted([u for u in users_dict.keys() if u != self_name])
    entries = []
    for user in others:
        user_id = users_dict.get(user)
        entries.append({
            "name": user,
            "id_suffix": user_id[-4:] if user_id else None
        })
    with state.state_lock:
        state.lobby_users[:] = entries


def get_user_id_from_display_name(display_name, known_user_id=None):
    if known_user_id:
        return known_user_id
    try:
        results = state.users_api_instance.search_users(search=display_name, n=10)
        for user in results:
            if user.display_name == display_name:
                return user.id
        if results:
            return results[0].id
        raise Exception(f"No user found matching '{display_name}'")
    except ApiException as e:
        raise Exception(f"API error searching for user: {e}")


def invite_user_to_group(groups_api_instance, group_id, user_id, display_name):
    try:
        request = CreateGroupInviteRequest(user_id=user_id, confirm_override_block=True)
        groups_api_instance.create_group_invite(group_id, create_group_invite_request=request)
        return True, "Success"
    except ApiException as e:
        error_msg = str(e.body) if hasattr(e, "body") else str(e)
        if e.status == 400 and "already" in error_msg.lower():
            return True, "Already invited/member"
        return False, error_msg


def load_invite_history():
    history = {}
    if not os.path.exists(USER_IDS_FILE):
        return history
    try:
        with open(USER_IDS_FILE, "r", encoding="utf-8") as f:
            users = json.load(f)
        for entry in users:
            user_id = entry.get("userId")
            invited_at = entry.get("invitedAt")
            if user_id and invited_at:
                try:
                    history[user_id] = datetime.fromisoformat(invited_at)
                except ValueError:
                    continue
    except Exception:
        return history
    return history


def save_invited_user(user_id, display_name):
    if user_id in state.invited_users:
        return
    state.invited_users.add(user_id)
    entry = {
        "userId": user_id,
        "displayName": display_name,
        "profileUrl": f"https://vrchat.com/home/user/{user_id}",
        "invitedAt": time.strftime("%Y-%m-%dT%H:%M:%S")
    }
    try:
        users = []
        if os.path.exists(USER_IDS_FILE):
            with open(USER_IDS_FILE, "r", encoding="utf-8") as f:
                users = json.load(f)
        users.append(entry)
        with open(USER_IDS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2)
    except Exception:
        pass


def clear_invited_users():
    state.invited_users.clear()
    try:
        if os.path.exists(USER_IDS_FILE):
            os.remove(USER_IDS_FILE)
    except Exception:
        pass


def do_invite_lobby(users_to_invite, room=None):
    self_name = state.current_user.display_name if state.current_user else ""

    if isinstance(users_to_invite, list):
        users_to_invite = {name: None for name in users_to_invite}

    to_invite = {name: uid for name, uid in users_to_invite.items() if name != self_name}
    if not to_invite:
        return

    count = len(to_invite)
    log_and_print(f"Inviting {count} user(s)...", "invite_start")

    group_id = get_setting("group_id", GROUP_ID)
    cooldown = timedelta(days=3)
    history = load_invite_history()
    groups_api_instance = state.groups_api_instance

    pending = []
    skipped = 0
    for name, known_id in to_invite.items():
        try:
            uid = get_user_id_from_display_name(name, known_id)
            log_and_print(f"Resolved {name} -> {uid}", "debug")
            last_invite = history.get(uid)
            if last_invite and datetime.utcnow() - last_invite < cooldown:
                skipped += 1
                log_and_print(f"Skipped {name} (invited within 3 days).", "info")
                continue
            pending.append((name, uid))
        except Exception as e:
            log_and_print(f"✗ Error {name}: {str(e)}", "invite_error")

    batch_size = 10
    invited = 0
    failed = 0
    for i in range(0, len(pending), batch_size):
        batch = pending[i:i + batch_size]
        with state.state_lock:
            state.current_invite_batch = [name for name, _ in batch]
        for idx, (name, uid) in enumerate(batch):
            try:
                success, msg = invite_user_to_group(groups_api_instance, group_id, uid, name)
                if success:
                    save_invited_user(uid, name)
                    log_and_print(f"✓ Invited {name}", "invite_success")
                    invited += 1
                else:
                    log_and_print(f"✗ Failed {name}: {msg}", "invite_fail")
                    failed += 1
            except Exception as e:
                log_and_print(f"✗ Error {name}: {str(e)}", "invite_error")
                failed += 1
            time.sleep(1.5)

        if i + batch_size < len(pending):
            log_and_print("Invite batch sent. Cooling down 60s.", "rate_limit")
            time.sleep(60)

    with state.state_lock:
        state.current_invite_batch = []
    if invited:
        increment_metric("invites_sent", invited)
    if failed:
        increment_metric("invites_failed", failed)
    if skipped:
        increment_metric("invites_skipped_cooldown", skipped)
    mark_last_invite_run()

    log_and_print(f"Finished: {invited}/{count} invited", "invite_done")


def get_auto_invite_enabled():
    if get_setting("safe_mode", "0") == "1":
        return False
    return state.auto_invite_enabled


def is_vrchat_running():
    """Check if VRChat process is running"""
    try:
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                proc_name = proc.info['name'].lower()
                if 'vrchat' in proc_name or proc_name == 'vrchat.exe':
                    return True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        return False
    except Exception:
        return False


def update_lobby_count():
    initial_delay_passed = False
    last_room_time = 0

    while True:
        try:
            # Always try to read logs, even if VRChat not running
            log_dir = os.path.expanduser(r"~\AppData\LocalLow\VRChat\VRChat")
            vrchat_running = is_vrchat_running()
            
            if not vrchat_running:
                state.lobby_status = "not_running"
                # Still try to read logs if directory exists
                if os.path.exists(log_dir):
                    try:
                        room, users_dict = parse_current_lobby_info()
                        if room and users_dict:
                            self_name = state.current_user.display_name if state.current_user else ""
                            others = {u: uid for u, uid in users_dict.items() if u != self_name}
                            with state.state_lock:
                                state.lobby_summary["total"] = len(users_dict)
                                state.lobby_summary["others"] = len(others)
                            update_lobby_list(users_dict, self_name)
                    except:
                        pass
                time.sleep(8)
                continue
            
            if not os.path.exists(log_dir):
                state.lobby_status = "not_running"
                time.sleep(8)
                continue
            room, users_dict = parse_current_lobby_info()
            self_name = state.current_user.display_name if state.current_user else ""

            if not room:
                state.lobby_status = "not_running"
                time.sleep(8)
                continue

            if room and room != state.current_room:
                state.current_room = room
                state.lobby_status = "running"
                state.known_users_in_room.clear()
                initial_delay_passed = False
                last_room_time = time.time()
                log_and_print(f"Entered new instance: {room}", "instance_change")

            if room and users_dict:
                state.lobby_status = "running"
                others = {u: uid for u, uid in users_dict.items() if u != self_name}
                with state.state_lock:
                    state.lobby_summary["total"] = len(users_dict)
                    state.lobby_summary["others"] = len(others)
                update_lobby_list(users_dict, self_name)

                if not initial_delay_passed and time.time() - last_room_time >= 15:
                    if others and get_auto_invite_enabled():
                        log_and_print(
                            f"Auto-inviting entire initial lobby ({len(others)} users)",
                            "auto_lobby_invite"
                        )
                        do_invite_lobby(others, room)
                    state.known_users_in_room.update(others.keys())
                    initial_delay_passed = True
                    log_and_print("Initial lobby processed", "lobby_init")

                if initial_delay_passed:
                    new_joiners = {
                        u: uid for u, uid in others.items() if u not in state.known_users_in_room
                    }
                    if new_joiners:
                        # Send Discord notifications for new joiners
                        try:
                            from .discord_webhook import send_discord_embed, get_discord_config
                            discord_config = get_discord_config()
                            if discord_config.get("enabled"):
                                for name, uid in new_joiners.items():
                                    try:
                                        user_info = {
                                            "displayName": name,
                                            "id": uid or "Unknown",
                                            "trustLevel": "Unknown",
                                            "platform": "Unknown"
                                        }
                                        # Try to get full user info
                                        if uid and state.users_api_instance:
                                            try:
                                                user = state.users_api_instance.get_user(uid)
                                                user_info["displayName"] = user.display_name
                                                user_info["bio"] = getattr(user, "bio", "")
                                                user_info["avatarUrl"] = getattr(user, "current_avatar_image_url", "") or ""
                                                user_info["platform"] = getattr(user, "last_platform", "Unknown")
                                                user_info["avatarId"] = getattr(user, "current_avatar", "")
                                                tags = getattr(user, "tags", [])
                                                trust_tag = next((t for t in tags if "trust_" in t), None)
                                                if trust_tag:
                                                    user_info["trustLevel"] = trust_tag.replace("system_trust_", "").title()
                                            except:
                                                pass
                                        send_discord_embed(user_info, "joined")
                                    except Exception as e:
                                        log_and_print(f"Discord notification error for {name}: {str(e)}", "error")
                        except:
                            pass
                        
                        if new_joiners and get_auto_invite_enabled():
                            names = ", ".join(
                                f"{n} ({uid[-4:] if uid else 'no-id'})" for n, uid in new_joiners.items()
                            )
                            log_and_print(f"New joiner(s): {names}", "new_joiners")
                            do_invite_lobby(new_joiners, room)
                            # Auto event invite: send calendar/event invite to new joiners if enabled
                            event_id = get_setting("event_id", "")
                            if event_id and getattr(state, "auto_event_invite_enabled", False):
                                try:
                                    from .event_invites import batch_invite_to_event
                                    user_list = [{"id": uid or "", "name": n} for n, uid in new_joiners.items() if uid]
                                    if user_list:
                                        threading.Thread(
                                            target=batch_invite_to_event,
                                            args=(event_id, user_list),
                                            daemon=True
                                        ).start()
                                except Exception:
                                    pass
                    state.known_users_in_room.update(new_joiners.keys())
                    
                    # Check for users who left
                    current_names = set(others.keys())
                    left_users = state.known_users_in_room - current_names
                    if left_users:
                        try:
                            from .discord_webhook import send_discord_embed, get_discord_config
                            discord_config = get_discord_config()
                            if discord_config.get("enabled"):
                                for name in left_users:
                                    try:
                                        user_info = {"displayName": name, "id": "Unknown", "trustLevel": "Unknown", "platform": "Unknown"}
                                        send_discord_embed(user_info, "left")
                                    except:
                                        pass
                        except:
                            pass
                        state.known_users_in_room -= left_users

        except Exception as e:
            log_and_print(f"Lobby scan error: {str(e)}", "error")
        time.sleep(8)


def invite_lobby_to_group():
    try:
        room, users_dict = parse_current_lobby_info()
        if not room:
            log_and_print("Not in a world.", "error")
            return False
        others = {u: uid for u, uid in users_dict.items() if u != state.current_user.display_name}
        if not others:
            log_and_print("No other users in lobby.", "info")
            return False
        threading.Thread(target=do_invite_lobby, args=(others, room), daemon=True).start()
        state.known_users_in_room.update(others.keys())
        return True
    except Exception as e:
        log_and_print(f"Invite error: {str(e)}", "error")
        return False


def send_friend_request_to_user(user_id, display_name):
    try:
        from vrchatapi.api import friends_api
        if not state.friends_api_instance:
            state.friends_api_instance = friends_api.FriendsApi(state.api_client)
        state.friends_api_instance.friend(user_id)
        return True, "Success"
    except ApiException as e:
        error_msg = str(e.body) if hasattr(e, "body") else str(e)
        if e.status == 400 and "already" in error_msg.lower():
            return True, "Already friends/requested"
        return False, error_msg
    except Exception as e:
        return False, str(e)


def friend_lobby_to_users():
    try:
        room, users_dict = parse_current_lobby_info()
        if not room:
            log_and_print("Not in a world.", "error")
            return False
        others = {u: uid for u, uid in users_dict.items() if u != state.current_user.display_name}
        if not others:
            log_and_print("No other users in lobby.", "info")
            return False
        
        count = len(others)
        log_and_print(f"Sending friend requests to {count} user(s)...", "friend_start")
        
        friended = 0
        failed = 0
        batch_size = 10
        
        pending = []
        for name, known_id in others.items():
            try:
                uid = get_user_id_from_display_name(name, known_id)
                pending.append((name, uid))
            except Exception as e:
                log_and_print(f"✗ Error resolving {name}: {str(e)}", "friend_error")
        
        for i in range(0, len(pending), batch_size):
            batch = pending[i:i + batch_size]
            for name, uid in batch:
                try:
                    success, msg = send_friend_request_to_user(uid, name)
                    if success:
                        log_and_print(f"✓ Sent friend request to {name}", "friend_success")
                        friended += 1
                    else:
                        log_and_print(f"✗ Failed {name}: {msg}", "friend_fail")
                        failed += 1
                except Exception as e:
                    log_and_print(f"✗ Error {name}: {str(e)}", "friend_error")
                    failed += 1
                time.sleep(1.5)
            
            if i + batch_size < len(pending):
                log_and_print("Friend request batch sent. Cooling down 60s.", "rate_limit")
                time.sleep(60)
        
        log_and_print(f"Finished: {friended}/{count} friend requests sent", "friend_done")
        return True
    except Exception as e:
        log_and_print(f"Friend error: {str(e)}", "error")
        return False
