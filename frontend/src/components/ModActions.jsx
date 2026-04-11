import ClickSpark from './ClickSpark';
import { useConfirm } from './ConfirmModal';

/**
 * Organized mod actions: Group actions (invite, remove, ban), Remove friend.
 */
export default function ModActions({
  user,
  actioning,
  onAction,
  onClose,
  canUseLobbyActions = true,
  onRemoveFriend,
}) {
  const name = user?.displayName ?? user?.display_name ?? 'Unknown';
  const { confirm } = useConfirm();

  return (
    <div className="space-y-4">
      {onRemoveFriend && (
        <div>
          <p className="text-[0.65rem] font-semibold text-surface-500 uppercase tracking-wider mb-2">Friend</p>
          <ClickSpark>
            <button
              type="button"
              onClick={async () => {
                const ok = await confirm(`Remove ${name} from your friends list?`, 'Remove friend');
                if (ok) onRemoveFriend();
              }}
              disabled={actioning}
              className="w-full px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 text-sm font-medium border border-red-500/30 disabled:opacity-50 transition-colors"
            >
              Remove friend
            </button>
          </ClickSpark>
        </div>
      )}

      <div>
        <p className="text-[0.65rem] font-semibold text-surface-500 uppercase tracking-wider mb-2">Group actions</p>
        <div className="grid grid-cols-1 gap-2">
          <ClickSpark>
            <button
              type="button"
              onClick={() => onAction('invite')}
              disabled={actioning}
              className="w-full px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium disabled:opacity-50 transition-colors"
            >
              Invite to group
            </button>
          </ClickSpark>
          <ClickSpark>
            <button
              type="button"
              onClick={() => onAction('remove')}
              disabled={actioning}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-700 hover:bg-surface-600 text-surface-200 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              Remove from group
            </button>
          </ClickSpark>
          <ClickSpark>
            <button
              type="button"
              onClick={async () => {
                const ok = await confirm(`Ban ${name} from the group?`, 'Ban from group');
                if (ok) onAction('ban');
              }}
              disabled={actioning}
              className="w-full px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 text-sm font-medium border border-red-500/30 disabled:opacity-50 transition-colors"
            >
              Ban from group
            </button>
          </ClickSpark>
        </div>
      </div>

      {onClose && (
        <ClickSpark>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 text-sm transition-colors"
          >
            Close
          </button>
        </ClickSpark>
      )}
    </div>
  );
}
