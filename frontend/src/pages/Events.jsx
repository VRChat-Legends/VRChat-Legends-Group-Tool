import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import Card from '../components/Card';
import { Icons } from '../components/Icons';

const REFRESH_MS = 5 * 60 * 1000;

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function statusStyle(status) {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'live') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (s === 'cancelled' || s === 'canceled') return 'bg-red-500/15 text-red-300 border-red-500/30';
  if (s === 'ended') return 'bg-surface-700/60 text-surface-400 border-surface-600/40';
  return 'bg-brand-500/15 text-brand-300 border-brand-500/30';
}

function EventCard({ ev }) {
  const isUpcoming = ev.startDt && new Date(ev.startDt) > new Date();
  return (
    <div className="flex gap-4 p-4 rounded-2xl bg-surface-800/50 border border-surface-700/50 hover:border-brand-500/30 transition-all">
      {ev.imageUrl ? (
        <img src={ev.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-surface-700/60 flex items-center justify-center flex-shrink-0">
          <i className="fas fa-calendar-star text-surface-500 text-xl" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
          <p className="text-sm font-semibold text-surface-100 truncate">{ev.name || 'Unnamed Event'}</p>
          <span className={`px-2 py-0.5 rounded-md text-[0.65rem] font-semibold border ${statusStyle(ev.status)}`}>
            {ev.status || (isUpcoming ? 'Upcoming' : 'Event')}
          </span>
        </div>
        {ev.description && (
          <p className="text-[0.72rem] text-surface-400 leading-snug mb-2 line-clamp-2">{ev.description}</p>
        )}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-surface-500">
          {ev.startDt && (
            <span>
              <i className="fas fa-clock mr-1" />
              {formatDate(ev.startDt)}
            </span>
          )}
          {ev.endDt && (
            <span>
              <i className="fas fa-arrow-right mr-1 text-surface-600" />
              {formatDate(ev.endDt)}
            </span>
          )}
          {ev.attendeeCount > 0 && (
            <span>
              <i className="fas fa-user-check mr-1" />
              {ev.attendeeCount} RSVP
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [countdown, setCountdown] = useState(REFRESH_MS / 1000);
  const [filter, setFilter] = useState('all');

  const fetchEvents = useCallback((manual = false) => {
    if (manual) setRefreshing(true);
    api.get('/api/group-events')
      .then((d) => {
        setEvents(d.events ?? []);
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
    fetchEvents();
    const interval = setInterval(() => fetchEvents(), REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  useEffect(() => {
    const tick = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  const now = new Date();
  const filtered = events.filter((ev) => {
    if (filter === 'upcoming') return ev.startDt && new Date(ev.startDt) > now;
    if (filter === 'past') return ev.startDt && new Date(ev.startDt) <= now;
    return true;
  });

  const mins = Math.floor(countdown / 60);
  const secs = String(countdown % 60).padStart(2, '0');

  return (
    <div className="space-y-6 animate-in w-full">
      <Card
        title="Group Events"
        subtitle="Calendar events from VRChat · auto-refreshes every 5 min"
        className="star-border"
        titleIcon={<Icons.Calendar />}
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              {['all', 'upcoming', 'past'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                    filter === f
                      ? 'bg-brand-500 text-white'
                      : 'bg-surface-800 text-surface-400 hover:bg-surface-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            {lastUpdated && (
              <span className="text-[0.65rem] text-surface-600">
                Next refresh in {mins}:{secs}
              </span>
            )}
          </div>
          <button
            onClick={() => fetchEvents(true)}
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
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <i className="fas fa-calendar-xmark text-3xl text-surface-600" />
            <p className="text-surface-400 text-sm">
              {filter === 'upcoming' ? 'No upcoming events' : filter === 'past' ? 'No past events' : 'No events found'}
            </p>
            <p className="text-surface-600 text-xs">Events created in VRChat will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ev, idx) => (
              <EventCard key={ev.id || idx} ev={ev} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
