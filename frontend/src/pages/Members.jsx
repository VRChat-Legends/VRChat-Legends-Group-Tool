import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import Paginator from '../components/Paginator';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import FriendUserCard from '../components/FriendUserCard';
import UserProfileModal from '../components/UserProfileModal';
import UserAvatar from '../components/UserAvatar';
import SpotlightCard from '../components/SpotlightCard';
import BlurText from '../components/BlurText';

const PAGE_SIZE = 15;

const TABS = [
  { id: 'friends', label: 'Friends',   count: null, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'lobby',   label: 'Lobby',     count: null, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'blocked', label: 'Blocked',   count: null, icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
];

const STATUS_DOT = {
  'join me': 'bg-blue-500',
  active: 'bg-emerald-500',
  'ask me': 'bg-amber-500',
  busy: 'bg-red-500',
  offline: 'bg-slate-600',
};

function statusDotClass(status) {
  return STATUS_DOT[(status || '').toLowerCase()] || STATUS_DOT.offline;
}

/** Unified person tile used in all three tabs */
function PersonTile({ user, onClick, onBlock, onUnblock, isAppFav, isVrcFav, onToggleAppFav, variant = 'friend' }) {
  const name       = user.displayName || user.display_name || user.name || 'Unknown';
  const status     = (user.status || '').toLowerCase();
  const isOnline   = user.isOnline;
  const dotClass   = variant === 'lobby' ? 'bg-emerald-500' : statusDotClass(status);

  return (
    <SpotlightCard
      as="button"
      type="button"
      onClick={onClick}
      className="person-card group w-full text-left"
      spotlightColor="rgba(109, 74, 255, 0.1)"
    >
      {/* Fav stars — Friends only */}
      {variant === 'friend' && (
        <div className={`absolute top-1.5 right-1.5 z-10 flex rounded-lg overflow-hidden transition-opacity ${(isAppFav || isVrcFav) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <span className={`px-1 py-1 text-xs ${isVrcFav ? 'text-amber-400' : 'text-slate-600'}`} title="VRChat favorite">★</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleAppFav?.(e); }}
            className={`px-1 py-1 text-xs transition-colors ${isAppFav ? 'text-violet-400 hover:text-violet-300' : 'text-slate-600 hover:text-violet-400'}`}
            title={isAppFav ? 'Remove from app favorites' : 'Add to app favorites'}
          >{isAppFav ? '★' : '☆'}</button>
        </div>
      )}

      {/* Avatar + status dot */}
      <div className="relative mb-1">
        <UserAvatar friend={user.tags !== undefined ? user : { tags: [], ...user }} sizeClasses="w-14 h-14" roundedClasses="rounded-xl" />
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${dotClass}`}
          style={{ borderColor: 'rgba(5,5,10,0.9)' }}
          title={variant === 'lobby' ? 'In lobby' : (isOnline ? 'Online' : 'Offline')}
        />
      </div>

      {/* Name */}
      <p className="text-xs font-semibold text-slate-200 truncate w-full text-center leading-tight px-1" title={name}>
        {name}
      </p>

      {/* Source badge for blocked */}
      {variant === 'blocked' && user.source && (
        <span className="text-[0.58rem] uppercase tracking-wider text-slate-600">{user.source === 'vrchat' ? 'VRC' : user.source}</span>
      )}

      {/* Actions row */}
      <div className="person-card-actions flex gap-1 mt-0.5">
        {variant !== 'blocked' && onBlock && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onBlock(); }}
            className="px-2 py-0.5 rounded text-[0.6rem] border transition-colors"
            style={{ background: 'rgba(239,68,68,0.12)', color: 'rgb(252,165,165)', borderColor: 'rgba(239,68,68,0.2)' }}
          >Block</button>
        )}
        {variant === 'blocked' && onUnblock && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onUnblock(); }}
            className="px-2 py-0.5 rounded text-[0.6rem] border transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgb(203,213,225)', borderColor: 'rgba(255,255,255,0.1)' }}
          >Unblock</button>
        )}
      </div>
    </SpotlightCard>
  );
}

