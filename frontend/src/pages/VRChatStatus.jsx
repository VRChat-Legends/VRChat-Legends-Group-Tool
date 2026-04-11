import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import Card from '../components/Card';

const STATUS_DOT = {
  operational: 'bg-emerald-400',
  none: 'bg-emerald-400',
  degraded_performance: 'bg-amber-400',
  partial_outage: 'bg-orange-400',
  major_outage: 'bg-red-400',
  under_maintenance: 'bg-blue-400',
  unknown: 'bg-surface-500',
};
const STATUS_TEXT = {
  operational: 'text-emerald-400',
  none: 'text-emerald-400',
  degraded_performance: 'text-amber-400',
  partial_outage: 'text-orange-400',
  major_outage: 'text-red-400',
  under_maintenance: 'text-blue-400',
  unknown: 'text-surface-500',
};

function StatusBadge({ status }) {
  const label = (status || 'unknown').replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_TEXT[status] || STATUS_TEXT.unknown} bg-white/5`}>
      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status] || STATUS_DOT.unknown}`} />
      {label}
    </span>
  );
}

function TimeAgo({ date }) {
  if (!date) return null;
  const d = new Date(date);
  return <span className="text-xs text-surface-500" title={d.toLocaleString()}>{d.toLocaleString()}</span>;
}

