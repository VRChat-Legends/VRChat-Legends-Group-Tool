import { useRef, useState } from 'react';

/**
 * ReactBits-inspired Spotlight Card
 * Tracks mouse position and renders a radial-gradient spotlight that follows the cursor.
 *
 * Usage:
 *   <SpotlightCard className="..." spotlightColor="rgba(109,74,255,0.15)">
 *     content
 *   </SpotlightCard>
 */
export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(109, 74, 255, 0.12)',
  as: Tag = 'div',
  ...props
}) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const onMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <Tag
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {/* spotlight overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(500px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 60%)`,
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </Tag>
  );
}
