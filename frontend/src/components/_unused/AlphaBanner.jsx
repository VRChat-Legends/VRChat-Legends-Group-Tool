import { useState, useEffect } from 'react';

const STORAGE_KEY = 'vrchat-legends-alpha-banner-dismissed';

export default function AlphaBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {}
  }, []);

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
  };

  if (dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-4 bg-gradient-to-r from-amber-500/95 to-orange-600/95 text-white py-3 px-4 pr-12 shadow-lg border-b border-amber-400/30">
      <span className="tracking-wide uppercase font-bold text-sm">Alpha</span>
      <span className="opacity-80">·</span>
      <span className="text-sm font-medium opacity-95">This app is in early development. Use at your own risk.</span>
      <button
        type="button"
        onClick={close}
        aria-label="Close banner"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white/90 hover:text-white"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
