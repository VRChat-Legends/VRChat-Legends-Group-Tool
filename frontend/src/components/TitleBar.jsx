import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_NAMES = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/people': 'People',
  '/moderation': 'Activity',
  '/integrations': 'Integrations',
  '/settings': 'Settings',
  '/vrchat-status': 'VRChat Status',
  '/info': 'Info & Docs',
  '/group': 'Group',
  '/analytics': 'Analytics',
  '/chatbox': 'Chatbox',
  '/discord': 'Discord',
  '/activity': 'Activity',
  '/about': 'About',
  '/ai': 'AI',
  '/credits': 'Credits',
  '/auth-store': 'Auth Store',
};

/**
 * Custom frameless title bar – only visible when running inside Electron.
 * Shows the current page name in the centre drag region.
 */
export default function TitleBar() {
  const eAPI = window.electronAPI;
  const [isMaximized, setIsMaximized] = useState(false);
  const location = useLocation();
  const pageName = ROUTE_NAMES[location.pathname] ?? 'VRChat Legends Group Tool';

  useEffect(() => {
    if (!eAPI) return;
    eAPI.isMaximized().then(setIsMaximized).catch(() => {});
    const cleanup = eAPI.onMaximizeChange(setIsMaximized);
    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, []);

  if (!eAPI?.isElectron) return null;

  return (
    <div
      className="flex items-center h-9 flex-shrink-0 bg-[#070707] border-b border-white/[0.05] select-none z-[100]"
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* App name / logo */}
      <div className="flex items-center gap-2 px-4 h-full" style={{ WebkitAppRegion: 'drag' }}>
        <img
          src="/assets/branding/group_tool_icon.png"
          alt=""
          className="h-4 w-4 rounded object-cover opacity-70"
        />
        <span className="text-[0.62rem] font-semibold tracking-wide text-gray-600 uppercase">
          VRChat Legends
        </span>
      </div>

      {/* Current page name — centred in remaining space */}
      <div className="flex-1 flex items-center justify-center h-full pointer-events-none" style={{ WebkitAppRegion: 'drag' }}>
        <span className="text-[0.68rem] font-semibold text-gray-500 tracking-tight">{pageName}</span>
      </div>

      {/* Window controls ─ right side */}
      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {/* Minimize */}
        <button
          type="button"
          onClick={() => eAPI.minimize()}
          className="w-11 h-full flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/[0.07] transition-colors"
          aria-label="Minimize"
        >
          <svg viewBox="0 0 12 12" width="11" height="11" fill="currentColor">
            <rect y="5.5" width="12" height="1" rx="0.5" />
          </svg>
        </button>

        {/* Maximize / restore */}
        <button
          type="button"
          onClick={() => eAPI.maximize()}
          className="w-11 h-full flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/[0.07] transition-colors"
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="2" y="0" width="10" height="10" rx="0.5" />
              <rect x="0" y="2" width="10" height="10" rx="0.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0.5" y="0.5" width="11" height="11" rx="0.5" />
            </svg>
          )}
        </button>

        {/* Close */}
        <button
          type="button"
          onClick={() => eAPI.close()}
          className="w-11 h-full flex items-center justify-center text-gray-600 hover:text-white hover:bg-red-600/80 transition-colors"
          aria-label="Close"
        >
          <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <line x1="1" y1="1" x2="11" y2="11" />
            <line x1="11" y1="1" x2="1" y2="11" />
          </svg>
        </button>
      </div>
    </div>
  );
}
