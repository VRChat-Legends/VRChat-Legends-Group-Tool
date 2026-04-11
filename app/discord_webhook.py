import json
import threading
import requests
from datetime import datetime

from . import state
from .auth import get_setting, set_setting
from .logging_store import log_and_print
from .secrets import encrypt_secret, decrypt_secret

discord_enabled = False
discord_webhook_url = None
discord_lock = threading.Lock()

# Tags for embed builder: replaced with user/action info when sending
DISCORD_EMBED_TAGS = {
    "display_name": "User's display name",
    "username": "Username (@handle)",
    "user_id": "User ID (usr_...)",
    "id": "Same as user_id",
    "trust_level": "Trust rank",
    "platform": "Last platform (e.g. standalonewindows)",
    "bio": "User bio (truncated)",
    "avatar_url": "In-game avatar image URL",
    "avatar_id": "Current avatar ID",
    "action": "joined or left",
    "action_title": "Joined or Left (capitalized)",
    "timestamp": "ISO timestamp",
    "time": "Current time (HH:MM:SS)",
    "time_12": "Current time (12h)",
    "date": "Current date (YYYY-MM-DD)",
    "date_long": "Current date (Month DD, YYYY)",
    "day_of_week": "Day of week (Monday, etc.)",
    "lobby_count": "Others in lobby",
    "lobby_total": "Total in lobby",
    "world_name": "Current world name",
    "world_author": "World author",
    "group_name": "Group name",
    "group_member_count": "Group member count",
    "friends_online": "Friends online count",
    "mod_action": "Moderation action (kick/ban/remove/warn)",
    "mod_action_title": "Action label (e.g. Banned from Group)",
    "mod_reason": "Reason / warning message",
}

def _replace_tags(text, user_info, action):
    if not text or not isinstance(text, str):
        return text
    from . import state
    now = datetime.now()
    ts = datetime.utcnow().isoformat()
    action_title = action.capitalize() if action else ""
    repl = {
        "{display_name}": user_info.get("displayName", "Unknown"),
        "{username}": user_info.get("username", ""),
        "{user_id}": user_info.get("id", "Unknown"),
        "{id}": user_info.get("id", "Unknown"),
        "{trust_level}": user_info.get("trustLevel", ""),
        "{platform}": user_info.get("platform", ""),
        "{bio}": (user_info.get("bio") or "No bio")[:500],
        "{avatar_url}": user_info.get("avatarUrl", ""),
        "{avatar_id}": user_info.get("avatarId", ""),
        "{action}": action,
        "{action_title}": action_title,
        "{mod_action}": user_info.get("_mod_action", action),
        "{mod_action_title}": user_info.get("_mod_action_title", action_title),
        "{mod_reason}": user_info.get("_mod_reason", ""),
        "{timestamp}": ts,
        "{time}": now.strftime("%H:%M:%S"),
        "{time_12}": now.strftime("%I:%M:%S %p"),
        "{date}": now.strftime("%Y-%m-%d"),
        "{date_long}": now.strftime("%B %d, %Y"),
        "{day_of_week}": now.strftime("%A"),
    }

    # Lobby info
    try:
        with state.state_lock:
            repl["{lobby_count}"] = str(state.lobby_summary.get("others", 0))
            repl["{lobby_total}"] = str(state.lobby_summary.get("total", 0))
    except Exception:
        repl["{lobby_count}"] = "0"
        repl["{lobby_total}"] = "0"

    # World info
    try:
        from .world_context import world_detail_from_location
        client = getattr(state, "api_client", None)
        loc = getattr(state.current_user, "location", "") if state.current_user else ""
        wd = world_detail_from_location(client, loc) if client else None
        repl["{world_name}"] = str(wd.get("name", "")) if wd else ""
        repl["{world_author}"] = str(wd.get("author_name", "")) if wd else ""
    except Exception:
        repl["{world_name}"] = ""
        repl["{world_author}"] = ""

    # Group info
    try:
        from .group_cache import get_cached_group_data, get_cached_member_count
        gd = get_cached_group_data() or {}
        repl["{group_name}"] = str(gd.get("name") or "")
        repl["{group_member_count}"] = str(get_cached_member_count())
    except Exception:
        repl["{group_name}"] = ""
        repl["{group_member_count}"] = "0"

    # Friends online
    try:
        from .friends_cache import get_cached_friends
        friends_data = get_cached_friends()
        repl["{friends_online}"] = str(sum(1 for f in friends_data if (f.get("status") or "offline") != "offline"))
    except Exception:
        repl["{friends_online}"] = "0"

    for tag, val in repl.items():
        text = text.replace(tag, str(val))
    return text


