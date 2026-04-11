import { useState, useEffect } from 'react';
import { api } from '../api/client';
import Card from '../components/Card';
import { useToast } from '../components/Toast';
import ClickSpark from '../components/ClickSpark';
import { Icons } from '../components/Icons';

const TAGS = [
  { tag: '{time}', desc: '24h time (HH:MM:SS)' },
  { tag: '{time_12}', desc: '12h time (hh:mm:ss AM/PM)' },
  { tag: '{time_short}', desc: '24h time (HH:MM)' },
  { tag: '{time_12_short}', desc: '12h time (hh:mm AM/PM)' },
  { tag: '{date}', desc: 'Date (YYYY-MM-DD)' },
  { tag: '{date_short}', desc: 'Date (MM/DD)' },
  { tag: '{date_long}', desc: 'Date (Month DD, YYYY)' },
  { tag: '{day_of_week}', desc: 'Day name (Monday, etc.)' },
  { tag: '{day_short}', desc: 'Day short (Mon, etc.)' },
  { tag: '{month}', desc: 'Month name (January, etc.)' },
  { tag: '{year}', desc: 'Current year' },
  { tag: '{display_name}', desc: 'Your display name' },
  { tag: '{username}', desc: 'Display name (legacy key)' },
  { tag: '{trust_rank}', desc: 'Your trust rank label' },
  { tag: '{user_status}', desc: 'Your status (active, busy, …)' },
  { tag: '{status_description}', desc: 'Your status message' },
  { tag: '{bio_short}', desc: 'Bio (truncated)' },
  { tag: '{lobby_count}', desc: 'Others in lobby' },
  { tag: '{lobby_total}', desc: 'Total in lobby' },
  { tag: '{lobby_names}', desc: 'Comma-separated lobby names' },
  { tag: '{lobby_list}', desc: 'Same as lobby_names' },
  { tag: '{world_name}', desc: 'Current world name' },
  { tag: '{world_author}', desc: 'World author display name' },
  { tag: '{world_id}', desc: 'World ID' },
  { tag: '{instance}', desc: 'Instance part of location' },
  { tag: '{world_visits}', desc: 'World visits count' },
  { tag: '{world_capacity}', desc: 'World capacity' },
  { tag: '{world_heat}', desc: 'World heat' },
  { tag: '{world_release}', desc: 'Release status' },
  { tag: '{world_description}', desc: 'Description (short)' },
  { tag: '{group_name}', desc: 'Your group name' },
  { tag: '{group_short_code}', desc: 'Group short code' },
  { tag: '{group_member_count}', desc: 'Group members' },
  { tag: '{friends_online}', desc: 'Friends currently online' },
  { tag: '{friends_total}', desc: 'Total friends count' },
  { tag: '{pending_friend_requests}', desc: 'Pending incoming friend count' },
  { tag: '{active_time}', desc: 'Bot uptime (e.g. 2h 15m 30s)' },
  { tag: '{uptime_short}', desc: 'Uptime short (e.g. 2h 15m)' },
  { tag: '{random_emoji}', desc: 'Random emoji each cycle' },
  { tag: '{divider}', desc: 'Short rule (14 chars)' },
  { tag: '{line}', desc: 'Long rule (30 chars)' },
  { tag: '{dots}', desc: 'Dot divider (14 dots)' },
  { tag: '{stars}', desc: 'Star divider (7 stars)' },
  { tag: '{hearts}', desc: 'Heart divider (7 hearts)' },
  { tag: '{space}', desc: 'Single space' },
  { tag: '{blank}', desc: 'Empty (remove tag)' },
  { tag: '{newline}', desc: 'Newline' },
];

