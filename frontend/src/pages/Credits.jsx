import Card from '../components/Card';
import ClickSpark from '../components/ClickSpark';

const developers = [
  {
    name: 'Sketch494',
    role: 'Lead Developer',
    avatar: '/assets/icons/Sketch494_icon.jpg',
    links: [{ label: 'sketch494.online', href: 'https://sketch494.online/' }],
  },
  {
    name: 'BarricadeBandit',
    role: 'Developer',
    avatar: '/assets/icons/BarricadeBandit_Icon.jpg',
    links: [
      { label: 'hoppou.ai', href: 'https://hoppou.ai/' },
      { label: 'barricade.dev', href: 'https://barricade.dev/' },
    ],
  },
];

const betaTesters = [
  { name: 'Beta Tester 1', links: [] },
  { name: 'Beta Tester 2', links: [] },
];

export default function Credits() {
  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-100 mb-1">Credits</h1>
        <p className="text-surface-500 text-sm">People who made this tool possible</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {developers.map((dev) => (
          <div key={dev.name} className="profile-card p-6 card-hover">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="relative flex-shrink-0">
                <img
                  src={dev.avatar}
                  alt=""
                  className="profile-card-avatar w-24 h-24 rounded-2xl object-cover ring-2 ring-brand-500/40"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-500 border-2 border-surface-900 shadow-lg" title="Contributor" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="font-semibold text-lg text-surface-100">{dev.name}</p>
                <p className="text-sm text-brand-400 font-medium">{dev.role}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  {dev.links.map((link) => (
                    <ClickSpark key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-3 py-1.5 rounded-lg bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 text-sm font-medium transition-colors border border-brand-500/30"
                      >
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

      {betaTesters.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-surface-200 mb-3">Beta testers</h2>
          <p className="text-surface-500 text-sm mb-4">Thanks to everyone who helped test the tool.</p>
          <div className="flex flex-wrap gap-3">
            {betaTesters.map((tester) => (
              <div key={tester.name} className="profile-card px-4 py-3 rounded-xl card-hover border border-surface-700 bg-surface-800/50">
                <p className="font-medium text-surface-200">{tester.name}</p>
                {tester.links?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tester.links.map((link) => (
                      <ClickSpark key={link.href}>
                        <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-400 hover:underline">
                          {link.label}
                        </a>
                      </ClickSpark>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Card title="About this tool" className="star-border">
        <p className="text-surface-400 text-sm leading-relaxed">
          EcIipse Studios™ tools are built for the VRChat community. Stack: Python, Flask, React, VRChat API.
          {' '}
          <a href="https://vrchat.community/" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">VRChat API docs</a>.
        </p>
      </Card>
      <Card title="Disclaimer" className="star-border">
        <p className="text-surface-400 text-sm leading-relaxed">
          Fan-made tool, not affiliated with VRChat. We are not responsible for account actions or bans.
        </p>
      </Card>
      <footer className="text-center text-sm text-surface-500 pt-8">
        Made by <a href="https://eciipsestudios.com/" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">EcIipse Studios™</a>
      </footer>
    </div>
  );
}
