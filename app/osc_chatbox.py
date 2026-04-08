import socket
import threading
import time
import json
from datetime import datetime, timedelta

from . import state
from .logging_store import log_and_print
from .auth import get_setting, set_setting
from .world_context import world_detail_from_location
from .trust_util import trust_rank_from_tags

OSC_IP = "127.0.0.1"
OSC_PORT = 9000

chatbox_enabled = False
chatbox_lines = []
chatbox_lock = threading.Lock()
send_thread = None


def get_osc_config():
    """Get OSC IP and port from settings with safe defaults."""
    ip = OSC_IP
    port = OSC_PORT
    try:
        ip_setting = get_setting("osc_ip", OSC_IP) or OSC_IP
        port_setting = get_setting("osc_port", str(OSC_PORT)) or str(OSC_PORT)
        ip = ip_setting
        try:
            port_int = int(port_setting)
            if 1 <= port_int <= 65535:
                port = port_int
        except ValueError:
            # Fall back to default port if stored value is invalid
            port = OSC_PORT
    except Exception as e:
        log_and_print(f"OSC config error: {str(e)}", "error")
    return ip, port


def send_osc_message(address, value):
    """Send OSC message to VRChat"""
    try:
        ip, port = get_osc_config()
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        
        # Build OSC message
        # OSC Address
        address_bytes = address.encode() + b'\x00'
        # Pad to multiple of 4
        while len(address_bytes) % 4 != 0:
            address_bytes += b'\x00'
        
        # OSC Type Tag String
        type_tag = b',s\x00\x00'  # string type
        
        # OSC Arguments (string value)
        value_bytes = value.encode() + b'\x00'
        # Pad to multiple of 4
        while len(value_bytes) % 4 != 0:
            value_bytes += b'\x00'
        
        message = address_bytes + type_tag + value_bytes
        sock.sendto(message, (ip, port))
        sock.close()
        return True
    except Exception as e:
        log_and_print(f"OSC send error: {str(e)}", "error")
        return False


def _osc_pad(data: bytes) -> bytes:
    while len(data) % 4:
        data += b"\x00"
    return data


def send_osc_chatbox_shrink_line(text: str) -> bool:
    """
    Small HUD / shrunk background: VRChat expects /chatbox/input with
    [text + \\x03\\x1f, True, False] (string + two booleans over OSC).
    """
    try:
        collapsed = (text or "") + "\x03\x1f"
        ip, port = get_osc_config()
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        address_bytes = _osc_pad(b"/chatbox/input\x00")
        type_tag = _osc_pad(b",sTF\x00")
        value_bytes = _osc_pad(collapsed.encode("utf-8") + b"\x00")
        message = address_bytes + type_tag + value_bytes
        sock.sendto(message, (ip, port))
        sock.close()
        return True
    except Exception as e:
        log_and_print(f"OSC chatbox shrink-line error: {str(e)}", "error")
        return False


def send_osc_chatbox_with_immediate(text, immediate=True):
    """Send chatbox message with immediate flag (doesn't open keyboard)"""
    try:
        import struct
        ip, port = get_osc_config()
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        
        # Build OSC message for /chatbox/input with string and bool parameters
        address = "/chatbox/input"
        address_bytes = address.encode() + b'\x00'
        # Pad to multiple of 4
        while len(address_bytes) % 4 != 0:
            address_bytes += b'\x00'
        
        # OSC Type Tag String: ,sT (string, True boolean) or ,sF (string, False boolean)
        if immediate:
            type_tag = b',sT\x00'  # string + True
        else:
            type_tag = b',sF\x00'  # string + False
        
        # OSC Arguments (string value)
        value_bytes = text.encode() + b'\x00'
        # Pad to multiple of 4
        while len(value_bytes) % 4 != 0:
            value_bytes += b'\x00'
        
        # Boolean values don't have data in OSC (just T or F in type tag)
        message = address_bytes + type_tag + value_bytes
        sock.sendto(message, (ip, port))
        sock.close()
        return True
    except Exception as e:
        log_and_print(f"OSC chatbox send error: {str(e)}", "error")
        return False


