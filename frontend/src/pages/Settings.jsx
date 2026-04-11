import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Card from '../components/Card';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import ClickSpark from '../components/ClickSpark';
import { Icons } from '../components/Icons';

export default function Settings() {
  const [s, setS] = useState({});
  const toast = useToast();
  const { confirm, alert } = useConfirm();
  const { logout } = useAuth();
  useEffect(() => { api.settings().then(setS); }, []);

  const save = async (payload, msg) => {
    try {
      await api.saveSettings(payload);
      toast(msg || 'Settings saved', 'success');
      api.settings().then(setS);
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="space-y-6 animate-in w-full">
      <div className="bento-grid">
        <Card title="VRChat API" subtitle="When off, the app will not make any VRChat API calls until turned back on" className="star-border bento-cell-1" titleIcon={<Icons.Globe />}>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={s.vrchat_api_enabled !== false} onChange={(e) => save({ vrchat_api_enabled: e.target.checked }, 'VRChat API setting saved')} className="rounded bg-surface-700 border-surface-600 text-brand-500" />
              <span className="text-surface-200">VRChat API enabled</span>
            </label>
            <ClickSpark>
              <button onClick={() => api.vrchatRefresh().then(() => toast('Refreshed', 'success')).catch((e) => toast(e.message, 'error'))} disabled={s.vrchat_api_enabled === false} className="px-4 py-2.5 rounded-xl bg-surface-700 hover:bg-surface-600 disabled:opacity-50 disabled:pointer-events-none text-surface-200 font-medium">
                Refresh now
              </button>
            </ClickSpark>
          </div>
          <p className="text-xs text-surface-500 mt-2">Restart the app for the toggle to take full effect.</p>
        </Card>
        <Card title="Group" subtitle="Group ID for invites" className="star-border bento-cell-1" titleIcon={<Icons.Users />}>
          <div className="flex gap-2">
            <input value={s.group_id ?? ''} onChange={(e) => setS((x) => ({ ...x, group_id: e.target.value }))} placeholder="grp_xxx" className="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100" />
            <ClickSpark><button onClick={() => save({ group_id: s.group_id }, 'Group ID saved')} className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium flex items-center gap-2"><Icons.Save /> Save</button></ClickSpark>
          </div>
        </Card>
        <Card title="Event invites" subtitle="VRChat calendar event instance ID" className="star-border bento-cell-1" titleIcon={<Icons.Calendar />}>
          <div className="flex gap-2">
            <input value={s.event_id ?? ''} onChange={(e) => setS((x) => ({ ...x, event_id: e.target.value }))} placeholder="Calendar event instance ID" className="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100" />
            <ClickSpark><button onClick={() => save({ event_id: s.event_id }, 'Event ID saved')} className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium flex items-center gap-2"><Icons.Save /> Save</button></ClickSpark>
          </div>
          <ClickSpark><button onClick={() => api.inviteEvent().then(() => toast('Started', 'success')).catch((e) => toast(e.message, 'error'))} className="mt-2 px-4 py-2 rounded-xl bg-surface-700 text-surface-200 text-sm flex items-center gap-2"><Icons.Invite /> Invite lobby to event</button></ClickSpark>
        </Card>
        <Card title="Auto-join invite" subtitle="When this user invites you to a lobby, auto-join (if supported by the app)" className="star-border bento-cell-1" titleIcon={<Icons.Users />}>
          <div className="flex gap-2">
            <input value={s.auto_join_inviter_id ?? ''} onChange={(e) => setS((x) => ({ ...x, auto_join_inviter_id: e.target.value }))} placeholder="usr_xxx (VRChat user ID)" className="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100" />
            <ClickSpark><button onClick={() => save({ auto_join_inviter_id: s.auto_join_inviter_id }, 'Auto-join inviter saved')} className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium flex items-center gap-2"><Icons.Save /> Save</button></ClickSpark>
          </div>
        </Card>
        <Card title="OSC Chatbox" className="star-border bento-cell-wide" titleIcon={<Icons.Chatbox />}>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-surface-500 mb-1">IP</label><input value={s.osc_ip ?? ''} onChange={(e) => setS((x) => ({ ...x, osc_ip: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100" /></div>
            <div><label className="block text-sm text-surface-500 mb-1">Port</label><input type="number" value={s.osc_port ?? ''} onChange={(e) => setS((x) => ({ ...x, osc_port: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100" /></div>
          </div>
          <ClickSpark><button onClick={() => save({ osc_ip: s.osc_ip, osc_port: s.osc_port }, 'OSC Chatbox saved')} className="mt-3 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium flex items-center gap-2"><Icons.Save /> Save OSC</button></ClickSpark>
        </Card>
        <Card title="Maintenance" className="star-border bento-cell-1" titleIcon={<Icons.Trash />}>
          <div className="flex flex-wrap gap-2">
            <ClickSpark><button onClick={async () => { try { const d = await api.exportData(); const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `vrchat-group-tool-export-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href); toast('Export downloaded', 'success'); } catch (e) { toast(e.message, 'error'); } }} className="px-4 py-2.5 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 font-medium flex items-center gap-2"><Icons.Save /> Export All Data</button></ClickSpark>
            <ClickSpark><button onClick={async () => { const ok = await confirm('Clear logs?', 'Clear logs'); if (ok) api.clearLogs().then(() => toast('Cleared', 'success')); }} className="px-4 py-2.5 rounded-xl bg-surface-700 hover:bg-surface-600 text-surface-200 font-medium flex items-center gap-2"><Icons.Trash /> Clear logs</button></ClickSpark>
            <ClickSpark><button onClick={async () => { const ok = await confirm('Clear invited users?', 'Clear invited users'); if (ok) api.clearUsers().then(() => toast('Cleared', 'success')); }} className="px-4 py-2.5 rounded-xl bg-surface-700 hover:bg-surface-600 text-surface-200 font-medium flex items-center gap-2">Clear invited users</button></ClickSpark>
          </div>
        </Card>
        <Card title="General" className="bento-cell-1" titleIcon={<Icons.Settings />}>
          <ClickSpark>
            <button onClick={() => api.openInstallFolder().then(() => toast('Opened file location', 'success')).catch((e) => toast(e.message, 'error'))} className="px-4 py-2.5 rounded-xl bg-surface-700 hover:bg-surface-600 text-surface-200 font-medium flex items-center gap-2">
              Open File Location
            </button>
          </ClickSpark>
          <p className="text-xs text-surface-500 mt-2">Opens the install directory in File Explorer.</p>
          <label className="flex items-center gap-2 mt-4 cursor-pointer">
            <input type="checkbox" checked={s.skip_startup_intro === true} onChange={(e) => save({ skip_startup_intro: e.target.checked })} className="rounded bg-surface-700 border-surface-600 text-brand-500" />
            <span className="text-surface-200">Skip startup intro (when available)</span>
          </label>
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input type="checkbox" checked={s.auto_backup_enabled !== false} onChange={(e) => save({ auto_backup_enabled: e.target.checked }, 'Auto-backup setting saved')} className="rounded bg-surface-700 border-surface-600 text-brand-500" />
            <span className="text-surface-200">Auto-backup (hourly to data/backups)</span>
          </label>
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input type="checkbox" checked={s.safe_mode === true} onChange={(e) => save({ safe_mode: e.target.checked }, 'Safe mode setting saved')} className="rounded bg-surface-700 border-surface-600 text-brand-500" />
            <span className="text-surface-200">Safe mode (disables auto-invite)</span>
          </label>
          <label className="flex items-center gap-2 mt-3 cursor-pointer" title="Windows only: adds a Startup entry for the installed .exe">
            <input
              type="checkbox"
              checked={s.start_with_windows === true}
              onChange={(e) => save({ start_with_windows: e.target.checked }, e.target.checked ? 'Start with Windows enabled' : 'Start with Windows disabled')}
              className="rounded bg-surface-700 border-surface-600 text-brand-500"
            />
            <span className="text-surface-200">Start with Windows (installed exe only)</span>
          </label>
        </Card>
        <Card title="Account" subtitle="Session actions" className="bento-cell-1" titleIcon={<Icons.Auth />}>
          <div className="flex flex-wrap gap-2">
            <ClickSpark>
              <button onClick={async () => { const ok = await confirm('Emergency stop all operations? You may need to restart the app.', 'Emergency stop'); if (ok) { api.emergencyStop().then(() => alert('Stopped.')); } }} className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2">
                Emergency Stop
              </button>
            </ClickSpark>
            <ClickSpark>
              <button onClick={() => logout()} className="px-4 py-2.5 rounded-xl bg-surface-700 hover:bg-surface-600 text-surface-200 font-medium flex items-center gap-2">
                Logout
              </button>
            </ClickSpark>
          </div>
        </Card>
        <Card title="Danger Zone" subtitle="Uninstall the app or erase data" className="bento-cell-wide border-red-500/30" titleIcon={<Icons.Trash />}>
          <div className="flex flex-wrap gap-2">
            <ClickSpark>
              <button
                onClick={async () => {
                  const ok = await confirm(
                    'Open the Windows uninstaller? Follow the wizard to remove the app, shortcuts, and files. The app may keep running until you finish.',
                    'Uninstall app'
                  );
                  if (ok) {
                    try {
                      await api.launchUninstaller();
                      toast('Uninstaller opened.', 'success');
                    } catch (e) {
                      toast(e.message || 'Could not start uninstaller', 'error');
                    }
                  }
                }}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-700"
              >
                Uninstall app…
              </button>
            </ClickSpark>
            <ClickSpark>
              <button
                onClick={async () => {
                  const ok = await confirm(
                    'Erase all local app data in the data folder? Settings, logs, and database will be reset. This does not remove the installed program.',
                    'Erase data'
                  );
                  if (ok) {
                    try {
                      await api.post('/api/uninstall');
                      toast('Local data cleared.', 'success');
                    } catch (e) {
                      toast(e.message || 'Request failed', 'error');
                    }
                  }
                }}
                className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 font-medium text-red-300 hover:bg-red-500/20"
              >
                Erase local data only
              </button>
            </ClickSpark>
          </div>
          <p className="mt-2 text-xs text-surface-500">
            <strong className="text-surface-400">Uninstall app</strong> runs the official installer uninstaller (installed build only).{' '}
            <strong className="text-surface-400">Erase local data</strong> wipes the app data directory only.
          </p>
        </Card>
        <Card title="More" subtitle="Additional pages" className="bento-cell-wide" titleIcon={<Icons.Settings />}>
          <div className="flex flex-wrap gap-2">
            <Link to="/integrations" className="px-4 py-2 rounded-xl bg-surface-700 hover:bg-surface-600 text-surface-200 text-sm font-medium">Integrations</Link>
            <Link to="/auth-store" className="px-4 py-2 rounded-xl bg-surface-700 hover:bg-surface-600 text-surface-200 text-sm font-medium">Auth Store</Link>
            <Link to="/vrchat-status" className="px-4 py-2 rounded-xl bg-surface-700 hover:bg-surface-600 text-surface-200 text-sm font-medium">VRChat Status</Link>
            <Link to="/info" className="px-4 py-2 rounded-xl bg-surface-700 hover:bg-surface-600 text-surface-200 text-sm font-medium">About & Credits</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
