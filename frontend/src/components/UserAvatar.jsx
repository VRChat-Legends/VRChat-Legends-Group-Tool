import { useState } from 'react';

/** Default when URL missing, on error, or VRC+ overlay (API often cannot render VRC+ profile images). */
export const AVATAR_PLACEHOLDER = '/assets/branding/group_tool_icon.png';

export function friendHasVrcPlus(friend) {
  if (!friend) return false;
  if (friend.hasVrcPlus === true) return true;
  const tags = friend.tags;
  return Array.isArray(tags) && tags.some((t) => String(t) === 'system_supporter');
}

export function friendIsAgeVerified(friend) {
  if (!friend) return false;
  if (friend.ageVerified === true) return true;
  const tags = friend.tags;
  return Array.isArray(tags) && tags.some((t) => String(t) === 'system_verified');
}

/**
 * Avatar for friends / API user objects. VRC+ (`system_supporter`) uses a placeholder with a VRC+ badge on top.
 * Shows 18+ badge when user is age-verified.
 */
export default function UserAvatar({
  friend,
  sizeClasses = 'w-14 h-14 sm:w-16 sm:h-16',
  roundedClasses = 'rounded-full',
  ringClasses = 'ring-2 ring-surface-600',
  showAgeVerified = true,
}) {
  const vrcPlus = friendHasVrcPlus(friend);
  const ageVerified = showAgeVerified && friendIsAgeVerified(friend);
  const apiUrl = friend?.currentAvatarImageUrl || friend?.profilePicOverride || friend?.userIcon || '';
  const [broken, setBroken] = useState(false);

  const baseSrc = vrcPlus || !apiUrl || broken ? AVATAR_PLACEHOLDER : apiUrl;

  return (
    <div className={`relative shrink-0 ${sizeClasses} ${roundedClasses}`}>
      <img
        src={baseSrc}
        alt=""
        className={`h-full w-full object-cover bg-surface-700 ${roundedClasses} ${ringClasses}`}
        onError={() => setBroken(true)}
      />
      {vrcPlus && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center ${roundedClasses} bg-surface-950/88 ring-2 ring-amber-500/45 pointer-events-none`}
          title="VRC+ profile image not shown here (API limitation)"
        >
          <img src={AVATAR_PLACEHOLDER} alt="" className="h-[55%] w-[55%] object-contain opacity-95 drop-shadow-md" />
          <span className="absolute bottom-[10%] left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.55rem] font-black tracking-wide text-amber-300">
            VRC+
          </span>
        </div>
      )}
      {ageVerified && (
        <span
          className="absolute -top-0.5 -left-0.5 z-10 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 ring-2 ring-surface-900 text-[0.5rem] font-black text-white leading-none pointer-events-none"
          title="Age verified (18+)"
        >
          18+
        </span>
      )}
    </div>
  );
}