export default function Chatbox() {
  const [enabled, setEnabled] = useState(false);
  const [lines, setLines] = useState([]);
  const [preview, setPreview] = useState('');
  const [shrinkBackground, setShrinkBackground] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.chatbox().then((d) => {
      setEnabled(d.enabled ?? false);
      setLines(d.lines ?? []);
      setShrinkBackground(d.shrink_background ?? false);
    });
  }, []);

  useEffect(() => {
    if (lines.length === 0) {
      setPreview('No lines yet');
      return;
    }
    api
      .chatboxPreview(lines, shrinkBackground)
      .then((d) => setPreview(d.preview || ''))
      .catch(() => setPreview(lines.filter(Boolean).join('\n')));
  }, [lines, shrinkBackground]);

  const save = async () => {
    try {
      await api.saveChatbox({ enabled, lines, shrink_background: shrinkBackground });
      toast('Chatbox saved', 'success');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const addLine = () => setLines((l) => [...l, '']);
  const removeLine = (i) => setLines((l) => l.filter((_, idx) => idx !== i));
  const setLine = (i, v) => setLines((l) => l.map((x, idx) => (idx === i ? v : x)));
  const moveLine = (from, delta) => {
    const to = from + delta;
    if (to < 0 || to >= lines.length) return;
    setLines((l) => {
      const next = [...l];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-in w-full">
      <Card title="VRChat OSC Chatbox" subtitle="Runs in background without opening keyboard" className="star-border" titleIcon={<Icons.Chatbox />}>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={(e) => { setEnabled(e.target.checked); api.saveChatbox({ enabled: e.target.checked, lines, shrink_background: shrinkBackground }).then(() => toast('Saved', 'success')); }} className="rounded border-surface-600 bg-surface-800 text-brand-500" />
            Enable chatbox
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer" title="Magic Chat Box style: shrink background while keeping text size. May require avatar support.">
            <input type="checkbox" checked={shrinkBackground} onChange={(e) => { setShrinkBackground(e.target.checked); api.saveChatbox({ enabled, lines, shrink_background: e.target.checked }).then(() => toast('Saved', 'success')); }} className="rounded border-surface-600 bg-surface-800 text-brand-500" />
            Shrink chatbox background (experimental)
          </label>
        </div>
      </Card>
      <Card title="Chatbox builder" subtitle="Reorder with ↑↓, lines and tags (saved on restart)" className="star-border" titleIcon={<Icons.Log />}>
        <div className="space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-2 items-center">
              <div className="flex flex-col gap-0.5">
                <ClickSpark><button type="button" onClick={() => moveLine(i, -1)} disabled={i === 0} className="p-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-surface-400 disabled:opacity-30 disabled:cursor-not-allowed" title="Move up">↑</button></ClickSpark>
                <ClickSpark><button type="button" onClick={() => moveLine(i, 1)} disabled={i === lines.length - 1} className="p-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-surface-400 disabled:opacity-30 disabled:cursor-not-allowed" title="Move down">↓</button></ClickSpark>
              </div>
              <input value={line} onChange={(e) => setLine(i, e.target.value)} placeholder="Line..." className="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500" />
              <ClickSpark><button type="button" onClick={() => removeLine(i)} className="px-3 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30"><Icons.Trash /></button></ClickSpark>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <ClickSpark><button onClick={addLine} className="px-4 py-2.5 rounded-xl bg-surface-700 hover:bg-surface-600 text-surface-200 font-medium flex items-center gap-2"><Icons.Plus /> Add line</button></ClickSpark>
          <ClickSpark><button onClick={save} className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium flex items-center gap-2"><Icons.Save /> Save & apply</button></ClickSpark>
        </div>
      </Card>
      <Card title="Tags" subtitle="Click to copy" titleIcon={<Icons.Copy />}>
        <div className="flex flex-wrap gap-2">
          {TAGS.map(({ tag, desc }) => (
            <ClickSpark key={tag}>
              <button type="button" title={desc} onClick={() => { navigator.clipboard.writeText(tag); toast(`Copied ${tag}`, 'info'); }} className="px-3 py-1.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:text-brand-400 hover:border-brand-500/50 text-sm font-mono flex items-center gap-1.5">
                <Icons.Copy /> {tag}
              </button>
            </ClickSpark>
          ))}
        </div>
      </Card>
      <Card title="Preview" className="star-border" titleIcon={<Icons.Chatbox />}>
        <pre className="p-4 rounded-xl bg-surface-950 border border-surface-700 text-emerald-400 font-mono text-sm whitespace-pre-wrap min-h-[120px]">{preview}</pre>
      </Card>
    </div>
  );
}
