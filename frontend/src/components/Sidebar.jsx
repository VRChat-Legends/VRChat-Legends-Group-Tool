import { NavLink } from 'react-router-dom';

const LOGO = '/assets/vrchat%20legends/vrchat_legends_logo_round.png';

const NAV = [
  {
    key: 'main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    ],
  },
  {
    key: 'community',
    label: 'Community',
    items: [
      { to: '/people',      label: 'People',      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
      { to: '/moderation',  label: 'Activity',    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    ],
  },
  {
    key: 'integrations',
    label: 'Integrations',
    items: [
      { to: '/integrations', label: 'Integrations', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    ],
  },
  {
    key: 'system',
    label: 'System',
    items: [
      { to: '/settings',      label: 'Settings',       icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 1.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-1.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-1.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 1.37-2.37.976.696 2.286.696 3.262 0zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
      { to: '/vrchat-status', label: 'VRChat Status',  icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
      { to: '/info',          label: 'Info & Docs',    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    ],
  },
];

const EXTERNAL = [
  { href: 'https://vrchatlegends.com/shop', label: 'Shop', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { href: 'https://discord.com/invite/6xPkZ7Dxp9', label: 'Discord', icon: 'M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 00-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 00-5.487 0 12.36 12.36 0 00-.617-1.23A.077.077 0 008.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 00-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 00.031.055 20.03 20.03 0 005.993 2.98.078.078 0 00.084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 01-1.872-.878.075.075 0 01-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 01.078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 01.079.009c.12.098.245.195.372.288a.075.075 0 01-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 00-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 00.084.028 19.963 19.963 0 006.002-2.981.076.076 0 00.032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 00-.031-.028z' },
];

function NavIcon({ d }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function SidebarItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 group ${
          isActive
            ? 'bg-vrcl-purple/20 text-white border border-vrcl-purple/25 shadow-sm'
            : 'text-gray-500 hover:bg-white/[0.05] hover:text-gray-200 border border-transparent'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors ${
              isActive
                ? 'bg-vrcl-purple/25 text-vrcl-purple-light'
                : 'bg-transparent text-gray-600 group-hover:text-gray-400'
            }`}
          >
            <NavIcon d={icon} />
          </span>
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-[#0c0c0c] border-r border-white/[0.05] h-full">
      {/* Logo / brand */}
      <div className="px-4 pt-5 pb-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <img
            src={LOGO}
            alt="VRChat Legends"
            className="w-9 h-9 rounded-xl object-cover flex-shrink-0 shadow-md shadow-vrcl-purple/20 ring-1 ring-vrcl-purple/20"
          />
          <div className="min-w-0">
            <p className="text-sm font-black text-white leading-tight truncate tracking-tight">
              VRChat Legends
            </p>
            <p className="text-[0.65rem] text-gray-600 truncate font-medium">Group Tool</p>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
        {NAV.map((group) => (
          <div key={group.key}>
            {group.label && (
              <p className="mb-1.5 px-3 text-[0.6rem] font-bold uppercase tracking-widest text-gray-700">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarItem key={item.to} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* External quick-links */}
      <div className="px-3 pb-4 pt-2 border-t border-white/[0.05] space-y-0.5">
        {EXTERNAL.map(({ href, label, icon }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-600 hover:text-gray-300 hover:bg-white/[0.04] transition-all border border-transparent group"
          >
            <span className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 text-gray-700 group-hover:text-gray-400 transition-colors">
              <NavIcon d={icon} />
            </span>
            <span className="truncate">{label}</span>
            <svg className="ml-auto w-3 h-3 text-gray-700 flex-shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 10L10 2M6 2h4v4" />
            </svg>
          </a>
        ))}
        <p className="px-3 pt-2 text-[0.58rem] text-gray-800 truncate">
          EcIipse Studios™ — not affiliated with VRChat Inc.
        </p>
      </div>
    </aside>
  );
}