def _embed_apply_tags(obj, user_info, action):
    """Recursively replace tags in embed template (strings only)."""
    if isinstance(obj, dict):
        return {k: _embed_apply_tags(v, user_info, action) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_embed_apply_tags(i, user_info, action) for i in obj]
    if isinstance(obj, str):
        return _replace_tags(obj, user_info, action)
    return obj


def _embed_from_template(template, user_info, action):
    """Build Discord embed from template dict; apply tags and Discord limits."""
    if not template:
        return None
    embed = _embed_apply_tags(json.loads(json.dumps(template)), user_info, action)
    # Discord limits
    if embed.get("title") and len(embed["title"]) > 256:
        embed["title"] = embed["title"][:256]
    if embed.get("description") and len(embed["description"]) > 4096:
        embed["description"] = embed["description"][:4096]
    if embed.get("fields"):
        embed["fields"] = embed["fields"][:25]
        for f in embed["fields"]:
            if f.get("name") and len(f["name"]) > 256:
                f["name"] = f["name"][:256]
            if f.get("value") and len(f["value"]) > 1024:
                f["value"] = f["value"][:1024]
    if embed.get("footer", {}).get("text") and len(embed["footer"]["text"]) > 2048:
        embed["footer"]["text"] = embed["footer"]["text"][:2048]
    if embed.get("author", {}).get("name") and len(embed["author"]["name"]) > 256:
        embed["author"]["name"] = embed["author"]["name"][:256]
    if embed.get("timestamp") is True:
        embed["timestamp"] = datetime.utcnow().isoformat()
    elif embed.get("timestamp") is False:
        embed.pop("timestamp", None)
    return embed


def set_discord_enabled(enabled):
    """Enable or disable Discord webhook"""
    global discord_enabled
    with discord_lock:
        discord_enabled = enabled
        set_setting("discord_enabled", "1" if enabled else "0")
    log_and_print(f"Discord webhook {'enabled' if enabled else 'disabled'}", "info")


def set_discord_webhook(url):
    """Set Discord webhook URL"""
    global discord_webhook_url
    with discord_lock:
        discord_webhook_url = url
        set_setting("discord_webhook_url", url or "")
    log_and_print("Discord webhook URL updated", "info")


def get_discord_embed_templates():
    """Return saved embed templates for join and leave (JSON dicts or None)."""
    join_s = get_setting("discord_embed_join", "")
    leave_s = get_setting("discord_embed_leave", "")
    join = json.loads(join_s) if join_s else None
    leave = json.loads(leave_s) if leave_s else None
    return join, leave


def get_discord_mod_templates():
    """Return saved moderation embed templates {action: embed_dict}."""
    raw = get_setting("discord_mod_templates", "")
    if raw:
        try:
            return json.loads(raw)
        except (TypeError, ValueError):
            pass
    return {}


def set_discord_mod_templates(templates):
    """Save moderation embed templates dict."""
    set_setting("discord_mod_templates", json.dumps(templates) if templates else "")