/** Shared search + sort bar used by all tabs */
function SearchBar({ value, onChange, placeholder = 'Search…', sortBy, onSortChange, showSort = false, count, countLabel = '' }) {
  return (
    <div className="flex items-center gap-2 mb-4 flex-shrink-0">
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 rounded-xl text-sm"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        />
      </div>
      {showSort && onSortChange && (
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="py-2 pl-3 pr-7 rounded-xl text-xs"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', minWidth: '7rem' }}
        >
          <option value="lastPlayed">Last played</option>
          <option value="name">Name A–Z</option>
        </select>
      )}
      {count != null && (
        <span className="text-xs text-slate-600 flex-shrink-0">{count} {countLabel}</span>
      )}
    </div>
  );
}

/** Filter chip bar */
function FilterBar({ filters, active, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-4 flex-shrink-0">
      {filters.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className="px-3 py-1 rounded-lg text-xs font-semibold border transition-all"
          style={
            active === id
              ? { background: 'rgba(109,74,255,0.2)', borderColor: 'rgba(109,74,255,0.35)', color: '#e9d5ff' }
              : { background: 'rgba(255,255,255,0.035)', borderColor: 'rgba(255,255,255,0.06)', color: 'rgb(100,116,139)' }
          }
        >{label}</button>
      ))}
    </div>
  );
}

