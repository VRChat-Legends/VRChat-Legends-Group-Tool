import { useRef, useCallback } from 'react';

/**
 * React Bits–style click spark: adds a brief spark burst at the click position.
 * Wrap buttons or clickable elements with this to get the effect.
 */
export default function ClickSpark({ children, className = '', as: Component = 'div', onClick, ...props }) {
  const ref = useRef(null);

  const handleClick = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const spark = document.createElement('span');
    spark.className = 'click-spark-burst';
    spark.style.cssText = `left:${x}px;top:${y}px;`;
    el.style.position = el.style.position || 'relative';
    el.style.overflow = el.style.overflow || 'hidden';
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.appendChild(spark);
    setTimeout(() => spark.remove(), 600);
    onClick?.(e);
  }, [onClick]);

  return (
    <Component
      ref={ref}
      className={`click-spark-wrapper ${className}`.trim()}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Component>
  );
}
