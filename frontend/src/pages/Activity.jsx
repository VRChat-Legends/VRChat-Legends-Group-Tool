import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import Card from '../components/Card';
import { Icons } from '../components/Icons';

const LOG_PATTERNS = {
  invite: /invite|invited|inviting/i,
  friend: /friend|accept|request/i,
  lobby: /lobby|joined|left|instance|room/i,
  error: /error|fail|rate limit|critical/i,
  success: /✓|success|accepted/i,
};

function getLogType(line) {
  if (LOG_PATTERNS.error.test(line)) return 'error';
  if (LOG_PATTERNS.success.test(line)) return 'success';
  if (LOG_PATTERNS.invite.test(line)) return 'invite';
  if (LOG_PATTERNS.friend.test(line)) return 'friend';
  if (LOG_PATTERNS.lobby.test(line)) return 'lobby';
  return 'info';
}

export default function Activity() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = () => api.status().then((d) => setLogs(d.logs ?? []));
    fetchData();
    const id = setInterval(fetchData, 2000);
    return () => clearInterval(id);
  }, []);

  const filteredLogs = useMemo(() => {
    let list = logs;
    if (filter !== 'all') {
      list = list.filter((l) => getLogType(l) === filter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((l) => l.toLowerCase().includes(q));
    }
    return list;
  }, [logs, filter, search]);

  return (
    <div className="space-y-6 animate-in">
      <Card title="Activity log" subtitle="Live updates every 2s" className="star-border" titleIcon={<Icons.Log />}>
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs…"
            className="flex-1 min-w-[200px] px-4 py-2 rounded-xl bg-surface-800 border border-surface-700 text-surface-100 text-sm placeholder-surface-500"
          />
          {['all', 'invite', 'friend', 'lobby', 'success', 'error'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
                filter === f ? 'bg-brand-500 text-white' : 'bg-surface-800 text-surface-400 hover:bg-surface-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <ul className="space-y-0.5 max-h-[70vh] overflow-y-auto text-sm font-mono">
          {filteredLogs.length === 0 ? (
            <li className="py-8 text-center text-surface-500">No logs match your filter.</li>
          ) : (
            filteredLogs.map((line, i) => {
              const type = getLogType(line);
              const color =
                type === 'error' ? 'text-red-400' :
                type === 'success' ? 'text-emerald-400' :
                type === 'invite' ? 'text-brand-300' :
                type === 'friend' ? 'text-amber-300' :
                type === 'lobby' ? 'text-cyan-300' :
                'text-surface-400';
              const match = line.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*(.*)$/);
              const time = match ? match[1] : '';
              const msg = match ? match[2] : line;
              return (
                <li key={i} className={`py-1.5 px-2 rounded hover:bg-surface-800/50 ${color}`}>
                  {time && <span className="text-surface-600 mr-2">{time}</span>}
                  {msg}
                </li>
              );
            })
          )}
        </ul>
      </Card>
    </div>
  );
}