export default function VRChatStatus() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = () => {
    setLoading(true);
    setError(null);
    api.vrchatStatus()
      .then((data) => { setSummary(data); setLoading(false); })
      .catch((e) => { setError(e.message || 'Failed to load status'); setLoading(false); });
  };

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 60000);
    return () => clearInterval(id);
  }, []);

  const { page, status, groups, incidents, scheduled } = useMemo(() => {
    if (!summary) return { page: {}, status: {}, groups: [], incidents: [], scheduled: [] };
    const allComp = summary.components ?? [];
    const parentComps = allComp.filter((c) => c.group === true);
    const childMap = {};
    allComp.filter((c) => !c.group && c.group_id).forEach((c) => {
      if (!childMap[c.group_id]) childMap[c.group_id] = [];
      childMap[c.group_id].push(c);
    });
    const standalone = allComp.filter((c) => !c.group && !c.group_id);
    const grps = parentComps.map((p) => ({ ...p, children: childMap[p.id] || [] }));
    if (standalone.length > 0) grps.push({ id: '_standalone', name: 'Other', status: 'operational', children: standalone, group: true });
    return {
      page: summary.page ?? {},
      status: summary.status ?? {},
      groups: grps,
      incidents: summary.incidents ?? [],
      scheduled: summary.scheduled_maintenances ?? [],
    };
  }, [summary]);

  if (loading && !summary) {
    return <div className="min-h-[40vh] flex flex-col items-center justify-center"><p className="text-surface-500 text-sm">Loading VRChat status…</p></div>;
  }

  const overall = status?.indicator ?? 'unknown';
  const overallDesc = status?.description ?? 'Unknown';
  const opCount = (summary?.components ?? []).filter((c) => !c.group && c.status === 'operational').length;
  const totalCount = (summary?.components ?? []).filter((c) => !c.group).length;

  return (
    <div className="space-y-6 animate-in w-full">
      {/* Overall banner */}
      <div className={`rounded-2xl border p-5 ${overall === 'none' || overall === 'operational' ? 'border-emerald-500/20 bg-emerald-500/[0.04]' : overall === 'major_outage' ? 'border-red-500/20 bg-red-500/[0.04]' : 'border-amber-500/20 bg-amber-500/[0.04]'}`}>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <i className={`fas fa-signal text-lg ${STATUS_TEXT[overall] || 'text-surface-500'}`} />
          <h1 className="text-xl font-bold text-surface-100">VRChat Status</h1>
          <StatusBadge status={overall} />
          <button type="button" onClick={fetchStatus} className="ml-auto px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-700 hover:bg-surface-600 text-surface-200 transition-colors">
            <i className="fas fa-arrows-rotate mr-1.5 text-xs" />Refresh
          </button>
        </div>
        <p className="text-sm text-surface-300 font-medium">{overallDesc}</p>
        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-surface-500">
          <span>{opCount}/{totalCount} components operational</span>
          {page?.updated_at && <span>Updated <TimeAgo date={page.updated_at} /></span>}
          <a href="https://status.vrchat.com/" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline ml-auto">
            <i className="fas fa-arrow-up-right-from-square mr-1" />status.vrchat.com
          </a>
        </div>
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      </div>

      {/* Grouped components */}
      {groups.map((grp) => (
        <Card key={grp.id} title={grp.name} subtitle={`${grp.children.filter((c) => c.status === 'operational').length}/${grp.children.length} operational`} titleIcon={<StatusBadge status={grp.children.every((c) => c.status === 'operational') ? 'operational' : grp.children.some((c) => c.status === 'major_outage') ? 'major_outage' : 'degraded_performance'} />}>
          <ul className="space-y-0">
            {grp.children.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
                <div className="min-w-0">
                  <span className="text-sm text-surface-200">{c.name}</span>
                  {c.description && <p className="text-xs text-surface-500 mt-0.5">{c.description}</p>}
                </div>
                <StatusBadge status={c.status} />
              </li>
            ))}
          </ul>
        </Card>
      ))}

      {/* Active incidents */}
      {incidents.length > 0 && (
        <Card title="Active incidents" titleIcon={<i className="fas fa-circle-exclamation text-red-400" />} className="border-red-500/20">
          <ul className="space-y-4">
            {incidents.map((inc) => (
              <li key={inc.id} className="p-4 rounded-xl bg-red-500/[0.04] border border-red-500/10">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-surface-200">{inc.name}</p>
                  <span className="text-xs text-red-400 font-medium capitalize flex-shrink-0">{inc.impact}</span>
                </div>
                {inc.incident_updates?.map((upd) => (
                  <div key={upd.id} className="mt-2 pl-3 border-l-2 border-red-500/20">
                    <p className="text-xs font-medium text-surface-400 capitalize mb-0.5">{upd.status}</p>
                    <p className="text-sm text-surface-300">{upd.body}</p>
                    <TimeAgo date={upd.created_at} />
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Scheduled maintenances */}
      {scheduled.length > 0 && (
        <Card title="Scheduled maintenance" titleIcon={<i className="fas fa-wrench text-blue-400" />} className="border-blue-500/20">
          <ul className="space-y-4">
            {scheduled.map((m) => (
              <li key={m.id} className="p-4 rounded-xl bg-blue-500/[0.04] border border-blue-500/10">
                <p className="font-semibold text-surface-200 mb-1">{m.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-surface-500 mb-2">
                  {m.scheduled_for && <span><i className="fas fa-calendar mr-1" />Starts {new Date(m.scheduled_for).toLocaleString()}</span>}
                  {m.scheduled_until && <span><i className="fas fa-calendar-check mr-1" />Ends {new Date(m.scheduled_until).toLocaleString()}</span>}
                  {m.impact && <span className="text-blue-400 capitalize">{m.impact}</span>}
                </div>
                {m.components?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {m.components.map((c) => (
                      <span key={c.id} className="px-2 py-0.5 rounded-md bg-blue-500/10 text-xs text-blue-300">{c.name}</span>
                    ))}
                  </div>
                )}
                {m.incident_updates?.map((upd) => (
                  <div key={upd.id} className="mt-2 pl-3 border-l-2 border-blue-500/20">
                    <p className="text-sm text-surface-300">{upd.body}</p>
                    <TimeAgo date={upd.created_at} />
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {incidents.length === 0 && scheduled.length === 0 && (
        <div className="text-center py-6 text-surface-500 text-sm">
          <i className="fas fa-check-circle text-emerald-400 text-lg mb-2 block" />
          No active incidents or scheduled maintenance
        </div>
      )}
    </div>
  );
}
