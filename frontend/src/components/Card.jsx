export default function Card({ title, subtitle, children, className = '', titleIcon, titleCenter, tooltip }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 card-hover ${className}`} title={tooltip}>
      {(title || subtitle || titleIcon) && (
        <div className={`mb-4 flex items-start gap-3 ${titleCenter ? 'justify-center text-center w-full' : ''}`}>
          {titleIcon && <span className="text-brand-400 mt-0.5">{titleIcon}</span>}
          <div>
            {title && <h2 className="text-lg font-semibold text-surface-100">{title}</h2>}
            {subtitle && <p className="text-sm text-surface-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
