import { useRef, useState, useEffect, useCallback } from 'react';

const SITE_URL = 'https://vrchatlegends.com';

export default function Website() {
  const webviewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [navUrl, setNavUrl] = useState(SITE_URL);

  // Electron <webview> events must be attached via addEventListener, not React props
  const attachRef = useCallback((node) => {
    if (webviewRef.current) {
      try {
        webviewRef.current.removeEventListener('did-start-loading', onStartLoad);
        webviewRef.current.removeEventListener('did-stop-loading', onStopLoad);
        webviewRef.current.removeEventListener('did-navigate', onNav);
        webviewRef.current.removeEventListener('did-navigate-in-page', onNav);
      } catch {}
    }
    webviewRef.current = node;
    if (node) {
      node.addEventListener('did-start-loading', onStartLoad);
      node.addEventListener('did-stop-loading', onStopLoad);
      node.addEventListener('did-navigate', onNav);
      node.addEventListener('did-navigate-in-page', onNav);
    }
  }, []);

  const onStartLoad = () => setLoading(true);
  const onStopLoad = () => {
    setLoading(false);
    if (webviewRef.current) {
      try { setNavUrl(webviewRef.current.getURL()); } catch {}
    }
  };
  const onNav = (e) => { if (e.url) setNavUrl(e.url); };

  const handleNavigate = (e) => {
    e.preventDefault();
    if (webviewRef.current) {
      try { webviewRef.current.loadURL(navUrl); } catch {}
    }
  };

  return (
    <div className="flex flex-col flex-1 animate-in w-full" style={{ minHeight: 0 }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => webviewRef.current?.goBack()}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:text-surface-200 hover:bg-surface-700 transition-all text-xs"
          title="Back"
        >
          <i className="fas fa-arrow-left" />
        </button>
        <button
          onClick={() => webviewRef.current?.goForward()}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:text-surface-200 hover:bg-surface-700 transition-all text-xs"
          title="Forward"
        >
          <i className="fas fa-arrow-right" />
        </button>
        <button
          onClick={() => webviewRef.current?.reload()}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:text-surface-200 hover:bg-surface-700 transition-all text-xs"
          title="Reload"
        >
          <i className={`fas fa-rotate-right ${loading ? 'animate-spin' : ''}`} />
        </button>

        <form onSubmit={handleNavigate} className="flex flex-1 gap-2">
          <input
            type="text"
            value={navUrl}
            onChange={(e) => setNavUrl(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-200 text-xs font-mono"
            spellCheck={false}
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium transition-all"
          >
            Go
          </button>
        </form>

        <a
          href={navUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:text-surface-200 hover:bg-surface-700 transition-all text-xs"
          title="Open in system browser"
        >
          <i className="fas fa-arrow-up-right-from-square" />
        </a>
      </div>

      {/* Webview */}
      <div className="relative flex-1 rounded-2xl overflow-hidden border border-surface-700/60">
        {loading && (
          <div className="absolute inset-0 bg-surface-900 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <i className="fas fa-globe text-3xl text-surface-600 animate-pulse" />
              <p className="text-xs text-surface-500">Loading VRChat Legends…</p>
            </div>
          </div>
        )}
        <webview
          ref={attachRef}
          src={SITE_URL}
          style={{ width: '100%', height: '100%', display: 'flex' }}
          allowpopups="true"
        />
      </div>
    </div>
  );
}
