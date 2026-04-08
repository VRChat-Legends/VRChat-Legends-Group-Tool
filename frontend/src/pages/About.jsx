import { Link } from 'react-router-dom';

const features = [
  { icon: 'fa-gauge-high',     color: 'text-vrcl-purple-light', label: 'Dashboard',     desc: 'Live lobby, queue, uptime stats, and quick actions in one view.' },
  { icon: 'fa-users',          color: 'text-cyan-400',          label: 'People',         desc: 'Friends list, lobby roster, and blocked-user management.' },
  { icon: 'fa-chart-line',     color: 'text-emerald-400',       label: 'Activity',       desc: 'Moderation log, invite history, and analytics.' },
  { icon: 'fa-plug',           color: 'text-vrcl-pink',         label: 'Integrations',   desc: 'Discord bot, OpenAI assistant, and OSC chatbox.' },
  { icon: 'fa-shield-halved',  color: 'text-amber-400',         label: 'Moderation',     desc: 'Block, kick, and manage members with confirmation prompts.' },
  { icon: 'fa-atom',           color: 'text-blue-400',          label: 'Desktop-native', desc: 'Runs in Electron for a proper PC app experience.' },
];

export default function About() {
  return (
    <div className="space-y-6 animate-in max-w-3xl">
      {/* Hero */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-vrcl-purple/10 via-transparent to-vrcl-pink/5 p-6 overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-vrcl-purple/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <img
              src="/assets/branding/group_tool_icon.png"
              alt="VRChat Legends"
              className="w-12 h-12 rounded-xl object-cover shadow-lg shadow-vrcl-purple/30 ring-1 ring-white/10"
            />
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">VRChat Legends Group Tool</h1>
              <p className="text-xs text-gray-500">by EcIipse Studios™</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            A desktop companion for the VRChat Legends community — lobby-aware group invites, friend management,
            moderation tools, OSC chatbox, and optional Discord &amp; AI integrations.
            Everything runs locally; your credentials and data stay on your machine.
          </p>
        </div>
      </div>

      {/* Feature grid */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">What's included</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f) => (
            <div key={f.label} className="flex gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
              <div className={`w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0 ${f.color}`}>
                <i className={`fas ${f.icon} text-sm`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-200 mb-0.5">{f.label}</p>
                <p className="text-[0.7rem] text-gray-600 leading-snug">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy note */}
      <div className="flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
        <i className="fas fa-lock mt-0.5 text-emerald-400 text-sm flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-300 mb-0.5">Local-only data</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            No telemetry, no cloud sync. Everything is stored locally on your PC.
            Third-party integrations only send data to the services you explicitly configure.
          </p>
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Link to="/docs" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.09] transition-all">
          <i className="fas fa-book text-xs text-gray-500" />
          Documentation
        </Link>
        <Link to="/info?tab=credits" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.09] transition-all">
          <i className="fas fa-heart text-xs text-gray-500" />
          Credits
        </Link>
        <a href="https://vrchatlegends.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.09] transition-all">
          <i className="fas fa-arrow-up-right-from-square text-xs text-gray-500" />
          VRChat Legends site
        </a>
      </div>

      <p className="text-[0.65rem] text-gray-700">
        EcIipse Studios™ — not affiliated with VRChat Inc. Use responsibly and within VRChat ToS.
      </p>
    </div>
  );
}