def process_chatbox_tags(text):
    """Replace tags with dynamic values"""
    if not text:
        return ""
    
    # Time-based tags
    now = datetime.now()
    text = text.replace("{time}", now.strftime("%H:%M:%S"))
    text = text.replace("{time_12}", now.strftime("%I:%M:%S %p"))
    text = text.replace("{date}", now.strftime("%Y-%m-%d"))
    text = text.replace("{date_short}", now.strftime("%m/%d"))
    
    # Active time (bot uptime - how long the app has been running)
    elapsed = time.time() - getattr(state, "app_start_time", time.time())
    if elapsed < 60:
        active_str = f"{int(elapsed)}s"
    elif elapsed < 3600:
        m, s = divmod(int(elapsed), 60)
        active_str = f"{m}m {s}s"
    elif elapsed < 86400:
        h, r = divmod(int(elapsed), 3600)
        m, _ = divmod(r, 60)
        active_str = f"{h}h {m}m"
    else:
        d, r = divmod(int(elapsed), 86400)
        h, r = divmod(r, 3600)
        m, _ = divmod(r, 60)
        active_str = f"{d}d {h}h {m}m"
    text = text.replace("{active_time}", active_str)
    
    # User info
    if state.current_user:
        u = state.current_user
        text = text.replace("{username}", u.display_name or "Unknown")
        text = text.replace("{display_name}", u.display_name or "Unknown")
        tags = getattr(u, "tags", []) or []
        _, tr_disp = trust_rank_from_tags(tags)
        text = text.replace("{trust_rank}", tr_disp)
        st = getattr(u, "status", "") or ""
        text = text.replace("{user_status}", str(st) or "—")
        sd = getattr(u, "status_description", "") or ""
        text = text.replace("{status_description}", str(sd) or "—")
        bio = getattr(u, "bio", "") or ""
        bio_s = bio.replace("\n", " ").strip()
        if len(bio_s) > 100:
            bio_s = bio_s[:97] + "…"
        text = text.replace("{bio_short}", bio_s or "—")
    else:
        text = text.replace("{username}", "Not logged in")
        text = text.replace("{display_name}", "Not logged in")
        for tag in ("{trust_rank}", "{user_status}", "{status_description}", "{bio_short}"):
            text = text.replace(tag, "—")

    with state.state_lock:
        pending_fr = state.pending_friend_requests
    text = text.replace("{pending_friend_requests}", str(pending_fr))
    
    # Lobby info
    with state.state_lock:
        lobby_users = list(state.lobby_users)
        text = text.replace("{lobby_count}", str(state.lobby_summary.get("others", 0)))
        text = text.replace("{lobby_total}", str(state.lobby_summary.get("total", 0)))
        names = ", ".join(
            str(u.get("name") or u.get("displayName") or "?") for u in lobby_users[:48]
        )
        text = text.replace("{lobby_names}", names or "—")
        text = text.replace("{lobby_list}", names or "—")

    # Current world (from logged-in user's location)
    try:
        client = getattr(state, "api_client", None)
        loc = getattr(state.current_user, "location", "") if state.current_user else ""
        wd = world_detail_from_location(client, loc) if client else None
        if wd:
            text = text.replace("{world_name}", str(wd.get("name") or "—"))
            text = text.replace("{world_author}", str(wd.get("author_name") or "—"))
            text = text.replace("{world_id}", str(wd.get("world_id") or "—"))
            text = text.replace("{instance}", str(wd.get("instance") or "—"))
            text = text.replace("{world_visits}", str(wd.get("visits") if wd.get("visits") is not None else "—"))
            text = text.replace("{world_capacity}", str(wd.get("capacity") if wd.get("capacity") is not None else "—"))
            text = text.replace("{world_heat}", str(wd.get("heat") if wd.get("heat") is not None else "—"))
            rel = str(wd.get("release_status") or wd.get("releaseStatus") or "—")
            text = text.replace("{world_release}", rel)
            desc = (wd.get("description") or "").replace("\n", " ").strip()
            if len(desc) > 120:
                desc = desc[:117] + "…"
            text = text.replace("{world_description}", desc or "—")
        else:
            for tag in (
                "{world_name}",
                "{world_author}",
                "{world_id}",
                "{instance}",
                "{world_visits}",
                "{world_capacity}",
                "{world_heat}",
                "{world_release}",
                "{world_description}",
            ):
                text = text.replace(tag, "—")
    except Exception:
        pass
    
    # Group member count (use cached value, never blank)
    try:
        from .group_cache import get_cached_member_count
        member_count = get_cached_member_count()
        text = text.replace("{group_member_count}", str(member_count))
    except:
        text = text.replace("{group_member_count}", "0")
    
    # Divider (14 chars for in-game chatbox width)
    text = text.replace("{divider}", "─" * 14)
    text = text.replace("{line}", "─" * 30)

    # Newline
    text = text.replace("{newline}", "\n")

    return text


