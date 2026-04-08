import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import Card from '../components/Card';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import FriendUserCard from '../components/FriendUserCard';
import UserProfileModal from '../components/UserProfileModal';
import UserAvatar from '../components/UserAvatar';
import { Icons } from '../components/Icons';

const TABS = [
  { id: 'friends', label: 'Friends', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { id: 'lobby', label: 'Lobby', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'blocked', label: 'Blocked', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
];

export default function Members() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'friends';
  const setTab = (id) => setSearchParams({ tab: id });

  const [friends, setFriends] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [lobby, setLobby] = useState({ users: [], total: 0, others: 0 });
  const [blocked, setBlocked] = useState([]);
  const [selected, setSelected] = useState(null);
  const [profileByName, setProfileByName] = useState(null);
  const [inWorld, setInWorld] = useState(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [appFavoriteIds, setAppFavoriteIds] = useState(new Set());
  const [vrchatFavoriteIds, setVrchatFavoriteIds] = useState(new Set());
  const [sortBy, setSortBy] = useState('lastPlayed');
  const toast = useToast();
  const { confirm } = useConfirm();

  const isVrcFavorite = (f) => vrchatFavoriteIds.has(f.id);
  const isAppFavorite = (f) => appFavoriteIds.has(f.id);
  const isFavorite = (f) => isAppFavorite(f) || isVrcFavorite(f);

  const fetchFriends = useCallback(() => {
    api.friends()
      .then((data) => {
        setFriends(data.friends || []);
        setLastUpdate(data.last_update || null);
        setAppFavoriteIds(new Set(data.app_favorite_ids || []));
        setVrchatFavoriteIds(new Set(data.vrchat_favorite_ids || []));
      })
      .catch((e) => toast(e.message || 'Failed to load friends', 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const fetchBlocked = useCallback(() => {
    api.get('/api/blocked').then((d) => setBlocked(d.users || [])).catch(() => setBlocked([]));
  }, []);

  const fetchStatus = useCallback(() => {
    api.status().then((d) => {
      setLobby(d.lobby || { users: [], total: 0, others: 0 });
      setInWorld(d.in_world !== false);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchFriends();
    fetchBlocked();
    fetchStatus();
  }, [fetchFriends, fetchBlocked, fetchStatus]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchFriends();
      fetchStatus();
    }, 30000);
    return () => clearInterval(id);
  }, [fetchFriends, fetchStatus]);

  const toggleAppFavorite = useCallback((friend, e) => {
    e.stopPropagation();
    const add = !isAppFavorite(friend);
    api.post('/api/friends/app-favorites', { user_id: friend.id, add })
      .then(() => setAppFavoriteIds((prev) => { const n = new Set(prev); if (add) n.add(friend.id); else n.delete(friend.id); return n; }))
      .catch((e) => toast(e.message, 'error'));
  }, [isAppFavorite, toast]);

  const handleBlock = useCallback(async (user) => {
    const ok = await confirm(`Block ${user.displayName || user.display_name || user.name || 'this user'}? They will be added to your blocked list.`, 'Block user');
    if (!ok) return;
    try {
      await api.post('/api/blocked', { user_id: user.id || user.user_id, display_name: user.displayName || user.display_name || user.name || 'Unknown' });
      toast('User blocked', 'success');
      fetchBlocked();
    } catch (e) {
      toast(e.message, 'error');
    }
  }, [confirm, fetchBlocked, toast]);

  const handleUnblock = useCallback(async (u) => {
    const ok = await confirm(`Unblock ${u.display_name}?`, 'Unblock');
    if (!ok) return;
    try {
      await api.delete(`/api/blocked/${encodeURIComponent(u.user_id)}`);
      toast('User unblocked', 'success');
      fetchBlocked();
    } catch (e) {
      toast(e.message, 'error');
    }
  }, [confirm, fetchBlocked, toast]);

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
      <div className="flex gap-2 mb-4 flex-shrink-0">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === id ? 'bg-brand-500 text-white' : 'bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-200'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={icon} /></svg>
            {label}
          </button>
        ))}
      </div>

      {tab === 'friends' && (
        <div className="flex-1 min-h-0 flex flex-col">
          <Card title="Friends" subtitle="Click a friend to open their card. Add to App Favorites with ★" className="star-border flex-1 min-h-0 flex flex-col" titleIcon={<Icons.Users />}>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {lastUpdate && <p className="text-xs text-surface-500">Last sync: {new Date(lastUpdate).toLocaleString()}</p>}
              <button type="button" onClick={fetchFriends} disabled={loading} className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-700 hover:bg-surface-600 text-surface-200 disabled:opacity-50">Refresh</button>
            </div>
            {!loading && friends.length > 0 && (
              <>
                <div className="flex flex-wrap items-center gap-3 mb-3 flex-shrink-0">
                  <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">Filter:</span>
                  {[{ id: 'all', label: 'All' }, { id: 'online', label: 'Online' }, { id: 'offline', label: 'Offline' }, { id: 'favorites', label: 'Favorites' }, { id: 'app_favorites', label: 'App Favorites' }, { id: 'vrchat_favorites', label: 'VRChat Favorites' }].map(({ id, label }) => (
                    <button key={id} type="button" onClick={() => setFilterTab(id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterTab === id ? 'bg-brand-500 text-white' : 'bg-surface-800 text-surface-300 hover:bg-surface-700'}`}>{label}</button>
                  ))}
                  <span className="text-xs font-medium text-surface-500 uppercase tracking-wider ml-2">Sort:</span>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-1.5 rounded-lg text-sm bg-surface-800 border border-surface-700 text-surface-200">
                    <option value="lastPlayed">Last played</option>
                    <option value="name">Name A–Z</option>
                  </select>
                </div>
                <div className="mb-4 flex-shrink-0">
                  <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or username…" className="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500" />
                </div>
              </>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-12"><span className="text-surface-500">Loading friends…</span></div>
            ) : filteredFriends.length === 0 ? (
              <p className="text-surface-500 py-8 text-center flex-1">{friends.length === 0 ? "No friends in cache yet. Wait for the next refresh or ensure you're logged in." : "No friends match your search."}</p>
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
                        <button key={friend.id} type="button" onClick={() => openCard(friend)} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-surface-600 transition-colors text-left relative group">
                          <button type="button" onClick={(e) => toggleAppFavorite(friend, e)} className={`absolute top-1 right-1 z-10 p-1.5 rounded-lg bg-surface-800/90 hover:bg-brand-500/30 transition-opacity ${isFavorite(friend) ? 'text-amber-400 opacity-100' : 'text-surface-400 hover:text-amber-400 opacity-0 group-hover:opacity-100'}`} title={isAppFavorite(friend) ? 'Remove from App Favorites' : 'Add to App Favorites'}>{isFavorite(friend) ? '★' : '☆'}</button>
                          <div className="relative">
                            <UserAvatar friend={friend} />
                            {friend.isOnline != null && (
                              <span
                                className={`absolute bottom-0 right-0 z-[1] w-3 h-3 rounded-full border-2 border-surface-900 ${friend.isOnline ? 'bg-emerald-500' : 'bg-surface-500'}`}
                                title={friend.isOnline ? 'Online' : 'Offline'}
                              />
                            )}
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-surface-200 truncate w-full text-center" title={friend.displayName}>{friend.displayName}</span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleBlock(friend); }} className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-opacity">Block</button>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'lobby' && (
        <Card title="Lobby" subtitle={`${lobby.total ?? 0} total · ${lobby.others ?? 0} others — same layout as Friends`} className="star-border flex-1 min-h-0 flex flex-col" titleIcon={<Icons.Users />}>
          {(!lobby.users || lobby.users.length === 0) ? (
            <p className="text-surface-500 py-12 text-center">No one else in lobby</p>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 content-start">
                {(lobby.users ?? []).map((u) => (
                  <div
                    key={u.name + (u.id_suffix || '')}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-surface-600 transition-colors text-center relative group"
                  >
                    <button
                      type="button"
                      onDoubleClick={() => setProfileByName(u.name)}
                      className="flex flex-col items-center gap-2 w-full"
                      title="Double-click to open profile"
                    >
                      <div className="relative">
                        <UserAvatar friend={{ tags: [] }} sizeClasses="w-14 h-14 sm:w-16 sm:h-16" />
                        <span className="absolute bottom-0 right-0 z-[1] w-3 h-3 rounded-full border-2 border-surface-900 bg-emerald-500" title="In instance" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-surface-200 truncate w-full" title={u.name}>
                        {u.name}{u.id_suffix ? ` (${u.id_suffix})` : ''}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const info = await api.userInfo(u.name);
                          handleBlock({ id: info.id, displayName: info.displayName || u.name, display_name: info.displayName || u.name });
                        } catch (e) {
                          toast('Could not look up user. Try blocking from Friends.', 'error');
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded-lg text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-opacity"
                    >
                      Block
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {tab === 'blocked' && (
        <Card title="Blocked" subtitle="From VRChat block list + local entries — same layout as Friends" className="star-border flex-1 min-h-0 flex flex-col" titleIcon={<Icons.Users />}>
          {blocked.length === 0 ? (
            <p className="text-surface-500 py-12 text-center">No blocked users</p>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 content-start">
                {blocked.map((u) => (
                  <div key={u.user_id} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-800/30 border border-surface-700/50 hover:border-surface-600 transition-colors text-center">
                    <UserAvatar friend={{ tags: [] }} sizeClasses="w-14 h-14 sm:w-16 sm:h-16" />
                    <span className="text-xs sm:text-sm font-medium text-surface-200 truncate w-full" title={u.display_name}>{u.display_name}</span>
                    {u.source && (
                      <span className="text-[0.65rem] uppercase tracking-wider text-surface-500">{u.source === 'vrchat' ? 'VRChat' : u.source}</span>
                    )}
                    <button type="button" onClick={() => handleUnblock(u)} className="mt-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-700 hover:bg-surface-600 text-surface-200 w-full max-w-[8rem]">
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {selected && (
        <FriendUserCard userId={selected.userId} displayName={selected.displayName} onClose={closeCard} inWorld={inWorld} onFriendRemoved={fetchFriends} />
      )}
      {profileByName && (
        <UserProfileModal displayName={profileByName} onClose={() => setProfileByName(null)} inWorld={inWorld} />
      )}
    </div>
  );
}
