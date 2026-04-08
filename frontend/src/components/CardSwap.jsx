import { useState } from 'react';
import ClickSpark from './ClickSpark';

/**
 * React Bits–style card swap: two card contents, swap between them with a toggle.
 */
export default function CardSwap({ front, back, frontLabel = 'View 1', backLabel = 'View 2', title, subtitle, className = '' }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden card-hover ${className}`}>
      <div className="p-6 pb-0 flex flex-wrap items-center justify-between gap-3">
        <div>
          {title && <h2 className="text-lg font-semibold text-surface-100">{title}</h2>}
          {subtitle && <p className="text-sm text-surface-500 mt-0.5">{subtitle}</p>}
        </div>
        <ClickSpark>
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="px-3 py-1.5 rounded-xl text-sm font-medium border border-brand-500/40 bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 transition-colors"
          >
            {flipped ? frontLabel : backLabel}
          </button>
        </ClickSpark>
      </div>
      <div className="p-6 relative min-h-[220px]">
        <div
          className="transition-opacity duration-300 ease-out"
          style={{
            opacity: flipped ? 0 : 1,
            pointerEvents: flipped ? 'none' : 'auto',
            position: flipped ? 'absolute' : 'relative',
            left: 0,
            right: 0,
            top: 0,
          }}
        >
          {front}
        </div>
        <div
          className="transition-opacity duration-300 ease-out"
          style={{
            opacity: flipped ? 1 : 0,
            pointerEvents: flipped ? 'auto' : 'none',
            position: flipped ? 'relative' : 'absolute',
            left: 0,
            right: 0,
            top: 0,
          }}
        >
          {back}
        </div>
      </div>
    </div>
  );
}
