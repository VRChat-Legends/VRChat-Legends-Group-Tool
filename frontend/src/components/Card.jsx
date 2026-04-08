export default function Card({ title, subtitle, children, className = '', titleIcon, titleCenter, tooltip }) {
  return (
    <div className={`rounded-2xl card-surface backdrop-blur-xl p-6 card-hover ${className}`} title={tooltip}>
      {(title || subtitle || titleIcon) && (
        <div className={`mb-4 flex items-start gap-3 ${titleCenter ? 'justify-center text-center w-full' : ''}`}>
          {titleIcon && <span className="text-brand-400 mt-0.5 shrink-0">{titleIcon}</span>}
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-surface-100 leading-snug">{title}</h2>}
            {subtitle && <p className="text-xs text-surface-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
