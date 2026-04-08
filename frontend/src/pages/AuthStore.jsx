import { useState, useEffect } from 'react';
import { api } from '../api/client';
import Card from '../components/Card';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import ClickSpark from '../components/ClickSpark';
import { Icons } from '../components/Icons';

export default function AuthStore() {
  const [entries, setEntries] = useState([]);
  const toast = useToast();
  const { confirm } = useConfirm();

  const load = () => api.authEntries().then((d) => setEntries(d.entries ?? []));

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (key) => {
    const ok = await confirm('Delete this entry?', 'Delete entry');
    if (!ok) return;
    try {
      await api.deleteAuthEntry(key);
      toast('Deleted', 'success');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <Card title="Auth Store" subtitle="Stored auth entries (view only, delete if needed)" className="star-border" titleIcon={<Icons.Auth />}>
      <ul className="space-y-3">
        {entries.map((e) => (
          <li key={e.key} className="flex items-center gap-4 p-3 rounded-xl bg-surface-800/50 border border-surface-700/50">
            <span className="font-mono text-sm text-surface-400 flex-1 truncate">{e.key}</span>
            <span className="text-surface-600 text-sm truncate max-w-[200px]">{e.value ? '••••••••' : '(empty)'}</span>
            <ClickSpark><button onClick={() => handleDelete(e.key)} className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"><Icons.Trash /> Delete</button></ClickSpark>
          </li>
        ))}
      </ul>
      <p className="text-surface-500 text-sm mt-4">Add entry via Flask login only. One account at a time.</p>
      </Card>
    </div>
  );
}
