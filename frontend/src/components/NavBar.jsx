import { useState, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { faIconClass } from '../utils/faIconClass';

const LOGO = '/assets/vrchat%20legends/vrchat_legends_logo_round.png';

function navKey(item) {
  return item.path || item.href || item.label;
}

function isNavExternal(item) {
  return Boolean(item.external || (item.href && /^https?:\/\//i.test(item.href)));
}

const TOP_LEVEL = [
  { label: 'Dashboard', path: '/dashboard', icon: 'fa-gauge-high' },
  { label: 'Shop', href: 'https://vrchatlegends.com/shop', external: true, icon: 'fa-store' },
  { label: 'Website', href: 'https://vrchatlegends.com/', external: true, icon: 'fa-globe' },
  { label: 'Chat', href: 'https://discord.com/invite/6xPkZ7Dxp9', external: true, icon: 'fab fa-discord' },
];

const NAV_CATEGORIES = {
  community: {
    label: 'Community',
    icon: 'fa-people-group',
    items: [
      { label: 'People', path: '/people', icon: 'fa-users' },
      { label: 'Activity', path: '/moderation', icon: 'fa-chart-line' },
      { label: 'Integrations', path: '/integrations', icon: 'fa-plug' },
    ],
  },
  more: {
    label: 'More',
    icon: 'fa-ellipsis',
    items: [
      { label: 'Settings', path: '/settings', icon: 'fa-gear' },
      { label: 'VRChat status', path: '/vrchat-status', icon: 'fa-signal' },
      { label: 'Docs', path: '/docs', icon: 'fa-book' },
      { label: 'Info', path: '/info', icon: 'fa-circle-info' },
    ],
  },
};

function NavDropdown({ label, icon, items, isOpen, onEnter, onLeave, onToggle, onNavigate }) {
  const location = useLocation();
  const isChildActive = items.some((item) => item.path && location.pathname.startsWith(item.path));

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
          isChildActive || isOpen
            ? 'bg-white/10 text-white shadow-sm'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <i className={`fas ${icon} w-4 shrink-0 text-center`} aria-hidden />
        {label}
        <i
          className={`fas fa-chevron-down text-[0.5rem] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      <div
        className={`absolute left-1/2 top-full z-50 min-w-44 -translate-x-1/2 pt-3 transition-all duration-200 ease-out ${
          isOpen
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-2 scale-95 opacity-0'
        }`}
      >
        <div className="absolute left-1/2 top-1.5 -translate-x-1/2">
          <div className="h-0 w-0 border-x-[9px] border-b-[9px] border-x-transparent border-b-white/10" />
          <div className="absolute left-1/2 top-px h-0 w-0 -translate-x-1/2 border-x-8 border-b-8 border-x-transparent border-b-[#111111]" />
        </div>
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111111]/95 p-1.5 shadow-xl shadow-black/40 backdrop-blur-xl">
          {items.map((item) =>
            isNavExternal(item) ? (
              <a
                key={navKey(item)}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onNavigate?.()}
                className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-gray-400 transition-all hover:bg-white/5 hover:text-white"
              >
                <i className={`${faIconClass(item.icon)} w-4 shrink-0 text-center text-gray-600`} aria-hidden />
                {item.label}
                <i className="fas fa-arrow-up-right-from-square ml-auto text-[0.5rem] text-gray-600" aria-hidden />
              </a>
            ) : (
              <NavLink
                key={navKey(item)}
                to={item.path}
                onClick={() => onNavigate?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-vrcl-purple/15 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <i className={`${faIconClass(item.icon)} w-4 shrink-0 text-center text-gray-600`} aria-hidden />
                {item.label}
              </NavLink>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const closeTimeoutRef = useRef(null);

  function handleDropdownEnter(key) {
    clearTimeout(closeTimeoutRef.current);
    setOpenDropdown(key);
  }

  function handleDropdownLeave() {
    closeTimeoutRef.current = setTimeout(() => setOpenDropdown(null), 150);
  }

  function handleDropdownNavigate() {
    clearTimeout(closeTimeoutRef.current);
    setOpenDropdown(null);
  }

  const categories = Object.entries(NAV_CATEGORIES).map(([key, cat]) => ({
    key,
    label: cat.label,
    icon: cat.icon,
    items: cat.items,
  }));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-vrcl-dark/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-none w-full items-center justify-between px-4 py-3 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <Link to="/dashboard" className="group flex items-center gap-3">
          <img
            src={LOGO}
            alt="VRChat Legends"
            className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-vrcl-purple/30 transition-transform group-hover:scale-105"
          />
          <span className="bg-gradient-to-r from-vrcl-purple-light to-vrcl-pink bg-clip-text text-xl font-black tracking-tight text-transparent sm:text-2xl">
            VRChat Legends
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {TOP_LEVEL.map((item) =>
            isNavExternal(item) ? (
              <a
                key={navKey(item)}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-gray-400 transition-all hover:bg-white/5 hover:text-white"
              >
                <i className={`${faIconClass(item.icon)} w-4 shrink-0 text-center`} aria-hidden />
                {item.label}
                <i className="fas fa-arrow-up-right-from-square text-[0.45rem] text-gray-600" aria-hidden />
              </a>
            ) : (
              <NavLink
                key={navKey(item)}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <i className={`${faIconClass(item.icon)} w-4 shrink-0 text-center`} aria-hidden />
                {item.label}
              </NavLink>
            )
          )}

          {categories.map((cat) => (
            <NavDropdown
              key={cat.key}
              label={cat.label}
              icon={cat.icon}
              items={cat.items}
              isOpen={openDropdown === cat.key}
              onEnter={() => handleDropdownEnter(cat.key)}
              onLeave={handleDropdownLeave}
              onToggle={() => setOpenDropdown(openDropdown === cat.key ? null : cat.key)}
              onNavigate={handleDropdownNavigate}
            />
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-purple-400 md:hidden"
          aria-label="Toggle navigation"
        >
          <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'} text-xl`} aria-hidden />
        </button>
      </div>

      <div
        className={`overflow-hidden border-t border-white/5 transition-all duration-300 md:hidden ${
          menuOpen ? 'max-h-[min(80vh,520px)]' : 'max-h-0 border-t-transparent'
        }`}
      >
        <nav className="max-h-[min(80vh,520px)] overflow-y-auto px-4 pb-4">
          {TOP_LEVEL.map((item) =>
            isNavExternal(item) ? (
              <a
                key={navKey(item)}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-gray-400 transition-all hover:bg-white/5 hover:text-white"
              >
                <i className={`${faIconClass(item.icon)} w-4 shrink-0 text-center`} aria-hidden />
                {item.label}
                <i className="fas fa-arrow-up-right-from-square ml-auto text-[0.5rem] text-gray-600" aria-hidden />
              </a>
            ) : (
              <NavLink
                key={navKey(item)}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                    isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <i className={`${faIconClass(item.icon)} w-4 shrink-0 text-center`} aria-hidden />
                {item.label}
              </NavLink>
            )
          )}

          {categories.map((cat) => (
            <div key={cat.key}>
              <button
                type="button"
                onClick={() => setMobileExpanded((prev) => (prev === cat.key ? null : cat.key))}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-gray-400 transition-all hover:bg-white/5 hover:text-white"
              >
                <i className={`fas ${cat.icon} w-4 shrink-0 text-center`} aria-hidden />
                {cat.label}
                <i
                  className={`fas fa-chevron-down ml-auto text-[0.5rem] transition-transform duration-200 ${
                    mobileExpanded === cat.key ? 'rotate-180' : ''
                  }`}
                  aria-hidden
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  mobileExpanded === cat.key ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="ml-4 border-l border-white/5 pl-2">
                  {cat.items.map((item) =>
                    isNavExternal(item) ? (
                      <a
                        key={navKey(item)}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 transition-all hover:bg-white/5 hover:text-white"
                      >
                        <i className={`${faIconClass(item.icon)} w-4 shrink-0 text-center`} aria-hidden />
                        {item.label}
                      </a>
                    ) : (
                      <NavLink
                        key={navKey(item)}
                        to={item.path}
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-vrcl-purple/15 text-white'
                              : 'text-gray-500 hover:bg-white/5 hover:text-white'
                          }`
                        }
                      >
                        <i className={`${faIconClass(item.icon)} w-4 shrink-0 text-center`} aria-hidden />
                        {item.label}
                      </NavLink>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}
