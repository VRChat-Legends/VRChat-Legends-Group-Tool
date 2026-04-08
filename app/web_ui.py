import json
import os
import subprocess
import threading
import time
import urllib.request
from datetime import datetime

from flask import Flask, request, jsonify, redirect, url_for, render_template_string, send_from_directory

from . import state
from .auth import (
    load_auth,
    load_remember_me,
    store_remember_me,
    clear_remember_me,
    login_start,
    login_submit_2fa,
    list_auth_entries,
    upsert_auth_entry,
    delete_auth_entry,
    get_setting,
    set_setting,
    list_all_settings,
)
from .friend_requests import poll_friend_requests
from .lobby import update_lobby_count, invite_lobby_to_group, clear_invited_users, friend_lobby_to_users, get_user_id_from_display_name, get_latest_log_file, parse_current_lobby_info
from .logging_store import log_and_print, clear_logs
from .analytics import snapshot_metrics
from .config import REPO_ROOT, GROUP_ID, FRONTEND_DIST, USE_REACT_UI, INSTALL_DIR, DATA_DIR, APP_FAVORITES_FILE, BLOCKED_USERS_FILE, USER_IDS_FILE
from .trust_util import trust_rank_from_tags as _trust_rank_from_tags
from . import windows_startup
import sys
from .friends import invite_all_online_friends_to_lobby
from .friends_cache import get_cached_friends, update_friends_cache
from .group_cache import update_group_cache, get_cached_member_count
from .osc_chatbox import get_chatbox_config, set_chatbox_enabled, set_chatbox_lines, process_chatbox_tags
from .discord_webhook import (
    get_discord_config,
    set_discord_enabled,
    set_discord_webhook,
    set_discord_bot_token,
    set_openai_api_key,
    set_discord_welcome,
    load_discord_config,
    send_discord_moderation,
)
app = Flask(__name__)

def _windows_desktop_dir():
    """Resolve the user's Desktop folder (handles OneDrive redirect)."""
    if sys.platform != "win32":
        return None
    try:
        import ctypes

        buf = ctypes.create_unicode_buffer(260)
        # CSIDL_DESKTOP = 0x10
        if ctypes.windll.shell32.SHGetFolderPathW(None, 0x10, None, 0, buf) == 0:
            p = buf.value
            if p and os.path.isdir(p):
                return p
    except Exception:
        pass
    up = os.environ.get("USERPROFILE", "")
    if up:
        fallback = os.path.join(up, "Desktop")
        if os.path.isdir(fallback):
            return fallback
    return None


def _user_to_card(user):
    """Build full user card dict from VRChat User model (in-game avatar, trust rank, bio, etc.)."""
    tags = getattr(user, "tags", []) or []
    tag_strs = [str(x) for x in tags]
    trust_rank, trust_rank_display_name = _trust_rank_from_tags(tags)
    current_avatar = getattr(user, "current_avatar", "") or ""
    if hasattr(current_avatar, "id"):
        current_avatar = getattr(current_avatar, "id", "") or ""
    if not isinstance(current_avatar, str):
        current_avatar = str(current_avatar) if current_avatar else ""
    last_login = getattr(user, "last_login", None)
    if hasattr(last_login, "isoformat"):
        last_login = last_login.isoformat()
    elif last_login is not None:
        last_login = str(last_login)
    date_joined = getattr(user, "date_joined", None)
    if hasattr(date_joined, "isoformat"):
        date_joined = date_joined.isoformat()
    elif date_joined is not None:
        date_joined = str(date_joined)
    loc = getattr(user, "location", "") or ""
    loc_l = str(loc).strip().lower()
    is_online = getattr(user, "is_online", None)
    if is_online is None:
        is_online = getattr(user, "isOnline", None)
    status_l = (getattr(user, "status", "") or "").lower()
    if loc_l == "offline":
        is_online = False
    elif loc_l in ("private", "traveling") or (loc_l and ":" in loc_l):
        is_online = True
    elif status_l in ("active", "join me", "ask me", "busy"):
        is_online = True
    elif status_l == "offline":
        is_online = False
    elif is_online is None:
        is_online = False
    return {
        "id": getattr(user, "id", ""),
        "displayName": getattr(user, "display_name", ""),
        "username": getattr(user, "username", ""),
        "bio": getattr(user, "bio", "") or "",
        "bioLinks": list(getattr(user, "bio_links", None) or getattr(user, "bioLinks", None) or []),
        "pronouns": getattr(user, "pronouns", "") or "",
        "currentAvatarImageUrl": getattr(user, "current_avatar_image_url", "") or "",
        "currentAvatar": current_avatar,
        "profilePicOverride": getattr(user, "profile_pic_override", "") or "",
        "userIcon": getattr(user, "user_icon", "") or "",
        "tags": list(tags),
        "trustRank": trust_rank,
        "trustRankDisplayName": trust_rank_display_name,
        "hasVrcPlus": "system_supporter" in tag_strs,
        "lastPlatform": getattr(user, "last_platform", "") or "Unknown",
        "status": getattr(user, "status", "") or "",
        "statusDescription": getattr(user, "status_description", "") or "",
        "location": loc,
        "isOnline": bool(is_online),
        "friendKey": getattr(user, "friend_key", "") or "",
        "ageVerified": "system_verified" in tag_strs,
        "lastLogin": last_login or "",
        "dateJoined": date_joined or "",
        "note": getattr(user, "note", "") or "",
        "state": getattr(user, "state", "") or "",
    }


def _world_detail_from_user_location(location):
    """Fetch world metadata for current user's location string (e.g. wrld_xxx:instance)."""
    if not location or not state.api_client:
        return None
    loc = str(location).strip()
    low = loc.lower()
    if low in ("offline", "private", ""):
        return None
    world_id = loc.split(":", 1)[0] if ":" in loc else ""
    if not world_id.startswith("wrld_"):
        return None
    instance_part = loc.split(":", 1)[1] if ":" in loc else ""
    try:
        from vrchatapi.api import worlds_api

        wapi = worlds_api.WorldsApi(state.api_client)
        w = wapi.get_world(world_id)
        return {
            "world_id": world_id,
            "instance": instance_part,
            "name": getattr(w, "name", "") or "",
            "author_name": getattr(w, "author_name", None) or getattr(w, "authorName", "") or "",
            "author_id": getattr(w, "author_id", None) or getattr(w, "authorId", "") or "",
            "capacity": getattr(w, "capacity", None),
            "favorites": getattr(w, "favorites", None),
            "visits": getattr(w, "visits", None),
            "heat": getattr(w, "heat", None),
            "release_status": str(getattr(w, "release_status", "") or getattr(w, "releaseStatus", "") or ""),
            "description": (getattr(w, "description", "") or "")[:400],
        }
    except Exception:
        return {"world_id": world_id, "instance": instance_part, "name": "", "error": "fetch_failed"}


def _build_ai_lobby_context():
    """Compact string for OpenAI system context: lobby + current world."""
    parts = []
    with state.state_lock:
        lobby_users = list(state.lobby_users)
        summary = dict(state.lobby_summary)
    parts.append(f"Lobby user count (others): {summary.get('others', 0)}, total: {summary.get('total', 0)}.")
    if lobby_users:
        names = [u.get("name", "?") for u in lobby_users[:48]]
        parts.append("People in lobby (from VRChat log): " + ", ".join(names) + ("…" if len(lobby_users) > 48 else "") + ".")
    u = state.current_user
    if u:
        loc = getattr(u, "location", "") or ""
        wd = _world_detail_from_user_location(loc)
        if wd and wd.get("name"):
            desc = (wd.get("description") or "").replace("\n", " ").strip()
            if len(desc) > 280:
                desc = desc[:277] + "…"
            parts.append(
                f"Current world: {wd.get('name','')} by author {wd.get('author_name','?')} "
                f"(author id {wd.get('author_id','')}). Instance: {wd.get('instance','') or '—'}. "
                f"Visits: {wd.get('visits')}, capacity: {wd.get('capacity')}, heat: {wd.get('heat')}, "
                f"release: {wd.get('release_status','')}."
            )
            if desc:
                parts.append(f"World description (truncated): {desc}")
        elif loc and str(loc).lower() not in ("offline", "private"):
            parts.append(f"Raw location string: {loc}")
    return "\n".join(parts)


def _fetch_vrchat_blocked_users():
    out = []
    try:
        if not state.api_client or not state.users_api_instance:
            return out
        from vrchatapi.api import playermoderation_api
        from vrchatapi.models.player_moderation_type import PlayerModerationType

        pm = playermoderation_api.PlayermoderationApi(state.api_client)
        mods = pm.get_player_moderations(type=PlayerModerationType.BLOCK) or []
        seen = set()
        for mod in mods:
            tid = getattr(mod, "target_user_id", None) or getattr(mod, "targetUserId", None)
            if not tid or tid in seen:
                continue
            seen.add(tid)
            name = ""
            try:
                u = state.users_api_instance.get_user(tid)
                name = getattr(u, "display_name", "") or ""
            except Exception:
                pass
            out.append({"user_id": tid, "display_name": name or tid, "source": "vrchat"})
    except Exception as e:
        log_and_print(f"VRChat blocked list: {e}", "debug")
    return out


APP_NAME = "VRChat Legends Group Tool"