def set_discord_embed_templates(embed_join=None, embed_leave=None):
    """Save embed templates (dicts → JSON strings)."""
    if embed_join is not None:
        set_setting("discord_embed_join", json.dumps(embed_join) if embed_join else "")
    if embed_leave is not None:
        set_setting("discord_embed_leave", json.dumps(embed_leave) if embed_leave else "")


def get_discord_bot_token():
    """Get Discord bot token (decrypted). Returns masked value for display."""
    enc = get_setting("discord_bot_token_enc", "")
    if not enc:
        return ""
    raw = decrypt_secret(enc)
    if not raw:
        return ""
    return raw[:8] + "..." + raw[-4:] if len(raw) > 12 else "***"


def set_discord_bot_token(token):
    """Store Discord bot token (encrypted). Pass empty to clear."""
    if token:
        set_setting("discord_bot_token_enc", encrypt_secret(token.strip()))
    else:
        set_setting("discord_bot_token_enc", "")


def get_discord_bot_token_raw():
    """Get raw Discord bot token for bot use (decrypted)."""
    enc = get_setting("discord_bot_token_enc", "")
    return decrypt_secret(enc) if enc else ""


def get_gemini_api_key():
    """Get Gemini API key (masked for display)."""
    enc = get_setting("gemini_api_key_enc", "")
    if not enc:
        return ""
    raw = decrypt_secret(enc)
    if not raw:
        return ""
    return raw[:7] + "..." + raw[-4:] if len(raw) > 11 else "***"


def set_gemini_api_key(key):
    """Store Gemini API key (encrypted)."""
    if key:
        set_setting("gemini_api_key_enc", encrypt_secret(key.strip()))
    else:
        set_setting("gemini_api_key_enc", "")


def get_gemini_api_key_raw():
    """Get raw Gemini API key for API use."""
    enc = get_setting("gemini_api_key_enc", "")
    return decrypt_secret(enc) if enc else ""


def _parse_welcome_embed(s):
    """Parse welcome embed JSON; return dict or None."""
    if not s or not isinstance(s, str):
        return None
    try:
        return json.loads(s)
    except (TypeError, ValueError):
        return None


def set_discord_welcome(enabled=None, channel_id=None, embed_json=None):
    """Configure Discord welcome system."""
    if enabled is not None:
        set_setting("discord_welcome_enabled", "1" if enabled else "0")
    if channel_id is not None:
        set_setting("discord_welcome_channel_id", str(channel_id).strip())
    if embed_json is not None:
        set_setting("discord_welcome_embed", embed_json if isinstance(embed_json, str) else json.dumps(embed_json) if embed_json else "")


def get_discord_config():
    """Get Discord webhook configuration and embed templates"""
    with discord_lock:
        join, leave = get_discord_embed_templates()
        return {
            "enabled": discord_enabled,
            "webhook_url": discord_webhook_url or get_setting("discord_webhook_url", ""),
            "embed_join": join,
            "embed_leave": leave,
            "embed_tags": DISCORD_EMBED_TAGS,
            "mod_templates": get_discord_mod_templates(),
            "discord_bot_token_masked": get_discord_bot_token(),
            "gemini_api_key_masked": get_gemini_api_key(),
            "discord_welcome_enabled": get_setting("discord_welcome_enabled", "0") == "1",
            "discord_welcome_channel_id": get_setting("discord_welcome_channel_id", ""),
            "discord_welcome_embed": _parse_welcome_embed(get_setting("discord_welcome_embed", "")),
        }


def load_discord_config():
    """Load Discord config from settings"""
    global discord_enabled, discord_webhook_url
    with discord_lock:
        discord_enabled = get_setting("discord_enabled", "0") == "1"
        discord_webhook_url = get_setting("discord_webhook_url", "")


def _default_embed_join():
    return {
        "title": "User {action_title} Lobby",
        "color": 0x48bb78,
        "timestamp": True,
        "fields": [
            {"name": "Display Name", "value": "{display_name}", "inline": True},
            {"name": "User ID", "value": "{user_id}", "inline": True},
            {"name": "Trust Level", "value": "{trust_level}", "inline": True},
            {"name": "Platform", "value": "{platform}", "inline": True},
        ],
        "thumbnail": {"url": "{avatar_url}"},
    }


