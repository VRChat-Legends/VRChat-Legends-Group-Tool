import { useState, useEffect, useRef } from 'react';

/**
 * Animate a number from 0 (or from value) to the target value - React Bits count-up style.
 */
export default function CountUp({ value = 0, duration = 600, from, className = '' }) {
  const [display, setDisplay] = useState(from ?? 0);
  const prevValue = useRef(value);
  const startTime = useRef(null);
  const raf = useRef(null);

  useEffect(() => {
    const start = from ?? prevValue.current;
    prevValue.current = value;
    if (start === value) {
      setDisplay(value);
      return;
    }
    startTime.current = null;
    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplay(Math.round(start + (value - start) * eased));
      if (t < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration, from]);

  return <span className={className}>{display}</span>;
}
