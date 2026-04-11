import { useState, useEffect } from 'react';
import { api } from '../api/client';
import Card from '../components/Card';
import CountUp from '../components/CountUp';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = {
  invites_sent: '#8b5cf6',
  invites_failed: '#ef4444',
  invites_skipped_cooldown: '#f59e0b',
  friend_requests_accepted: '#10b981',
  friend_requests_failed: '#f87171',
  friend_requests_expired: '#f97316',
  rate_limit_events: '#e11d48',
};

const ICONS = {
  invites_sent: 'fas fa-user-plus',
  invites_failed: 'fas fa-circle-exclamation',
  invites_skipped_cooldown: 'fas fa-clock',
  friend_requests_accepted: 'fas fa-check',
  friend_requests_failed: 'fas fa-xmark',
  friend_requests_expired: 'fas fa-hourglass-end',
  rate_limit_events: 'fas fa-bolt',
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchData = () => api.analytics().then(setData);
    fetchData();
    api.analyticsHistory().then(setHistory).catch(() => {});
    const id = setInterval(fetchData, 5000);
    const hid = setInterval(() => api.analyticsHistory().then(setHistory).catch(() => {}), 60000);
    return () => { clearInterval(id); clearInterval(hid); };
  }, []);

  if (!data) return <div className="text-surface-500 py-12 text-center">Loading…</div>;

  const metrics = [
    { key: 'invites_sent', label: 'Invites sent' },
    { key: 'invites_failed', label: 'Invites failed' },
    { key: 'invites_skipped_cooldown', label: 'Skipped (cooldown)' },
    { key: 'friend_requests_accepted', label: 'Friend requests accepted' },
    { key: 'friend_requests_failed', label: 'Friend requests failed' },
    { key: 'friend_requests_expired', label: 'Friend requests expired' },
    { key: 'rate_limit_events', label: 'Rate limit events' },
  ];

  const pieData = metrics.map(({ key, label }) => ({ name: label, value: data[key] || 0 })).filter((d) => d.value > 0);
  const barData = metrics.map(({ key, label }) => ({ name: label.split(' ').slice(0, 2).join(' '), value: data[key] || 0, fill: COLORS[key] }));
  const historyFormatted = history.map((h) => ({ ...h, time: h.ts ? new Date(h.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '' }));

  const tooltipStyle = { contentStyle: { background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', fontSize: '0.75rem' }, itemStyle: { color: '#e2e8f0' } };

  return (
    <div className="space-y-6 animate-in w-full">
      <div>
        <h1 className="text-2xl font-bold text-surface-100 mb-1"><i className="fas fa-chart-bar mr-2 text-brand-400" />Analytics</h1>
        <p className="text-surface-500 text-sm">Invite and friend-request metrics</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {metrics.map(({ key, label }) => (
          <div key={key} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center">
            <i className={`${ICONS[key]} text-lg mb-1`} style={{ color: COLORS[key] }} />
            <p className="text-lg font-bold text-surface-100"><CountUp value={data[key] || 0} duration={400} /></p>
            <p className="text-[0.6rem] text-surface-500 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <Card title="Overview" subtitle="Current totals by metric" className="star-border">
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={barData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Pie chart */}
      {pieData.length > 0 && (
        <Card title="Distribution" subtitle="Proportion of events" className="star-border">
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={Object.values(COLORS)[i % Object.values(COLORS).length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '0.7rem', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Line chart - history over time */}
      {historyFormatted.length > 1 && (
        <Card title="Trend" subtitle="Hourly snapshots over time" className="star-border">
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={historyFormatted} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                {metrics.map(({ key }) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={COLORS[key]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Last activity */}
      <Card title="Last activity" className="star-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-surface-500">Last invite run</span>
            <p className="font-medium text-surface-200 mt-0.5">
              {data.last_invite_run ? new Date(data.last_invite_run).toLocaleString() : 'Never'}
            </p>
          </div>
          <div>
            <span className="text-surface-500">Last friend poll</span>
            <p className="font-medium text-surface-200 mt-0.5">
              {data.last_friend_poll ? new Date(data.last_friend_poll).toLocaleString() : 'Never'}
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
