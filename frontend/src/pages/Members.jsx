import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import Card from '../components/Card';
import Paginator from '../components/Paginator';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import FriendUserCard from '../components/FriendUserCard';
import UserProfileModal from '../components/UserProfileModal';
import UserAvatar from '../components/UserAvatar';
import { Icons } from '../components/Icons';

const PAGE_SIZE = 10;

const TABS = [
  { id: 'friends', label: 'Friends', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { id: 'lobby', label: 'Lobby', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'blocked', label: 'Blocked', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
];

export default function Members() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'friends';
  const setTab = (id) => { setSearchParams({ tab: id }); setPage(1); };

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
  // ── Pagination ────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
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

  // Reset to page 1 whenever the filtered set changes
  useEffect(() => { setPage(1); }, [search, filterTab, tab]);

  // Paginated slice of the filtered friends list
  const pagedFriends = useMemo(
    () => filteredFriends.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredFriends, page],
  );

  const openCard = (friend) => setSelected({ userId: friend.id, displayName: friend.displayName });
  const closeCard = useCallback(() => setSelected(null), []);

  const avatarUrl = (friend) =>
    friend.currentAvatarImageUrl || friend.profilePicOverride || friend.userIcon || undefined;

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-in">
      <div className="tab-bar mb-4 flex-shrink-0">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`tab-bar-item ${tab === id ? 'tab-bar-item--active' : 'tab-bar-item--idle'}`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={icon} /></svg>
            {label}
          </button>
        ))}
      </div>

      {tab === 'friends' && (
        <div className="flex-1 min-h-0 flex flex-col">
          <Card title="Friends" subtitle="Click a friend to open their card. Star to favorite." className="star-border flex-1 min-h-0 flex flex-col" titleIcon={<Icons.Users />}>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {lastUpdate && <p className="text-xs text-surface-500">Last sync: {new Date(lastUpdate).toLocaleString()}</p>}
              <button type="button" onClick={fetchFriends} disabled={loading} className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-700 hover:bg-surface-600 text-surface-200 disabled:opacity-50">Refresh</button>
            </div>
            {!loading && friends.length > 0 && (
              <>
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 mb-3 flex-shrink-0">
                  {[{ id: 'all', label: 'All' }, { id: 'online', label: 'Online' }, { id: 'offline', label: 'Offline' }, { id: 'favorites', label: 'Favorites' }, { id: 'app_favorites', label: 'App Favs' }, { id: 'vrchat_favorites', label: 'VRC Favs' }].map(({ id, label }) => (
                    <button key={id} type="button" onClick={() => setFilterTab(id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filterTab === id ? 'bg-vrcl-purple/25 border-vrcl-purple/40 text-white' : 'bg-surface-800 border-surface-700 text-surface-400 hover:bg-surface-700 hover:text-white'}`}
                    >{label}</button>
                  ))}
                  <span className="w-px h-4 bg-surface-700 ml-1" />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-2 py-1.5 rounded-lg text-xs bg-surface-800 border border-surface-700 text-surface-300 hover:border-surface-600 transition-colors">
                    <option value="lastPlayed">Last played</option>
                    <option value="name">Name A–Z</option>
                  </select>
                </div>
                {/* Search */}
                <div className="mb-4 flex-shrink-0 relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search friends…"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-600 focus:outline-none focus:border-vrcl-purple/50 transition-colors text-sm" />
                </div>
              </>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-12"><span className="text-surface-500 text-sm">Loading friends…</span></div>
            ) : filteredFriends.length === 0 ? (
              <p className="text-surface-500 py-8 text-center text-sm">{friends.length === 0 ? "No friends in cache yet — wait for the next refresh or ensure you're logged in." : "No friends match your search."}</p>
            ) : (
              <>
                {/* Paginated grid – flat list, 10 per page */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 content-start">
                  {pagedFriends.map((friend) => (
                    <button key={friend.id} type="button" onClick={() => openCard(friend)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/[0.05] border border-transparent hover:border-surface-700 transition-all text-left relative group"
                    >
                      <button type="button" onClick={(e) => toggleAppFavorite(friend, e)}
                        className={`absolute top-1.5 right-1.5 z-10 p-1 rounded-lg bg-surface-900/80 transition-opacity text-sm ${isFavorite(friend) ? 'text-amber-400 opacity-100' : 'text-surface-500 hover:text-amber-400 opacity-0 group-hover:opacity-100'}`}
                        title={isAppFavorite(friend) ? 'Remove from favorites' : 'Add to favorites'}
                      >{isFavorite(friend) ? '★' : '☆'}</button>
                      <div className="relative">
                        <UserAvatar friend={friend} sizeClasses="w-14 h-14" />
                        {friend.isOnline != null && (
                          <span className={`absolute bottom-0 right-0 z-[1] w-3 h-3 rounded-full border-2 border-surface-900 ${friend.isOnline ? 'bg-emerald-500' : 'bg-surface-600'}`} title={friend.isOnline ? 'Online' : 'Offline'} />
                        )}
                      </div>
                      <span className="text-xs font-medium text-surface-200 truncate w-full text-center leading-tight" title={friend.displayName}>{friend.displayName}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleBlock(friend); }}
                        className="opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded text-[0.65rem] bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-opacity border border-red-500/20"
                      >Block</button>
                    </button>
                  ))}
                </div>
                <Paginator total={filteredFriends.length} page={page} pageSize={PAGE_SIZE} onPage={setPage} />
              </>
            )}
          </Card>
        </div>
      )}

      {tab === 'lobby' && (
        <Card title="Lobby" subtitle={`${lobby.total ?? 0} total · ${lobby.others ?? 0} others in instance`} className="star-border flex-1 min-h-0 flex flex-col" titleIcon={<Icons.Users />}>
          {(!lobby.users || lobby.users.length === 0) ? (
            <p className="text-surface-500 py-12 text-center text-sm">No one else in lobby</p>
          ) : (
            <div className="flex-1 min-h-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 content-start">
                {(lobby.users ?? []).map((u) => (
                  <div key={u.name + (u.id_suffix || '')} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/[0.05] border border-transparent hover:border-surface-700 transition-colors text-center relative group">
                    <button type="button" onDoubleClick={() => setProfileByName(u.name)} className="flex flex-col items-center gap-2 w-full" title="Double-click to open profile">
                      <div className="relative">
                        <UserAvatar friend={{ tags: [] }} sizeClasses="w-14 h-14" />
                        <span className="absolute bottom-0 right-0 z-[1] w-3 h-3 rounded-full border-2 border-surface-900 bg-emerald-500" title="In instance" />
                      </div>
                      <span className="text-xs font-medium text-surface-200 truncate w-full" title={u.name}>{u.name}{u.id_suffix ? ` (${u.id_suffix})` : ''}</span>
                    </button>
                    <button type="button" onClick={async () => { try { const info = await api.userInfo(u.name); handleBlock({ id: info.id, displayName: info.displayName || u.name, display_name: info.displayName || u.name }); } catch { toast('Could not look up user.', 'error'); } }}
                      className="opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded-lg text-[0.65rem] bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-opacity border border-red-500/20"
                    >Block</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {tab === 'blocked' && (
        <Card title="Blocked" subtitle="VRChat block list + local entries" className="star-border flex-1 min-h-0 flex flex-col" titleIcon={<Icons.Users />}>
          {blocked.length === 0 ? (
            <p className="text-surface-500 py-12 text-center text-sm">No blocked users</p>
          ) : (
            <div className="flex-1 min-h-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 content-start">
                {blocked.map((u) => (
                  <div key={u.user_id} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-800/20 border border-surface-700/40 text-center">
                    <UserAvatar friend={{ tags: [] }} sizeClasses="w-14 h-14" />
                    <span className="text-xs font-medium text-surface-300 truncate w-full" title={u.display_name}>{u.display_name}</span>
                    {u.source && (
                      <span className="text-[0.6rem] uppercase tracking-wider text-surface-600">{u.source === 'vrchat' ? 'VRChat' : u.source}</span>
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
