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
  const toast = useToast();

  const fetchGroup = useCallback(() => {
    setLoading(true);
    api.get('/api/group')
      .then((d) => setData(d))
      .catch((e) => {
        toast(e.message || 'Failed to load group', 'error');
        setData({ error: e.message, group: null, members: [] });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    fetchGroup();
    api.status().then((d) => setInWorld(d.in_world !== false)).catch(() => {});
  }, [fetchGroup]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-surface-500">Loading group…</span>
      </div>
    );
  }

  const { group, members = [], roles = [], error } = data || {};
  const q = search.trim().toLowerCase();
  const filteredMembers = q ? members.filter((m) => (m.display_name || '').toLowerCase().includes(q)) : members;

  const membersByRoleSection = useMemo(() => {
    const roleOrder = [...roles].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
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

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-in">
      <Card title="Group" subtitle="Your configured VRChat group" className="star-border flex-shrink-0 mb-4" titleIcon={<Icons.Users />}>
        {error && !group && <p className="text-amber-400 text-sm mb-4">{error}</p>}
        {group ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><p className="text-xs text-surface-500">Name</p><p className="font-semibold text-surface-100">{group.name || '—'}</p></div>
            <div><p className="text-xs text-surface-500">Short code</p><p className="font-semibold text-surface-100">{group.short_code || '—'}</p></div>
            <div><p className="text-xs text-surface-500">Members</p><p className="font-semibold text-surface-100">{group.member_count ?? '—'}</p></div>
            <div><p className="text-xs text-surface-500">Group ID</p><p className="text-xs font-mono text-surface-400 truncate" title={group.id}>{group.id || '—'}</p></div>
          </div>
        ) : (
          <p className="text-surface-500">Set your Group ID in Settings to view group info.</p>
        )}
        <button type="button" onClick={fetchGroup} disabled={loading} className="mt-3 px-4 py-2 rounded-xl bg-surface-700 hover:bg-surface-600 text-surface-200 text-sm font-medium disabled:opacity-50">Refresh</button>
      </Card>

      <Card title="Group members" subtitle={`Showing ${filteredMembers.length} of ${members.length} · grouped by role`} className="star-border flex-1 min-h-0 flex flex-col" titleIcon={<Icons.Users />}>
        {members.length > 0 && (
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members…" className="w-full mb-3 px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500" />
        )}
        {members.length === 0 ? (
          <p className="text-surface-500 py-8 text-center flex-1">{group ? 'No members loaded or you lack permission.' : 'Configure group in Settings first.'}</p>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-6">
            {membersByRoleSection.map(({ label, members: sectionMembers }) => (
              <div key={label}>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">{label}</h3>
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
                      <UserAvatar friend={{ tags: [] }} sizeClasses="w-14 h-14 sm:w-16 sm:h-16" />
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

      {selected && <FriendUserCard userId={selected.userId} displayName={selected.displayName} onClose={() => setSelected(null)} inWorld={inWorld} />}
    </div>
  );
}