def build_chatbox_message():
    """Build chatbox message from lines"""
    with chatbox_lock:
        if not chatbox_lines:
            return ""
        processed_lines = [process_chatbox_tags(line) for line in chatbox_lines]
        return "\n".join(processed_lines)


def chatbox_send_loop():
    """Background thread to continuously send chatbox messages"""
    global chatbox_enabled
    while True:
        try:
            if chatbox_enabled:
                shrink = get_setting("chatbox_shrink_background", "0") == "1"
                if shrink:
                    with chatbox_lock:
                        raw_lines = [ln for ln in chatbox_lines if ln and str(ln).strip()]
                    for line in raw_lines:
                        processed = process_chatbox_tags(line)
                        if processed.strip():
                            send_osc_chatbox_shrink_line(processed)
                            time.sleep(0.04)
                else:
                    message = build_chatbox_message()
                    if message:
                        send_osc_chatbox_with_immediate(message, True)
            time.sleep(5)  # Update every 5 seconds
        except Exception as e:
            log_and_print(f"Chatbox loop error: {str(e)}", "error")
            time.sleep(5)


def start_chatbox_thread():
    """Start the chatbox background thread"""
    global send_thread, chatbox_enabled, chatbox_lines
    
    # Load saved configuration on startup
    try:
        saved_enabled = get_setting("chatbox_enabled", "0")
        chatbox_enabled = saved_enabled == "1"
        
        saved_lines = get_setting("chatbox_lines", "[]")
        with chatbox_lock:
            chatbox_lines = json.loads(saved_lines) if saved_lines else []
        
        if chatbox_enabled:
            log_and_print(f"Chatbox restored: {len(chatbox_lines)} lines, enabled={chatbox_enabled}", "info")
    except Exception as e:
        log_and_print(f"Chatbox restore error: {str(e)}", "error")
    
    if send_thread is None or not send_thread.is_alive():
        send_thread = threading.Thread(target=chatbox_send_loop, daemon=True)
        send_thread.start()
        log_and_print("Chatbox OSC thread started", "info")


def set_chatbox_enabled(enabled):
    """Enable or disable chatbox sending"""
    global chatbox_enabled
    chatbox_enabled = enabled
    set_setting("chatbox_enabled", "1" if enabled else "0")
    if enabled:
        start_chatbox_thread()
        log_and_print("Chatbox enabled", "info")
    else:
        log_and_print("Chatbox disabled", "info")


def set_chatbox_lines(lines):
    """Set the chatbox lines"""
    global chatbox_lines
    with chatbox_lock:
        chatbox_lines = [line for line in lines if line]  # Filter empty lines
        # Save to database
        try:
            set_setting("chatbox_lines", json.dumps(chatbox_lines))
        except Exception as e:
            log_and_print(f"Chatbox save error: {str(e)}", "error")


def get_chatbox_config():
    """Get current chatbox configuration"""
    ip, port = get_osc_config()
    shrink_bg = get_setting("chatbox_shrink_background", "0") == "1"
    with chatbox_lock:
        return {
            "enabled": chatbox_enabled,
            "lines": list(chatbox_lines),
            "osc_ip": ip,
            "osc_port": port,
            "shrink_background": shrink_bg,
        }
