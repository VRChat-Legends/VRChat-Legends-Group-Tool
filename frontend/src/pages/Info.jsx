import { useState } from 'react';
import About from './About';
import DocsPage from './DocsPage';
import Credits from './Credits';

const TABS = [
  { id: 'about',   label: 'About',         icon: 'fa-circle-info' },
  { id: 'docs',    label: 'Documentation', icon: 'fa-book' },
  { id: 'credits', label: 'Credits',       icon: 'fa-heart' },
];

export default function Info() {
  const [tab, setTab] = useState('about');
  const TabComponent = TABS.find((t) => t.id === tab)?.component ??
    (tab === 'about' ? About : tab === 'docs' ? DocsPage : Credits);

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-in">
      {/* Tab bar */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit flex-shrink-0">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id
                ? 'bg-vrcl-purple/25 text-white border border-vrcl-purple/30 shadow-sm'
                : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'
            }`}
          >
            <i className={`fas ${icon} text-xs`} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {tab === 'about'   && <About />}
        {tab === 'docs'    && <DocsPage />}
        {tab === 'credits' && <Credits />}
      </div>
    </div>
  );
}