export default function Members() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'friends';
  const setTab = (id) => {
    setSearchParams({ tab: id });
    setPage(1);
    setSearch('');
    setLobbySearch('');
    setBlockedSearch('');
  };

  /* ── state ─────────────────────────────────────────────────── */
  const [friends, setFriends]                     = useState([]);
  const [lastUpdate, setLastUpdate]               = useState(null);
  const [lobby, setLobby]                         = useState({ users: [], total: 0, others: 0 });
  const [blocked, setBlocked]                     = useState([]);
  const [selected, setSelected]                   = useState(null);
  const [profileByName, setProfileByName]         = useState(null);
  const [inWorld, setInWorld]                     = useState(true);
  const [loading, setLoading]                     = useState(true);
  const [search, setSearch]                       = useState('');
  const [lobbySearch, setLobbySearch]             = useState('');
  const [blockedSearch, setBlockedSearch]         = useState('');
  const [filterTab, setFilterTab]                 = useState('all');
  const [appFavoriteIds, setAppFavoriteIds]       = useState(new Set());
  const [vrchatFavoriteIds, setVrchatFavoriteIds] = useState(new Set());
  const [sortBy, setSortBy]                       = useState('lastPlayed');
  const [page, setPage]                           = useState(1);
  const [lobbyPage, setLobbyPage]                 = useState(1);
  const [blockedPage, setBlockedPage]             = useState(1);

  const toast     = useToast();
  const { confirm } = useConfirm();

  const isVrcFavorite = (f) => vrchatFavoriteIds.has(f.id);
  const isAppFavorite = (f) => appFavoriteIds.has(f.id);
  const isFavorite    = (f) => isAppFavorite(f) || isVrcFavorite(f);

  /* ── data fetching ─────────────────────────────────────────── */
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
    const id = setInterval(() => { fetchFriends(); fetchStatus(); }, 30000);
    return () => clearInterval(id);
  }, [fetchFriends, fetchStatus]);

  /* ── actions ───────────────────────────────────────────────── */
  const toggleAppFavorite = useCallback((friend, e) => {
    e.stopPropagation();
    const add = !isAppFavorite(friend);
    api.post('/api/friends/app-favorites', { user_id: friend.id, add })
      .then(() => setAppFavoriteIds((prev) => {
        const n = new Set(prev);
        if (add) n.add(friend.id); else n.delete(friend.id);
        return n;
      }))
      .catch((e) => toast(e.message, 'error'));
  }, [isAppFavorite, toast]);

  const handleBlock = useCallback(async (user) => {
    const name = user.displayName || user.display_name || user.name || 'this user';
    const ok = await confirm(`Block ${name}?`, 'Block user');
    if (!ok) return;
    try {
      await api.post('/api/blocked', { user_id: user.id || user.user_id, display_name: name });
      toast('User blocked', 'success');
      fetchBlocked();
    } catch (e) { toast(e.message, 'error'); }
  }, [confirm, fetchBlocked, toast]);

  const handleUnblock = useCallback(async (u) => {
    const ok = await confirm(`Unblock ${u.display_name}?`, 'Unblock');
    if (!ok) return;
    try {
      await api.delete(`/api/blocked/${encodeURIComponent(u.user_id)}`);
      toast('User unblocked', 'success');
      fetchBlocked();
    } catch (e) { toast(e.message, 'error'); }
  }, [confirm, fetchBlocked, toast]);

  /* ── filtering / sorting ───────────────────────────────────── */
  const filteredFriends = useMemo(() => {
    let list = friends;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((f) => (f.displayName || '').toLowerCase().includes(q) || (f.username || '').toLowerCase().includes(q));
    if (filterTab === 'favorites')          list = list.filter(isFavorite);
    else if (filterTab === 'app_favorites') list = list.filter(isAppFavorite);
    else if (filterTab === 'vrc_favorites') list = list.filter(isVrcFavorite);
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

  const filteredLobby = useMemo(() => {
    const q = lobbySearch.trim().toLowerCase();
    if (!q) return lobby.users ?? [];
    return (lobby.users ?? []).filter((u) => (u.name || '').toLowerCase().includes(q));
  }, [lobby.users, lobbySearch]);

  const filteredBlocked = useMemo(() => {
    const q = blockedSearch.trim().toLowerCase();
    if (!q) return blocked;
    return blocked.filter((u) => (u.display_name || '').toLowerCase().includes(q));
  }, [blocked, blockedSearch]);

  useEffect(() => { setPage(1); }, [search, filterTab, tab]);
  useEffect(() => { setLobbyPage(1); }, [lobbySearch]);
  useEffect(() => { setBlockedPage(1); }, [blockedSearch]);

  const pagedFriends  = useMemo(() => filteredFriends.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredFriends, page]);
  const pagedLobby    = useMemo(() => filteredLobby.slice((lobbyPage - 1) * PAGE_SIZE, lobbyPage * PAGE_SIZE), [filteredLobby, lobbyPage]);
  const pagedBlocked  = useMemo(() => filteredBlocked.slice((blockedPage - 1) * PAGE_SIZE, blockedPage * PAGE_SIZE), [filteredBlocked, blockedPage]);

  const openCard = (friend) => setSelected({ userId: friend.id, displayName: friend.displayName });
  const closeCard = useCallback(() => setSelected(null), []);

  const FRIEND_FILTERS = [
    { id: 'all',           label: 'All' },
    { id: 'favorites',     label: 'Favorites' },
    { id: 'app_favorites', label: 'App Favs' },
    { id: 'vrc_favorites', label: 'VRC Favs' },
  ];

  /* ── helpers ───────────────────────────────────────────────── */
  const sectionClass = 'flex-1 min-h-0 flex flex-col animate-in';

  const EmptyState = ({ message }) => (
    <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center" style={{ background: 'rgba(109,74,255,0.08)', border: '1px solid rgba(109,74,255,0.15)' }}>
        <svg className="w-6 h-6" style={{ color: 'rgba(139,92,246,0.5)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M15 19l-7-7 7-7" />
        </svg>
      </div>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );

  const GridWrap = ({ children }) => (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
      {children}
    </div>
  );

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Page header */}
      <div className="page-hero">
        <h1 className="page-hero-title">
          <BlurText text="People" delay={80} />
        </h1>
        <p className="page-hero-sub">
          Friends, lobby companions and blocked users
        </p>
      </div>

      {/* Tab bar */}
      <div className="tab-bar mb-5 flex-shrink-0">
        {TABS.map(({ id, label, icon }) => {
          const counts = { friends: friends.length, lobby: lobby.users?.length ?? 0, blocked: blocked.length };
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`tab-bar-item ${tab === id ? 'tab-bar-item--active' : 'tab-bar-item--idle'}`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={icon} />
              </svg>
              {label}
              {counts[id] > 0 && (
                <span className="ml-0.5 text-[0.6rem] px-1.5 py-0.5 rounded-full font-bold"
                  style={tab === id
                    ? { background: 'rgba(109,74,255,0.3)', color: '#e9d5ff' }
                    : { background: 'rgba(255,255,255,0.06)', color: 'rgb(100,116,139)' }
                  }
                >{counts[id]}</span>
              )}
            </button>
          );
        })}
        {lastUpdate && (
          <span className="ml-auto text-[0.65rem] text-slate-600 self-center pr-1 hidden sm:block">
            Synced {new Date(lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* ── FRIENDS ─────────────────────────────────────────── */}
      {tab === 'friends' && (
        <div className={sectionClass}>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                <p className="text-xs text-slate-600">Loading friends…</p>
              </div>
            </div>
          ) : (
            <>
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search friends…"
                sortBy={sortBy}
                onSortChange={setSortBy}
                showSort
                count={filteredFriends.length}
                countLabel="friends"
              />
              <FilterBar filters={FRIEND_FILTERS} active={filterTab} onSelect={(id) => { setFilterTab(id); setPage(1); }} />
              {filteredFriends.length === 0 ? (
                <EmptyState message={friends.length === 0 ? "No friends cached yet — wait for next refresh." : "No friends match your search."} />
              ) : (
                <>
                  <GridWrap>
                    {pagedFriends.map((friend) => (
                      <PersonTile
                        key={friend.id}
                        user={friend}
                        variant="friend"
                        onClick={() => openCard(friend)}
                        onBlock={() => handleBlock(friend)}
                        isAppFav={isAppFavorite(friend)}
                        isVrcFav={isVrcFavorite(friend)}
                        onToggleAppFav={(e) => toggleAppFavorite(friend, e)}
                      />
                    ))}
                  </GridWrap>
                  <Paginator total={filteredFriends.length} page={page} pageSize={PAGE_SIZE} onPage={setPage} />
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── LOBBY ───────────────────────────────────────────── */}
      {tab === 'lobby' && (
        <div className={sectionClass}>
          <SearchBar
            value={lobbySearch}
            onChange={setLobbySearch}
            placeholder="Search lobby…"
            count={filteredLobby.length}
            countLabel={`/ ${lobby.total ?? 0} total${lobby.others ? ` · ${lobby.others} others` : ''}`}
          />
          {filteredLobby.length === 0 ? (
            <EmptyState message={!lobby.users?.length ? "No one else is in your lobby." : "No match for that search."} />
          ) : (
            <>
              <GridWrap>
                {pagedLobby.map((u) => (
                  <PersonTile
                    key={u.name + (u.id_suffix || '')}
                    user={{ ...u, displayName: u.name + (u.id_suffix ? ` (${u.id_suffix})` : ''), tags: [] }}
                    variant="lobby"
                    onClick={() => setProfileByName(u.name)}
                    onBlock={async () => {
                      try {
                        const info = await api.userInfo(u.name);
                        handleBlock({ id: info.id, displayName: info.displayName || u.name });
                      } catch { toast('Could not look up user.', 'error'); }
                    }}
                  />
                ))}
              </GridWrap>
              <Paginator total={filteredLobby.length} page={lobbyPage} pageSize={PAGE_SIZE} onPage={setLobbyPage} />
            </>
          )}
        </div>
      )}

      {/* ── BLOCKED ─────────────────────────────────────────── */}
      {tab === 'blocked' && (
        <div className={sectionClass}>
          <SearchBar
            value={blockedSearch}
            onChange={setBlockedSearch}
            placeholder="Search blocked users…"
            count={filteredBlocked.length}
            countLabel="blocked"
          />
          {filteredBlocked.length === 0 ? (
            <EmptyState message={!blocked.length ? "No blocked users." : "No match for that search."} />
          ) : (
            <>
              <GridWrap>
                {pagedBlocked.map((u) => (
                  <PersonTile
                    key={u.user_id}
                    user={{ displayName: u.display_name, tags: [], source: u.source }}
                    variant="blocked"
                    onClick={() => {}}
                    onUnblock={() => handleUnblock(u)}
                  />
                ))}
              </GridWrap>
              <Paginator total={filteredBlocked.length} page={blockedPage} pageSize={PAGE_SIZE} onPage={setBlockedPage} />
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {selected && (
        <FriendUserCard userId={selected.userId} displayName={selected.displayName} onClose={closeCard} inWorld={inWorld} onFriendRemoved={fetchFriends} />
      )}
      {profileByName && (
        <UserProfileModal displayName={profileByName} onClose={() => setProfileByName(null)} inWorld={inWorld} />
      )}
    </div>
  );
}
