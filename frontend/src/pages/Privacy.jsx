import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto animate-in py-2">
      <h1 className="text-2xl font-bold text-surface-100 mb-2">Privacy Policy</h1>
      <p className="text-surface-500 text-sm mb-8">VRChat Legends Group Tool (local application)</p>

      <div className="space-y-6 text-surface-300 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-surface-100 mb-2">Local-first software</h2>
          <p>
            This application is designed to run on your computer. Settings, logs, caches, and databases are stored on your device under the app&apos;s install or data folder unless you choose to export or back them up.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-surface-100 mb-2">What we do not collect</h2>
          <p className="text-emerald-400/90 font-medium mb-2">We do not operate a central service for this app and do not receive your VRChat credentials, friend lists, or chat content from the application by default.</p>
          <p>
            The developers of this distribution do not receive telemetry from the app solely because you installed it. Any future optional telemetry would be disclosed at the time it is added and, where required, behind explicit consent.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-surface-100 mb-2">Third parties you may use</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-surface-200">VRChat</strong> — When you log in, the app uses VRChat&apos;s official APIs as you direct it (invites, friends, profile, etc.), subject to{' '}
              <a href="https://hello.vrchat.com/legal" className="text-brand-400 hover:underline" target="_blank" rel="noopener noreferrer">
                VRChat&apos;s policies
              </a>
              .
            </li>
            <li>
              <strong className="text-surface-200">Discord</strong> — If you configure a webhook, messages you choose to send go to Discord under your control.
            </li>
            <li>
              <strong className="text-surface-200">OpenAI</strong> — If you enable the AI assistant and provide an API key, prompts you send are processed by OpenAI per your account and their terms.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-surface-100 mb-2">Your responsibilities</h2>
          <p>
            Protect your device, OS account, and any exported backups. Do not share auth cookies, API keys, or exports that contain sensitive data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-surface-100 mb-2">Contact</h2>
          <p>
            For privacy questions about this software distribution, contact the publisher or maintainer listed with your copy of the app (e.g. project or community links in the app or installer).
          </p>
        </section>

        <p className="text-surface-500 text-xs pt-4 border-t border-surface-700">
          This policy describes the intended behavior of the open/local app. If you use a modified or repackaged build, review that publisher&apos;s terms separately.
        </p>
      </div>

      <p className="mt-8">
        <Link to="/dashboard" className="text-brand-400 hover:underline text-sm font-medium">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}
