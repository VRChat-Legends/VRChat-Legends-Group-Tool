import { useEffect, useRef, useState } from 'react';

/**
 * BlurText – ReactBits-inspired animated text that blurs/fades in word-by-word.
 * Pure CSS keyframes – no extra dependencies needed.
 *
 * Props:
 *   text        {string}  – text to animate
 *   className   {string}  – wrapper class
 *   delay       {number}  – ms between each word (default 80)
 *   duration    {number}  – ms per word animation (default 400)
 *   animateBy   {'words'|'chars'} – split by words or chars (default 'words')
 *   once        {boolean} – only animate on first mount (default true)
 */
export default function BlurText({
  text = '',
  className = '',
  delay = 80,
  duration = 400,
  animateBy = 'words',
  once = true,
}) {
  const [played, setPlayed] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (once && played) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPlayed(true);
          if (once) observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [once, played]);

  const parts = animateBy === 'chars' ? [...text] : text.split(' ');

  return (
    <span ref={ref} className={`inline-flex flex-wrap gap-x-[0.25em] ${className}`} aria-label={text}>
      {parts.map((part, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            display: 'inline-block',
            opacity: played ? 1 : 0,
            filter: played ? 'blur(0px)' : 'blur(8px)',
            transform: played ? 'translateY(0)' : 'translateY(-6px)',
            transition: `opacity ${duration}ms ease, filter ${duration}ms ease, transform ${duration}ms ease`,
            transitionDelay: `${i * delay}ms`,
          }}
        >
          {part}
          {animateBy === 'words' && i < parts.length - 1 ? '\u00a0' : ''}
        </span>
      ))}
    </span>
  );
}
