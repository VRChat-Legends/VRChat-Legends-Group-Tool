import { Link } from 'react-router-dom';

const SITE_URL = 'https://vrchatlegends.com';
const DISCORD_URL = 'https://discord.com/invite/6xPkZ7Dxp9';
const SHOP_URL = 'https://vrchatlegends.com/shop';
const BLUESKY_URL = 'https://bsky.app/profile/vrchatlegends.com';
const PATREON_URL = 'https://www.patreon.com/cw/VRChatLegends';
const ECLIPSE_URL = 'https://eciipsestudios.com/';

const quickLinks = [
  { label: 'Dashboard', path: '/dashboard', icon: 'fas fa-gauge-high' },
  { label: 'People', path: '/people', icon: 'fas fa-users' },
  { label: 'Activity', path: '/moderation', icon: 'fas fa-chart-line' },
  { label: 'Integrations', path: '/integrations', icon: 'fas fa-plug' },
  { label: 'Docs', path: '/docs', icon: 'fas fa-book' },
  { label: 'VRChat Legends (site)', href: SITE_URL, external: true, icon: 'fas fa-globe' },
  { label: 'Store', href: SHOP_URL, external: true, icon: 'fas fa-store' },
  { label: 'EcIipse Studios™', href: ECLIPSE_URL, external: true, icon: 'fas fa-building' },
];

const legalLinks = [
  { label: 'Privacy (app)', path: '/privacy' },
  { label: 'Terms (app)', path: '/terms' },
  { label: 'vrchatlegends.com privacy', href: `${SITE_URL}/privacy`, external: true },
];

function linkKey(link) {
  return link.path || link.href || link.label;
}

function isExternal(link) {
  return Boolean(link.external || (link.href && /^https?:\/\//i.test(link.href)));
}

export default function Footer() {
  const year = new Date().getFullYear();
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="relative mt-auto flex-shrink-0">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-vrcl-purple to-transparent" />

      <div className="bg-gradient-to-r from-vrcl-purple/10 via-vrcl-pink/5 to-vrcl-purple/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 sm:px-6 md:flex-row">
          <div>
            <h3 className="text-sm font-bold text-white">Join the VRChat Legends Community</h3>
            <p className="text-xs text-gray-400">
              Connect with players, share stories, and get help with the Group Tool.
            </p>
          </div>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-vrcl-purple to-vrcl-pink px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-vrcl-purple/25 transition-all hover:shadow-vrcl-purple/40 hover:brightness-110"
          >
            <i className="fab fa-discord" aria-hidden />
            Join Discord
          </a>
        </div>
      </div>

      <div className="bg-vrcl-darker">
        <div className="mx-auto max-w-none px-4 py-8 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-3">
              <div className="mb-3 flex items-center gap-2">
                <img
                  src="/assets/vrchat%20legends/vrchat_legends_logo_round.png"
                  alt="VRChat Legends"
                  className="h-8 w-8 rounded-lg object-cover shadow-lg shadow-vrcl-purple/30"
                />
                <span className="text-sm font-bold text-white">VRChat Legends</span>
              </div>
              <p className="mb-2 text-xs font-semibold text-vrcl-purple-light/90">Group Tool</p>
              <p className="mb-4 text-xs leading-relaxed text-gray-500">
                EcIipse Studios™ — desktop companion for group invites, friends, and lobby workflows. Not affiliated
                with VRChat Inc.
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Discord"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-all hover:border-vrcl-purple/40 hover:bg-vrcl-purple/15 hover:text-white"
                >
                  <i className="fab fa-discord text-base" />
                </a>
                <a
                  href={BLUESKY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Bluesky"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sky-400/90 transition-all hover:border-sky-400/40 hover:bg-sky-400/10 hover:text-sky-300"
                >
                  <i className="fab fa-bluesky text-base" />
                </a>
                <a
                  href={PATREON_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Patreon"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-amber-400/90 transition-all hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-300"
                >
                  <span className="text-sm font-bold">P</span>
                </a>
              </div>
            </div>

            <div className="md:col-span-3">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-purple-400">Explore</h3>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {quickLinks.map((link) => (
                  <li key={linkKey(link)}>
                    {isExternal(link) ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 text-xs text-gray-500 transition-colors hover:text-white"
                      >
                        <i
                          className={`${link.icon} w-3 shrink-0 text-center text-[0.55rem] text-gray-600 transition-colors group-hover:text-purple-400`}
                        />
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.path}
                        className="group inline-flex items-center gap-2 text-xs text-gray-500 transition-colors hover:text-white"
                      >
                        <i
                          className={`${link.icon} w-3 shrink-0 text-center text-[0.55rem] text-gray-600 transition-colors group-hover:text-purple-400`}
                        />
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-3">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-purple-400">Get in Touch</h3>
              <ul className="space-y-1.5">
                <li>
                  <a
                    href="mailto:business@vrchatlegends.com"
                    className="group inline-flex items-center gap-2 text-xs text-gray-500 transition-colors hover:text-white"
                  >
                    <i className="fas fa-briefcase w-3 shrink-0 text-center text-[0.55rem] text-gray-600 transition-colors group-hover:text-purple-400" />
                    <span className="truncate">business@vrchatlegends.com</span>
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@vrchatlegends.com"
                    className="group inline-flex items-center gap-2 text-xs text-gray-500 transition-colors hover:text-white"
                  >
                    <i className="fas fa-life-ring w-3 shrink-0 text-center text-[0.55rem] text-gray-600 transition-colors group-hover:text-purple-400" />
                    <span className="truncate">support@vrchatlegends.com</span>
                  </a>
                </li>
              </ul>
              <p className="mt-3 text-[0.65rem] leading-relaxed text-gray-600">
                API reference:{' '}
                <a
                  href="https://vrchat.community/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-vrcl-purple-light hover:underline"
                >
                  vrchat.community
                </a>
              </p>
            </div>

            <div className="md:col-span-3">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-purple-400">Legal</h3>
              <ul className="mb-4 space-y-1.5">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs text-gray-500 transition-colors hover:text-white"
                      >
                        <i className="fas fa-file-alt w-3 text-center text-[0.55rem] text-gray-600" />
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.path}
                        className="inline-flex items-center gap-2 text-xs text-gray-500 transition-colors hover:text-white"
                      >
                        <i className="fas fa-file-alt w-3 text-center text-[0.55rem] text-gray-600" />
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={scrollToTop}
                className="group inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[0.65rem] text-gray-500 transition-all hover:border-vrcl-purple/30 hover:bg-vrcl-purple/10 hover:text-white"
              >
                <i className="fas fa-arrow-up text-[0.55rem] transition-transform group-hover:-translate-y-0.5" />
                Back to Top
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5">
          <div className="mx-auto flex max-w-none flex-col items-center gap-1 px-4 py-3 sm:px-6 md:flex-row md:justify-between lg:px-8 xl:px-12 2xl:px-16">
            <p className="text-center text-[0.65rem] text-gray-600 md:text-left">
              © {year} VRChat Legends · EcIipse Studios™ · Group Tool
            </p>
            <p className="text-center text-[0.65rem] text-gray-600 md:text-right">
              Inspired by VRChat. Not affiliated with VRChat Inc.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
