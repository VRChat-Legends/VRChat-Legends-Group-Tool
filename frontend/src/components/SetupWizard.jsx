import { useState } from 'react';
import { api } from '../api/client';

const STEPS = [
  { key: 'welcome', title: 'Welcome' },
  { key: 'data', title: 'Your data' },
  { key: 'shortcut', title: 'Shortcut' },
  { key: 'done', title: 'Ready' },
];

export default function SetupWizard({ dataDir, onComplete }) {
  const [step, setStep] = useState(0);
  const [desktopShortcut, setDesktopShortcut] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const finish = async () => {
    setBusy(true);
    setErr('');
    try {
      await api.setupWizardComplete({ create_desktop_shortcut: desktopShortcut });
      onComplete();
    } catch (e) {
      setErr(e.message || 'Could not finish setup');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0a0a]/95 p-4 backdrop-blur-md">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
      >
        <div className="absolute top-1/4 left-1/2 h-[min(90vw,480px)] w-[min(90vw,480px)] -translate-x-1/2 rounded-full bg-vrcl-purple/30 blur-[90px]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-vrcl-pink/20 blur-[70px]" />
      </div>

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#111]/90 shadow-2xl shadow-vrcl-purple/20 backdrop-blur-xl">
        <div className="border-b border-white/5 bg-gradient-to-r from-vrcl-purple/15 via-transparent to-vrcl-pink/10 px-6 py-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex flex-1 items-center">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    i <= step
                      ? 'bg-gradient-to-br from-vrcl-purple to-vrcl-pink text-white shadow-lg shadow-vrcl-purple/30'
                      : 'border border-white/10 bg-white/5 text-gray-500'
                  }`}
                >
                  {i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 flex-1 rounded-full ${i < step ? 'bg-vrcl-purple/60' : 'bg-white/10'}`}
                  />
                )}
              </div>
            ))}
          </div>
          <h1 className="bg-gradient-to-r from-vrcl-purple-light to-vrcl-pink bg-clip-text text-xl font-black tracking-tight text-transparent">
            First-time setup
          </h1>
          <p className="mt-1 text-xs text-gray-500">{STEPS[step].title}</p>
        </div>

        <div className="px-6 py-6">
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-gray-300">
                You&apos;re running the <strong className="text-white">VRChat Legends Group Tool</strong> — a desktop
                companion for group invites, friends, and lobby tools.
              </p>
              <p className="text-sm leading-relaxed text-gray-400">
                This short wizard confirms where your data lives and can add a desktop shortcut. You can change
                shortcuts anytime from the installer or Settings.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-300">
                Settings, database, and logs are stored next to the app (installed copy) or in the project{' '}
                <code className="text-purple-300">data</code> folder in development:
              </p>
              <div className="rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[0.7rem] leading-relaxed text-gray-400 break-all">
                {dataDir || '—'}
              </div>
              <p className="text-xs text-gray-500">Back up this folder if you want to keep a copy of your data.</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-300">
                Add a shortcut on your Windows desktop that launches this app? (Uses your real Desktop folder,
                including OneDrive Desktop.)
              </p>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-vrcl-purple/30">
                <input
                  type="checkbox"
                  checked={desktopShortcut}
                  onChange={(e) => setDesktopShortcut(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-black/40 text-vrcl-purple focus:ring-vrcl-purple"
                />
                <span className="text-sm text-gray-200">Create desktop shortcut</span>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-300">
                You&apos;re all set. Open <strong className="text-white">Dashboard</strong> after this to see your
                lobby and invite tools.
              </p>
              <p className="text-xs text-gray-500">
                Docs and VRChat API notes are under <strong className="text-gray-400">Docs</strong> in the header.
              </p>
            </div>
          )}

          {err && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {err}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 bg-black/20 px-6 py-4">
          <button
            type="button"
            disabled={step === 0 || busy}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setStep((s) => s + 1)}
              className="rounded-lg bg-gradient-to-r from-vrcl-purple to-vrcl-pink px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-vrcl-purple/25 transition-all hover:brightness-110"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={finish}
              className="rounded-lg bg-gradient-to-r from-vrcl-purple to-vrcl-pink px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-vrcl-purple/25 transition-all hover:brightness-110 disabled:opacity-60"
            >
              {busy ? 'Finishing…' : 'Finish'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
