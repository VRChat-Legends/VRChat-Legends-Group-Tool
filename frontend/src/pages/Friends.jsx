import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../api/client';
import Card from '../components/Card';
import { useToast } from '../components/Toast';
import FriendUserCard from '../components/FriendUserCard';
import { Icons } from '../components/Icons';

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [settings, setSettings] = useState({});
  const [selected, setSelected] = useState(null);
  const [inWorld, setInWorld] = useState(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'online' | 'offline' | 'favorites' | 'app_favorites' | 'vrchat_favorites'
  const [appFavoriteIds, setAppFavoriteIds] = useState(new Set());
  const [vrchatFavoriteIds, setVrchatFavoriteIds] = useState(new Set());
  const [sortBy, setSortBy] = useState('lastPlayed'); // 'lastPlayed' | 'name'
  const toast = useToast();

  const isVrcFavorite = (f) => vrchatFavoriteIds.has(f.id);
  const isAppFavorite = (f) => appFavoriteIds.has(f.id);
  const isFavorite = (f) => isAppFavorite(f) || isVrcFavorite(f);

  const fetchFriends = useCallback(() => {
    api.friends()
      .then((data) => {
        setFriends(data.friends || []);
        setLastUpdate(data.last_update || null);
        setAppFavoriteIds(new Set(data.app_favorite_ids || []));
      })
      .catch((e) => toast(e.message || 'Failed to load friends', 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const toggleAppFavorite = useCallback((friend, e) => {
    e.stopPropagation();
    const add = !isAppFavorite(friend);
    api.post('/api/friends/app-favorites', { user_id: friend.id, add })
      .then(() => setAppFavoriteIds((prev) => { const n = new Set(prev); if (add) n.add(friend.id); else n.delete(friend.id); return n; }))
      .catch((e) => toast(e.message, 'error'));
  }, [isAppFavorite, toast]);

  useEffect(() => {
    fetchFriends();
    api.settings().then(setSettings).catch(() => {});
    api.status().then((d) => setInWorld(d.in_world !== false)).catch(() => {});
  }, [fetchFriends]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchFriends();
      api.status().then((d) => setInWorld(d.in_world !== false)).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [fetchFriends]);

  const filteredFriends = useMemo(() => {
    let list = friends;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (f) =>
          (f.displayName || '').toLowerCase().includes(q) ||
          (f.username || '').toLowerCase().includes(q)
      );
    }
    if (filterTab === 'online') list = list.filter((f) => f.isOnline === true);
    else if (filterTab === 'offline') list = list.filter((f) => f.isOnline !== true);
    else if (filterTab === 'favorites') list = list.filter(isFavorite);
    else if (filterTab === 'app_favorites') list = list.filter(isAppFavorite);
    else if (filterTab === 'vrchat_favorites') list = list.filter(isVrcFavorite);
    if (sortBy === 'name') {
      list = [...list].sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    } else {
      list = [...list].sort((a, b) => {
        const da = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
        const db = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
        return db - da;
      });
    }
    return list;
  }, [friends, search, filterTab, sortBy, appFavoriteIds, vrchatFavoriteIds]);

  const sections = useMemo(() => {
    if (filterTab !== 'all') {
      const label = filterTab === 'favorites' ? 'Favorites' : filterTab === 'app_favorites' ? 'App Favorites' : filterTab === 'vrchat_favorites' ? 'VRChat Favorites' : filterTab === 'online' ? 'Online' : 'Offline';
      return [{ label, friends: filteredFriends }];
    }
    const appFav = filteredFriends.filter(isAppFavorite);
    const vrcFav = filteredFriends.filter((f) => !isAppFavorite(f) && isVrcFavorite(f));
    const onl = filteredFriends.filter((f) => !isAppFavorite(f) && !isVrcFavorite(f) && f.isOnline === true);
    const off = filteredFriends.filter((f) => !isAppFavorite(f) && !isVrcFavorite(f) && f.isOnline !== true);
    const out = [];
    if (appFav.length) out.push({ label: 'App Favorites', friends: appFav });
    if (vrcFav.length) out.push({ label: 'VRChat Favorites', friends: vrcFav });
    if (onl.length) out.push({ label: 'Online', friends: onl });
    if (off.length) out.push({ label: 'Offline', friends: off });
    return out.length ? out : [{ label: 'All', friends: filteredFriends }];
  }, [filterTab, filteredFriends, isAppFavorite, isVrcFavorite]);

  const openCard = (friend) => setSelected({ userId: friend.id, displayName: friend.displayName });
  const closeCard = useCallback(() => setSelected(null), []);

  const avatarUrl = (friend) =>
    friend.currentAvatarImageUrl || friend.profilePicOverride || friend.userIcon || undefined;

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-in">
      <div className="flex-1 min-h-0 flex flex-col">
        <Card title="Friends" subtitle="Click a friend to open their card" className="star-border flex-1 min-h-0 flex flex-col" titleIcon={<Icons.Users />}>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {lastUpdate && (
              <p className="text-xs text-surface-500">
                Last sync: {new Date(lastUpdate).toLocaleString()}
              </p>
            )}
            <button type="button" onClick={fetchFriends} disabled={loading} className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-700 hover:bg-surface-600 text-surface-200 disabled:opacity-50">
              Refresh
            </button>
          </div>
          {!loading && friends.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-3 flex-shrink-0">
                <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">Filter:</span>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'online', label: 'Online' },
                  { id: 'offline', label: 'Offline' },
                  { id: 'favorites', label: 'Favorites' },
                  { id: 'app_favorites', label: 'App Favorites' },
                  { id: 'vrchat_favorites', label: 'VRChat Favorites' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFilterTab(id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterTab === id ? 'bg-brand-500 text-white' : 'bg-surface-800 text-surface-300 hover:bg-surface-700'}`}
                  >
                    {label}
                  </button>
                ))}
                <span className="text-xs font-medium text-surface-500 uppercase tracking-wider ml-2">Sort:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-1.5 rounded-lg text-sm bg-surface-800 border border-surface-700 text-surface-200">
                  <option value="lastPlayed">Last played</option>
                  <option value="name">Name A–Z</option>
                </select>
              </div>
              <div className="mb-4 flex-shrink-0">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or username…"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500"
                />
              </div>
            </>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-surface-500">Loading friends…</span>
            </div>
          ) : filteredFriends.length === 0 ? (
            <p className="text-surface-500 py-8 text-center flex-1">{friends.length === 0 ? "No friends in cache yet. Wait for the next refresh or ensure" : "No friends match your search."}you’re logged in.</p>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-6">
              {sections.map(({ label, friends: sectionFriends }) => (
                <div key={label}>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">{label}</h3>
                    <div className="flex-1 h-px bg-surface-700" />
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 content-start">
                    {sectionFriends.map((friend) => (
                      <button
                        key={friend.id}
                        type="button"
                        onClick={() => openCard(friend)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-surface-600 transition-colors text-left relative group"
                      >
                        <button type="button" onClick={(e) => toggleAppFavorite(friend, e)} className="absolute top-1 right-1 z-10 p-1.5 rounded-lg bg-surface-800/90 hover:bg-brand-500/30 text-surface-400 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" title={isAppFavorite(friend) ? 'Remove from App Favorites' : 'Add to App Favorites'}>
                          {isAppFavorite(friend) ? '★' : '☆'}
                        </button>
                        <div className="relative">
                          <img
                            src={avatarUrl(friend)}
                            alt=""
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover bg-surface-700 ring-2 ring-surface-600"
                          />
                          {friend.isOnline != null && (
                            <span
                              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-900 ${friend.isOnline ? 'bg-emerald-500' : 'bg-surface-500'}`}
                              title={friend.isOnline ? 'Online' : 'Offline'}
                            />
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-surface-200 truncate w-full text-center" title={friend.displayName}>
                          {friend.displayName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {selected && (
        <FriendUserCard
          userId={selected.userId}
          displayName={selected.displayName}
          onClose={closeCard}
          inWorld={inWorld}
          onFriendRemoved={fetchFriends}
        />
      )}
    </div>
  );
}
