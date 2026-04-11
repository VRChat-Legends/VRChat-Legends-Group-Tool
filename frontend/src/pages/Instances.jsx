import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import Card from '../components/Card';
import { Icons } from '../components/Icons';

const REFRESH_MS = 5 * 60 * 1000; // 5 minutes

function InstanceTypeTag({ type }) {
  const map = {
    public: { label: 'Public', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    group: { label: 'Group', cls: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
    groupPublic: { label: 'Group+', cls: 'bg-brand-500/15 text-brand-300 border-brand-500/30' },
    groupPlus: { label: 'Group+', cls: 'bg-brand-500/15 text-brand-300 border-brand-500/30' },
    friends: { label: 'Friends', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
    friendsPlus: { label: 'Friends+', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
    private: { label: 'Private', cls: 'bg-surface-700/60 text-surface-400 border-surface-600/40' },
  };
  const t = map[type] ?? { label: type || 'Unknown', cls: 'bg-surface-700/60 text-surface-400 border-surface-600/40' };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[0.65rem] font-semibold border ${t.cls}`}>
      {t.label}
    </span>
  );
}

function InstanceCard({ inst }) {
  const fill = inst.capacity > 0 ? Math.round((inst.n_users / inst.capacity) * 100) : 0;
  return (
    <div className="flex gap-3 p-4 rounded-2xl bg-surface-800/50 border border-surface-700/50 hover:border-brand-500/30 transition-all">
      {inst.worldImageUrl ? (
        <img
          src={inst.worldImageUrl}
          alt=""
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-surface-700/60 flex items-center justify-center flex-shrink-0">
          <i className="fas fa-earth-americas text-surface-500 text-xl" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-surface-100 truncate">
            {inst.worldName || inst.worldId || 'Unknown World'}
          </p>
          <InstanceTypeTag type={inst.type} />
        </div>
        <p className="text-[0.7rem] text-surface-500 font-mono truncate mb-2">
          {inst.instanceId || inst.location || ''}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-surface-400">
            <i className="fas fa-user mr-1 text-surface-500" />
            {inst.n_users}
            {inst.capacity > 0 && <span className="text-surface-600"> / {inst.capacity}</span>}
          </span>
          {inst.capacity > 0 && (
            <div className="flex-1 h-1.5 rounded-full bg-surface-700/60 overflow-hidden max-w-[80px]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${fill}%`,
                  background: fill > 80 ? '#f87171' : fill > 50 ? '#fb923c' : '#8b5cf6',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Instances() {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [countdown, setCountdown] = useState(REFRESH_MS / 1000);

  const fetchInstances = useCallback((manual = false) => {
    if (manual) setRefreshing(true);
    api.get('/api/group-instances')
      .then((d) => {
        setInstances(d.instances ?? []);
        setLoading(false);
        setRefreshing(false);
        setLastUpdated(new Date());
        setCountdown(REFRESH_MS / 1000);
      })
      .catch(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    fetchInstances();
    const interval = setInterval(() => fetchInstances(), REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchInstances]);

  // Countdown timer
  useEffect(() => {
    const tick = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  const mins = Math.floor(countdown / 60);
  const secs = String(countdown % 60).padStart(2, '0');

  return (
    <div className="space-y-6 animate-in w-full">
      <Card
        title="Group Instances"
        subtitle="Open public & group lobbies · auto-refreshes every 5 min"
        className="star-border"
        titleIcon={<Icons.Lobby />}
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {instances.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-500/15 text-brand-300 border border-brand-500/25">
                {instances.length} open
              </span>
            )}
            {lastUpdated && (
              <span className="text-[0.65rem] text-surface-600">
                Next refresh in {mins}:{secs}
              </span>
            )}
          </div>
          <button
            onClick={() => fetchInstances(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-surface-800 border border-surface-700 text-surface-300 hover:bg-surface-700 disabled:opacity-50 transition-all"
          >
            <i className={`fas fa-rotate-right text-[0.7rem] ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh now'}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-surface-800/50 border border-surface-700/50 animate-pulse" />
            ))}
          </div>
        ) : instances.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <i className="fas fa-door-closed text-3xl text-surface-600" />
            <p className="text-surface-400 text-sm">No open group instances right now</p>
            <p className="text-surface-600 text-xs">Check back soon or start one yourself in VRChat</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {instances.map((inst, idx) => (
              <InstanceCard key={inst.instanceId || inst.location || idx} inst={inst} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
