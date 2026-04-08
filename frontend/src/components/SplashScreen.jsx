import { useState, useEffect } from 'react';
import { api } from '../api/client';

const INTRO_DURATION_MS = 2400;
const WELCOME_DURATION_MS = 1800;
const FADE_MS = 550;

const LOGO_URL = '/assets/vrchat%20legends/vrchat_legends_logo_round.png';

export default function SplashScreen({ onComplete, skipIntro }) {
  const [phase, setPhase] = useState('intro'); // intro | welcome | fade
  const [displayName, setDisplayName] = useState(null);

  useEffect(() => {
    if (skipIntro) {
      onComplete?.();
      return undefined;
    }
    let cancelled = false;
    (async () => {
      let name = null;
      try {
        const data = await api.status();
        name = data?.user?.display_name || null;
      } catch {
        name = null;
      }
      if (cancelled) return;
      setDisplayName(name);
      await new Promise((r) => setTimeout(r, INTRO_DURATION_MS));
      if (cancelled) return;
      if (name) setPhase('welcome');
      else setPhase('fade');
    })();
    return () => {
      cancelled = true;
    };
  }, [skipIntro, onComplete]);

  useEffect(() => {
    if (phase !== 'welcome') return undefined;
    const t = setTimeout(() => setPhase('fade'), WELCOME_DURATION_MS);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'fade') return undefined;
    const t = setTimeout(() => {
      sessionStorage.setItem('splash_seen', '1');
      onComplete?.();
    }, FADE_MS);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  if (skipIntro) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center vrcl-app-bg bg-beams transition-opacity duration-[550ms] ease-out ${
        phase === 'fade' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[min(100vw,480px)] h-[min(100vw,480px)] rounded-full bg-vrcl-purple/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-vrcl-pink/10 blur-[80px]" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full border border-vrcl-purple/15 rounded-full animate-[spin_28s_linear_infinite]" />
        <div className="absolute top-1/3 right-1/3 w-32 h-32 border border-vrcl-pink/10 rounded-full animate-[spin_22s_linear_infinite_reverse]" />
      </div>

      {phase === 'intro' && (
        <div className="relative flex flex-col items-center justify-center gap-8 px-6">
          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-vrcl-purple/30 via-transparent to-vrcl-pink/20 blur-xl opacity-80" />
            <img
              src={LOGO_URL}
              alt=""
              className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover shadow-2xl shadow-vrcl-purple/40 ring-2 ring-white/10"
            />
          </div>
          <div className="text-center space-y-2">
            <h1 className="bg-gradient-to-r from-vrcl-purple-light via-white to-vrcl-pink bg-clip-text text-2xl sm:text-3xl font-black tracking-tight text-transparent drop-shadow-sm">
              VRChat Legends
            </h1>
            <p className="text-sm font-semibold text-surface-400 tracking-wide uppercase">Group Tool</p>
            <p className="text-xs text-surface-500 font-medium">EcIipse Studios™</p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-vrcl-purple/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {phase === 'welcome' && displayName && (
        <div className="relative flex flex-col items-center gap-5 px-6 text-center animate-in">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-vrcl-purple to-transparent" />
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-surface-500">Welcome back</p>
          <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-vrcl-purple-light bg-clip-text text-transparent">
            {displayName}
          </p>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-vrcl-pink to-transparent" />
        </div>
      )}
    </div>
  );
}