LOGIN_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0a0a0a">
  <title>{{ title }}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Montserrat, system-ui, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #e5e5e5;
      background: #0a0a0a;
      position: relative;
      overflow-x: hidden;
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      background:
        radial-gradient(ellipse 90% 60% at 50% -30%, rgba(107, 70, 193, 0.35), transparent 55%),
        radial-gradient(ellipse 50% 40% at 100% 50%, rgba(255, 0, 122, 0.12), transparent 50%),
        radial-gradient(ellipse 40% 50% at 0% 80%, rgba(0, 183, 235, 0.08), transparent 45%);
      pointer-events: none;
      z-index: 0;
    }
    body::after {
      content: "";
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(107, 70, 193, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(107, 70, 193, 0.05) 1px, transparent 1px);
      background-size: 56px 56px;
      mask-image: radial-gradient(ellipse 70% 70% at 50% 45%, black 20%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }
    .wrap { position: relative; z-index: 1; width: 100%; max-width: 420px; }
    .card {
      background: linear-gradient(145deg, rgba(20, 20, 22, 0.92), rgba(10, 10, 12, 0.96));
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 36px 32px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(107, 70, 193, 0.15), inset 0 1px 0 rgba(255,255,255,0.06);
    }
    .brand {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      background: linear-gradient(90deg, #a78bfa, #f472b6);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      margin-bottom: 8px;
    }
    h1 { font-size: 1.35rem; font-weight: 800; margin-bottom: 8px; color: #fff; letter-spacing: -0.02em; }
    .sub { font-size: 0.8rem; color: #737373; margin-bottom: 28px; line-height: 1.5; }
    label { display: block; font-size: 0.75rem; font-weight: 600; color: #a3a3a3; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.06em; }
    input[type="text"], input[type="password"] {
      width: 100%;
      padding: 14px 16px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(0,0,0,0.35);
      color: #fafafa;
      font-size: 1rem;
      margin-bottom: 18px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input:focus { outline: none; border-color: rgba(107, 70, 193, 0.6); box-shadow: 0 0 0 3px rgba(107, 70, 193, 0.2); }
    .remember { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
    .remember input { width: auto; margin: 0; accent-color: #6b46c1; }
    .remember label { margin: 0; cursor: pointer; text-transform: none; letter-spacing: 0; font-weight: 500; color: #a3a3a3; font-size: 0.875rem; }
    .error { color: #fca5a5; font-size: 0.875rem; margin-bottom: 16px; padding: 10px 12px; background: rgba(239, 68, 68, 0.12); border-radius: 10px; border: 1px solid rgba(239, 68, 68, 0.25); }
    .hint { color: #a3a3a3; font-size: 0.875rem; margin-bottom: 16px; line-height: 1.5; }
    button {
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, #6b46c1, #db2777);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 8px 28px rgba(107, 70, 193, 0.35);
      transition: transform 0.15s, filter 0.15s, box-shadow 0.15s;
    }
    button:hover { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 12px 36px rgba(107, 70, 193, 0.45); }
    button:active { transform: translateY(0); }
  </style>
</head>
<body>
  <div class="wrap">
  <div class="card">
    <p class="brand">VRChat Legends</p>
    <h1>{{ title }}</h1>
    <p class="sub">Sign in with your VRChat account. Credentials stay on this device.</p>
    {% if error %}<p class="error">{{ error }}</p>{% endif %}
    <form method="post" action="{{ action }}">
      {% if mode == "login" %}
        <label for="username">Username or Email</label>
        <input type="text" id="username" name="username" value="{{ last_username or '' }}" placeholder="Username or email" autocomplete="username">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" value="{{ last_password or '' }}" placeholder="Password" autocomplete="current-password">
        <div class="remember">
          <input type="checkbox" id="remember" name="remember_me" value="1" {{ 'checked' if remember_me else '' }}>
          <label for="remember">Remember me (encrypted, auto-fill next time)</label>
        </div>
      {% else %}
        <p class="hint">{{ twofa_hint or 'Enter your 2FA code.' }}</p>
        <label for="code">2FA Code</label>
        <input type="text" id="code" name="code" placeholder="000000" autocomplete="one-time-code" autofocus>
      {% endif %}
      <button type="submit">{{ button_label }}</button>
    </form>
  </div>
  </div>
</body>
</html>
"""


def get_status_payload():
    """Build the /api/status response for the React UI (dashboard, auth check)."""
    u = state.current_user
    if not u:
        return {"user": None, "logs": [], "lobby": {"users": [], "total": 0, "others": 0}, "lobby_status": "unknown", "in_world": False}

    user = _user_to_card(u)
    user["display_name"] = user.get("displayName", "")  # AuthContext expects display_name
    user["trust_rank_display_name"] = user.get("trustRankDisplayName", "")
    user["status_description"] = user.get("statusDescription", "")
    tags = user.get("tags", []) or []
    user["has_vrc_plus"] = bool(user.get("hasVrcPlus") or "system_supporter" in tags)
    user["age_verified"] = "system_verified" in tags

    with state.log_lock:
        logs = list(state.log_entries[-200:])  # last 200 lines

    with state.state_lock:
        lobby_users = list(state.lobby_users)
        lobby_summary = dict(state.lobby_summary)
        current_invite_batch = list(state.current_invite_batch)
        auto_invite_enabled = state.auto_invite_enabled
        auto_accept_friend_enabled = state.auto_accept_friend_enabled
        auto_event_invite_enabled = getattr(state, "auto_event_invite_enabled", False)
        pending_friend_requests = state.pending_friend_requests

    lobby = {
        "users": lobby_users,
        "total": lobby_summary.get("total", 0),
        "others": lobby_summary.get("others", 0),
    }
    next_poll_remaining = max(0.0, state.next_poll_time - time.time()) if state.next_poll_time else 0.0
    metrics = snapshot_metrics()
    group_member_count = get_cached_member_count()
    bot_uptime_seconds = time.time() - getattr(state, "app_start_time", time.time())
    chatbox_preview = ""
    try:
        chatbox_cfg = get_chatbox_config()
        if chatbox_cfg.get("enabled"):
            lines = [process_chatbox_tags(line) for line in (chatbox_cfg.get("lines") or []) if line]
            if chatbox_cfg.get("shrink_background"):
                chatbox_preview = "\n".join(
                    f"{ln}  →  small HUD (\\x03\\x1f + input True, False)" for ln in lines if ln.strip()
                )
            else:
                chatbox_preview = "\n".join(lines)
    except Exception:
        pass

    active_worlds = []
    try:
        wd = _world_detail_from_user_location(user.get("location"))
        if wd:
            active_worlds.append(wd)
    except Exception:
        pass

    return {
        "bot_uptime_seconds": round(bot_uptime_seconds, 1),
        "user": user,
        "logs": logs,
        "lobby": lobby,
        "current_invite_batch": current_invite_batch,
        "next_poll_remaining": round(next_poll_remaining, 1),
        "pending_friend_requests": pending_friend_requests,
        "auto_invite_enabled": auto_invite_enabled,
        "auto_accept_friend_enabled": auto_accept_friend_enabled,
        "auto_event_invite_enabled": auto_event_invite_enabled,
        "lobby_status": state.lobby_status,
        "group_member_count": group_member_count,
        "in_world": state.lobby_status == "running",
        "invites_sent": metrics.get("invites_sent", 0),
        "invites_failed": metrics.get("invites_failed", 0),
        "invites_skipped_cooldown": metrics.get("invites_skipped_cooldown", 0),
        "friend_requests_accepted": metrics.get("friend_requests_accepted", 0),
        "friend_requests_failed": metrics.get("friend_requests_failed", 0),
        "friend_requests_expired": metrics.get("friend_requests_expired", 0),
        "current_world": getattr(state, "current_room", None) or "",
        "queue_size": len(current_invite_batch),
        "time_until_next_switch": round(next_poll_remaining, 1),
        "chatbox_preview": chatbox_preview,
        "api_health": "ok" if state.api_client and state.current_user else "not_logged_in",
        "crash_recovered": getattr(state, "crash_recovered", False),
        "active_worlds": active_worlds,
        "tray_minimize_available": getattr(state, "tray_enabled", False),
        "window_visible": getattr(state, "ui_visible", True),
        "start_with_windows": windows_startup.get_start_with_windows(),
    }


def _serve_react_index():
    if USE_REACT_UI:
        return send_from_directory(FRONTEND_DIST, "index.html")
    return None


def _serve_node_required():
    """When Node.js/React UI is not built, show this instead of legacy HTML UI."""
    html = """
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VRChat Legends Group Tool - Node.js required</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; margin: 0; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .box { max-width: 480px; background: rgba(30,41,59,0.9); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; text-align: center; }
    h1 { font-size: 1.25rem; margin: 0 0 16px; color: #f1f5f9; }
    p { margin: 0 0 12px; color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
    code { background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.9rem; }
    .steps { text-align: left; margin: 20px 0; padding: 16px; background: rgba(0,0,0,0.2); border-radius: 8px; }
    .steps p { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="box">
    <h1>React UI not built</h1>
    <p>Node.js was not found or the frontend was not built. The legacy (non-Node) UI has been removed.</p>
    <p>To use the app:</p>
    <div class="steps">
      <p>1. Install <a href="https://nodejs.org/" target="_blank" rel="noopener" style="color:#818cf8;">Node.js</a></p>
      <p>2. In a terminal, run:</p>
      <p><code>cd frontend</code></p>
      <p><code>npm install</code></p>
      <p><code>npm run build</code></p>
      <p>3. Restart this app.</p>
    </div>
    <p><a href="/login" style="color:#818cf8;">Back to login</a></p>
  </div>
</body>
</html>
"""
    from flask import Response
    return Response(html, mimetype="text/html")


@app.get("/")
def index():
    if USE_REACT_UI:
        return _serve_react_index()
    return _serve_node_required()


@app.get("/dashboard")
def dashboard():
    if USE_REACT_UI:
        return _serve_react_index()
    if not state.current_user:
        return redirect(url_for("login"))
    return _serve_node_required()


@app.get("/activity")
def activity():
    if USE_REACT_UI:
        return _serve_react_index()
    if not state.current_user:
        return redirect(url_for("login"))
    return _serve_node_required()


@app.get("/auth-store")
def auth_store():
    if USE_REACT_UI:
        return _serve_react_index()
    if not state.current_user:
        return redirect(url_for("login"))
    return _serve_node_required()


@app.get("/analytics")
def analytics():
    if USE_REACT_UI:
        return _serve_react_index()
    if not state.current_user:
        return redirect(url_for("login"))
    return _serve_node_required()


@app.get("/settings")
def settings():
    if USE_REACT_UI:
        return _serve_react_index()
    if not state.current_user:
        return redirect(url_for("login"))
    return _serve_node_required()


@app.get("/chatbox")
def chatbox():
    if USE_REACT_UI:
        return _serve_react_index()
    if not state.current_user:
        return redirect(url_for("login"))
    return _serve_node_required()


@app.get("/credits")
def credits():
    if USE_REACT_UI:
        return _serve_react_index()
    if not state.current_user:
        return redirect(url_for("login"))
    return _serve_node_required()


@app.get("/group")
def group():
    if USE_REACT_UI:
        return _serve_react_index()
    if not state.current_user:
        return redirect(url_for("login"))
    return _serve_node_required()


@app.get("/about")
def about():
    if USE_REACT_UI:
        return _serve_react_index()
    if not state.current_user:
        return redirect(url_for("login"))
    return _serve_node_required()


@app.get("/docs")
def docs_page():
    if USE_REACT_UI:
        return _serve_react_index()
    if not state.current_user:
        return redirect(url_for("login"))
    return _serve_node_required()


@app.get("/privacy")
def privacy_page():
    if USE_REACT_UI:
        return _serve_react_index()
    if not state.current_user:
        return redirect(url_for("login"))
    return _serve_node_required()


@app.get("/terms")
def terms_page():
    if USE_REACT_UI:
        return _serve_react_index()
    if not state.current_user:
        return redirect(url_for("login"))
    return _serve_node_required()


@app.get("/assets/<path:filename>")
def assets(filename):
    if USE_REACT_UI:
        react_asset = os.path.join(FRONTEND_DIST, "assets", filename)
        if os.path.isfile(react_asset):
            return send_from_directory(os.path.join(FRONTEND_DIST, "assets"), filename)
    return send_from_directory(os.path.join(REPO_ROOT, "assets"), filename)


@app.get("/login")
def login():
    if state.current_user:
        return redirect(url_for("dashboard"))
    _, last_username = load_auth()
    rem_user, rem_pass = load_remember_me()
    if rem_user:
        last_username = last_username or rem_user
    return render_template_string(
        LOGIN_HTML,
        app_name=APP_NAME,
        title=f"{APP_NAME} Login",
        action=url_for("login_post"),
        mode="login",
        last_username=last_username or rem_user,
        last_password=rem_pass,
        remember_me=bool(rem_user and rem_pass),
        button_label="Login",
        error=None
    )


@app.post("/login")
def login_post():
    username = request.form.get("username", "").strip()
    password = request.form.get("password", "")
    remember_me = request.form.get("remember_me") == "1"
    if not username or not password:
        _, last_username = load_auth()
        rem_user, rem_pass = load_remember_me()
        return render_template_string(
            LOGIN_HTML,
            app_name=APP_NAME,
            title=f"{APP_NAME} Login",
            action=url_for("login_post"),
            mode="login",
            last_username=last_username or rem_user,
            last_password=rem_pass,
            remember_me=remember_me,
            button_label="Login",
            error="Both fields required."
        )
    try:
        result = login_start(username, password, remember_me=remember_me)
        if result["status"] == "2fa":
            twofa_hint = "Enter the code sent to your email." if result["type"] == "email" \
                else "Enter your authenticator code."
            return render_template_string(
                LOGIN_HTML,
                app_name=APP_NAME,
                title="Two-Factor Authentication",
                action=url_for("twofa_post"),
                mode="2fa",
                button_label="Verify",
                twofa_hint=twofa_hint,
                show_resend=(result["type"] == "email"),
                error=None
            )
        if remember_me:
            store_remember_me(username, password)
        else:
            clear_remember_me()
        start_background_tasks()
        return redirect(url_for("dashboard"))
    except Exception as e:
        _, last_username = load_auth()
        rem_user, rem_pass = load_remember_me()
        return render_template_string(
            LOGIN_HTML,
            app_name=APP_NAME,
            title=f"{APP_NAME} Login",
            action=url_for("login_post"),
            mode="login",
            last_username=last_username or rem_user,
            last_password=rem_pass,
            remember_me=remember_me,
            button_label="Login",
            error=str(e)
        )


@app.post("/login/2fa")
def twofa_post():
    raw = request.form.get("code", "").strip()
    # Normalize: remove spaces and dashes (e.g. "123 456" or "123-456" from paste)
    code = "".join(c for c in raw if c.isalnum())
    if not code:
        show_resend = bool(state.pending_2fa and state.pending_2fa.get("type") == "email")
        return render_template_string(
            LOGIN_HTML,
            app_name=APP_NAME,
            title="Two-Factor Authentication",
            action=url_for("twofa_post"),
            mode="2fa",
            button_label="Verify",
            twofa_hint="Enter the code from your 2FA method.",
            show_resend=show_resend,
            error="Code required."
        )
    try:
        login_submit_2fa(code)
        start_background_tasks()
        return redirect(url_for("dashboard"))
    except Exception as e:
        show_resend = bool(state.pending_2fa and state.pending_2fa.get("type") == "email")
        return render_template_string(
            LOGIN_HTML,
            app_name=APP_NAME,
            title="Two-Factor Authentication",
            action=url_for("twofa_post"),
            mode="2fa",
            button_label="Verify",
            twofa_hint="Enter the code from your 2FA method.",
            show_resend=show_resend,
            error=str(e)
        )


@app.get("/<path:path>")
def spa_catchall(path):
    if USE_REACT_UI and path != "login" and not path.startswith("api"):
        return _serve_react_index()
    if path != "login" and not path.startswith("api"):
        return _serve_node_required()
    from flask import abort
    abort(404)


@app.get("/api/status")
def api_status():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    return jsonify(get_status_payload())


@app.get("/api/setup-wizard")
def api_setup_wizard_get():
    """Return whether first-run setup is done and where data is stored. No auth required."""
    done = get_setting("setup_wizard_done", "0") == "1"
    return jsonify({"done": done, "data_dir": DATA_DIR})


@app.post("/api/setup-wizard")
def api_setup_wizard_post():
    """Complete first-run setup: optional desktop shortcut. No auth required."""
    data = request.get_json(silent=True) or {}
    create_shortcut = data.get("create_desktop_shortcut", False)
    if create_shortcut and sys.platform == "win32":
        try:
            exe = os.path.abspath(sys.executable)
            desktop = _windows_desktop_dir() or os.path.join(os.environ.get("USERPROFILE", ""), "Desktop")
            os.makedirs(desktop, exist_ok=True)
            lnk = os.path.join(desktop, "VRChat Legends Group Tool.lnk")
            ps = (
                "$exe=$args[0]; $lnk=$args[1]; "
                "$WshShell = New-Object -ComObject WScript.Shell; "
                "$s = $WshShell.CreateShortcut($lnk); $s.TargetPath = $exe; $s.Save()"
            )
            subprocess.run(
                ["powershell", "-NoProfile", "-Command", ps, exe, lnk],
                capture_output=True,
                timeout=10,
                creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0,
            )
        except Exception:
            pass
    set_setting("setup_wizard_done", "1")
    return jsonify({"ok": True})


@app.get("/api/settings")
def api_settings():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    from .osc_chatbox import get_osc_config
    osc_ip, osc_port = get_osc_config()
    discord_config = get_discord_config()
    tags = getattr(state.current_user, "tags", []) or [] if state.current_user else []
    has_vrc_plus = "system_supporter" in tags
    return jsonify({
        "group_id": get_setting("group_id", GROUP_ID),
        "event_id": get_setting("event_id", ""),
        "osc_ip": osc_ip,
        "osc_port": osc_port,
        "discord_enabled": discord_config.get("enabled", False),
        "discord_webhook_url": discord_config.get("webhook_url", ""),
        "boop_text": get_setting("boop_text", "Boop!"),
        "boop_emoji": get_setting("boop_emoji", "👋"),
        "auto_join_inviter_id": get_setting("auto_join_inviter_id", ""),
        "has_vrc_plus": has_vrc_plus,
        "vrchat_api_enabled": get_setting("vrchat_api_enabled", "true").lower() not in ("false", "0", "no"),
        "skip_startup_intro": get_setting("skip_startup_intro", "false").lower() in ("true", "1", "yes"),
        "auto_backup_enabled": get_setting("auto_backup_enabled", "1") == "1",
        "safe_mode": get_setting("safe_mode", "0") == "1",
        "start_with_windows": windows_startup.get_start_with_windows(),
    })


@app.post("/api/settings")
def api_settings_save():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    data = request.get_json(silent=True) or {}
    group_id = str(data.get("group_id", "")).strip()
    event_id = str(data.get("event_id", "")).strip()
    osc_ip = str(data.get("osc_ip", "")).strip()
    osc_port = data.get("osc_port")
    boop_text = str(data.get("boop_text", "")).strip() or "Boop!"
    boop_emoji = str(data.get("boop_emoji", "")).strip() or "👋"
    auto_join_inviter_id = str(data.get("auto_join_inviter_id", "")).strip()

    if group_id:
        set_setting("group_id", group_id)
    if event_id is not None:
        set_setting("event_id", event_id)
    if osc_ip:
        set_setting("osc_ip", osc_ip)
    if osc_port:
        set_setting("osc_port", str(osc_port))
    set_setting("boop_text", boop_text)
    set_setting("boop_emoji", boop_emoji)
    set_setting("auto_join_inviter_id", auto_join_inviter_id)
    if "vrchat_api_enabled" in data:
        set_setting("vrchat_api_enabled", "true" if data.get("vrchat_api_enabled") else "false")
    if "skip_startup_intro" in data:
        set_setting("skip_startup_intro", "true" if data.get("skip_startup_intro") else "false")
    if "auto_backup_enabled" in data:
        set_setting("auto_backup_enabled", "1" if data.get("auto_backup_enabled") else "0")
    if "safe_mode" in data:
        set_setting("safe_mode", "1" if data.get("safe_mode") else "0")
    if "start_with_windows" in data:
        windows_startup.set_start_with_windows(bool(data.get("start_with_windows")))

    from .osc_chatbox import get_osc_config
    osc_ip, osc_port = get_osc_config()
    return jsonify({"ok": True, "group_id": get_setting("group_id", GROUP_ID), "event_id": get_setting("event_id", ""), "osc_ip": osc_ip, "osc_port": osc_port, "boop_text": boop_text, "boop_emoji": boop_emoji, "auto_join_inviter_id": get_setting("auto_join_inviter_id", "")})


@app.get("/api/export-data")
def api_export_data():
    """Export all data as JSON (settings, logs, users, queue, blocked, favorites). Excludes auth cookies."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        settings = dict(list_all_settings())
        with state.log_lock:
            logs = list(state.log_entries[-500:])
        with state.state_lock:
            current_batch = list(state.current_invite_batch)
            invited_ids = list(state.invited_users)
        users_invited = []
        if os.path.exists(USER_IDS_FILE):
            try:
                with open(USER_IDS_FILE, "r", encoding="utf-8") as f:
                    users_invited = json.load(f)
            except Exception:
                pass
        blocked = _load_blocked_users()
        app_fav = list(_load_app_favorites())
        try:
            from .osc_chatbox import get_chatbox_config
            chatbox = get_chatbox_config()
        except Exception:
            chatbox = {"enabled": False, "lines": []}
        export_data = {
            "exported_at": datetime.utcnow().isoformat() + "Z",
            "settings": settings,
            "logs": logs,
            "users_invited": users_invited,
            "invited_user_ids": invited_ids,
            "current_invite_batch": current_batch,
            "blocked_users": blocked,
            "app_favorites": app_fav,
            "chatbox": chatbox,
        }
        return jsonify(export_data)
    except Exception as e:
        log_and_print(f"Export error: {str(e)}", "error")
        return jsonify({"error": str(e)}), 500


@app.get("/api/auth-entries")
def api_auth_entries():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    return jsonify({"entries": list_auth_entries()})


@app.post("/api/auth-entries")
def api_auth_entries_upsert():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    data = request.get_json(silent=True) or {}
    key = str(data.get("key", "")).strip()
    value = str(data.get("value", ""))
    if not key:
        return jsonify({"error": "key_required"}), 400
    upsert_auth_entry(key, value)
    return jsonify({"ok": True})


@app.delete("/api/auth-entries/<path:key>")
def api_auth_entries_delete(key):
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    key = str(key).strip()
    if not key:
        return jsonify({"error": "key_required"}), 400
    delete_auth_entry(key)
    return jsonify({"ok": True})


@app.post("/api/restart")
def api_restart():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    def _do_restart():
        import sys
        time.sleep(2)
        try:
            exe = sys.executable
            args = [exe] + (sys.argv[1:] if len(sys.argv) > 1 else [])
            subprocess.Popen(args, cwd=os.getcwd())
        except Exception as e:
            log_and_print(f"Restart failed: {e}", "error")
        os._exit(0)
    threading.Thread(target=_do_restart, daemon=True).start()
    log_and_print("Restart requested", "info")
    return jsonify({"ok": True})


@app.post("/api/invite-lobby")
def api_invite_lobby():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    threading.Thread(target=invite_lobby_to_group, daemon=True).start()
    log_and_print("Manual invite lobby triggered", "info")
    return jsonify({"ok": True})


@app.post("/api/friend-lobby")
def api_friend_lobby():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    threading.Thread(target=friend_lobby_to_users, daemon=True).start()
    log_and_print("Manual friend lobby triggered", "info")
    return jsonify({"ok": True})


@app.post("/api/auto-invite")
def api_auto_invite():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    data = request.get_json(silent=True) or {}
    enabled = bool(data.get("enabled"))
    with state.state_lock:
        state.auto_invite_enabled = enabled
    log_and_print(f"Auto-invite {'enabled' if enabled else 'disabled'}", "info")
    return jsonify({"ok": True, "enabled": state.auto_invite_enabled})


@app.post("/api/auto-accept-friend")
def api_auto_accept_friend():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    data = request.get_json(silent=True) or {}
    enabled = bool(data.get("enabled"))
    with state.state_lock:
        state.auto_accept_friend_enabled = enabled
    log_and_print(f"Auto-accept friend requests {'enabled' if enabled else 'disabled'}", "info")
    return jsonify({"ok": True, "enabled": state.auto_accept_friend_enabled})


@app.post("/api/auto-event-invite")
def api_auto_event_invite():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    data = request.get_json(silent=True) or {}
    enabled = bool(data.get("enabled"))
    with state.state_lock:
        state.auto_event_invite_enabled = enabled
    log_and_print(f"Auto event invite {'enabled' if enabled else 'disabled'}", "info")
    return jsonify({"ok": True, "enabled": state.auto_event_invite_enabled})


@app.get("/api/analytics")
def api_analytics():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    return jsonify(snapshot_metrics())


@app.post("/api/invite-all-friends")
def api_invite_all_friends():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    
    def do_invite_all():
        with state.state_lock:
            prev_auto_invite = state.auto_invite_enabled
            state.auto_invite_enabled = False
        log_and_print("Auto-invite temporarily disabled for Invite ALL", "info")
        
        invite_all_online_friends_to_lobby()
        
        log_and_print("Waiting 30 seconds before re-enabling auto-invite...", "info")
        time.sleep(30)
        
        with state.state_lock:
            state.auto_invite_enabled = prev_auto_invite
        log_and_print("Auto-invite re-enabled", "info")
    
    threading.Thread(target=do_invite_all, daemon=True).start()
    return jsonify({"ok": True})


def _load_app_favorites():
    """Return set of user ids that are app favorites."""
    try:
        if os.path.exists(APP_FAVORITES_FILE):
            with open(APP_FAVORITES_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return set(data.get("user_ids") or [])
    except Exception:
        pass
    return set()


def _save_app_favorites(user_ids):
    """Persist app favorites (list of user ids)."""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(APP_FAVORITES_FILE, "w", encoding="utf-8") as f:
        json.dump({"user_ids": list(user_ids)}, f, indent=2)


@app.get("/api/friends")
def api_friends():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        friends, last_update, vrchat_fav = get_cached_friends()
        app_fav = _load_app_favorites()
        return jsonify({
            "friends": friends,
            "last_update": last_update,
            "app_favorite_ids": list(app_fav),
            "vrchat_favorite_ids": list(vrchat_fav),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/friends/app-favorites")
def api_friends_app_favorites():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    return jsonify({"user_ids": list(_load_app_favorites())})


@app.post("/api/friends/app-favorites")
def api_friends_app_favorites_toggle():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    data = request.get_json(silent=True) or {}
    user_id = (data.get("user_id") or "").strip()
    add = data.get("add", True)
    if not user_id:
        return jsonify({"error": "user_id_required"}), 400
    fav = _load_app_favorites()
    if add:
        fav.add(user_id)
    else:
        fav.discard(user_id)
    _save_app_favorites(fav)
    return jsonify({"ok": True, "user_ids": list(fav)})


def _load_blocked_users():
    """Load blocked users list: [{user_id, display_name}, ...]."""
    try:
        if os.path.exists(BLOCKED_USERS_FILE):
            with open(BLOCKED_USERS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return list(data.get("users") or [])
    except Exception:
        pass
    return []


def _save_blocked_users(users):
    """Persist blocked users."""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(BLOCKED_USERS_FILE, "w", encoding="utf-8") as f:
        json.dump({"users": users}, f, indent=2)


def _merge_group_member_row(members_by_uid, m, role_map):
    """Merge one GroupMember into members_by_uid keyed by user_id (union roles)."""
    user = getattr(m, "user", None)
    uid = getattr(m, "user_id", "") or ""
    if not uid:
        return
    rids = list(getattr(m, "role_ids", None) or getattr(m, "m_role_ids", None) or [])
    ja = getattr(m, "joined_at", "")
    if hasattr(ja, "isoformat"):
        ja = ja.isoformat()
    elif ja is not None:
        ja = str(ja)
    avatar_url = ""
    profile_pic = ""
    user_icon = ""
    if user:
        avatar_url = getattr(user, "current_avatar_image_url", "") or getattr(user, "currentAvatarImageUrl", "") or ""
        profile_pic = getattr(user, "profile_pic_override", "") or getattr(user, "profilePicOverride", "") or ""
        user_icon = getattr(user, "user_icon", "") or getattr(user, "userIcon", "") or ""
    rec = {
        "id": getattr(m, "id", ""),
        "user_id": uid,
        "display_name": getattr(user, "display_name", "") if user else "",
        "joined_at": ja,
        "membership_status": str(getattr(m, "membership_status", "") or ""),
        "role_ids": list(rids),
        "role_names": [role_map.get(str(x), str(x)) for x in rids],
        "avatar_url": avatar_url,
        "profile_pic": profile_pic,
        "user_icon": user_icon,
    }
    if uid not in members_by_uid:
        members_by_uid[uid] = rec
        return
    old = members_by_uid[uid]
    seen = {str(x) for x in old["role_ids"]}
    for rid in rids:
        if str(rid) not in seen:
            old["role_ids"].append(rid)
            seen.add(str(rid))
    old["role_names"] = [role_map.get(str(x), str(x)) for x in old["role_ids"]]
    # Keep first non-empty avatar data
    if not old["avatar_url"] and avatar_url:
        old["avatar_url"] = avatar_url
    if not old["profile_pic"] and profile_pic:
        old["profile_pic"] = profile_pic
    if not old["user_icon"] and user_icon:
        old["user_icon"] = user_icon


def _fetch_all_group_members(group_id, role_map, groups_api):
    """
    Paginate group members (n<=100). Also fetch per role_id so large groups and
    role-filtered views stay complete, then merge by user_id.
    """
    members_by_uid = {}
    n = 100

    def fetch_pages(role_id=None):
        offset = 0
        while True:
            kwargs = {"n": n, "offset": offset}
            if role_id:
                kwargs["role_id"] = role_id
            resp = groups_api.get_group_members(group_id, **kwargs)
            if not resp:
                break
            for m in resp:
                _merge_group_member_row(members_by_uid, m, role_map)
            if len(resp) < n:
                break
            offset += n
            time.sleep(0.22)

    try:
        fetch_pages(None)
    except Exception as e:
        log_and_print(f"Group members (unfiltered) error: {e}", "error")
    for rid in list(role_map.keys()):
        try:
            fetch_pages(rid)
        except Exception as e:
            log_and_print(f"Group members role {rid} error: {e}", "debug")
    return list(members_by_uid.values())


# ─── In-memory group data cache (avoid blocking request thread on long fetches) ─
_group_page_cache = {"data": None, "last_fetch": 0.0, "fetching": False}
_GROUP_PAGE_CACHE_TTL = 300  # seconds before a background refresh is triggered


def _refresh_group_page_cache_bg(group_id):
    """Background thread: fetch full group data and populate _group_page_cache."""
    global _group_page_cache
    try:
        if not state.groups_api_instance:
            return
        group = state.groups_api_instance.get_group(group_id)
        group_data = {
            "id": getattr(group, "id", group_id),
            "name": getattr(group, "name", ""),
            "short_code": getattr(group, "short_code", ""),
            "member_count": getattr(group, "member_count", 0),
            "description": getattr(group, "description", ""),
        }
        role_map = {}
        try:
            roles = state.groups_api_instance.get_group_roles(group_id) or []
            for r in roles:
                rid = getattr(r, "id", None)
                if rid:
                    role_map[str(rid)] = getattr(r, "name", "") or str(rid)
        except Exception as e:
            log_and_print(f"Group roles fetch error: {e}", "error")
        try:
            members = _fetch_all_group_members(group_id, role_map, state.groups_api_instance)
        except Exception as e:
            log_and_print(f"Group members fetch error: {e}", "error")
            members = []
        my_m = getattr(group, "my_member", None)
        self_id = getattr(state.current_user, "id", "") if state.current_user else ""
        self_name = getattr(state.current_user, "display_name", "") if state.current_user else ""
        if my_m and self_id and not any(m.get("user_id") == self_id for m in members):
            rids = list(getattr(my_m, "role_ids", None) or getattr(my_m, "m_role_ids", None) or [])
            ja = getattr(my_m, "joined_at", "")
            if hasattr(ja, "isoformat"):
                ja = ja.isoformat()
            elif ja is not None:
                ja = str(ja)
            members.append({
                "id": getattr(my_m, "id", "") or "",
                "user_id": self_id,
                "display_name": self_name or "You",
                "joined_at": ja,
                "membership_status": str(getattr(my_m, "membership_status", "") or ""),
                "role_ids": rids,
                "role_names": [role_map.get(str(x), str(x)) for x in rids],
                "avatar_url": "",
                "profile_pic": "",
                "user_icon": "",
            })
        _group_page_cache["data"] = {
            "group": group_data,
            "members": members,
            "roles": [{"id": k, "name": v} for k, v in role_map.items()],
        }
        _group_page_cache["last_fetch"] = time.time()
        log_and_print(f"Group cache refreshed: {len(members)} members", "info")
    except Exception as e:
        log_and_print(f"Group cache refresh error: {e}", "error")
    finally:
        _group_page_cache["fetching"] = False


@app.get("/api/group")
def api_group():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    group_id = get_setting("group_id", GROUP_ID)
    if not group_id:
        return jsonify({"error": "no_group_id", "group": None, "members": []}), 200
    if not state.groups_api_instance:
        return jsonify({"error": "groups_api_unavailable", "group": None, "members": []}), 503

    now = time.time()
    cache = _group_page_cache
    stale = cache["data"] is None or (now - cache["last_fetch"]) >= _GROUP_PAGE_CACHE_TTL

    # Kick off a background refresh if needed (non-blocking)
    if stale and not cache["fetching"]:
        cache["fetching"] = True
        threading.Thread(target=_refresh_group_page_cache_bg, args=(group_id,), daemon=True).start()

    if cache["data"]:
        # Return cached data; include a flag so the frontend can show a subtle "refreshing" hint
        return jsonify({**cache["data"], "loading": cache["fetching"]})

    # Nothing in cache yet — tell the frontend to poll
    return jsonify({"group": None, "members": [], "roles": [], "loading": True})


@app.get("/api/blocked")
def api_blocked():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    api_users = _fetch_vrchat_blocked_users()
    by_id = {u["user_id"]: u for u in api_users}
    for u in _load_blocked_users():
        uid = u.get("user_id")
        if uid and uid not in by_id:
            by_id[uid] = {"user_id": uid, "display_name": u.get("display_name") or uid, "source": "local"}
    return jsonify({"users": list(by_id.values())})


@app.post("/api/blocked")
def api_blocked_add():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    data = request.get_json(silent=True) or {}
    user_id = (data.get("user_id") or "").strip()
    display_name = (data.get("display_name") or "").strip() or "Unknown"
    if not user_id:
        return jsonify({"error": "user_id_required"}), 400
    try:
        if state.api_client:
            from vrchatapi.api import playermoderation_api
            from vrchatapi.models.moderate_user_request import ModerateUserRequest
            from vrchatapi.models.player_moderation_type import PlayerModerationType

            pm = playermoderation_api.PlayermoderationApi(state.api_client)
            pm.moderate_user(ModerateUserRequest(moderated=user_id, type=PlayerModerationType.BLOCK))
    except Exception as e:
        log_and_print(f"VRChat block API: {e}", "warning")
    users = _load_blocked_users()
    if not any(u.get("user_id") == user_id for u in users):
        users.append({"user_id": user_id, "display_name": display_name})
        _save_blocked_users(users)
    return jsonify({"ok": True})


@app.delete("/api/blocked/<user_id>")
def api_blocked_remove(user_id):
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    user_id = user_id.strip()
    try:
        if state.api_client:
            from vrchatapi.api import playermoderation_api
            from vrchatapi.models.moderate_user_request import ModerateUserRequest
            from vrchatapi.models.player_moderation_type import PlayerModerationType

            pm = playermoderation_api.PlayermoderationApi(state.api_client)
            pm.unmoderate_user(ModerateUserRequest(moderated=user_id, type=PlayerModerationType.BLOCK))
    except Exception as e:
        log_and_print(f"VRChat unblock API: {e}", "warning")
    users = [u for u in _load_blocked_users() if u.get("user_id") != user_id]
    _save_blocked_users(users)
    return jsonify({"ok": True})


@app.get("/api/favorite-groups")
def api_favorite_groups():
    """Return the logged-in user's VRChat-favorited groups with basic metadata."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        if not state.api_client:
            return jsonify({"groups": []}), 200
        from vrchatapi.api import favorites_api
        fav_api = favorites_api.FavoritesApi(state.api_client)
        fav_ids = []
        offset = 0
        n = 100
        while True:
            try:
                batch = fav_api.get_favorites(n=n, offset=offset, type="group")
            except Exception:
                break
            if not batch:
                break
            for x in batch:
                gid = getattr(x, "favorite_id", None) or getattr(x, "favoriteId", None)
                if gid:
                    fav_ids.append(str(gid))
            if len(batch) < n:
                break
            offset += n
            time.sleep(0.2)
        # Enrich with group metadata where possible
        result = []
        for gid in fav_ids:
            entry = {"id": gid, "name": gid, "short_code": "", "member_count": 0, "icon_url": "", "banner_url": ""}
            try:
                if state.groups_api_instance:
                    g = state.groups_api_instance.get_group(gid)
                    entry["name"] = getattr(g, "name", "") or gid
                    entry["short_code"] = getattr(g, "short_code", "") or ""
                    entry["member_count"] = getattr(g, "member_count", 0) or 0
                    entry["icon_url"] = getattr(g, "icon_url", "") or getattr(g, "icon", "") or ""
                    entry["banner_url"] = getattr(g, "banner_url", "") or getattr(g, "banner", "") or ""
                    time.sleep(0.2)
            except Exception:
                pass
            result.append(entry)
        return jsonify({"groups": result})
    except Exception as e:
        log_and_print(f"Favorite groups error: {e}", "debug")
        return jsonify({"groups": []}), 200


@app.post("/api/remove-friend")
def api_remove_friend():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    data = request.get_json(silent=True) or {}
    user_id = (data.get("userId") or "").strip()
    if not user_id:
        return jsonify({"error": "userId_required"}), 400
    try:
        if not state.friends_api_instance:
            return jsonify({"error": "friends_api_unavailable"}), 503
        state.friends_api_instance.unfriend(user_id)
        update_friends_cache()
        log_and_print(f"Unfriended user {user_id}", "admin")
        return jsonify({"ok": True})
    except Exception as e:
        log_and_print(f"Remove friend error: {str(e)}", "error")
        return jsonify({"error": str(e)}), 500


@app.get("/api/user-info")
def api_user_info():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    display_name = request.args.get("name", "")
    if not display_name:
        return jsonify({"error": "name_required"}), 400
    try:
        user_id = get_user_id_from_display_name(display_name)
        user = state.users_api_instance.get_user(user_id)
        return jsonify(_user_to_card(user))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/user-info-by-id")
def api_user_info_by_id():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    user_id = request.args.get("userId", "").strip()
    if not user_id:
        return jsonify({"error": "userId_required"}), 400
    try:
        user = state.users_api_instance.get_user(user_id)
        return jsonify(_user_to_card(user))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/current-user-files")
def api_current_user_files():
    """List current user's uploaded image files (for invite message image). Only usable with VRC+."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    tags = getattr(state.current_user, "tags", []) or []
    if "system_supporter" not in tags:
        return jsonify({"files": [], "vrc_plus_required": True})
    try:
        from vrchatapi.api import files_api
        files_api_instance = files_api.FilesApi(state.api_client)
        files_list = files_api_instance.get_files(tag="gallery") or []
        out = []
        for f in files_list:
            fid = getattr(f, "id", None) or getattr(f, "file_id", None)
            name = getattr(f, "name", "") or getattr(f, "file_name", "") or fid
            if fid:
                out.append({"id": fid, "name": name})
        return jsonify({"files": out, "vrc_plus_required": False})
    except Exception as e:
        try:
            from vrchatapi.api import files_api
            files_api_instance = files_api.FilesApi(state.api_client)
            files_list = files_api_instance.get_files() or []
            out = []
            for f in files_list:
                fid = getattr(f, "id", None) or getattr(f, "file_id", None)
                name = getattr(f, "name", "") or getattr(f, "file_name", "") or fid
                if fid and ("image" in str(getattr(f, "mime_type", "")).lower() or "gallery" in str(getattr(f, "tags", []))):
                    out.append({"id": fid, "name": name})
            return jsonify({"files": out, "vrc_plus_required": False})
        except Exception:
            return jsonify({"files": [], "vrc_plus_required": False, "error": str(e)})


def _normalize_user_status_for_api(status_str):
    """Map UI / common aliases to vrchatapi UserStatus string values."""
    from vrchatapi.models.user_status import UserStatus

    if not status_str:
        return None
    s = str(status_str).strip().lower().replace("_", " ")
    aliases = {
        "online": UserStatus.ACTIVE,
        "active": UserStatus.ACTIVE,
        "join me": UserStatus.JOIN_ME,
        "joinme": UserStatus.JOIN_ME,
        "ask me": UserStatus.ASK_ME,
        "askme": UserStatus.ASK_ME,
        "busy": UserStatus.BUSY,
        "offline": UserStatus.OFFLINE,
    }
    if s in aliases:
        return aliases[s]
    for v in UserStatus.allowable_values:
        if s == str(v).lower():
            return v
    return None


@app.patch("/api/current-user")
def api_update_current_user():
    """Update current user profile: bio, status, status description (VRChat API)."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    data = request.get_json(silent=True) or {}
    if "bio" not in data and "status" not in data and "status_description" not in data:
        return jsonify({"error": "no_fields"}), 400
    try:
        from vrchatapi.models.update_user_request import UpdateUserRequest

        user_id = state.current_user.id
        kwargs = {}
        if "bio" in data:
            kwargs["bio"] = str(data.get("bio") or "")[:512]
        if "status" in data and data.get("status") is not None and str(data.get("status")).strip() != "":
            norm = _normalize_user_status_for_api(data.get("status"))
            if not norm:
                return jsonify({"error": "invalid_status"}), 400
            kwargs["status"] = norm
        if "status_description" in data:
            kwargs["status_description"] = str(data.get("status_description") or "")[:80]
        if not kwargs:
            return jsonify({"error": "no_fields"}), 400
        req = UpdateUserRequest(**kwargs)
        state.users_api_instance.update_user(user_id, update_user_request=req)
        try:
            if state.auth_api:
                state.current_user = state.auth_api.get_current_user()
        except Exception:
            pass
        return jsonify({"ok": True, "user": _user_to_card(state.current_user) if state.current_user else None})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/api/user-action")
def api_user_action():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    data = request.get_json(silent=True) or {}
    action = data.get("action")
    user_id = data.get("userId")
    message = data.get("message")
    if not action or not user_id:
        return jsonify({"error": "missing_parameters"}), 400
    
    try:
        from vrchatapi.models.ban_group_member_request import BanGroupMemberRequest
        from vrchatapi.models.invite_request import InviteRequest
        from vrchatapi.models.create_group_invite_request import CreateGroupInviteRequest
        from vrchatapi.api import invite_api
        group_id = get_setting("group_id", GROUP_ID)
        
        def _display_name_for_discord(uid):
            try:
                u = state.users_api_instance.get_user(uid)
                return getattr(u, "display_name", None) or uid
            except Exception:
                return uid

        if action == "invite":
            request_obj = CreateGroupInviteRequest(user_id=user_id, confirm_override_block=True)
            state.groups_api_instance.create_group_invite(group_id, create_group_invite_request=request_obj)
            log_and_print(f"Group invite sent to user {user_id}", "admin")
        elif action == "ban":
            request_obj = BanGroupMemberRequest(user_id=user_id)
            state.groups_api_instance.ban_group_member(group_id, user_id, ban_group_member_request=request_obj)
            log_and_print(f"Banned user {user_id} from group", "admin")
            send_discord_moderation("ban", user_id, _display_name_for_discord(user_id))
        elif action == "remove":
            state.groups_api_instance.remove_group_member(group_id, user_id)
            log_and_print(f"Removed user {user_id} from group", "admin")
            send_discord_moderation("remove", user_id, _display_name_for_discord(user_id))
        elif action == "kick":
            # Vote-kick from lobby (requires current world instance)
            if not state.current_room:
                return jsonify({"error": "not_in_world"}), 400
            # VRChat doesn't have direct kick API - this would require moderator actions in-game
            log_and_print(f"Kick attempted for user {user_id} (requires in-game moderator action)", "admin")
            send_discord_moderation("kick", user_id, _display_name_for_discord(user_id))
            return jsonify({"ok": True, "note": "Kick requires in-game moderator permissions"})
        elif action == "warn":
            # Send warning via invite message
            if not state.current_room:
                return jsonify({"error": "not_in_world"}), 400
            invite_api_instance = invite_api.InviteApi(state.api_client)
            invite_request = InviteRequest(
                instance_id=state.current_room,
                message_slot=0  # Default message
            )
            invite_api_instance.invite_user(user_id, invite_request=invite_request)
            log_and_print(f"Warning sent to user {user_id}: {message}", "admin")
            send_discord_moderation("warn", user_id, _display_name_for_discord(user_id), message=message)
        else:
            return jsonify({"error": "invalid_action"}), 400

        return jsonify({"ok": True})
    except Exception as e:
        log_and_print(f"User action error: {str(e)}", "error")
        return jsonify({"error": str(e)}), 500


@app.get("/api/chatbox")
def api_chatbox_get():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    return jsonify(get_chatbox_config())


@app.post("/api/chatbox")
def api_chatbox_post():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    data = request.get_json(silent=True) or {}
    enabled = bool(data.get("enabled", False))
    lines = data.get("lines", [])
    shrink_bg = data.get("shrink_background")
    
    set_chatbox_enabled(enabled)
    set_chatbox_lines(lines)
    if shrink_bg is not None:
        set_setting("chatbox_shrink_background", "1" if shrink_bg else "0")
    
    log_and_print(f"Chatbox {'enabled' if enabled else 'disabled'} with {len(lines)} lines", "info")
    return jsonify({"ok": True})


@app.post("/api/chatbox-preview")
def api_chatbox_preview():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    data = request.get_json(silent=True) or {}
    lines = data.get("lines", [])
    shrink = bool(data.get("shrink_background"))
    if not lines:
        return jsonify({"preview": ""})

    processed_lines = [process_chatbox_tags(line) for line in lines if line]
    if shrink:
        preview = "\n".join(
            f"{ln}  →  small HUD (\\x03\\x1f + True, False)" for ln in processed_lines if ln.strip()
        )
    else:
        preview = "\n".join(processed_lines)
    return jsonify({"preview": preview})


def _load_commands_config():
    """Load commands config (prefix, commands list, slash commands, sync)."""
    import json
    prefix = get_setting("commands_prefix", "!")
    raw = get_setting("commands_json", "[]")
    slash_raw = get_setting("slash_commands_json", "[]")
    try:
        commands = json.loads(raw) if raw else []
    except (TypeError, ValueError):
        commands = []
    try:
        slash_commands = json.loads(slash_raw) if slash_raw else []
    except (TypeError, ValueError):
        slash_commands = []
    sync = get_setting("commands_sync_to_discord", "0") == "1"
    return {"prefix": prefix, "commands": commands, "slash_commands": slash_commands, "sync_to_discord": sync}


@app.get("/api/commands")
def api_commands_get():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    return jsonify(_load_commands_config())


@app.post("/api/commands")
def api_commands_post():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    data = request.get_json(silent=True) or {}
    if "prefix" in data:
        set_setting("commands_prefix", str(data.get("prefix", "!")).strip() or "!")
    if "commands" in data:
        set_setting("commands_json", json.dumps(data["commands"]) if data["commands"] else "[]")
    if "slash_commands" in data:
        set_setting("slash_commands_json", json.dumps(data["slash_commands"]) if data["slash_commands"] else "[]")
    if "sync_to_discord" in data:
        set_setting("commands_sync_to_discord", "1" if data["sync_to_discord"] else "0")
    return jsonify(_load_commands_config())


def _load_ai_config():
    """Load AI config (desktop, discord, shared memory, file access, prompts, usage)."""
    today = datetime.now().strftime("%Y-%m-%d")
    stored_date = get_setting("ai_daily_tokens_date", "")
    daily_tokens = int(get_setting("ai_daily_tokens", "0") or 0)
    if stored_date != today:
        daily_tokens = 0
    return {
        "desktop_enabled": get_setting("ai_desktop_enabled", "0") == "1",
        "discord_enabled": get_setting("ai_discord_enabled", "0") == "1",
        "shared_memory": get_setting("ai_shared_memory", "0") == "1",
        "file_access": get_setting("ai_file_access", "0") == "1",
        "memory_limit": int(get_setting("ai_memory_limit", "50") or 50),
        "system_prompt": get_setting("ai_system_prompt", ""),
        "negative_prompt": get_setting("ai_negative_prompt", ""),
        "daily_tokens": daily_tokens,
        "daily_limit": int(get_setting("ai_daily_limit", "0") or 0),
    }


@app.get("/api/ai-config")
def api_ai_config_get():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    return jsonify(_load_ai_config())


@app.post("/api/ai-config")
def api_ai_config_post():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    data = request.get_json(silent=True) or {}
    if "desktop_enabled" in data:
        set_setting("ai_desktop_enabled", "1" if data["desktop_enabled"] else "0")
    if "discord_enabled" in data:
        set_setting("ai_discord_enabled", "1" if data["discord_enabled"] else "0")
    if "shared_memory" in data:
        set_setting("ai_shared_memory", "1" if data["shared_memory"] else "0")
    if "file_access" in data:
        set_setting("ai_file_access", "1" if data["file_access"] else "0")
    if "memory_limit" in data:
        try:
            v = max(5, min(200, int(data.get("memory_limit", 50))))
            set_setting("ai_memory_limit", str(v))
        except (TypeError, ValueError):
            pass
    if "system_prompt" in data:
        set_setting("ai_system_prompt", str(data.get("system_prompt", ""))[:2000])
    if "negative_prompt" in data:
        set_setting("ai_negative_prompt", str(data.get("negative_prompt", ""))[:1000])
    if "daily_limit" in data:
        try:
            v = max(0, int(data.get("daily_limit", 0)))
            set_setting("ai_daily_limit", str(v))
        except (TypeError, ValueError):
            pass
    return jsonify(_load_ai_config())


@app.post("/api/ai-chat")
def api_ai_chat():
    """Simple AI chat using OpenAI (if key is set)."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    if get_setting("ai_desktop_enabled", "0") != "1":
        return jsonify({"error": "ai_disabled"}), 400
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "message_required"}), 400
    try:
        from .discord_webhook import get_openai_api_key_raw
        key = get_openai_api_key_raw()
        if not key:
            return jsonify({"reply": "OpenAI API key not configured. Add it in AI settings."})
        daily_limit = int(get_setting("ai_daily_limit", "0") or 0)
        if daily_limit > 0:
            today = datetime.now().strftime("%Y-%m-%d")
            stored_date = get_setting("ai_daily_tokens_date", "")
            daily_tokens = int(get_setting("ai_daily_tokens", "0") or 0)
            if stored_date != today:
                daily_tokens = 0
            if daily_tokens >= daily_limit:
                return jsonify({"reply": f"Daily token limit reached ({daily_tokens}/{daily_limit}). Reset at midnight or increase limit in AI settings."})
        import urllib.request
        import urllib.error
        system_prompt = get_setting("ai_system_prompt", "")
        negative_prompt = get_setting("ai_negative_prompt", "")
        memory_limit = max(5, min(200, int(get_setting("ai_memory_limit", "50") or 50)))
        messages = []
        if system_prompt or negative_prompt:
            parts = []
            if system_prompt:
                parts.append(system_prompt)
            if negative_prompt:
                parts.append("You must NOT do the following:\n" + negative_prompt)
            messages.append({"role": "system", "content": "\n\n".join(parts)})
        try:
            ctx = _build_ai_lobby_context()
            if ctx:
                block = "--- VRChat session context (lobby + world; use for factual answers) ---\n" + ctx
                if messages and messages[0].get("role") == "system":
                    messages[0]["content"] = messages[0]["content"] + "\n\n" + block
                else:
                    messages.insert(0, {"role": "system", "content": block})
        except Exception:
            pass
        history = data.get("history") or []
        for h in history[-(memory_limit * 2):]:
            r = (h.get("role") or "user").lower()
            c = (h.get("content") or "").strip()
            if r in ("user", "assistant") and c:
                messages.append({"role": r, "content": c})
        messages.append({"role": "user", "content": message})
        body = json.dumps({
            "model": "gpt-3.5-turbo",
            "messages": messages,
            "max_tokens": 500,
        })
        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=body.encode("utf-8"),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            out = json.loads(resp.read().decode())
        reply = (out.get("choices") or [{}])[0].get("message", {}).get("content", "No response.")
        usage = out.get("usage") or {}
        prompt_tokens = usage.get("prompt_tokens", 0)
        completion_tokens = usage.get("completion_tokens", 0)
        total_tokens = usage.get("total_tokens", prompt_tokens + completion_tokens)
        today = datetime.now().strftime("%Y-%m-%d")
        stored_date = get_setting("ai_daily_tokens_date", "")
        stored_total = int(get_setting("ai_daily_tokens", "0") or 0)
        if stored_date != today:
            stored_total = 0
            set_setting("ai_daily_tokens_date", today)
        daily = stored_total + total_tokens
        set_setting("ai_daily_tokens", str(daily))
        return jsonify({"reply": reply, "usage": {"prompt_tokens": prompt_tokens, "completion_tokens": completion_tokens, "total_tokens": total_tokens, "daily_total": daily}})
    except urllib.error.HTTPError as e:
        try:
            err_body = e.read().decode()
            err_data = json.loads(err_body)
            msg = err_data.get("error", {}).get("message", str(e))
        except Exception:
            msg = str(e)
        return jsonify({"reply": f"API error: {msg}"})
    except Exception as e:
        return jsonify({"reply": f"Error: {str(e)}"})


@app.get("/api/discord")
def api_discord_get():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    return jsonify(get_discord_config())


@app.post("/api/discord")
def api_discord_post():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    data = request.get_json(silent=True) or {}
    enabled = data.get("enabled")
    webhook_url = data.get("webhook_url", "")
    embed_join = data.get("embed_join")
    embed_leave = data.get("embed_leave")
    discord_bot_token = data.get("discord_bot_token")
    openai_api_key = data.get("openai_api_key")
    welcome_enabled = data.get("discord_welcome_enabled")
    welcome_channel_id = data.get("discord_welcome_channel_id")
    welcome_embed = data.get("discord_welcome_embed")

    if enabled is not None:
        set_discord_enabled(bool(enabled))
    if webhook_url is not None:
        set_discord_webhook(webhook_url or "")
    if "embed_join" in data:
        set_setting("discord_embed_join", json.dumps(embed_join) if embed_join else "")
    if "embed_leave" in data:
        set_setting("discord_embed_leave", json.dumps(embed_leave) if embed_leave else "")
    if discord_bot_token is not None:
        set_discord_bot_token(discord_bot_token if isinstance(discord_bot_token, str) else "")
    if openai_api_key is not None:
        set_openai_api_key(openai_api_key if isinstance(openai_api_key, str) else "")
    if welcome_enabled is not None:
        set_discord_welcome(enabled=bool(welcome_enabled))
    if welcome_channel_id is not None:
        set_discord_welcome(channel_id=str(welcome_channel_id))
    if welcome_embed is not None:
        set_discord_welcome(embed_json=welcome_embed)

    return jsonify(get_discord_config())


@app.post("/api/logout")
def api_logout():
    from .auth import clear_auth
    clear_auth()
    state.current_user = None
    state.api_client = None
    state.auth_api = None
    state.notifications_api_instance = None
    state.groups_api_instance = None
    state.users_api_instance = None
    state.pending_2fa = None
    state.threads_started = False
    log_and_print("Logged out. Background tasks will pause until login.", "info")
    return jsonify({"ok": True})


@app.post("/api/clear-logs")
def api_clear_logs():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    clear_logs()
    return jsonify({"ok": True})


@app.post("/api/clear-users")
def api_clear_users():
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    clear_invited_users()
    return jsonify({"ok": True})


@app.post("/api/emergency-stop")
def api_emergency_stop():
    """Emergency stop - immediately halt all background operations"""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    
    log_and_print("⛔ EMERGENCY STOP ACTIVATED BY USER", "critical")
    
    # Disable all automatic features
    with state.state_lock:
        state.auto_invite_enabled = False
        state.auto_accept_friend_enabled = False
    
    # Clear any pending batches
    with state.state_lock:
        state.current_invite_batch = []
    
    log_and_print("All automatic features disabled. Please restart the app.", "critical")
    
    return jsonify({"ok": True, "message": "Emergency stop activated"})


@app.get("/api/install-path")
def api_install_path():
    """Return the install directory (where the exe lives when frozen, or project root in dev)."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    return jsonify({"path": INSTALL_DIR})


@app.post("/api/open-install-folder")
def api_open_install_folder():
    """Open the install directory in the system file explorer."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        path = os.path.abspath(INSTALL_DIR)
        if os.name == "nt":
            subprocess.run(["explorer", path], check=False)
        else:
            subprocess.run(["xdg-open", path], check=False)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/vrchat-status")
def api_vrchat_status():
    """Proxy VRChat status page API (https://status.vrchat.com/api/v2/summary.json) to avoid CORS."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        req = urllib.request.Request(
            "https://status.vrchat.com/api/v2/summary.json",
            headers={"User-Agent": "VRChatLegendsGroupTool/1.0"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e), "status": "unknown"}), 502


@app.post("/api/vrchat-refresh")
def api_vrchat_refresh():
    """Manually refresh friends and group cache (only when VRChat API is enabled)."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    if get_setting("vrchat_api_enabled", "true").lower() in ("false", "0", "no"):
        return jsonify({"error": "vrchat_api_disabled", "message": "Enable VRChat API in Settings first."}), 400
    try:
        update_friends_cache()
        update_group_cache()
        return jsonify({"ok": True, "message": "Refresh started."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/api/uninstall")
def api_uninstall():
    """Erase local app data in the install/data folder. Does not run the Windows uninstaller."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        import shutil
        if os.path.isdir(DATA_DIR):
            shutil.rmtree(DATA_DIR, ignore_errors=True)
        os.makedirs(DATA_DIR, exist_ok=True)
        return jsonify({"ok": True, "message": "Local data removed. Close the app and delete the install folder if you wish to fully uninstall."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/api/launch-uninstaller")
def api_launch_uninstaller():
    """Start the Inno Setup uninstaller next to the frozen exe (Windows installed build)."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    if not getattr(sys, "frozen", False):
        return jsonify({
            "error": "dev_build",
            "message": "The uninstall wizard is only available in the installed Windows app.",
        }), 400
    install_dir = os.path.abspath(INSTALL_DIR)
    candidates = []
    try:
        for name in os.listdir(install_dir):
            low = name.lower()
            if low.startswith("unins") and low.endswith(".exe"):
                candidates.append(os.path.join(install_dir, name))
    except OSError:
        pass
    if not candidates:
        return jsonify({
            "error": "uninstaller_not_found",
            "message": "Uninstaller not found. Use Start Menu → Uninstall, or remove the install folder manually.",
        }), 404
    candidates.sort()
    uninst = candidates[-1]
    try:
        subprocess.Popen([uninst], cwd=install_dir)
        return jsonify({"ok": True, "path": uninst})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/api/invite-event")
def api_invite_event():
    """Invite current lobby to configured VRChat event"""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    
    event_id = get_setting("event_id", "")
    if not event_id:
        return jsonify({"error": "no_event_configured"}), 400
    
    try:
        from .lobby import parse_current_lobby_info
        from .event_invites import batch_invite_to_event
        import threading
        
        room, users_dict = parse_current_lobby_info()
        if not room or not users_dict:
            return jsonify({"error": "not_in_world"}), 400
        
        # Build user list
        user_list = []
        for name, uid in users_dict.items():
            if name != state.current_user.display_name and uid:
                user_list.append({"id": uid, "name": name})
        
        if not user_list:
            return jsonify({"error": "no_users_to_invite"}), 400
        
        # Start invite thread
        threading.Thread(target=batch_invite_to_event, args=(event_id, user_list), daemon=True).start()
        log_and_print(f"Event invite batch started for {len(user_list)} users", "info")
        
        return jsonify({"ok": True})
    except Exception as e:
        log_and_print(f"Event invite error: {str(e)}", "error")
        return jsonify({"error": str(e)}), 500


# ── VRChat API proxy endpoints ──────────────────────────────────────────────
# These expose raw VRChat API data to the frontend for richer user profiles,
# world info, notifications, and moderation tools.

@app.get("/api/world/<world_id>")
def api_get_world(world_id):
    """Get info about a VRChat world by ID."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        from vrchatapi.api import worlds_api as wa
        w_api = wa.WorldsApi(state.api_client)
        world = w_api.get_world(world_id)
        return jsonify({
            "id": getattr(world, "id", ""),
            "name": getattr(world, "name", ""),
            "description": getattr(world, "description", "") or "",
            "authorId": getattr(world, "author_id", ""),
            "authorName": getattr(world, "author_name", ""),
            "imageUrl": getattr(world, "image_url", "") or "",
            "thumbnailImageUrl": getattr(world, "thumbnail_image_url", "") or "",
            "capacity": getattr(world, "capacity", 0),
            "recommendedCapacity": getattr(world, "recommended_capacity", 0),
            "occupants": getattr(world, "occupants", 0),
            "publicOccupants": getattr(world, "public_occupants", 0),
            "privateOccupants": getattr(world, "private_occupants", 0),
            "visits": getattr(world, "visits", 0),
            "favorites": getattr(world, "favorites", 0),
            "heat": getattr(world, "heat", 0),
            "popularity": getattr(world, "popularity", 0),
            "tags": list(getattr(world, "tags", []) or []),
            "releaseStatus": getattr(world, "release_status", ""),
            "version": getattr(world, "version", 0),
            "created_at": str(getattr(world, "created_at", "")),
            "updated_at": str(getattr(world, "updated_at", "")),
            "labsPublicationDate": str(getattr(world, "labs_publication_date", "") or ""),
            "publicationDate": str(getattr(world, "publication_date", "") or ""),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/world/<world_id>/instance/<instance_id>")
def api_get_instance(world_id, instance_id):
    """Get info about a specific world instance."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        from vrchatapi.api import instances_api as ia
        i_api = ia.InstancesApi(state.api_client)
        inst = i_api.get_instance(world_id, instance_id)
        users = []
        for u in (getattr(inst, "users", []) or []):
            users.append({
                "id": getattr(u, "id", ""),
                "displayName": getattr(u, "display_name", ""),
                "currentAvatarImageUrl": getattr(u, "current_avatar_image_url", "") or "",
            })
        return jsonify({
            "instanceId": getattr(inst, "instance_id", ""),
            "worldId": getattr(inst, "world_id", ""),
            "name": getattr(inst, "name", ""),
            "type": getattr(inst, "type", ""),
            "region": str(getattr(inst, "region", "")),
            "ownerId": getattr(inst, "owner_id", "") or "",
            "capacity": getattr(inst, "capacity", 0),
            "recommendedCapacity": getattr(inst, "recommended_capacity", 0),
            "userCount": getattr(inst, "user_count", 0) or getattr(inst, "n_users", 0),
            "full": getattr(inst, "full", False),
            "active": getattr(inst, "active", True),
            "users": users,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/notifications")
def api_get_notifications():
    """List recent VRChat notifications for the current user."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        from vrchatapi.api import notifications_api as na
        n_api = na.NotificationsApi(state.api_client)
        notifs = n_api.get_notifications(hidden="false")
        items = []
        for n in (notifs or []):
            items.append({
                "id": getattr(n, "id", ""),
                "type": getattr(n, "type", ""),
                "senderUserId": getattr(n, "sender_user_id", ""),
                "senderUsername": getattr(n, "sender_username", ""),
                "message": getattr(n, "message", "") or "",
                "details": str(getattr(n, "details", "") or ""),
                "created_at": str(getattr(n, "created_at", "")),
                "seen": getattr(n, "seen", False),
            })
        return jsonify({"notifications": items})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/api/notifications/<notif_id>/accept")
def api_accept_notification(notif_id):
    """Accept a VRChat notification (friend request, invite, etc.)."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        from vrchatapi.api import notifications_api as na
        n_api = na.NotificationsApi(state.api_client)
        n_api.accept_friend_request(notif_id)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.delete("/api/notifications/<notif_id>")
def api_delete_notification(notif_id):
    """Mark a notification as read / delete it."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        from vrchatapi.api import notifications_api as na
        n_api = na.NotificationsApi(state.api_client)
        n_api.mark_notification_as_read(notif_id)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/friend-status/<user_id>")
def api_friend_status(user_id):
    """Check friend status with a user."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        from vrchatapi.api import friends_api as fa
        f_api = fa.FriendsApi(state.api_client)
        status = f_api.get_friend_status(user_id)
        return jsonify({
            "isFriend": getattr(status, "is_friend", False),
            "outgoingRequest": getattr(status, "outgoing_request", False),
            "incomingRequest": getattr(status, "incoming_request", False),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/api/friend-request/<user_id>")
def api_send_friend_request(user_id):
    """Send a friend request to a user."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        from vrchatapi.api import friends_api as fa
        f_api = fa.FriendsApi(state.api_client)
        f_api.friend(user_id)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/player-moderations")
def api_player_moderations():
    """List all current user's player moderations (blocks, mutes, etc.)."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        from vrchatapi.api import playermoderation_api as pma
        pm_api = pma.PlayermoderationApi(state.api_client)
        mods = pm_api.get_player_moderations()
        items = []
        for m in (mods or []):
            items.append({
                "id": getattr(m, "id", ""),
                "type": str(getattr(m, "type", "")),
                "sourceUserId": getattr(m, "source_user_id", ""),
                "sourceDisplayName": getattr(m, "source_display_name", ""),
                "targetUserId": getattr(m, "target_user_id", ""),
                "targetDisplayName": getattr(m, "target_display_name", ""),
                "created": str(getattr(m, "created", "")),
            })
        return jsonify({"moderations": items})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/api/player-moderations")
def api_create_player_moderation():
    """Create a player moderation (block, mute, hide avatar)."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    data = request.get_json(silent=True) or {}
    target_id = data.get("targetUserId", "")
    mod_type = data.get("type", "")
    if not target_id or not mod_type:
        return jsonify({"error": "targetUserId and type required"}), 400
    try:
        from vrchatapi.api import playermoderation_api as pma
        from vrchatapi.models.moderate_user_request import ModerateUserRequest
        from vrchatapi.models.player_moderation_type import PlayerModerationType
        pm_api = pma.PlayermoderationApi(state.api_client)
        type_map = {
            "block": PlayerModerationType.BLOCK,
            "mute": PlayerModerationType.MUTE,
            "hideAvatar": PlayerModerationType.HIDEAVATAR,
        }
        pm_type = type_map.get(mod_type)
        if not pm_type:
            return jsonify({"error": f"Invalid type. Use: {list(type_map.keys())}"}), 400
        pm_api.moderate_user(ModerateUserRequest(moderated=target_id, type=pm_type))
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.delete("/api/player-moderations/<mod_id>")
def api_delete_player_moderation(mod_id):
    """Remove a player moderation by ID."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        from vrchatapi.api import playermoderation_api as pma
        pm_api = pma.PlayermoderationApi(state.api_client)
        pm_api.unmoderate_user(mod_id)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/group/<group_id>/announcement")
def api_group_announcement(group_id):
    """Get the latest announcement for a group."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        ann = state.groups_api_instance.get_group_announcement(group_id)
        if not ann:
            return jsonify({"announcement": None})
        return jsonify({
            "announcement": {
                "id": getattr(ann, "id", ""),
                "groupId": getattr(ann, "group_id", ""),
                "authorId": getattr(ann, "author_id", ""),
                "title": getattr(ann, "title", "") or "",
                "text": getattr(ann, "text", "") or "",
                "imageId": getattr(ann, "image_id", "") or "",
                "imageUrl": getattr(ann, "image_url", "") or "",
                "created_at": str(getattr(ann, "created_at", "")),
                "updated_at": str(getattr(ann, "updated_at", "")),
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/group/<group_id>/bans")
def api_group_bans(group_id):
    """List group bans."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        bans = state.groups_api_instance.get_group_bans(group_id, n=100, offset=0)
        items = []
        for b in (bans or []):
            items.append({
                "id": getattr(b, "id", ""),
                "groupId": getattr(b, "group_id", ""),
                "bannedUserId": getattr(b, "user_id", "") or getattr(b, "banned_user_id", ""),
                "bannedByUserId": getattr(b, "banned_by_user_id", "") or "",
                "created_at": str(getattr(b, "created_at", "")),
            })
        return jsonify({"bans": items})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.delete("/api/group/<group_id>/bans/<user_id>")
def api_unban_group_member(group_id, user_id):
    """Unban a user from a group."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        state.groups_api_instance.unban_group_member(group_id, user_id)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/group/<group_id>/posts")
def api_group_posts(group_id):
    """List recent group posts."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        posts = state.groups_api_instance.get_group_posts(group_id, n=20, offset=0)
        items = []
        for p in (posts or []):
            items.append({
                "id": getattr(p, "id", ""),
                "authorId": getattr(p, "author_id", ""),
                "title": getattr(p, "title", "") or "",
                "text": getattr(p, "text", "") or "",
                "imageId": getattr(p, "image_id", "") or "",
                "imageUrl": getattr(p, "image_url", "") or "",
                "visibility": str(getattr(p, "visibility", "")),
                "created_at": str(getattr(p, "created_at", "")),
                "updated_at": str(getattr(p, "updated_at", "")),
            })
        return jsonify({"posts": items})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/search/users")
def api_search_users():
    """Search VRChat users by name."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"users": []})
    try:
        results = state.users_api_instance.search_users(search=q, n=20)
        users = [_user_to_card(u) for u in (results or [])]
        return jsonify({"users": users})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/search/worlds")
def api_search_worlds():
    """Search VRChat worlds by name."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"worlds": []})
    try:
        from vrchatapi.api import worlds_api as wa
        w_api = wa.WorldsApi(state.api_client)
        results = w_api.search_worlds(search=q, n=20)
        worlds = []
        for w in (results or []):
            worlds.append({
                "id": getattr(w, "id", ""),
                "name": getattr(w, "name", ""),
                "authorName": getattr(w, "author_name", ""),
                "imageUrl": getattr(w, "image_url", "") or "",
                "thumbnailImageUrl": getattr(w, "thumbnail_image_url", "") or "",
                "capacity": getattr(w, "capacity", 0),
                "occupants": getattr(w, "occupants", 0),
                "favorites": getattr(w, "favorites", 0),
                "tags": list(getattr(w, "tags", []) or []),
                "releaseStatus": getattr(w, "release_status", ""),
            })
        return jsonify({"worlds": worlds})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/avatar/<avatar_id>")
def api_get_avatar(avatar_id):
    """Get info about a specific avatar."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        from vrchatapi.api import avatars_api as aa
        a_api = aa.AvatarsApi(state.api_client)
        av = a_api.get_avatar(avatar_id)
        return jsonify({
            "id": getattr(av, "id", ""),
            "name": getattr(av, "name", ""),
            "description": getattr(av, "description", "") or "",
            "authorId": getattr(av, "author_id", ""),
            "authorName": getattr(av, "author_name", ""),
            "imageUrl": getattr(av, "image_url", "") or "",
            "thumbnailImageUrl": getattr(av, "thumbnail_image_url", "") or "",
            "releaseStatus": getattr(av, "release_status", ""),
            "tags": list(getattr(av, "tags", []) or []),
            "version": getattr(av, "version", 0),
            "created_at": str(getattr(av, "created_at", "")),
            "updated_at": str(getattr(av, "updated_at", "")),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/api/invite/<user_id>")
def api_invite_user(user_id):
    """Invite a user to the current instance."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    data = request.get_json(silent=True) or {}
    instance_id = data.get("instanceId", "")
    world_id = data.get("worldId", "")
    if not instance_id or not world_id:
        return jsonify({"error": "instanceId and worldId required"}), 400
    try:
        from vrchatapi.api import invite_api as inv_a
        from vrchatapi.models.invite_request import InviteRequest
        i_api = inv_a.InviteApi(state.api_client)
        i_api.invite_user(user_id, InviteRequest(instance_id=f"{world_id}:{instance_id}"))
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/favorites")
def api_get_favorites():
    """List current user's VRChat favorites (worlds, avatars, friends)."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    fav_type = request.args.get("type", "")  # friend, world, avatar
    try:
        from vrchatapi.api import favorites_api as fav_a
        f_api = fav_a.FavoritesApi(state.api_client)
        favs = f_api.get_favorites(n=100, type=fav_type) if fav_type else f_api.get_favorites(n=100)
        items = []
        for f in (favs or []):
            items.append({
                "id": getattr(f, "id", ""),
                "type": str(getattr(f, "type", "")),
                "favoriteId": getattr(f, "favorite_id", ""),
                "tags": list(getattr(f, "tags", []) or []),
            })
        return jsonify({"favorites": items})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/api/favorites")
def api_add_favorite():
    """Add a favorite (world, avatar, or friend)."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    data = request.get_json(silent=True) or {}
    fav_type = data.get("type", "")
    fav_id = data.get("favoriteId", "")
    fav_tags = data.get("tags", [])
    if not fav_type or not fav_id:
        return jsonify({"error": "type and favoriteId required"}), 400
    try:
        from vrchatapi.api import favorites_api as fav_a
        from vrchatapi.models.add_favorite_request import AddFavoriteRequest
        f_api = fav_a.FavoritesApi(state.api_client)
        f_api.add_favorite(AddFavoriteRequest(type=fav_type, favorite_id=fav_id, tags=fav_tags))
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.delete("/api/favorites/<fav_id>")
def api_remove_favorite(fav_id):
    """Remove a favorite."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        from vrchatapi.api import favorites_api as fav_a
        f_api = fav_a.FavoritesApi(state.api_client)
        f_api.remove_favorite(fav_id)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/current-user/permissions")
def api_current_user_permissions():
    """Get the current user's permissions."""
    if not state.current_user:
        return jsonify({"error": "not_authenticated"}), 401
    try:
        from vrchatapi.api import permissions_api as perm_a
        p_api = perm_a.PermissionsApi(state.api_client)
        perms = p_api.get_assigned_permissions()
        items = []
        for p in (perms or []):
            items.append({
                "id": getattr(p, "id", ""),
                "name": getattr(p, "name", ""),
                "ownerDisplayName": getattr(p, "owner_display_name", "") or "",
            })
        return jsonify({"permissions": items})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.errorhandler(500)
@app.errorhandler(404)
@app.errorhandler(Exception)
def handle_error(e):
    """Fallback HTML when server has errors"""
    return """
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Server Error - VRChat Legends Group Tool</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      background-attachment: fixed;
      color: #1a202c;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .error-container {
      background: #ffffff;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
      padding: 48px;
      max-width: 600px;
      text-align: center;
    }
    .error-icon {
      font-size: 64px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 28px;
      color: #667eea;
      margin-bottom: 16px;
    }
    p {
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: linear-gradient(135deg, #667eea, #5568d3);
      color: white;
      border-radius: 16px;
      text-decoration: none;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
      transition: transform 0.3s ease;
    }
    .button:hover {
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="error-icon">⚠️</div>
    <h1>Server Error</h1>
    <p>The server encountered an error. Please try refreshing the page or restarting the application.</p>
    <a href="/" class="button">Go to Dashboard</a>
  </div>
  <script>
    setTimeout(() => {
      window.location.href = '/';
    }, 5000);
  </script>
</body>
</html>
""", 500


def start_background_tasks():
    """Start lobby scan and friend-request polling threads (after login)."""
    if state.threads_started:
        return
    state.threads_started = True
    threading.Thread(target=update_lobby_count, daemon=True).start()
    threading.Thread(target=poll_friend_requests, daemon=True).start()
    log_and_print("Background tasks started (lobby scan, friend requests)", "info")


def start_web_ui():
    """Start Flask and open embedded app window (no browser/port config needed)."""
    load_discord_config()
    port = 5555
    url = f"http://127.0.0.1:{port}"

    # When launched from Electron, skip pywebview – Electron provides the window.
    if os.environ.get("ELECTRON_MODE") == "1":
        log_and_print("ELECTRON_MODE=1: running Flask only, skipping pywebview", "info")
        app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False, threaded=True)
        return

    try:
        import webview
        from . import tray_helper

        def run_flask():
            app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False, threaded=True)

        server_thread = threading.Thread(target=run_flask, daemon=True)
        server_thread.start()
        for _ in range(30):
            try:
                urllib.request.urlopen(url, timeout=1)
                break
            except Exception:
                time.sleep(0.2)
        else:
            time.sleep(1)

        window = webview.create_window(
            "VRChat Legends Group Tool",
            url,
            width=1280,
            height=800,
            min_size=(800, 600),
        )

        def get_window():
            try:
                wins = webview.windows
                return wins[0] if wins else None
            except Exception:
                return None

        def _on_closing(*_args, **_kwargs):
            if not state.tray_enabled:
                return True
            try:
                window.hide()
                state.ui_visible = False
                return False
            except Exception:
                return True

        def _tray_on_show():
            state.ui_visible = True

        if tray_helper.start_tray(get_window, on_show=_tray_on_show):
            try:
                window.events.closing += _on_closing
                state.tray_enabled = True
            except Exception:
                state.tray_enabled = False

        webview.start()
    except ImportError:
        import webbrowser
        def open_browser():
            time.sleep(1.5)
            webbrowser.open(url)
        threading.Thread(target=open_browser, daemon=True).start()
        app.run(host="127.0.0.1", port=port, debug=False, threaded=True)
