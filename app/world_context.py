"""Resolve VRChat world metadata from a user location string (shared by web UI, chatbox tags, AI)."""


def world_detail_from_location(api_client, location):
    if not api_client or not location:
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

        wapi = worlds_api.WorldsApi(api_client)
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
