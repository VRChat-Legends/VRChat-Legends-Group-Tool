import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-in w-full">
      <p className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-vrcl-purple-light to-vrcl-pink mb-2 select-none" aria-hidden>
        404
      </p>
      <h1 className="text-xl font-bold text-surface-100 mb-2">Page not found</h1>
      <p className="text-surface-400 text-sm max-w-md mb-8">
        That route does not exist in this app. Check the address or use the navigation bar.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/20"
        >
          Dashboard
        </Link>
        <Link to="/docs" className="px-5 py-2.5 rounded-xl bg-surface-800 border border-surface-600 text-surface-200 text-sm font-medium hover:bg-surface-700 transition-colors">
          Documentation
        </Link>
      </div>
    </div>
  );
}
