import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useToast } from './Toast';
import ModActions from './ModActions';
import UserAvatar from './UserAvatar';

/** Full user card for a friend: in-game avatar, trust rank, bio, etc. Opened from Friends list. */
export default function FriendUserCard({ userId, displayName: initialName, onClose, inWorld = true, onFriendRemoved }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const toast = useToast();
  const lastFetchedId = useRef(null);

  useEffect(() => {
    if (!userId) return;
    if (lastFetchedId.current === userId && user) {
      setLoading(false);
      return;
    }
    lastFetchedId.current = userId;
    setLoading(true);
    api.userInfoById(userId)
      .then(setUser)
      .catch((e) => {
        toast(e.message || 'Failed to load user', 'error');
        onClose();
      })
      .finally(() => setLoading(false));
  }, [userId]);

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

  const handleRemoveFriend = async () => {
    if (!user?.id) return;
    setActioning(true);
    try {
      await api.removeFriend(user.id);
      toast('Friend removed', 'success');
      onFriendRemoved?.();
      onClose();
    } catch (e) {
      toast(e.message || 'Failed to remove friend', 'error');
    } finally {
      setActioning(false);
    }
  };

  if (!userId) return null;

  const name = user?.displayName ?? user?.display_name ?? initialName ?? '—';
  const trustRank = user?.trustRankDisplayName ?? user?.trust_rank_display_name ?? user?.trustRank ?? user?.trust_rank ?? '—';
  const bio = user?.bio ?? '';
  const tags = user?.tags || [];
  const tagStrs = tags.map((t) => String(t));
  const hasVrcPlus = user?.hasVrcPlus ?? user?.has_vrc_plus ?? tagStrs.includes('system_supporter');
  const ageVerified = user?.ageVerified ?? user?.age_verified ?? tagStrs.includes('system_verified');

  const vrcCardUser = user
    ? {
        currentAvatarImageUrl: user.currentAvatarImageUrl || user.current_avatar_image_url,
        profilePicOverride: user.profilePicOverride || user.profile_pic_override,
        userIcon: user.userIcon || user.user_icon,
        tags,
        hasVrcPlus,
      }
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-surface-700 flex-shrink-0">
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-20 h-20 rounded-xl bg-surface-700 animate-pulse flex-shrink-0" />
            ) : (
              <UserAvatar
                friend={vrcCardUser}
                sizeClasses="w-20 h-20"
                roundedClasses="rounded-xl"
                ringClasses="ring-2 ring-brand-500/50"
              />
            )}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="h-6 w-32 bg-surface-700 rounded animate-pulse" />
              ) : (
                <>
                  <p className="font-semibold text-surface-100 truncate">{name}</p>
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
                  {user?.lastPlatform && <p className="text-xs text-surface-500 mt-0.5">Platform: {user.lastPlatform}</p>}
                  {user?.location && <p className="text-xs text-surface-500">Location: {user.location}</p>}
                </>
              )}
            </div>
          </div>
          {!loading && bio && <p className="mt-3 text-sm text-surface-400 line-clamp-3">{bio}</p>}
          {!loading && user?.currentAvatar && (
            <p className="mt-1 text-xs text-surface-500">Current avatar ID: {typeof user.currentAvatar === 'string' ? user.currentAvatar : '—'}</p>
          )}
        </div>

        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          {loading ? (
            <div className="h-24 bg-surface-800 rounded-xl animate-pulse" />
          ) : (
            <ModActions
              user={user}
              actioning={actioning}
              onAction={handleAction}
              onClose={onClose}
              canUseLobbyActions={inWorld !== false}
              onRemoveFriend={handleRemoveFriend}
            />
          )}
        </div>
      </div>
    </div>
  );
}
