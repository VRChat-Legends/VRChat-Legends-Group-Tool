import json
import sqlite3
from datetime import datetime
from http.cookiejar import Cookie

import vrchatapi
from vrchatapi.api import authentication_api, notifications_api, groups_api, users_api, friends_api
from vrchatapi.exceptions import UnauthorizedException, ApiException
from vrchatapi.models.two_factor_auth_code import TwoFactorAuthCode
from vrchatapi.models.two_factor_email_code import TwoFactorEmailCode

from . import state
from .config import USER_AGENT, DB_PATH


def _api_error_message(e):
    """Extract a user-friendly message from VRChat API exception (e.g. 401 Invalid Username/Password)."""
    if getattr(e, "status", None) == 401:
        default = "Invalid username/email or password."
    else:
        default = "Login failed. Please try again."
    body = getattr(e, "body", None)
    if not body:
        return default
    try:
        if isinstance(body, bytes):
            body = body.decode("utf-8")
        data = json.loads(body)
        err = data.get("error") or data
        msg = err.get("message") if isinstance(err, dict) else None
        if msg and isinstance(msg, str):
            return msg.strip('"')
        return default
    except (TypeError, ValueError, KeyError):
        return default


def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("CREATE TABLE IF NOT EXISTS auth (key TEXT PRIMARY KEY, value TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)")
    c.execute(
        "CREATE TABLE IF NOT EXISTS accounts ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, "
        "username TEXT NOT NULL, "
        "auth_cookie TEXT NOT NULL, "
        "added_at TEXT NOT NULL)"
    )
    conn.commit()
    conn.close()


def list_auth_entries():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT key, value FROM auth ORDER BY key")
    rows = [{"key": key, "value": value} for key, value in c.fetchall()]
    conn.close()
    return rows


def upsert_auth_entry(key, value):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT OR REPLACE INTO auth (key, value) VALUES (?, ?)", (key, value))
    conn.commit()
    conn.close()


def delete_auth_entry(key):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM auth WHERE key = ?", (key,))
    conn.commit()
    conn.close()

def list_accounts():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, username, auth_cookie, added_at FROM accounts ORDER BY id")
    rows = [
        {"id": row[0], "username": row[1], "auth_cookie": row[2], "added_at": row[3]}
        for row in c.fetchall()
    ]
    conn.close()
    return rows


def add_account(username, auth_cookie, added_at):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "INSERT INTO accounts (username, auth_cookie, added_at) VALUES (?, ?, ?)",
        (username, auth_cookie, added_at)
    )
    conn.commit()
    conn.close()


def upsert_account(username, auth_cookie, added_at):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "SELECT id FROM accounts WHERE username = ?",
        (username,)
    )
    row = c.fetchone()
    if row:
        c.execute(
            "UPDATE accounts SET auth_cookie = ?, added_at = ? WHERE id = ?",
            (auth_cookie, added_at, row[0])
        )
    else:
        c.execute(
            "INSERT INTO accounts (username, auth_cookie, added_at) VALUES (?, ?, ?)",
            (username, auth_cookie, added_at)
        )
    conn.commit()
    conn.close()


def delete_account(account_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM accounts WHERE id = ?", (account_id,))
    conn.commit()
    conn.close()


def list_account_cookies():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT username, auth_cookie FROM accounts ORDER BY id")
    rows = [{"username": row[0], "auth_cookie": row[1]} for row in c.fetchall()]
    conn.close()
    return rows


def get_setting(key, default=None):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT value FROM settings WHERE key = ?", (key,))
    row = c.fetchone()
    conn.close()
    return row[0] if row else default


def set_setting(key, value):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, value))
    conn.commit()
    conn.close()


SENSITIVE_KEYS = frozenset({"discord_bot_token_enc", "gemini_api_key_enc"})


