import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="prose prose-invert prose-sm max-w-none animate-in">
      <h1 className="text-2xl font-bold text-surface-100 mb-3">VRChat Legends Group Tool</h1>
      <p className="text-surface-300 leading-relaxed mb-6">
        A desktop companion for VRChat Legends: lobby-aware group invites, friend management, OSC chatbox, and optional Discord and AI integrations. Everything runs locally on your PC; your credentials and data stay on your machine.
      </p>
      <p className="text-surface-400 text-sm mb-4">
        Use the <strong className="text-surface-300">Documentation</strong> tab in Info for the full guide, or open{' '}
        <Link to="/docs" className="text-brand-400 hover:underline font-medium">
          Documentation
        </Link>{' '}
        from the nav bar.
      </p>
      <p className="text-surface-500 text-xs">
        EcIipse Studios™ — not affiliated with VRChat Inc.
      </p>
    </div>
  );
}
