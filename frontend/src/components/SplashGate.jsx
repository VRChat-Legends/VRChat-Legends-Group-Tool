import { useState, useEffect } from 'react';
import { api } from '../api/client';
import SplashScreen from './SplashScreen';
import SetupWizard from './SetupWizard';

function BootSpinner({ label }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden px-6 vrcl-app-bg bg-beams">
      <div className="pointer-events-none absolute inset-0 opacity-35" aria-hidden>
        <div className="absolute left-1/2 top-1/3 h-[min(90vw,400px)] w-[min(90vw,400px)] -translate-x-1/2 rounded-full bg-vrcl-purple/25 blur-[72px]" />
      </div>
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative">
          <img
            src="/assets/vrchat%20legends/vrchat_legends_logo_round.png"
            alt=""
            className="h-14 w-14 rounded-xl object-cover opacity-90 shadow-lg shadow-vrcl-purple/20 ring-2 ring-vrcl-purple/25"
          />
          <div
            className="pointer-events-none absolute -inset-1 animate-spin rounded-[12px] border-2 border-vrcl-purple/35 border-t-vrcl-purple"
            style={{ animationDuration: '1.2s' }}
            aria-hidden
          />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-surface-500">{label}</p>
      </div>
    </div>
  );
}

export default function SplashGate({ children }) {
  const [wizard, setWizard] = useState(null);
  const [splash, setSplash] = useState(null);

  const runSplashDecision = () => {
    if (sessionStorage.getItem('splash_seen')) {
      setSplash(false);
      return;
    }
    setSplash(null);
    api
      .settings()
      .then((s) => setSplash(!(s?.skip_startup_intro === true)))
      .catch(() => setSplash(true));
  };

  useEffect(() => {
    api
      .setupWizardStatus()
      .then((w) => {
        setWizard(w);
        if (w.done) runSplashDecision();
      })
      .catch(() => {
        setWizard({ done: true, data_dir: '' });
        runSplashDecision();
      });
  }, []);

  const onWizardComplete = () => {
    setWizard((prev) => ({
      ...(prev || {}),
      done: true,
      data_dir: prev?.data_dir ?? '',
    }));
    runSplashDecision();
  };

  if (wizard === null) {
    return <BootSpinner label="Preparing workspace" />;
  }

  if (!wizard.done) {
    return <SetupWizard dataDir={wizard.data_dir} onComplete={onWizardComplete} />;
  }

  if (splash === null) {
    return <BootSpinner label="Loading" />;
  }

  if (splash) {
    return <SplashScreen onComplete={() => setSplash(false)} skipIntro={false} />;
  }

  return children;
}
