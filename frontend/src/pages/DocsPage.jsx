import { useState, useEffect, useCallback } from 'react';
import { NavLink, Link } from 'react-router-dom';

const CHAPTERS = [
  { id: 'intro', num: '01', icon: 'fa-book-open', title: 'Introduction' },
  { id: 'dashboard', num: '02', icon: 'fa-gauge-high', title: 'Dashboard' },
  { id: 'people', num: '03', icon: 'fa-users', title: 'People & group' },
  { id: 'activity', num: '04', icon: 'fa-chart-line', title: 'Activity' },
  { id: 'settings', num: '05', icon: 'fa-gear', title: 'Settings' },
  { id: 'integrations', num: '06', icon: 'fa-plug', title: 'Integrations' },
  { id: 'usage', num: '07', icon: 'fa-list-check', title: 'How to use' },
  { id: 'vrchat_api', num: '08', icon: 'fa-code', title: 'VRChat API' },
  { id: 'app_api', num: '09', icon: 'fa-server', title: 'App API (local)' },
  { id: 'trust', num: '10', icon: 'fa-shield-halved', title: 'Trust rank' },
  { id: 'emergency', num: '11', icon: 'fa-triangle-exclamation', title: 'Emergency stop' },
  { id: 'license', num: '12', icon: 'fa-scale-balanced', title: 'License' },
  { id: 'credits', num: '13', icon: 'fa-heart', title: 'Credits' },
];

function sectionIds() {
  return CHAPTERS.map((c) => c.id);
}

function SectionTitle({ id, num, icon, children }) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-white/5 pb-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-vrcl-purple/20 to-vrcl-pink/20 text-sm text-vrcl-purple">
        <i className={`fas ${icon}`} />
      </span>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-xs text-vrcl-purple/40">{num}</span>
        <h2 id={id} className="scroll-mt-28 text-lg font-bold text-white">
          {children}
        </h2>
      </div>
    </div>
  );
}

function InfoBox({ icon = 'fa-circle-info', color = 'purple', children }) {
  const colors = {
    purple: 'border-vrcl-purple/20 bg-vrcl-purple/10 text-vrcl-purple',
    green: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
    red: 'border-red-500/20 bg-red-500/10 text-red-400',
  };
  return (
    <div className={`mb-4 flex gap-3 rounded-xl border p-4 ${colors[color]}`}>
      <i className={`fas ${icon} mt-0.5 shrink-0 text-sm`} />
      <div className="text-sm leading-relaxed text-gray-300">{children}</div>
    </div>
  );
}

function Endpoint({ method, path, desc, auth }) {
  const mc = {
    GET: 'bg-emerald-500/15 text-emerald-400',
    POST: 'bg-blue-500/15 text-blue-400',
    PATCH: 'bg-amber-500/15 text-amber-400',
    DELETE: 'bg-red-500/15 text-red-400',
  };
  return (
    <div className="flex flex-wrap items-start gap-3 border-b border-white/5 py-3 last:border-0">
      <span className={`shrink-0 rounded px-2 py-0.5 font-mono text-[0.65rem] font-bold uppercase ${mc[method]}`}>
        {method}
      </span>
      <code className="font-mono text-sm text-gray-200">{path}</code>
      {auth && (
        <span className="rounded bg-vrcl-purple/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase text-vrcl-purple">
          Session
        </span>
      )}
      <span className="w-full text-xs text-gray-500 md:ml-auto md:w-auto md:pl-0">{desc}</span>
    </div>
  );
}

