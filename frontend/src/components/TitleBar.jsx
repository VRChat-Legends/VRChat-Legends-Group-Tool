import { useState, useEffect } from 'react';

/**
 * Custom frameless title bar – only visible when running inside Electron.
 * The wide drag region lets users move the window; the three buttons call
 * window‑control IPC messages exposed by preload.js.
 */
export default function TitleBar() {
  const eAPI = window.electronAPI;
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!eAPI) return;
    eAPI.isMaximized().then(setIsMaximized).catch(() => {});
    const cleanup = eAPI.onMaximizeChange(setIsMaximized);
    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, []);

  if (!eAPI?.isElectron) return null;

  return (
    <div
      className="flex items-center h-9 flex-shrink-0 bg-[#080808] border-b border-white/[0.06] select-none z-[100]"
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* App name pill */}
      <div className="flex items-center gap-2 px-4 h-full" style={{ WebkitAppRegion: 'drag' }}>
        <img
          src="/assets/vrchat%20legends/vrchat_legends_logo_round.png"
          alt=""
          className="h-4 w-4 rounded object-cover opacity-80"
        />
        <span className="text-[0.65rem] font-semibold tracking-wide text-gray-500 uppercase">
          VRChat Legends Group Tool
        </span>
      </div>

      {/* Window controls ─ right side */}
      <div
        className="ml-auto flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {/* Minimize */}
        <button
          type="button"
          onClick={() => eAPI.minimize()}
          className="w-11 h-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.07] transition-colors"
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
          className="w-11 h-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.07] transition-colors"
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
          className="w-11 h-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-red-600/80 transition-colors"
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
