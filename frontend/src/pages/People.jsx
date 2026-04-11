import { useState } from 'react';
import Members from './Members';
import Group from './Group';
import ErrorBoundary from '../components/ErrorBoundary';

const TABS = [
  { id: 'friends', label: 'Friends & Lobby', icon: 'fa-users' },
  { id: 'group',   label: 'Group',            icon: 'fa-people-group' },
];

export default function People() {
  const [tab, setTab] = useState('friends');

  return (
    <div className="space-y-6 animate-in w-full">
      <div className="tab-bar mb-5 flex-shrink-0">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`tab-bar-item ${tab === id ? 'tab-bar-item--active' : 'tab-bar-item--idle'}`}
          >
            <i className={`fas ${icon} text-xs`} />
            {label}
          </button>
        ))}
      </div>
      <div>
        {tab === 'friends' && <Members />}
        {tab === 'group'   && (
          <ErrorBoundary>
            <Group />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}