export default function DocsPage() {
  const [activeChapter, setActiveChapter] = useState('intro');

  const scrollToSection = useCallback((id) => {
    setActiveChapter(id);
    const el = document.getElementById(`doc-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    const ids = sectionIds();
    const elements = ids.map((id) => document.getElementById(`doc-${id}`)).filter(Boolean);
    if (elements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id?.startsWith('doc-')) {
          setActiveChapter(visible[0].target.id.slice(4));
        }
      },
      { root: null, rootMargin: '-15% 0px -50% 0px', threshold: [0, 0.1, 0.25, 0.5] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mx-auto max-w-7xl animate-in px-4 py-8 md:py-12 lg:px-8">
      <div className="mb-10 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-vrcl-purple/20 via-vrcl-dark to-vrcl-pink/15 p-6 shadow-lg shadow-vrcl-purple/10 md:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-vrcl-purple to-vrcl-pink text-lg text-white shadow-lg shadow-vrcl-purple/30">
            <i className="fas fa-book-open" />
          </span>
          <div>
            <h1 className="bg-gradient-to-r from-vrcl-purple-light to-vrcl-pink bg-clip-text pb-1 text-3xl font-black leading-tight text-transparent">
              Group Tool Docs
            </h1>
            <p className="text-sm text-gray-400">
              Handbook for the VRChat Legends Group Tool — invites, friends, lobby tools, and integrations.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="shrink-0 lg:w-56">
          <nav className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 lg:sticky lg:top-24">
            <p className="mb-2 px-2 text-[0.6rem] font-bold uppercase tracking-widest text-gray-600">Chapters</p>
            <div className="max-h-[50vh] space-y-0.5 overflow-y-auto lg:max-h-[calc(100vh-8rem)]">
              {CHAPTERS.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => scrollToSection(ch.id)}
                  className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-all ${
                    activeChapter === ch.id
                      ? 'bg-vrcl-purple/15 text-white'
                      : 'text-gray-500 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <i
                    className={`fas ${ch.icon} w-3.5 shrink-0 text-center text-[0.6rem] ${
                      activeChapter === ch.id ? 'text-vrcl-purple' : 'text-gray-600 group-hover:text-gray-400'
                    }`}
                  />
                  <span className="font-mono text-[0.55rem] text-vrcl-purple/40">{ch.num}</span>
                  {ch.title}
                </button>
              ))}
            </div>
          </nav>
        </aside>

        <div className="min-w-0 flex-1 space-y-10">
          <div className="lg:hidden">
            <label htmlFor="docs-jump" className="sr-only">
              Jump to section
            </label>
            <select
              id="docs-jump"
              value={activeChapter}
              onChange={(e) => scrollToSection(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-gray-200"
            >
              {CHAPTERS.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.num} — {ch.title}
                </option>
              ))}
            </select>
          </div>

          <section id="doc-intro" className="glass-card p-6">
            <SectionTitle id="intro" num="01" icon="fa-book-open">
              Introduction
            </SectionTitle>
            <p className="mb-4 text-sm leading-relaxed text-gray-300">
              The <strong className="text-white">VRChat Legends Group Tool</strong> is a Windows desktop companion that
              reads your VRChat log to understand your current lobby, manage friends and blocks, and send group invites
              within VRChat&apos;s rate limits. It is built by EcIipse Studios™ for the VRChat Legends community.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: 'fa-gauge-high', label: 'Dashboard', desc: 'Lobby, auto-invite, quick actions' },
                { icon: 'fa-users', label: 'People', desc: 'Friends, lobby, group, blocked' },
                { icon: 'fa-plug', label: 'Integrations', desc: 'Discord, AI, OSC chatbox' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <i className={`fas ${item.icon} mb-2 text-xl text-vrcl-purple`} />
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="doc-dashboard" className="glass-card p-6">
            <SectionTitle id="dashboard" num="02" icon="fa-gauge-high">
              Dashboard
            </SectionTitle>
            <p className="text-sm leading-relaxed text-gray-300">
              Your hub for trust rank, bio, world presence, and who is in your lobby. Enable <strong className="text-white">Auto-invite</strong> to queue group invites when users join, use <strong className="text-white">Invite lobby</strong> or <strong className="text-white">Friend lobby</strong> for one-shot actions, and <strong className="text-white">Invite to event</strong> when an event ID is configured in Settings.
            </p>
          </section>

          <section id="doc-people" className="glass-card p-6">
            <SectionTitle id="people" num="03" icon="fa-users">
              People &amp; group
            </SectionTitle>
            <p className="mb-4 text-sm leading-relaxed text-gray-300">
              The People page merges <strong className="text-white">Friends</strong>, <strong className="text-white">Lobby</strong>, and <strong className="text-white">Blocked</strong> users. Open a user card to invite to your configured group, manage friends, or block. Group membership and counts come from the VRChat API when API calls are enabled in Settings.
            </p>
          </section>

          <section id="doc-activity" className="glass-card p-6">
            <SectionTitle id="activity" num="04" icon="fa-chart-line">
              Activity
            </SectionTitle>
            <p className="text-sm leading-relaxed text-gray-300">
              <strong className="text-white">Activity</strong> streams lobby-related log lines, invites, and errors.{' '}
              <strong className="text-white">Analytics</strong> summarizes invites, friend accepts, and cooldown skips over time.
            </p>
          </section>

          <section id="doc-settings" className="glass-card p-6">
            <SectionTitle id="settings" num="05" icon="fa-gear">
              Settings
            </SectionTitle>
            <ul className="list-disc space-y-2 pl-5 text-sm text-gray-300">
              <li>
                <strong className="text-white">VRChat API</strong> — Master switch; when off, no VRChat API calls are made.
              </li>
              <li>
                <strong className="text-white">Group ID</strong> — Target group for invites.
              </li>
              <li>
                <strong className="text-white">Event ID</strong> — Optional calendar event for lobby event invites.
              </li>
              <li>
                <strong className="text-white">OSC / maintenance / account</strong> — Chatbox endpoint, log clears, emergency stop, logout.
              </li>
              <li>
                <strong className="text-white">Uninstall</strong> — Opens the Windows uninstaller (installed build) or erases local data only; see in-app labels.
              </li>
            </ul>
          </section>

          <section id="doc-integrations" className="glass-card p-6">
            <SectionTitle id="integrations" num="06" icon="fa-plug">
              Integrations
            </SectionTitle>
            <p className="mb-3 text-sm leading-relaxed text-gray-300">
              <strong className="text-white">Discord</strong> webhooks can announce joins, leaves, and moderation actions.{' '}
              <strong className="text-white">AI</strong> uses your OpenAI key and configurable system prompts.{' '}
              <strong className="text-white">OSC chatbox</strong> sends tagged lines to VRChat (see tags like{' '}
              <code className="rounded bg-white/10 px-1 font-mono text-xs text-purple-300">{'{username}'}</code>,{' '}
              <code className="rounded bg-white/10 px-1 font-mono text-xs text-purple-300">{'{lobby_count}'}</code>
              ).
            </p>
          </section>

          <section id="doc-usage" className="glass-card p-6">
            <SectionTitle id="usage" num="07" icon="fa-list-check">
              How to use
            </SectionTitle>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-300">
              <li>Sign in with VRChat so the tool can use the API (session stored locally).</li>
              <li>
                Set your <strong className="text-white">Group ID</strong> in{' '}
                <NavLink to="/settings" className="text-vrcl-purple-light hover:underline">
                  Settings
                </NavLink>
                .
              </li>
              <li>Join a world in VRChat so the log reflects your instance and lobby.</li>
              <li>Use Dashboard auto-invite or manual invite actions as needed.</li>
              <li>Use People for per-user actions; Activity for logs and metrics.</li>
            </ol>
          </section>

          <section id="doc-vrchat_api" className="glass-card p-6">
            <SectionTitle id="vrchat_api" num="08" icon="fa-code">
              VRChat API (community reference)
            </SectionTitle>
            <p className="mb-4 text-sm leading-relaxed text-gray-300">
              VRChat does not publish an official public REST spec for third-party tools. Community-maintained documentation
              at{' '}
              <a
                href="https://vrchat.community/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-vrcl-purple-light hover:underline"
              >
                vrchat.community
              </a>{' '}
              describes endpoints, auth cookies, user models (including <code className="text-purple-300">tags</code> and trust-related values), groups, instances, and rate-limit expectations. This app uses the supported Python client patterns; respect VRChat&apos;s Terms of Service and avoid aggressive polling.
            </p>
            <InfoBox icon="fa-triangle-exclamation" color="amber">
              Automations can fail if VRChat changes APIs or if your account hits limits. Keep <strong className="text-white">VRChat API enabled</strong> in Settings only when you need live data, and use <strong className="text-white">Safe mode</strong> to disable auto-invite when debugging.
            </InfoBox>
          </section>

          <section id="doc-app_api" className="glass-card p-6">
            <SectionTitle id="app_api" num="09" icon="fa-server">
              Local app API
            </SectionTitle>
            <p className="mb-4 text-sm text-gray-400">
              The embedded UI talks to Flask on localhost. Examples (session cookie required except setup):
            </p>
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <Endpoint method="GET" path="/api/status" desc="Current user, lobby snapshot, flags" auth />
              <Endpoint method="GET" path="/api/friends" desc="Cached friends list" auth />
              <Endpoint method="POST" path="/api/invite-lobby" desc="Invite lobby to configured group" auth />
              <Endpoint method="POST" path="/api/auto-invite" desc="Toggle auto-invite" auth />
              <Endpoint method="GET" path="/api/setup-wizard" desc="First-run wizard state" />
              <Endpoint method="POST" path="/api/setup-wizard" desc="Complete wizard; optional desktop shortcut" />
              <Endpoint method="POST" path="/api/launch-uninstaller" desc="Start Inno uninstaller (frozen build)" auth />
            </div>
          </section>

          <section id="doc-trust" className="glass-card p-6">
            <SectionTitle id="trust" num="10" icon="fa-shield-halved">
              Trust rank
            </SectionTitle>
            <p className="text-sm leading-relaxed text-gray-300">
              Trust labels are derived from VRChat <code className="text-purple-300">tags</code> (for example{' '}
              <code className="text-purple-300">system_trust_known</code>) as described on{' '}
              <a href="https://vrchat.community/" className="text-vrcl-purple-light hover:underline" target="_blank" rel="noopener noreferrer">
                vrchat.community
              </a>
              . The app maps them to Visitor, New User, User, Known User, Trusted User, and VRChat Legend-style labels for display.
            </p>
          </section>

          <section id="doc-emergency" className="glass-card p-6">
            <SectionTitle id="emergency" num="11" icon="fa-triangle-exclamation">
              Emergency stop
            </SectionTitle>
            <p className="text-sm leading-relaxed text-gray-300">
              From{' '}
              <NavLink to="/settings" className="text-vrcl-purple-light hover:underline">
                Settings
              </NavLink>{' '}
              use <strong className="text-white">Emergency stop</strong> to halt background work. Restart the app if behavior seems stuck.
            </p>
          </section>

          <section id="doc-license" className="glass-card p-6">
            <SectionTitle id="license" num="12" icon="fa-scale-balanced">
              License
            </SectionTitle>
            <p className="text-sm leading-relaxed text-gray-300">
              Provided under the <strong className="text-white">MIT License</strong> unless otherwise noted in the repository. App Terms and Privacy:{' '}
              <Link to="/terms" className="text-vrcl-purple-light hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-vrcl-purple-light hover:underline">
                Privacy
              </Link>
              .
            </p>
          </section>

          <section id="doc-credits" className="glass-card p-6">
            <SectionTitle id="credits" num="13" icon="fa-heart">
              Credits
            </SectionTitle>
            <p className="text-sm text-gray-300">
              <Link to="/info" className="text-vrcl-purple-light hover:underline">
                Open Info
              </Link>{' '}
              for credits, testers, and links.
            </p>
          </section>

          <footer className="border-t border-white/10 pt-8 text-center text-sm text-gray-500">
            EcIipse Studios™ ·{' '}
            <a href="https://eciipsestudios.com/" target="_blank" rel="noopener noreferrer" className="text-vrcl-purple-light hover:underline">
              eciipsestudios.com
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}