def list_all_settings():
    """Return all settings as {key: value} (excludes sensitive auth and encrypted tokens)."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT key, value FROM settings ORDER BY key")
    rows = c.fetchall()
    conn.close()
    return {k: v for k, v in rows if k not in SENSITIVE_KEYS}


def store_auth(auth_cookie, username):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT OR REPLACE INTO auth (key, value) VALUES ('auth_cookie', ?)", (auth_cookie,))
    c.execute("INSERT OR REPLACE INTO auth (key, value) VALUES ('last_username', ?)", (username,))
    conn.commit()
    conn.close()


def load_auth():
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT value FROM auth WHERE key = 'auth_cookie'")
        cookie_res = c.fetchone()
        c.execute("SELECT value FROM auth WHERE key = 'last_username'")
        username_res = c.fetchone()
        conn.close()
        return cookie_res[0] if cookie_res else None, username_res[0] if username_res else None
    except Exception:
        return None, None


def store_remember_me(username, password):
    """Store encrypted credentials for Remember Me (auto-fill on next visit)."""
    if not username or not password:
        return
    try:
        from .secrets import encrypt_secret
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("INSERT OR REPLACE INTO auth (key, value) VALUES ('remember_username', ?)", (username,))
        c.execute("INSERT OR REPLACE INTO auth (key, value) VALUES ('remember_password', ?)",
                  (encrypt_secret(password),))
        conn.commit()
        conn.close()
    except Exception:
        pass


def load_remember_me():
    """Return (username, password) for Remember Me, or (username, None) if no stored password."""
    try:
        from .secrets import decrypt_secret
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT value FROM auth WHERE key = 'remember_username'")
        u = c.fetchone()
        c.execute("SELECT value FROM auth WHERE key = 'remember_password'")
        p = c.fetchone()
        conn.close()
        username = u[0] if u else None
        password = decrypt_secret(p[0]) if p and p[0] else None
        return username or "", password or ""
    except Exception:
        return "", ""


def clear_remember_me():
    """Remove stored Remember Me credentials."""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("DELETE FROM auth WHERE key IN ('remember_username', 'remember_password')")
        conn.commit()
        conn.close()
    except Exception:
        pass


def clear_auth():
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("DELETE FROM auth WHERE key = 'auth_cookie'")
        conn.commit()
        conn.close()
    except Exception:
        pass


def setup_api_client(auth_cookie=None, username=None, password=None):
    configuration = vrchatapi.Configuration()
    if username and password:
        configuration.username = username
        configuration.password = password

    state.api_client = vrchatapi.ApiClient(configuration)
    state.api_client.user_agent = USER_AGENT

    if auth_cookie:
        _set_auth_cookie(state.api_client.rest_client.cookie_jar, auth_cookie)

    state.auth_api = authentication_api.AuthenticationApi(state.api_client)
    state.notifications_api_instance = notifications_api.NotificationsApi(state.api_client)
    state.groups_api_instance = groups_api.GroupsApi(state.api_client)
    state.users_api_instance = users_api.UsersApi(state.api_client)
    state.friends_api_instance = friends_api.FriendsApi(state.api_client)

    return state.api_client


def _extract_auth_cookie():
    if not state.api_client:
        return None
    return _extract_auth_cookie_from_cookiejar(state.api_client.rest_client.cookie_jar)
    return None


def _set_auth_cookie(cookie_jar, auth_cookie):
    if hasattr(cookie_jar, "set"):
        try:
            cookie_jar.set(
                "auth",
                auth_cookie,
                domain="api.vrchat.cloud",
                path="/"
            )
            return
        except Exception:
            pass
    try:
        from requests.cookies import create_cookie
        cookie_jar.set_cookie(
            create_cookie(
                name="auth",
                value=auth_cookie,
                domain="api.vrchat.cloud",
                path="/"
            )
        )
        return
    except Exception:
        pass


def apply_auth_cookie(cookie_jar, auth_cookie):
    _set_auth_cookie(cookie_jar, auth_cookie)


def _extract_auth_cookie_from_cookiejar(cookie_jar):
    try:
        for cookie in cookie_jar:
            if cookie.name in ("auth", "authToken"):
                return cookie.value
    except Exception:
        pass
    return None


def login_account_with_credentials(username, password, code=None):
    configuration = vrchatapi.Configuration()
    configuration.username = username
    configuration.password = password
    api_client = vrchatapi.ApiClient(configuration)
    api_client.user_agent = USER_AGENT
    auth_api = authentication_api.AuthenticationApi(api_client)

    try:
        user = auth_api.get_current_user()
    except UnauthorizedException as e:
        if e.status == 200:
            if "Email 2 Factor Authentication" in e.reason:
                if not code:
                    return {"status": "2fa", "type": "email"}
                auth_api.verify2_fa_email_code(
                    two_factor_email_code=TwoFactorEmailCode(code=code)
                )
            elif "2 Factor Authentication" in e.reason:
                if not code:
                    return {"status": "2fa", "type": "app"}
                auth_api.verify2_fa(
                    two_factor_auth_code=TwoFactorAuthCode(code=code)
                )
            user = auth_api.get_current_user()
        else:
            raise Exception(f"Login failed: {e}")
    except ApiException as e:
        raise Exception(f"Login failed: {e}")

    auth_cookie = _extract_auth_cookie_from_cookiejar(api_client.rest_client.cookie_jar)
    if not auth_cookie:
        raise Exception("Login succeeded but auth cookie missing.")
    upsert_account(user.username, auth_cookie, datetime.utcnow().isoformat())
    return {"status": "ok", "username": user.username}
    try:
        cookie = Cookie(
            version=0,
            name="auth",
            value=auth_cookie,
            port=None,
            port_specified=False,
            domain="api.vrchat.cloud",
            domain_specified=True,
            domain_initial_dot=False,
            path="/",
            path_specified=True,
            secure=False,
            expires=None,
            discard=True,
            comment=None,
            comment_url=None,
            rest={},
            rfc2109=False
        )
        cookie_jar.set_cookie(cookie)
    except Exception:
        pass


def store_current_auth_cookie(username):
    auth_cookie = _extract_auth_cookie()
    if auth_cookie:
        store_auth(auth_cookie, username)
        upsert_account(username, auth_cookie, datetime.utcnow().isoformat())


def try_login_with_stored_cookie():
    stored_cookie, _ = load_auth()
    if not stored_cookie:
        return False
    try:
        setup_api_client(auth_cookie=stored_cookie)
        state.current_user = state.auth_api.get_current_user()
        if state.current_user and getattr(state.current_user, "username", None):
            upsert_account(state.current_user.username, stored_cookie, datetime.utcnow().isoformat())
        return True
    except Exception:
        clear_auth()
        return False


def login_start(username, password, remember_me=False):
    setup_api_client(username=username, password=password)
    try:
        state.current_user = state.auth_api.get_current_user()
        store_current_auth_cookie(username)
        state.pending_2fa = None
        return {"status": "ok"}
    except UnauthorizedException as e:
        if e.status == 200:
            if "Email 2 Factor Authentication" in e.reason:
                state.pending_2fa = {"type": "email", "username": username, "password": password, "remember_me": remember_me}
            elif "2 Factor Authentication" in e.reason:
                state.pending_2fa = {"type": "app", "username": username, "password": password, "remember_me": remember_me}
            else:
                raise Exception("2FA required but type unknown")
            return {"status": "2fa", "type": state.pending_2fa["type"]}
        raise Exception(_api_error_message(e))
    except ApiException as e:
        raise Exception(_api_error_message(e))


def login_submit_2fa(code):
    if not state.pending_2fa:
        raise Exception("No pending 2FA challenge.")
    # Normalize code: digits/letters only (VRChat can reject codes with spaces or extra chars)
    code = "".join(c for c in str(code).strip() if c.isalnum())
    if not code:
        raise Exception("2FA code is required.")
    try:
        if state.pending_2fa["type"] == "email":
            state.auth_api.verify2_fa_email_code(
                two_factor_email_code=TwoFactorEmailCode(code=code)
            )
        else:
            state.auth_api.verify2_fa(
                two_factor_auth_code=TwoFactorAuthCode(code=code)
            )
    except ApiException as e:
        if getattr(e, "status", None) == 400:
            body = getattr(e, "body", "") or ""
            try:
                data = json.loads(body) if isinstance(body, str) else body
                if isinstance(data, dict) and data.get("verified") is False:
                    raise Exception("Code invalid or expired. Check the code and try again, or request a new email code.")
            except (TypeError, ValueError):
                pass
        raise Exception(_api_error_message(e))
    state.current_user = state.auth_api.get_current_user()
    username = state.pending_2fa["username"]
    store_current_auth_cookie(username)
    if state.pending_2fa.get("remember_me") and state.pending_2fa.get("password"):
        store_remember_me(username, state.pending_2fa["password"])
    state.pending_2fa = None
    return state.current_user


def login_with_cookie(auth_cookie):
    setup_api_client(auth_cookie=auth_cookie)
    state.current_user = state.auth_api.get_current_user()
    if state.current_user and getattr(state.current_user, "username", None):
        upsert_account(state.current_user.username, auth_cookie, datetime.utcnow().isoformat())
    return state.current_user
