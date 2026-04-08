"""Friends list cache: persist to file and refresh every 10 minutes to avoid API spam."""
import json
import os
import threading
import time
from datetime import datetime

from . import state
from .config import DATA_DIR
from .logging_store import log_and_print
from .trust_util import trust_rank_from_tags

CACHE_FILE = os.path.join(DATA_DIR, "friends_cache.json")
REFRESH_INTERVAL_SEC = 60  # 1 minute for friends (frequently needed)

cache_lock = threading.Lock()
cached_friends = []
cached_vrchat_favorite_ids = []
last_update = None
cache_thread = None


def _friend_to_dict(f):
    """Convert VRChat friend object to JSON-serializable dict."""
    avatar = getattr(f, "current_avatar_image_url", "") or getattr(f, "profile_pic_override", "") or getattr(f, "user_icon", "") or ""
    profile_pic = getattr(f, "profile_pic_override", "") or ""
    user_icon = getattr(f, "user_icon", "") or ""
    last_login = getattr(f, "last_login", None)
    if hasattr(last_login, "isoformat"):
        last_login = last_login.isoformat()
    elif last_login is not None:
        last_login = str(last_login)
    tags = getattr(f, "tags", []) or []
    tag_strs = [str(x) for x in tags]
    loc_raw = getattr(f, "location", "") or ""
    loc_l = str(loc_raw).strip().lower()
    is_online = getattr(f, "is_online", None)
    if is_online is None:
        is_online = getattr(f, "isOnline", None)
    status_l = (getattr(f, "status", "") or "").lower()
    if loc_l == "offline":
        is_online = False
    elif loc_l in ("private", "traveling") or (loc_l and ":" in loc_l):
        # "private" = in game but location hidden; "traveling" = switching worlds; "wrld_xxx:..." = in world
        is_online = True
    elif status_l in ("active", "join me", "ask me", "busy"):
        is_online = True
    elif status_l == "offline":
        is_online = False
    elif is_online is None:
        is_online = False
    _, trust_display = trust_rank_from_tags(tags)
    return {
        "id": getattr(f, "id", ""),
        "displayName": getattr(f, "display_name", ""),
        "username": getattr(f, "username", ""),
        "location": loc_raw,
        "status": getattr(f, "status", ""),
        "isOnline": bool(is_online),
        "currentAvatarImageUrl": avatar,
        "profilePicOverride": profile_pic,
        "userIcon": user_icon,
        "lastLogin": last_login or "",
        "tags": list(tags),
        "hasVrcPlus": "system_supporter" in tag_strs,
        "trustRankDisplayName": trust_display,
        "ageVerified": "system_verified" in tag_strs,
    }


def load_cache():
    """Load friends from file if present."""
    global cached_friends, last_update, cached_vrchat_favorite_ids
    try:
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                with cache_lock:
                    cached_friends = data.get("friends", [])
                    last_update = data.get("last_update")
                    cached_vrchat_favorite_ids = list(data.get("vrchat_favorite_ids") or [])
                if cached_friends:
                    log_and_print(f"Friends cache loaded: {len(cached_friends)} friends", "info")
    except Exception as e:
        log_and_print(f"Friends cache load error: {str(e)}", "error")


def save_cache(friends, vrchat_favorite_ids=None):
    """Write friends list and VRChat star-favorite user IDs to file."""
    global cached_friends, last_update, cached_vrchat_favorite_ids
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with cache_lock:
            cached_friends = friends
            last_update = datetime.utcnow().isoformat()
            if vrchat_favorite_ids is not None:
                cached_vrchat_favorite_ids = list(vrchat_favorite_ids)
            data = {
                "friends": cached_friends,
                "last_update": last_update,
                "vrchat_favorite_ids": cached_vrchat_favorite_ids,
            }
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        log_and_print(f"Friends cache save error: {str(e)}", "error")


def get_cached_friends():
    """Return cached friends, last_update, VRChat favorite friend user IDs."""
    with cache_lock:
        return list(cached_friends), last_update, list(cached_vrchat_favorite_ids)


def _fetch_vrchat_friend_favorite_user_ids():
    """User IDs starred in VRChat's friend favorites (API), paginated."""
    out = []
    try:
        if not state.api_client:
            return out
        from vrchatapi.api import favorites_api
        from vrchatapi.models.favorite_type import FavoriteType

        fav_api = favorites_api.FavoritesApi(state.api_client)
        offset = 0
        n = 100
        while True:
            batch = fav_api.get_favorites(n=n, offset=offset, type=FavoriteType.FRIEND)
            if not batch:
                break
            for x in batch:
                uid = getattr(x, "favorite_id", None) or getattr(x, "favoriteId", None)
                if uid:
                    out.append(str(uid))
            if len(batch) < n:
                break
            offset += n
            time.sleep(0.25)
    except Exception as e:
        log_and_print(f"VRChat friend favorites fetch: {e}", "debug")
    return out


def update_friends_cache():
    """Fetch all friends from API (paginated) and update cache."""
    try:
        if not state.friends_api_instance:
            return
        friends = []
        n = 100
        offset = 0
        try:
            while True:
                batch = state.friends_api_instance.get_friends(offline=True, n=n, offset=offset)
                if not batch:
                    break
                for f in batch:
                    friends.append(_friend_to_dict(f))
                if len(batch) < n:
                    break
                offset += n
                time.sleep(0.5)
        except TypeError:
            # SDK may not support offset; fetch single page
            batch = state.friends_api_instance.get_friends(offline=True, n=n)
            if batch:
                friends = [_friend_to_dict(f) for f in batch]
        fav_ids = _fetch_vrchat_friend_favorite_user_ids()
        if friends:
            save_cache(friends, fav_ids)
            log_and_print(f"Friends cache updated: {len(friends)} friends, {len(fav_ids)} VRChat favorites", "debug")
    except Exception as e:
        log_and_print(f"Friends cache update error: {str(e)}", "error")


def friends_cache_loop():
    """Background thread: refresh cache every 10 minutes."""
    while True:
        try:
            if state.current_user and state.friends_api_instance:
                update_friends_cache()
            time.sleep(REFRESH_INTERVAL_SEC)
        except Exception as e:
            log_and_print(f"Friends cache loop error: {str(e)}", "error")
            time.sleep(REFRESH_INTERVAL_SEC)


def start_friends_cache_thread():
    """Load cache from file and start background refresh."""
    global cache_thread
    load_cache()
    if state.current_user and state.friends_api_instance:
        update_friends_cache()
    if cache_thread is None or not cache_thread.is_alive():
        cache_thread = threading.Thread(target=friends_cache_loop, daemon=True)
        cache_thread.start()
        log_and_print("Friends cache thread started (1 min refresh)", "info")
