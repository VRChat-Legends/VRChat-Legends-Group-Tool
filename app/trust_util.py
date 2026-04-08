# VRChat trust ranks: User.tags use system_trust_* (see https://vrchat.community/).
TRUST_LEVEL_ORDER = {
    "visitor": 0,
    "basic": 1,
    "known": 2,
    "trusted": 3,
    "veteran": 4,
    "legend": 5,
}

TRUST_RANK_DISPLAY_NAMES = {
    "visitor": "Visitor",
    "basic": "New User",
    "known": "User",
    "trusted": "Known User",
    "veteran": "Trusted User",
    "legend": "VRChat Legend",
    "new_user": "New User",
    "user": "User",
    "known_user": "Known User",
    "trusted_user": "Trusted User",
    "veteran_user": "Trusted User",
}


def trust_rank_from_tags(tags):
    """Return (key, display_name) for highest system_trust_* in tags."""
    if not tags:
        return "visitor", TRUST_RANK_DISPLAY_NAMES["visitor"]
    keys = []
    for t in tags:
        s = str(t)
        if s.startswith("system_trust_"):
            keys.append(s.replace("system_trust_", "", 1))
    if not keys:
        return "visitor", TRUST_RANK_DISPLAY_NAMES["visitor"]

    def sort_key(k):
        return (TRUST_LEVEL_ORDER.get(k, -1), k)

    best = max(keys, key=sort_key)
    display = TRUST_RANK_DISPLAY_NAMES.get(best, best.replace("_", " ").title())
    return best, display
