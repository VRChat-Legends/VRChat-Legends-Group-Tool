import { useState, useEffect } from 'react';
import { api } from '../api/client';
import Card from '../components/Card';
import CountUp from '../components/CountUp';
export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = () => api.analytics().then(setData);
    fetchData();
    const id = setInterval(fetchData, 5000);
    return () => clearInterval(id);
  }, []);

  if (!data) return <div className="text-surface-500 py-12 text-center">Loading…</div>;

  const metrics = [
    { key: 'invites_sent', label: 'Invites sent', color: 'bg-brand-500', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
    { key: 'invites_failed', label: 'Invites failed', color: 'bg-red-500', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'invites_skipped_cooldown', label: 'Skipped (cooldown)', color: 'bg-amber-500', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'friend_requests_accepted', label: 'Friend requests accepted', color: 'bg-emerald-500', icon: 'M5 13l4 4L19 7' },
    { key: 'friend_requests_failed', label: 'Friend requests failed', color: 'bg-red-400', icon: 'M6 18L18 6M6 6l12 12' },
    { key: 'friend_requests_expired', label: 'Friend requests expired', color: 'bg-orange-500', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'rate_limit_events', label: 'Rate limit events', color: 'bg-rose-500', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ];

  const maxVal = Math.max(1, ...metrics.map((m) => data[m.key] || 0));

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-100 mb-1">Analytics</h1>
        <p className="text-surface-500 text-sm">Invite and friend-request metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map(({ key, label, color }) => (
          <Card key={key} title={label} className="bento-cell-1">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-sm text-surface-500">{label}</span>
              <span className="text-xl font-bold text-surface-100">
                <CountUp value={data[key] || 0} duration={400} />
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-800 overflow-hidden">
              <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${((data[key] || 0) / maxVal) * 100}%` }} />
            </div>
          </Card>
        ))}
      </div>

      <Card title="Last activity" className="star-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-surface-500">Last invite run</span>
            <p className="font-medium text-surface-200 mt-0.5">
              {data.last_invite_run ? new Date(data.last_invite_run).toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <span className="text-surface-500">Last friend poll</span>
            <p className="font-medium text-surface-200 mt-0.5">
              {data.last_friend_poll ? new Date(data.last_friend_poll).toLocaleString() : '—'}
            </p>
          </div>
        </div>
        <p className="text-xs text-surface-500 mt-4">
          Batching: 10 invites/60s, 10 friend accepts/60s, 3-day cooldown per user.
        </p>
      </Card>
    </div>
  );
}
