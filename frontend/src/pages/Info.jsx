import { useState } from 'react';
import About from './About';
import DocsPage from './DocsPage';
import Credits from './Credits';
import Terms from './Terms';
import Privacy from './Privacy';

const TABS = [
  { id: 'about',   label: 'About',          icon: 'fa-circle-info' },
  { id: 'docs',    label: 'Documentation',  icon: 'fa-book' },
  { id: 'credits', label: 'Credits',        icon: 'fa-heart' },
  { id: 'terms',   label: 'Terms of Service', icon: 'fa-scale-balanced' },
  { id: 'privacy', label: 'Privacy Policy', icon: 'fa-shield-halved' },
];

export default function Info() {
  const [tab, setTab] = useState('about');

  return (
    <div className="space-y-6 animate-in w-full">
      {/* Tab bar */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit flex-shrink-0 flex-wrap">
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

        {/* GitHub link */}
        <a
          href="https://github.com/VRChat-Legends/VRChat-Legends-Group-Tool"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-200 hover:bg-white/[0.04] transition-all"
        >
          <i className="fab fa-github text-xs" />
          GitHub
          <i className="fas fa-arrow-up-right-from-square text-[0.55rem] opacity-50" />
        </a>
      </div>

      <div>
        {tab === 'about'   && <About />}
        {tab === 'docs'    && <DocsPage />}
        {tab === 'credits' && <Credits />}
        {tab === 'terms'   && <Terms />}
        {tab === 'privacy' && <Privacy />}
      </div>
    </div>
  );
}
