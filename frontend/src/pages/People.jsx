import { useState } from 'react';
import Members from './Members';
import Group from './Group';

const TABS = [
  { id: 'friends', label: 'Friends', component: Members },
  { id: 'group', label: 'Group', component: Group },
];

export default function People() {
  const [tab, setTab] = useState('friends');
  const TabComponent = TABS.find((t) => t.id === tab)?.component || Members;

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
