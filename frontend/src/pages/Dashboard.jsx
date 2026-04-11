import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Card from '../components/Card';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import ClickSpark from '../components/ClickSpark';
import UserProfileModal from '../components/UserProfileModal';
import CountUp from '../components/CountUp';
import { Icons } from '../components/Icons';
import UserAvatar from '../components/UserAvatar';
import BlurText from '../components/BlurText';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState('');
  const [statusDescDraft, setStatusDescDraft] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const toast = useToast();
  const { confirm } = useConfirm();
  const closeProfile = useCallback(() => setProfileUser(null), []);

  useEffect(() => {
    const fetchData = () => api.status().then(setData).catch(console.error);
    fetchData();
    const id = setInterval(fetchData, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (editingProfile) return;
    const u = data?.user;
    if (!u) return;
    setBioDraft(u.bio ?? '');
    setStatusDraft(u.status ?? '');
    setStatusDescDraft(u.status_description ?? u.statusDescription ?? '');
  }, [editingProfile, data?.user?.id, data?.user?.bio, data?.user?.status, data?.user?.status_description, data?.user?.statusDescription]);

  const handle = async (fn, successMsg, errorMsg) => {
    try {
      await fn();
      toast(successMsg, 'success');
    } catch (e) {
      toast(errorMsg || e.message, 'error');
    }
  };

  if (!data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <p className="text-surface-500 text-sm">Loading…</p>
      </div>
    );
  }

  const { user, lobby, logs, current_invite_batch, next_poll_remaining, pending_friend_requests, auto_invite_enabled, auto_accept_friend_enabled, auto_event_invite_enabled, lobby_status, group_member_count, invites_sent, invites_failed, friend_requests_accepted, friend_requests_expired, invites_skipped_cooldown, bot_uptime_seconds, current_world, queue_size, time_until_next_switch, chatbox_preview, active_worlds, tray_minimize_available, window_visible } = data;

  const formatUptime = (sec) => {
    if (sec < 60) return `${Math.floor(sec)}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ${Math.floor(sec % 60)}s`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
    return `${Math.floor(sec / 86400)}d ${Math.floor((sec % 86400) / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
  };

  const statusBadge = (status) => {
    const s = (status || '').toLowerCase().replace(/\s+/g, '');
    const colors = {
      online: 'bg-emerald-500/20 text-emerald-400',
      active: 'bg-emerald-500/20 text-emerald-400',
      busy: 'bg-amber-500/20 text-amber-400',
      joinme: 'bg-blue-500/20 text-blue-400',
      askme: 'bg-purple-500/20 text-purple-400',
      offline: 'bg-surface-500/20 text-surface-400',
    };
    return colors[s] || 'bg-surface-500/20 text-surface-400';
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.updateCurrentUser({
        bio: bioDraft,
        status: statusDraft || undefined,
        status_description: statusDescDraft,
      });
      toast('Profile updated', 'success');
      setEditingProfile(false);
      const fresh = await api.status();
      setData(fresh);
    } catch (e) {
      toast(e.message || 'Update failed', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6 animate-in w-full">
      {/* Page hero */}
      <div className="page-hero">
        <h1 className="page-hero-title">
          <BlurText text="Dashboard" delay={70} />
        </h1>
        <p className="page-hero-sub">Your VRChat Legends control centre</p>
      </div>

      {tray_minimize_available && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            window_visible === false
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
              : 'border-violet-500/30 bg-violet-500/10 text-surface-200'
          }`}
        >
          <strong className={window_visible === false ? 'text-amber-200' : 'text-violet-400'}>
            {window_visible === false ? 'Running in tray: ' : 'Tray mode: '}
          </strong>
          The app keeps working when you close the window. Use the tray icon → Open VRChat Legends Group Tool to show it again. Hover the tray icon to see the full tooltip.
        </div>
      )}

      <Card className="star-border">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
          <div className="relative flex-shrink-0 mx-auto lg:mx-0">
            <UserAvatar
              friend={{
                currentAvatarImageUrl: user?.currentAvatarImageUrl || user?.current_avatar_image_url,
                profilePicOverride: user?.profilePicOverride || user?.profile_pic_override,
                userIcon: user?.userIcon || user?.user_icon,
                tags: user?.tags,
                hasVrcPlus: user?.has_vrc_plus,
              }}
              sizeClasses="w-24 h-24 sm:w-28 sm:h-28"
              ringClasses="ring-2 ring-brand-500/40"
            />
            {user?.status && (
              <span
                className={`absolute bottom-1 right-1 z-[1] w-3.5 h-3.5 rounded-full border-2 border-surface-900 ${statusBadge(user.status).split(' ')[0]}`}
                title={user.status}
              />
            )}
          </div>

          <div className="flex-1 min-w-0 w-full text-center lg:text-left">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-surface-500">Signed in</p>
                <p className="text-xl sm:text-2xl font-semibold text-surface-100 mt-1">{user?.display_name ?? 'Unknown'}</p>
                <p className="text-sm text-surface-500">@{user?.username ?? 'unknown'}</p>
              </div>
              <div className="relative flex justify-center lg:justify-end">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((o) => !o)}
                  className="p-2 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-surface-200"
                  aria-label="Profile menu"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {profileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileMenuOpen(false)} />
                    <div className="absolute right-0 mt-1 py-1 w-48 rounded-xl bg-surface-800 border border-surface-600 shadow-xl z-20">
                      <Link to="/settings" onClick={() => setProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-surface-200 hover:bg-surface-700">Settings</Link>
                      <Link to="/docs" onClick={() => setProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-surface-200 hover:bg-surface-700">Documentation</Link>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-1.5 mt-3">
              {user?.status && (
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(user.status)}`} title={user.status_description}>
                  {user.status}
                </span>
              )}
              {user?.trust_rank_display_name && (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-brand-500/20 text-brand-300" title="Trust rank">
                  {user.trust_rank_display_name}
                </span>
              )}
              {user?.has_vrc_plus && (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400" title="VRC+">
                  VRC+
                </span>
              )}
              {user?.age_verified && (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400" title="Verified adult (VRChat tag)">
                  18+ verified
                </span>
              )}
            </div>

            <dl className="mt-4 w-full text-left grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm items-baseline">
              {user?.lastPlatform && (
                <>
                  <dt className="text-surface-500">Platform</dt>
                  <dd className="text-surface-200">{user.lastPlatform}</dd>
                </>
              )}
              {user?.location && (
                <>
                  <dt className="text-surface-500">Location</dt>
                  <dd className="text-surface-200 truncate min-w-0 font-mono text-xs" title={user.location}>
                    {user.location}
                  </dd>
                </>
              )}
              {user?.id && (
                <>
                  <dt className="text-surface-500">User ID</dt>
                  <dd className="text-surface-400 font-mono text-xs truncate min-w-0" title={user.id}>
                    {user.id}
                  </dd>
                </>
              )}
            </dl>

            <div className="mt-5 w-full text-left border-t border-surface-700/80 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">Bio &amp; status</span>
                <button
                  type="button"
                  onClick={() => (editingProfile ? setEditingProfile(false) : setEditingProfile(true))}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200"
                >
                  {editingProfile ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {editingProfile ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-surface-500 block mb-1">Status</label>
                    <select
                      value={statusDraft}
                      onChange={(e) => setStatusDraft(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-surface-700 text-surface-100 text-sm"
                    >
                      <option value="active">Online (active)</option>
                      <option value="join me">Join me</option>
                      <option value="busy">Busy</option>
                      <option value="ask me">Ask me</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-surface-500 block mb-1">Status message (max 80)</label>
                    <input
                      value={statusDescDraft}
                      onChange={(e) => setStatusDescDraft(e.target.value.slice(0, 80))}
                      className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-surface-700 text-surface-100 text-sm"
                      placeholder="What you're up to…"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-surface-500 block mb-1">Bio (max 512)</label>
                    <textarea
                      value={bioDraft}
                      onChange={(e) => setBioDraft(e.target.value.slice(0, 512))}
                      rows={4}
                      className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-surface-700 text-surface-100 text-sm resize-y min-h-[5rem]"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={savingProfile}
                    onClick={saveProfile}
                    className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium disabled:opacity-50"
                  >
                    {savingProfile ? 'Saving…' : 'Save to VRChat'}
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-surface-300">
                    {(user?.status || user?.status_description) ? (
                      <>
                        <span className="font-medium text-surface-200">{user?.status}</span>
                        {user?.status_description ? ` · ${user.status_description}` : ''}
                      </>
                    ) : (
                      <span className="italic text-surface-500">No status message</span>
                    )}
                  </p>
                  <p className="mt-2 text-sm text-surface-400 whitespace-pre-wrap">{user?.bio ? user.bio : <span className="italic text-surface-500">No bio</span>}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {active_worlds && active_worlds.length > 0 && (
        <Card title="Current world" subtitle="From your VRChat location (see also vrchat.community API docs)" className="star-border" titleIcon={<Icons.Globe />}>
          <div className="space-y-4">
            {active_worlds.map((w) => (
              <div key={w.world_id || w.name} className="rounded-xl border border-surface-700/60 bg-surface-800/40 p-4 text-sm space-y-1.5">
                <p className="font-semibold text-surface-100">{w.name || w.world_id || 'World'}</p>
                <p className="text-surface-400">
                  By <span className="text-surface-200">{w.author_name || 'Unknown'}</span>
                  {w.author_id ? <span className="font-mono text-xs text-surface-500 ml-1">({w.author_id})</span> : null}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-surface-500">
                  {w.visits != null && <span>Visits: {w.visits}</span>}
                  {w.capacity != null && <span>Capacity: {w.capacity}</span>}
                  {w.heat != null && <span>Heat: {w.heat}</span>}
                  {w.release_status && <span>Release: {w.release_status}</span>}
                  {w.instance && <span className="font-mono truncate max-w-full">Instance: {w.instance}</span>}
                </div>
                {w.description && <p className="text-xs text-surface-500 line-clamp-4 mt-2">{w.description}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Stats + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Quick stats" className="star-border lg:col-span-1">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span className="text-surface-500">Bot uptime</span><span className="font-medium">{formatUptime(bot_uptime_seconds ?? 0)}</span></li>
            <li className="flex justify-between"><span className="text-surface-500">Current world</span><span className="font-medium truncate max-w-[140px]" title={current_world}>{current_world || 'N/A'}</span></li>
            <li className="flex justify-between"><span className="text-surface-500">Queue size</span><span className="font-medium">{queue_size ?? current_invite_batch?.length ?? 0}</span></li>
            <li className="flex justify-between"><span className="text-surface-500">Time until next switch</span><span className="font-medium"><CountUp value={time_until_next_switch ?? next_poll_remaining} duration={400} />s</span></li>
            <li className="flex justify-between"><span className="text-surface-500">Pending requests</span><span className="font-medium"><CountUp value={pending_friend_requests} duration={400} /></span></li>
            <li className="flex justify-between"><span className="text-surface-500">Lobby</span><span className="font-medium"><CountUp value={lobby?.total ?? 0} duration={400} /> (<CountUp value={lobby?.others ?? 0} duration={400} /> others)</span></li>
            <li className="flex justify-between"><span className="text-surface-500">VRChat</span><span className={lobby_status === 'not_running' ? 'text-red-400' : 'text-emerald-400'} title="API health">{lobby_status === 'not_running' ? 'Not running' : 'Running'}</span></li>
            <li className="flex justify-between"><span className="text-surface-500">Group members</span><span className="font-medium">{group_member_count ?? 0}</span></li>
            <li className="flex justify-between"><span className="text-surface-500">Invites sent (session)</span><span className="font-medium"><CountUp value={invites_sent ?? 0} duration={400} /></span></li>
            <li className="flex justify-between"><span className="text-surface-500">Invites failed (session)</span><span className="font-medium"><CountUp value={invites_failed ?? 0} duration={400} /></span></li>
            <li className="flex justify-between"><span className="text-surface-500">Friends accepted (session)</span><span className="font-medium"><CountUp value={friend_requests_accepted ?? 0} duration={400} /></span></li>
            <li className="flex justify-between"><span className="text-surface-500">Friends expired (session)</span><span className="font-medium"><CountUp value={friend_requests_expired ?? 0} duration={400} /></span></li>
            <li className="flex justify-between"><span className="text-surface-500">Skipped (cooldown)</span><span className="font-medium"><CountUp value={invites_skipped_cooldown ?? 0} duration={400} /></span></li>
          </ul>
        </Card>
        <Card title="Actions" className="lg:col-span-2">
          <div className="flex flex-wrap gap-2 mb-3">
            <ClickSpark>
              <button onClick={async () => { const ok = await confirm('Restart the application? It will close and reopen.', 'Restart'); if (ok) { try { await api.restart(); toast('Restarting…', 'success'); } catch (e) { toast(e.message, 'error'); } } }} className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium">
                Restart
              </button>
            </ClickSpark>
          </div>
          <div className="space-y-2">
            <ClickSpark>
              <button onClick={() => handle(api.inviteLobby, 'Invite started', 'Invite failed')} className="btn-shine w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-sm font-semibold transition-all shadow-lg hover:shadow-glow flex items-center justify-center gap-2">
                <Icons.Invite /> Invite entire lobby
              </button>
            </ClickSpark>
            <ClickSpark>
              <button onClick={() => handle(api.friendLobby, 'Friend requests sent', 'Failed')} className="btn-shine w-full px-4 py-2.5 rounded-xl bg-surface-700/80 hover:bg-surface-600 text-surface-200 text-sm font-medium transition-all border border-white/10 flex items-center justify-center gap-2">
                <Icons.UserAdd /> Friend entire lobby
              </button>
            </ClickSpark>
            <ClickSpark>
              <button onClick={() => handle(api.inviteEvent, 'Event invites started', 'Failed')} className="btn-shine w-full px-4 py-2.5 rounded-xl bg-surface-700/80 hover:bg-surface-600 text-surface-200 text-sm font-medium transition-all border border-white/10 flex items-center justify-center gap-2">
                <Icons.Calendar /> Invite lobby to event
              </button>
            </ClickSpark>
            <ClickSpark>
              <button onClick={() => handle(api.inviteAllFriends, 'Inviting all friends...', 'Failed')} className="btn-shine w-full px-4 py-2.5 rounded-xl bg-surface-700/80 hover:bg-surface-600 text-surface-200 text-sm font-medium transition-all border border-white/10 flex items-center justify-center gap-2">
                <Icons.Users /> Invite all friends
              </button>
            </ClickSpark>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-3 text-sm text-surface-200 cursor-pointer rounded-xl border border-white/10 bg-surface-800/50 px-4 py-3 hover:bg-surface-800 transition-colors" title="Auto-invite lobby joiners to group">
              <input type="checkbox" checked={auto_invite_enabled} onChange={(e) => api.autoInvite(e.target.checked).then(() => toast('Auto-invite saved', 'success'))} className="rounded border-surface-600 bg-surface-900 text-brand-500 w-4 h-4 shrink-0" />
              <span>
                <span className="font-medium text-surface-100 block">Auto-invite</span>
                <span className="text-xs text-surface-500">New lobby joiners → group</span>
              </span>
            </label>
            <label className="flex items-center gap-3 text-sm text-surface-200 cursor-pointer rounded-xl border border-white/10 bg-surface-800/50 px-4 py-3 hover:bg-surface-800 transition-colors" title="Auto-accept incoming friend requests">
              <input type="checkbox" checked={auto_accept_friend_enabled} onChange={(e) => api.autoAcceptFriend(e.target.checked).then(() => toast('Auto-accept friends saved', 'success'))} className="rounded border-surface-600 bg-surface-900 text-brand-500 w-4 h-4 shrink-0" />
              <span>
                <span className="font-medium text-surface-100 block">Auto-accept friends</span>
                <span className="text-xs text-surface-500">Incoming requests</span>
              </span>
            </label>
            <label className="flex items-center gap-3 text-sm text-surface-200 cursor-pointer rounded-xl border border-white/10 bg-surface-800/50 px-4 py-3 hover:bg-surface-800 transition-colors" title="Auto-invite lobby joiners to event">
              <input type="checkbox" checked={auto_event_invite_enabled} onChange={(e) => api.autoEventInvite(e.target.checked).then(() => toast('Auto event invite saved', 'success'))} className="rounded border-surface-600 bg-surface-900 text-brand-500 w-4 h-4 shrink-0" />
              <span>
                <span className="font-medium text-surface-100 block">Auto event invite</span>
                <span className="text-xs text-surface-500">Lobby → calendar event</span>
              </span>
            </label>
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Chatbox preview" subtitle="What VRChat OSC receives (tags resolved live)" className="star-border" tooltip="Live preview of chatbox lines with tags resolved">
          <pre className="text-xs text-surface-400 whitespace-pre-wrap font-mono max-h-24 overflow-y-auto rounded-lg bg-surface-800/50 p-2">{chatbox_preview || ''}</pre>
        </Card>
        <Card title="Current lobby" subtitle="Double-click a name to open profile" className="star-border">
          <ul className="space-y-1.5 max-h-64 overflow-y-auto">
            {(lobby?.users ?? []).map((u) => (
              <li
                key={u.name + (u.id_suffix || '')}
                onDoubleClick={() => setProfileUser(u.name)}
                className="text-sm text-surface-300 py-1.5 px-2 rounded-lg hover:bg-white/5 cursor-pointer select-none transition-colors"
              >
                {u.name}{u.id_suffix ? ` (${u.id_suffix})` : ''}
              </li>
            ))}
            {(!lobby?.users || lobby.users.length === 0) && <li className="text-surface-500">No one else in lobby</li>}
          </ul>
        </Card>
        <Card title="Activity log" className="star-border lg:col-span-2" tooltip="Live lobby and invite events">
          <ul className="space-y-1 max-h-64 overflow-y-auto text-sm text-surface-400">
            {(logs ?? []).slice(-30).map((line, i) => {
              const raw = typeof line === 'object' ? line?.raw : line;
              const avatarUrl = typeof line === 'object' ? line?.avatar_url : null;
              const userId = typeof line === 'object' ? line?.user_id : null;
              return (
                <li key={i} className="flex items-center gap-2">
                  {avatarUrl && <a href={avatarUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0"><img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" /></a>}
                  <span>{raw}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
      <Card title="Invite batch" subtitle={`${queue_size ?? 0} in queue · ${time_until_next_switch ?? 0}s until next`} className="star-border" tooltip="Users being invited; rate-limited to ~10/min">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-xs text-surface-500">Next batch in: <CountUp value={time_until_next_switch ?? next_poll_remaining} duration={400} />s</span>
          <span className="text-xs text-surface-500">Rate: ~10/min</span>
        </div>
        <ul className="space-y-1.5 text-sm text-surface-400 max-h-32 overflow-y-auto">
          {(current_invite_batch ?? []).length > 0 ? current_invite_batch.map((name, i) => <li key={i} className="flex items-center gap-2"><span className="text-surface-500 w-5">{i + 1}.</span>{name}</li>) : <li className="text-surface-500">No active batch</li>}
        </ul>
      </Card>
      {profileUser && (
        <UserProfileModal displayName={profileUser} onClose={closeProfile} inWorld={data?.in_world} />
      )}
      <footer className="text-center text-xs text-surface-500 pt-8 pb-4">
        Made by <a href="https://eciipsestudios.com/" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">EcIipse Studios™</a>
      </footer>
    </div>
  );
}
