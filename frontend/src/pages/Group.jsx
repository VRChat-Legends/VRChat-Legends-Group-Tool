import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../api/client';
import Card from '../components/Card';
import { useToast } from '../components/Toast';
import FriendUserCard from '../components/FriendUserCard';
import UserAvatar from '../components/UserAvatar';
import { Icons } from '../components/Icons';

export default function Group() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [inWorld, setInWorld] = useState(true);
  const [announcement, setAnnouncement] = useState(null);
  const [posts, setPosts] = useState([]);
  const [bans, setBans] = useState([]);
  const [activeTab, setActiveTab] = useState('members');
  const toast = useToast();

  const fetchGroup = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    api.get('/api/group')
      .then((d) => {
        setData(d);
        if (!silent) setLoading(false);
        // Fetch extras when we have a group
        const gid = d?.group?.id;
        if (gid) {
          api.groupAnnouncement(gid).then((r) => setAnnouncement(r.announcement)).catch(() => {});
          api.groupPosts(gid).then((r) => setPosts(r.posts || [])).catch(() => {});
          api.groupBans(gid).then((r) => setBans(r.bans || [])).catch(() => {});
        }
      })
      .catch((e) => {
        toast(e.message || 'Failed to load group', 'error');
        setData({ error: e.message, group: null, members: [], loading: false });
        if (!silent) setLoading(false);
      });
  }, [toast]);

  useEffect(() => {
    fetchGroup();
    api.status().then((d) => setInWorld(d.in_world !== false)).catch(() => {});
  }, [fetchGroup]);

  useEffect(() => {
    if (!data?.loading) return;
    const id = setTimeout(() => fetchGroup(true), 5000);
    return () => clearTimeout(id);
  }, [data, fetchGroup]);

  const { group, members = [], roles = [], error } = data || {};
  const isInitialLoad = loading && !data;
  const q = search.trim().toLowerCase();
  const filteredMembers = q ? members.filter((m) => (m.display_name || '').toLowerCase().includes(q)) : members;

  const membersByRoleSection = useMemo(() => {    const roleOrder = [...roles].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    const sections = [];
    const used = new Set();
    for (const r of roleOrder) {
      const inRole = filteredMembers.filter((m) => (m.role_ids || []).map(String).includes(String(r.id)));
      inRole.forEach((m) => used.add(m.user_id));
      if (inRole.length) sections.push({ label: r.name || r.id, members: inRole });
    }
    const uncategorized = filteredMembers.filter((m) => !used.has(m.user_id));
    if (uncategorized.length) sections.push({ label: 'Other members', members: uncategorized });
    return sections.length ? sections : [{ label: 'Members', members: filteredMembers }];
  }, [filteredMembers, roles]);

  const memberAvatarFriend = (m) => ({
    currentAvatarImageUrl: m.avatar_url || '',
    profilePicOverride: m.profile_pic || '',
    userIcon: m.user_icon || '',
    tags: [],
  });

  const TABS = [
    { id: 'members', label: 'Members', icon: 'fa-users', count: members.length },
    { id: 'posts', label: 'Posts', icon: 'fa-newspaper', count: posts.length },
    { id: 'bans', label: 'Bans', icon: 'fa-ban', count: bans.length },
  ];

  return (
    <div className="space-y-4 animate-in w-full">
      {/* Initial load skeleton — keeps full page width */}
      {isInitialLoad && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 animate-pulse space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-surface-700 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-surface-700 rounded-lg w-1/3" />
              <div className="h-3 bg-surface-800 rounded w-1/5" />
              <div className="h-3 bg-surface-800 rounded w-2/3" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-surface-800" />
            ))}
          </div>
        </div>
      )}

      {/* Group header with banner */}
      {!isInitialLoad && group ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          {group.banner_url && (
            <div className="h-36 w-full overflow-hidden">
              <img src={group.banner_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
          )}
          <div className="p-5">
            <div className="flex items-start gap-4">
              {group.icon_url && (
                <img src={group.icon_url} alt="" className="w-16 h-16 rounded-xl object-cover bg-surface-700 border border-white/10 flex-shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white truncate">{group.name || '—'}</h1>
                <p className="text-sm text-surface-500">{group.short_code ? `${group.short_code}.${group.discriminator || '0000'}` : group.id}</p>
                {group.description && <p className="text-sm text-surface-400 mt-2 leading-relaxed line-clamp-3">{group.description}</p>}
              </div>
              <button type="button" onClick={() => fetchGroup()} disabled={loading} className="px-4 py-2 rounded-xl bg-surface-700 hover:bg-surface-600 text-surface-200 text-sm font-medium disabled:opacity-50 flex-shrink-0">
                <i className="fas fa-arrows-rotate mr-1.5 text-xs" />Refresh
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
              <Stat label="Members" value={group.member_count ?? '—'} icon="fa-users" />
              <Stat label="Online" value={group.online_member_count ?? '—'} icon="fa-circle" color="text-emerald-400" />
              <Stat label="Privacy" value={group.privacy || '—'} icon="fa-lock" />
              <Stat label="Roles" value={roles.length} icon="fa-shield-halved" />
              <Stat label="Bans" value={bans.length} icon="fa-ban" />
              <Stat label="Created" value={group.created_at ? new Date(group.created_at).toLocaleDateString() : '—'} icon="fa-calendar" />
            </div>

            {/* Languages & Tags */}
            {(group.languages?.length > 0 || group.tags?.length > 0) && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(group.languages || []).map((l) => (
                  <span key={l} className="px-2 py-0.5 rounded-md bg-blue-500/10 text-xs text-blue-300 border border-blue-500/20"><i className="fas fa-globe mr-1" />{l}</span>
                ))}
                {(group.tags || []).map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-surface-700 text-xs text-surface-400">{t}</span>
                ))}
              </div>
            )}

            {data?.loading && <span className="text-xs text-surface-500 animate-pulse mt-2 inline-block">Syncing members…</span>}
          </div>
        </div>
      ) : (
        !isInitialLoad && (
        <Card title="Group" subtitle="Your configured VRChat group" className="star-border" titleIcon={<Icons.Users />}>
          {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}
          <p className="text-surface-500">{data?.loading ? 'Fetching group data in background…' : 'Set your Group ID in Settings to view group info.'}</p>
        </Card>
        )
      )}

      {/* Rules */}
      {group?.rules && (
        <Card title="Group rules" titleIcon={<i className="fas fa-gavel text-amber-400 w-5 text-center" />}>
          <pre className="text-sm text-surface-300 whitespace-pre-wrap leading-relaxed">{group.rules}</pre>
        </Card>
      )}

      {/* Announcement */}
      {announcement && (
        <Card title="Announcement" titleIcon={<i className="fas fa-bullhorn text-brand-400 w-5 text-center" />} className="border-brand-500/20">
          <div className="space-y-2">
            {announcement.title && <h3 className="text-base font-semibold text-white">{announcement.title}</h3>}
            {announcement.text && <p className="text-sm text-surface-300 whitespace-pre-wrap leading-relaxed">{announcement.text}</p>}
            {announcement.imageUrl && <img src={announcement.imageUrl} alt="" className="rounded-xl max-h-64 object-cover mt-2" onError={(e) => { e.target.style.display = 'none'; }} />}
            <p className="text-xs text-surface-500">{announcement.created_at ? new Date(announcement.created_at).toLocaleString() : ''}</p>
          </div>
        </Card>
      )}

      {/* Tab sub-nav */}
      {group && (
        <>
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
            {TABS.map(({ id, label, icon, count }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'bg-vrcl-purple/25 text-white border border-vrcl-purple/30'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'
                }`}
              >
                <i className={`fas ${icon} text-xs`} />
                {label}
                {count > 0 && <span className="text-xs opacity-60">({count})</span>}
              </button>
            ))}
          </div>

          {/* Members tab */}
          {activeTab === 'members' && (
            <Card title="Group members" subtitle={`Showing ${filteredMembers.length} of ${members.length} · grouped by role`} className="star-border" titleIcon={<Icons.Users />}>
              {members.length > 0 && (
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members…" className="w-full mb-3 px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500" />
              )}
              {members.length === 0 ? (
                <p className="text-surface-500 py-8 text-center">
                  {data?.loading ? 'Loading members in the background — this may take a minute for large groups…' : (group ? 'No members loaded or you lack permission.' : 'Configure group in Settings first.')}
                </p>
              ) : (
                <div className="overflow-y-auto pr-1 space-y-6">
                  {membersByRoleSection.map(({ label, members: sectionMembers }) => (
                    <div key={label}>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">{label}</h3>
                        <span className="text-xs text-surface-500">({sectionMembers.length})</span>
                        <div className="flex-1 h-px bg-surface-700" />
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 content-start">
                        {sectionMembers.map((m) => (
                          <button
                            key={m.id || m.user_id}
                            type="button"
                            onClick={() => setSelected({ userId: m.user_id, displayName: m.display_name })}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-surface-600 transition-colors text-center"
                          >
                            <UserAvatar friend={memberAvatarFriend(m)} sizeClasses="w-14 h-14 sm:w-16 sm:h-16" />
                            <span className="text-xs sm:text-sm font-medium text-surface-200 truncate w-full">{m.display_name || 'Unknown'}</span>
                            {(m.role_names && m.role_names.length > 0) && (
                              <span className="text-[0.65rem] text-surface-500 truncate w-full" title={m.role_names.join(', ')}>{m.role_names[0]}{m.role_names.length > 1 ? ` +${m.role_names.length - 1}` : ''}</span>
                            )}
                            <span className="text-[0.65rem] text-surface-600">{m.joined_at ? new Date(m.joined_at).toLocaleDateString() : ''}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Posts tab */}
          {activeTab === 'posts' && (
            <Card title="Group posts" subtitle={`${posts.length} recent posts`} titleIcon={<i className="fas fa-newspaper text-brand-400 w-5 text-center" />}>
              {posts.length === 0 ? (
                <p className="text-surface-500 py-8 text-center">No posts found.</p>
              ) : (
                <div className="space-y-4">
                  {posts.map((p) => (
                    <div key={p.id} className="p-4 rounded-xl bg-surface-800/50 border border-surface-700/40">
                      {p.title && <h4 className="font-semibold text-white mb-1">{p.title}</h4>}
                      {p.text && <p className="text-sm text-surface-300 whitespace-pre-wrap leading-relaxed">{p.text}</p>}
                      {p.imageUrl && <img src={p.imageUrl} alt="" className="rounded-xl max-h-48 object-cover mt-2" onError={(e) => { e.target.style.display = 'none'; }} />}
                      <div className="flex items-center gap-3 mt-2 text-xs text-surface-500">
                        {p.visibility && <span className="capitalize"><i className="fas fa-eye mr-1" />{p.visibility}</span>}
                        {p.created_at && <span>{new Date(p.created_at).toLocaleString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Bans tab */}
          {activeTab === 'bans' && (
            <Card title="Group bans" subtitle={`${bans.length} banned users`} titleIcon={<i className="fas fa-ban text-red-400 w-5 text-center" />}>
              {bans.length === 0 ? (
                <p className="text-surface-500 py-8 text-center">No bans found.</p>
              ) : (
                <div className="space-y-2">
                  {bans.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-800/50 border border-surface-700/40">
                      <div>
                        <p className="text-sm text-surface-200 font-medium font-mono">{b.bannedUserId || '—'}</p>
                        <p className="text-xs text-surface-500">{b.created_at ? new Date(b.created_at).toLocaleString() : ''}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          api.unbanGroupMember(group.id, b.bannedUserId)
                            .then(() => { toast('Unbanned', 'success'); setBans((prev) => prev.filter((x) => x.id !== b.id)); })
                            .catch((e) => toast(e.message, 'error'));
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm"
                      >
                        Unban
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {selected && <FriendUserCard userId={selected.userId} displayName={selected.displayName} onClose={() => setSelected(null)} inWorld={inWorld} />}
    </div>
  );
}

function Stat({ label, value, icon, color = 'text-surface-400' }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center gap-2 mb-1">
        <i className={`fas ${icon} text-xs ${color}`} />
        <span className="text-xs text-surface-500">{label}</span>
      </div>
      <p className="text-sm font-semibold text-surface-100 truncate">{value}</p>
    </div>
  );
}
