import { useState, useEffect } from 'react';
import { api } from '../api/client';
import Card from '../components/Card';
import { Icons } from '../components/Icons';

const STATUS_COLORS = {
  none: 'text-emerald-400',
  operational: 'text-emerald-400',
  degraded_performance: 'text-amber-400',
  partial_outage: 'text-orange-400',
  major_outage: 'text-red-400',
  unknown: 'text-surface-500',
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.unknown;
  const label = (status || 'unknown').replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${c} bg-white/5`}>
      <span className={`w-2 h-2 rounded-full ${(status === 'operational' || status === 'none') ? 'bg-emerald-400' : status === 'major_outage' ? 'bg-red-400' : 'bg-amber-400'}`} />
      {label}
    </span>
  );
}

export default function VRChatStatus() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = () => {
    setLoading(true);
    setError(null);
    api.vrchatStatus()
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Failed to load status');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 60000);
    return () => clearInterval(id);
  }, []);

  if (loading && !summary) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center">
        <p className="text-surface-500 text-sm">Loading VRChat status…</p>
      </div>
    );
  }

  const page = summary?.page ?? {};
  const status = summary?.status ?? {};
  const components = summary?.components ?? [];
  const incidents = summary?.incidents ?? [];
  const overall = status?.indicator ?? 'unknown';

  return (
    <div className="space-y-6 animate-in">
      <Card
        title="VRChat Status"
        subtitle="Live status from status.vrchat.com"
        className="star-border"
        titleIcon={<Icons.Globe />}
      >
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <StatusBadge status={overall} />
          <span className="text-sm text-surface-500">
            {page?.updated_at ? `Updated ${new Date(page.updated_at).toLocaleString()}` : ''}
          </span>
          <button
            type="button"
            onClick={fetchStatus}
            className="ml-auto px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-700 hover:bg-surface-600 text-surface-200"
          >
            Refresh
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <p className="text-sm text-surface-400">
          <a href="https://status.vrchat.com/" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
            status.vrchat.com
          </a>
        </p>
      </Card>

      {components.length > 0 && (
        <Card title="Components" className="bento-cell-wide">
          <ul className="space-y-2">
            {components.filter((c) => !c.group).map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 border-b border-surface-700 last:border-0">
                <span className="text-surface-200">{c.name}</span>
                <StatusBadge status={c.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {incidents.length > 0 && (
        <Card title="Active incidents" className="bento-cell-wide border-amber-500/20">
          <ul className="space-y-4">
            {incidents.slice(0, 5).map((inc) => (
              <li key={inc.id} className="p-3 rounded-xl bg-surface-800 border border-surface-700">
                <div className="font-medium text-surface-200">{inc.name}</div>
                <div className="text-xs text-surface-500 mt-1">{inc.status}</div>
                {inc.incident_updates?.[0]?.body && (
                  <p className="text-sm text-surface-400 mt-2">{inc.incident_updates[0].body}</p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
