import { NavLink } from 'react-router-dom';

const NavIcon = ({ d, viewBox = '0 0 24 24' }) => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/members', label: 'Members', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { to: '/group', label: 'Group', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { to: '/moderation', label: 'Moderation', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { to: '/discord', label: 'Discord', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9a9 9 0 019-9m-9 9a9 9 0 019 9' },
  { to: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 2.31.826 1.37 1.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 2.31-1.37 1.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-2.31-.826-1.37-1.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-2.31 1.37-1.37.976.696 2.286.696 3.262 0z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-12 bottom-0 w-[240px] flex flex-col z-40 pt-2 pb-4 pl-4">
      <div className="nav-pill flex flex-col flex-1 min-h-0 p-3 rounded-2xl mr-2">
        <div className="p-2 flex-shrink-0 mb-2">
          <a href="https://eciipsestudios.com/" target="_blank" rel="noopener noreferrer" className="block">
          <img
            src="/assets/vrchat%20legends/vrchat_legends_logo_round.png"
            alt="EcIipse Studios"
            className="w-14 h-14 rounded-full object-cover shadow-lg ring-2 ring-white/10"
          />
        </a>
        </div>
        <nav className="flex-1 overflow-y-auto py-1 space-y-2">
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 border border-white/10 bg-white/5 card-hover ${
                  isActive
                    ? 'border-vrcl-purple/40 bg-vrcl-purple/15 text-white shadow-lg shadow-vrcl-purple/20'
                    : 'text-gray-400 hover:border-white/20 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <NavIcon d={icon} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
