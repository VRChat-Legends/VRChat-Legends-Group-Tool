import { useState } from 'react';
import About from './About';
import DocsPage from './DocsPage';
import Credits from './Credits';

const TABS = [
  { id: 'about', label: 'About', component: About },
  { id: 'docs', label: 'Documentation', component: DocsPage },
  { id: 'credits', label: 'Credits', component: Credits },
];

export default function Info() {
  const [tab, setTab] = useState('about');
  const TabComponent = TABS.find((t) => t.id === tab)?.component || About;

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
      <div className="flex-1 min-h-0 overflow-auto">
        <TabComponent />
      </div>
    </div>
  );
}
