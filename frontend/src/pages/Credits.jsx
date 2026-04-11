import ClickSpark from '../components/ClickSpark';

const developers = [
  {
    name: 'Sketch494',
    role: 'Lead Developer',
    avatar: '/assets/icons/Sketch494_icon.jpg',
    links: [{ label: 'sketch494.online', href: 'https://sketch494.online/' }],
    badge: 'Lead',
    badgeColor: 'from-vrcl-purple to-vrcl-pink',
  },
  {
    name: 'BarricadeBandit',
    role: 'Developer',
    avatar: '/assets/icons/BarricadeBandit_Icon.jpg',
    links: [
      { label: 'hoppou.ai',     href: 'https://hoppou.ai/' },
      { label: 'barricade.dev', href: 'https://barricade.dev/' },
    ],
    badge: 'Dev',
    badgeColor: 'from-blue-500 to-cyan-500',
  },
];

const betaTesters = [
  { name: 'Beta Tester 1', links: [] },
  { name: 'Beta Tester 2', links: [] },
];

const techStack = [
  { name: 'Python',         icon: 'fab fa-python',     color: 'text-yellow-400',  subtitle: 'Backend runtime'    },
  { name: 'Flask',          icon: 'fas fa-flask',       color: 'text-green-400',   subtitle: 'REST API'           },
  { name: 'React',          icon: 'fab fa-react',       color: 'text-cyan-400',    subtitle: 'Frontend'           },
  { name: 'Vite',           icon: 'fas fa-bolt',        color: 'text-vrcl-purple', subtitle: 'Build tooling'      },
  { name: 'Tailwind CSS',   icon: 'fas fa-paint-roller',color: 'text-sky-400',     subtitle: 'Styling'            },
  { name: 'Electron',       icon: 'fas fa-atom',        color: 'text-blue-400',    subtitle: 'Desktop wrapper'    },
  { name: 'Recharts',       icon: 'fas fa-chart-area',  color: 'text-pink-400',    subtitle: 'Charts & graphs'    },
  { name: 'VRChat API',     icon: 'fas fa-cube',        color: 'text-vrcl-pink',   subtitle: 'vrchatapi SDK'      },
  { name: 'FontAwesome',    icon: 'fas fa-icons',       color: 'text-indigo-400',  subtitle: 'Icon library'       },
];

export default function Credits() {
  return (
    <div className="space-y-8 animate-in w-full">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-vrcl-purple to-vrcl-pink flex items-center justify-center shadow-lg shadow-vrcl-purple/30">
            <i className="fas fa-heart text-white text-sm" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Credits</h1>
        </div>
        <p className="text-surface-500 text-sm ml-12">People and tools that made this project possible</p>
      </div>

      {/* Developer cards */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Core team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {developers.map((dev) => (
            <div
              key={dev.name}
              className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 overflow-hidden group hover:border-white/[0.14] transition-all duration-300 hover:-translate-y-0.5"
            >
              {/* gradient glow */}
              <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${dev.badgeColor} opacity-[0.07] group-hover:opacity-[0.12] transition-opacity blur-xl`} />

              <div className="flex items-start gap-4 relative">
                <div className="relative flex-shrink-0">
                  <img
                    src={dev.avatar}
                    alt={dev.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/[0.08]"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <span className={`absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r ${dev.badgeColor} text-[0.55rem] font-bold text-white shadow-sm`}>
                    {dev.badge}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base text-white">{dev.name}</p>
                  <p className="text-xs text-gray-500 mb-3">{dev.role}</p>
                  <div className="flex flex-wrap gap-2">
                    {dev.links.map((link) => (
                      <ClickSpark key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/[0.06] text-gray-300 hover:text-white hover:bg-white/[0.1] text-[0.7rem] font-medium transition-all"
                        >
                          <i className="fas fa-arrow-up-right-from-square text-gray-600 text-[0.55rem]" />
                          {link.label}
                        </a>
                      </ClickSpark>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Beta testers */}
      {betaTesters.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Beta testers</h2>
          <div className="flex flex-wrap gap-2">
            {betaTesters.map((t) => (
              <div key={t.name} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-surface-300 font-medium">
                {t.name}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tech stack */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Built with</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {techStack.map((t) => (
            <div key={t.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
              <i className={`${t.icon} text-lg ${t.color} w-5 text-center flex-shrink-0`} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-surface-200 truncate">{t.name}</p>
                <p className="text-[0.62rem] text-gray-600 truncate">{t.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Studio footer */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-surface-200 mb-0.5">EcIipse Studios™</p>
          <p className="text-xs text-surface-500 leading-relaxed">
            Fan-made tool for the VRChat Legends community. Not affiliated with VRChat Inc.
            All data stays on your local machine.
          </p>
        </div>
        <a
          href="https://eciipsestudios.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-vrcl-purple/15 border border-vrcl-purple/25 text-vrcl-purple-light hover:bg-vrcl-purple/25 text-sm font-medium transition-all"
        >
          <i className="fas fa-globe text-xs" />
          Visit site
        </a>
      </div>
    </div>
  );
}
