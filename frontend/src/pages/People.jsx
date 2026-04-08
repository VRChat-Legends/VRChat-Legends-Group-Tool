import { useState } from 'react';
import Members from './Members';
import Group from './Group';

const TABS = [
  { id: 'friends', label: 'Friends & Lobby', icon: 'fa-users' },
  { id: 'group',   label: 'Group',            icon: 'fa-people-group' },
];

export default function People() {
  const [tab, setTab] = useState('friends');

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-in">
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
      <div className="flex-1 min-h-0">
        {tab === 'friends' && <Members />}
        {tab === 'group'   && <Group />}
      </div>
    </div>
  );
}
