import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useToast } from './Toast';
import ModActions from './ModActions';
import UserAvatar from './UserAvatar';

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
      }
    : null;

  const trustRank = user?.trustRankDisplayName ?? user?.trust_rank_display_name ?? '—';
  const utags = (user?.tags || []).map((t) => String(t));
  const hasVrcPlus = user?.hasVrcPlus ?? user?.has_vrc_plus ?? utags.includes('system_supporter');
  const ageVerified = user?.ageVerified ?? user?.age_verified ?? utags.includes('system_verified');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-surface-700">
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-16 h-16 rounded-full bg-surface-700 animate-pulse" />
            ) : (
              <UserAvatar friend={avatarFriend} sizeClasses="w-16 h-16" ringClasses="ring-2 ring-brand-500/50" />
            )}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="h-6 w-32 bg-surface-700 rounded animate-pulse" />
              ) : (
                <>
                  <p className="font-semibold text-surface-100 truncate">{user?.displayName ?? user?.display_name ?? displayName}</p>
                  <p className="text-sm text-surface-500">@{user?.username ?? '—'}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-brand-500/20 text-brand-300">{trustRank}</span>
                    {hasVrcPlus && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">VRC+</span>
                    )}
                    {ageVerified && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">18+ verified</span>
                    )}
                  </div>
                  <p className="text-xs text-surface-500 mt-1 font-mono truncate" title={user?.id}>ID: {user?.id ?? '—'}</p>
                  {(user?.status || user?.statusDescription || user?.status_description) && (
                    <p className="text-xs text-surface-400 mt-1">
                      {(user?.status || '') + (user?.statusDescription || user?.status_description ? ` — ${user?.statusDescription || user?.status_description}` : '')}
                    </p>
                  )}
                  {(user?.lastPlatform || user?.last_platform) && (
                    <p className="text-xs text-surface-500 mt-0.5">Platform: {user?.lastPlatform || user?.last_platform}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="h-24 bg-surface-800 rounded-xl animate-pulse" />
          ) : (
            <ModActions
              user={user}
              actioning={actioning}
              onAction={handleAction}
              onClose={onClose}
              canUseLobbyActions={inWorld !== false}
              showBoop={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