def _default_embed_leave():
    return {
        "title": "User Left Lobby",
        "color": 0xf56565,
        "timestamp": True,
        "fields": [
            {"name": "Display Name", "value": "{display_name}", "inline": True},
            {"name": "User ID", "value": "{user_id}", "inline": True},
        ],
    }


def send_discord_embed(user_info, action="joined"):
    """Send user join/leave notification to Discord (custom embed or default)."""
    if not discord_enabled or not discord_webhook_url:
        return
    try:
        join_t, leave_t = get_discord_embed_templates()
        template = join_t if action == "joined" else leave_t
        if template:
            embed = _embed_from_template(template, user_info, action)
        else:
            default = _default_embed_join() if action == "joined" else _default_embed_leave()
            default["title"] = f"User {action.capitalize()} Lobby" if action in ["joined", "left"] else f"User {action}"
            embed = _embed_from_template(default, user_info, action)
        if not embed:
            return
        payload = {"embeds": [embed]}
        webhook_url = discord_webhook_url

        def send_async():
            try:
                response = requests.post(webhook_url, json=payload, timeout=5)
                if response.status_code not in [200, 204]:
                    log_and_print(f"Discord webhook error: {response.status_code}", "error")
            except Exception as e:
                log_and_print(f"Discord webhook send error: {str(e)}", "error")

        threading.Thread(target=send_async, daemon=True).start()
    except Exception as e:
        log_and_print(f"Discord embed error: {str(e)}", "error")


def send_discord_moderation(action, user_id, display_name=None, message=None):
    """Send moderation action (kick/ban/remove/warn) to Discord webhook."""
    if not discord_enabled or not discord_webhook_url:
        return
    action_labels = {
        "kick": ("Kicked from Lobby", 0xf59e0b),
        "ban": ("Banned from Group", 0xef4444),
        "remove": ("Removed from Group", 0xed8936),
        "warn": ("Warned in Lobby", 0xeab308),
    }
    if action not in action_labels:
        return
    title, color = action_labels[action]
    try:
        # Build a user_info dict so _replace_tags can resolve all standard tags
        user_info = {
            "displayName": display_name or "Unknown",
            "username": "",
            "id": user_id or "Unknown",
            "trustLevel": "",
            "platform": "",
            "bio": "",
            "avatarUrl": "",
            "avatarId": "",
            "_mod_action": action,
            "_mod_action_title": title,
            "_mod_reason": (message or "")[:1024],
        }

        # Check for saved custom template
        mod_templates = get_discord_mod_templates()
        custom_template = mod_templates.get(action)

        if custom_template:
            embed = _embed_from_template(custom_template, user_info, action)
        else:
            # Default hardcoded embed
            embed = {
                "title": title,
                "color": color,
                "timestamp": datetime.utcnow().isoformat(),
                "fields": [
                    {"name": "User ID", "value": user_id or "Unknown", "inline": True},
                    {"name": "Display Name", "value": (display_name or "Unknown")[:256], "inline": True},
                ],
            }
            if message and action == "warn":
                embed["fields"].append({"name": "Warning Message", "value": (message or "")[:1024], "inline": False})

        if not embed:
            return
        payload = {"embeds": [embed]}
        webhook_url = discord_webhook_url

        def send_async():
            try:
                response = requests.post(webhook_url, json=payload, timeout=5)
                if response.status_code not in [200, 204]:
                    log_and_print(f"Discord webhook error: {response.status_code}", "error")
            except Exception as e:
                log_and_print(f"Discord moderation log error: {str(e)}", "error")

        threading.Thread(target=send_async, daemon=True).start()
    except Exception as e:
        log_and_print(f"Discord moderation embed error: {str(e)}", "error")
