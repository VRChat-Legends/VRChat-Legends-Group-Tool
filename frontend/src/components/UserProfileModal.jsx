import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useToast } from './Toast';
import ModActions from './ModActions';
import UserAvatar, { friendIsAgeVerified } from './UserAvatar';

const STATUS_COLORS = {
  'join me': 'bg-blue-500',
  active: 'bg-emerald-500',
  'ask me': 'bg-amber-500',
  busy: 'bg-red-500',
  offline: 'bg-surface-600',
};
const STATUS_LABELS = {
  'join me': 'Join Me',
  active: 'Online',
  'ask me': 'Ask Me',
  busy: 'Do Not Disturb',
  offline: 'Offline',
};

export default function UserProfileModal({ displayName, onClose, inWorld = true }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const toast = useToast();
  const lastFetchedName = useRef(null);

  useEffect(() => {
    if (!displayName) return;
    if (lastFetchedName.current === displayName && user) {
      setLoading(false);
      return;
    }
    lastFetchedName.current = displayName;
    setLoading(true);
    api.userInfo(displayName)
      .then(setUser)
      .catch((e) => {
        toast(e.message || 'Failed to load user', 'error');
        onClose();
      })
      .finally(() => setLoading(false));
  }, [displayName]);

  const handleAction = async (action, message = '') => {
    if (!user?.id) return;
    setActioning(true);
    try {
      await api.userAction(action, user.id, message);
      toast(`Action "${action}" sent`, 'success');
      onClose();
    } catch (e) {
      toast(e.message || 'Action failed', 'error');
    } finally {
      setActioning(false);
    }
  };

  if (!displayName) return null;

  const avatarFriend = user
    ? {
        currentAvatarImageUrl: user.currentAvatarImageUrl || user.current_avatar_image_url,
        profilePicOverride: user.profilePicOverride || user.profile_pic_override,
        userIcon: user.userIcon || user.user_icon,
        tags: user.tags,
        hasVrcPlus: user.hasVrcPlus ?? user.has_vrc_plus,
        ageVerified: user.ageVerified ?? user.age_verified,
      }
    : null;

  const name = user?.displayName ?? user?.display_name ?? displayName;
  const username = user?.username ?? '';
  const pronouns = user?.pronouns ?? '';
  const trustRank = user?.trustRankDisplayName ?? user?.trust_rank_display_name ?? '—';
  const utags = (user?.tags || []).map((t) => String(t));
  const hasVrcPlus = user?.hasVrcPlus ?? user?.has_vrc_plus ?? utags.includes('system_supporter');
  const ageVerified = user?.ageVerified ?? user?.age_verified ?? utags.includes('system_verified');
  const status = (user?.status ?? '').toLowerCase() || 'offline';
  const statusDesc = user?.statusDescription ?? user?.status_description ?? '';
  const statusDot = STATUS_COLORS[status] || STATUS_COLORS.offline;
  const statusLabel = STATUS_LABELS[status] || 'Unknown';
  const bio = user?.bio ?? '';
  const platform = user?.lastPlatform ?? user?.last_platform ?? '';
  const bioLinks = user?.bioLinks ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="modal-surface max-w-lg w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────── */}
        <div className="relative bg-gradient-to-br from-brand-600/30 via-surface-800 to-surface-900 px-6 pt-6 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-surface-900/60 hover:bg-surface-700 text-surface-400 hover:text-white flex items-center justify-center transition-colors z-10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="flex items-start gap-4">
            {loading ? (
              <div className="w-[4.5rem] h-[4.5rem] rounded-2xl bg-surface-700 animate-pulse flex-shrink-0" />
            ) : (
              <div className="relative flex-shrink-0">
                <UserAvatar friend={avatarFriend} sizeClasses="w-[4.5rem] h-[4.5rem]" roundedClasses="rounded-2xl" ringClasses="ring-2 ring-brand-500/40 profile-card-avatar" />
                <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-[3px] border-surface-800 ${statusDot}`} title={statusLabel} />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-0.5">
              {loading ? (
                <>
                  <div className="h-6 w-36 bg-surface-700 rounded animate-pulse mb-2" />
                  <div className="h-4 w-24 bg-surface-700 rounded animate-pulse" />
                </>
              ) : (
                <>
                  <h2 className="font-bold text-lg text-white truncate leading-tight">{name}</h2>
                  <p className="text-sm text-surface-400">@{username || '—'}{pronouns ? ` · ${pronouns}` : ''}</p>

                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                    <span className="text-xs text-surface-300">{statusLabel}</span>
                    {statusDesc && <span className="text-xs text-surface-500 truncate">— {statusDesc}</span>}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.65rem] font-semibold bg-brand-500/15 text-brand-300 border border-brand-500/20">{trustRank}</span>
                    {hasVrcPlus && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.65rem] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                        VRC+
                      </span>
                    )}
                    {ageVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.65rem] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg>
                        18+
                      </span>
                    )}
                  </div>

                  {platform && <p className="text-xs text-surface-500 mt-1.5">Platform: {platform}</p>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ─────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="space-y-3">
              <div className="h-16 bg-surface-800 rounded-xl animate-pulse" />
              <div className="h-12 bg-surface-800 rounded-xl animate-pulse" />
            </div>
          ) : (
            <>
              {bio && (
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-surface-500 mb-1.5">Bio</p>
                  <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-wrap break-words max-h-24 overflow-y-auto pr-1">{bio}</p>
                </div>
              )}

              {bioLinks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {bioLinks.map((link, i) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-400 hover:text-brand-300 underline underline-offset-2 truncate max-w-[200px]">
                      {link.replace(/^https?:\/\//, '')}
                    </a>
                  ))}
                </div>
              )}

              <ModActions
                user={user}
                actioning={actioning}
                onAction={handleAction}
                onClose={null}
                canUseLobbyActions={inWorld !== false}
                showBoop={false}
              />

              <a
                href={`https://vrchat.com/home/user/${user?.id ?? ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-2.5 rounded-xl bg-surface-800/60 hover:bg-surface-700 text-surface-300 text-sm font-medium text-center border border-surface-700/30 transition-colors"
              >
                Open on VRChat.com
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
