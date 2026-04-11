import { NavLink } from 'react-router-dom';

const LOGO = '/assets/branding/group_tool_icon.png';

const NAV = [
  {
    key: 'main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: 'fas fa-house' },
    ],
  },
  {
    key: 'community',
    label: 'Community',
    items: [
      { to: '/instances',   label: 'Instances',  icon: 'fas fa-earth-americas' },
      { to: '/events',      label: 'Events',     icon: 'fas fa-calendar-star' },
      { to: '/moderation',  label: 'Activity',   icon: 'fas fa-chart-line' },
    ],
  },
  {
    key: 'integrations',
    label: 'Integrations',
    items: [
      { to: '/integrations', label: 'Integrations', icon: 'fas fa-plug' },
    ],
  },
  {
    key: 'system',
    label: 'System',
    items: [
      { to: '/settings',       label: 'Settings',       icon: 'fas fa-gear' },
      { to: '/vrchat-status',  label: 'VRChat Status',  icon: 'fas fa-signal' },
      { to: '/info',           label: 'Info & Docs',    icon: 'fas fa-book' },
    ],
  },
];

const EXTERNAL = [
  { href: 'https://vrchatlegends.com/shop',         label: 'Shop',    icon: 'fas fa-bag-shopping' },
  { href: 'https://discord.com/invite/6xPkZ7Dxp9', label: 'Discord', icon: 'fab fa-discord' },
];

function SidebarItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex items-center gap-2.5 px-3 py-[0.42rem] rounded-xl text-[0.825rem] font-medium transition-all duration-150 group overflow-hidden ${
          isActive
            ? 'text-white'
            : 'text-gray-500 hover:text-gray-100 border border-transparent hover:border-white/[0.05]'
        }`
      }
      style={({ isActive }) =>
        isActive
          ? {
              background: 'rgba(109,74,255,0.13)',
              border: '1px solid rgba(109,74,255,0.22)',
              boxShadow: '0 0 16px -6px rgba(109,74,255,0.35)',
            }
          : undefined
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute left-0 top-[0.35rem] bottom-[0.35rem] w-[3px] rounded-r-full"
              style={{
                background: 'linear-gradient(180deg, #8b5cf6, #6d4aff)',
                boxShadow: '0 0 8px rgba(109,74,255,0.7)',
              }}
            />
          )}
          <span
            className={`w-6 h-6 flex items-center justify-center rounded-lg flex-shrink-0 transition-all duration-150 ${
              isActive ? 'text-violet-300' : 'text-gray-600 group-hover:text-gray-300'
            }`}
            style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(109,74,255,0.5))' } : undefined}
          >
            <i className={`${icon} text-[0.85rem]`} />
          </span>
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col h-full border-r"
      style={{
        background: 'linear-gradient(180deg, #08080e 0%, #06060b 100%)',
        borderColor: 'rgba(255,255,255,0.05)',
      }}
    >
      {/* Logo / brand */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <img
              src={LOGO}
              alt="VRChat Legends"
              className="w-9 h-9 rounded-xl object-cover"
              style={{ boxShadow: '0 0 16px -4px rgba(109,74,255,0.5), 0 0 0 1px rgba(109,74,255,0.2)' }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[0.8rem] font-black text-white leading-tight truncate tracking-tight">
              VRChat Legends
            </p>
            <p className="text-[0.6rem] font-medium truncate" style={{ color: 'rgba(139,92,246,0.7)' }}>
              Group Tool
            </p>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
        {NAV.map((group) => (
          <div key={group.key}>
            {group.label && (
              <p
                className="mb-1.5 px-2.5 text-[0.57rem] font-bold uppercase tracking-[0.14em] select-none"
                style={{ color: 'rgba(255,255,255,0.2)' }}
              >
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

      {/* External quick-links + credit */}
      <div className="px-2.5 pb-3 pt-2 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {EXTERNAL.map(({ href, label, icon }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[0.8rem] transition-colors"
            style={{ color: 'rgba(255,255,255,0.25)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = ''; }}
          >
            <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <i className={`${icon} text-[0.85rem]`} />
            </span>
            <span className="truncate">{label}</span>
            <i className="fas fa-arrow-up-right-from-square ml-auto text-[0.55rem] opacity-40" />
          </a>
        ))}
        <p className="px-3 pt-1.5 text-[0.53rem] leading-relaxed" style={{ color: 'rgba(255,255,255,0.12)' }}>
          EcIipse Studios&#8482; &middot; Not affiliated with VRChat Inc.
        </p>
      </div>
    </aside>
  );
}
