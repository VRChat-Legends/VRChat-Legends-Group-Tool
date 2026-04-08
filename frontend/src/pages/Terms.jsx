import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto animate-in py-2">
      <h1 className="text-2xl font-bold text-surface-100 mb-2">Terms of Service</h1>
      <p className="text-surface-500 text-sm mb-8">VRChat Legends Group Tool (local application)</p>

      <div className="space-y-6 text-surface-300 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-surface-100 mb-2">Agreement</h2>
          <p>
            By installing or using this software, you agree to these terms. If you do not agree, do not use the application.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-surface-100 mb-2">No warranty</h2>
          <p>
            The software is provided &quot;as is&quot;, without warranty of any kind. Use at your own risk. The authors and distributors are not liable for lost data, account restrictions, downtime, or damages arising from use or inability to use the software, to the maximum extent permitted by law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-surface-100 mb-2">VRChat and platform rules</h2>
          <p>
            You are solely responsible for complying with{' '}
            <a href="https://hello.vrchat.com/legal" className="text-brand-400 hover:underline" target="_blank" rel="noopener noreferrer">
              VRChat&apos;s Terms of Service
            </a>{' '}
            and Community Guidelines. Automated invites, friend actions, and similar features must be used in a way that respects rate limits, other users, and platform rules. Account actions taken by VRChat are between you and VRChat.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-surface-100 mb-2">Acceptable use</h2>
          <p>You agree not to use the tool to harass users, evade enforcement, scrape at abusive rates, or violate applicable law. You are responsible for API keys, webhooks, and content you configure.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-surface-100 mb-2">Third-party services</h2>
          <p>
            Features that call VRChat, Discord, OpenAI, or other services are also governed by those providers&apos; terms. This app is not endorsed by VRChat Inc.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-surface-100 mb-2">License</h2>
          <p>
            Source or binary distribution may be under the MIT License or another license shipped with the project; see the repository or package for the exact license text.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-surface-100 mb-2">Changes</h2>
          <p>These terms may be updated in future releases. Continued use after an update constitutes acceptance of the revised terms.</p>
        </section>
      </div>

      <p className="mt-8">
        <Link to="/privacy" className="text-brand-400 hover:underline text-sm font-medium mr-4">
          Privacy Policy
        </Link>
        <Link to="/dashboard" className="text-brand-400 hover:underline text-sm font-medium">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}
