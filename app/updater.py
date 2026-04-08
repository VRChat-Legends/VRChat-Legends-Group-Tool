import os
import subprocess
import sys
import tempfile
import threading
import urllib.error
import urllib.parse
import urllib.request

from .logging_store import log_and_print

REPO_OWNER = "VRChat-Legends"
REPO_NAME = "VRChat-Legends-Group-Tool"
REPO_URL = f"https://github.com/{REPO_OWNER}/{REPO_NAME}"
RELEASES_API = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/releases/latest"

# Keep this in sync with release tags (example: v1.2.0)
APP_VERSION = "v1.0.0"


def _version_tuple(version_text):
    raw = str(version_text or "").strip().lower()
    if raw.startswith("v"):
        raw = raw[1:]
    parts = []
    for p in raw.split("."):
        try:
            parts.append(int(p))
        except ValueError:
            parts.append(0)
    while len(parts) < 3:
        parts.append(0)
    return tuple(parts[:3])


def _fetch_latest_release():
    req = urllib.request.Request(
        RELEASES_API,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "VRChatLegendsGroupToolUpdater/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=12) as resp:
        import json

        return json.loads(resp.read().decode("utf-8"))


def _pick_windows_asset(release_json):
    assets = release_json.get("assets") or []
    for asset in assets:
        name = str(asset.get("name", "")).lower()
        if name.endswith(".exe") and ("setup" in name or "installer" in name):
            return asset.get("browser_download_url")
    for asset in assets:
        name = str(asset.get("name", "")).lower()
        if name.endswith(".exe"):
            return asset.get("browser_download_url")
    return None


def _download_file(url, out_path):
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "VRChatLegendsGroupToolUpdater/1.0"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
    with open(out_path, "wb") as f:
        f.write(data)


def _check_for_updates_impl():
    try:
        rel = _fetch_latest_release()
    except urllib.error.HTTPError as e:
        if e.code == 404:
            log_and_print("Update check skipped: no published GitHub releases yet.", "debug")
            return
        log_and_print(f"Update check failed: HTTP {e.code}", "warning")
        return
    except Exception as e:
        log_and_print(f"Update check failed: {e}", "warning")
        return

    latest_tag = str(rel.get("tag_name") or "").strip() or APP_VERSION
    if _version_tuple(latest_tag) <= _version_tuple(APP_VERSION):
        log_and_print(f"Update check: up to date ({APP_VERSION}).", "info")
        return

    html_url = str(rel.get("html_url") or "").strip() or f"{REPO_URL}/releases"
    log_and_print(
        f"Update available: {latest_tag} (current {APP_VERSION}).",
        "warning",
    )

    if not getattr(sys, "frozen", False):
        log_and_print(f"Download latest build here: {html_url}", "info")
        return

    download_url = _pick_windows_asset(rel)
    if not download_url:
        log_and_print(f"No Windows installer asset found. Open: {html_url}", "info")
        return

    try:
        file_name = os.path.basename(urllib.parse.urlparse(download_url).path) or "VRChatLegends-Update.exe"
        out_path = os.path.join(tempfile.gettempdir(), file_name)
        _download_file(download_url, out_path)
        subprocess.Popen([out_path], cwd=os.path.dirname(out_path))
        log_and_print("Update installer downloaded and launched.", "info")
    except Exception as e:
        log_and_print(f"Auto-update launch failed: {e}. Open: {html_url}", "warning")


def start_update_check_thread():
    threading.Thread(target=_check_for_updates_impl, daemon=True).start()
