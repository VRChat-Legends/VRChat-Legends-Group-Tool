import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Activity from './Activity';
import Analytics from './Analytics';

const TABS = [
  { id: 'activity', label: 'Activity Log', component: Activity },
  { id: 'analytics', label: 'Analytics', component: Analytics },
];

export default function Moderation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'activity';
  const setTab = (id) => setSearchParams({ tab: id });
  const TabComponent = TABS.find((t) => t.id === tab)?.component || Activity;

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-in">
      <div className="flex gap-2 mb-4 flex-shrink-0">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === id ? 'bg-brand-500 text-white' : 'bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0">
        <TabComponent />
      </div>
    </div>
  );
}
