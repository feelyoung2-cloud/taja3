import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface ChalkParticleProps {
  x: number;
  y: number;
  color?: string;
  count?: number;
  onComplete?: () => void;
}

export const ChalkDustEffect: React.FC<ChalkParticleProps> = ({
  x,
  y,
  color = '#ffffff',
  count = 14,
  onComplete
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const initial: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      initial.push({
        id: i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2, // slight upward bias
        size: 3 + Math.random() * 5,
        opacity: 0.9,
        color,
      });
    }
    setParticles(initial);

    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 600);

    return () => clearTimeout(timer);
  }, [x, y, color, count, onComplete]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-30">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full pointer-events-none animate-dust"
          style={{
            left: `${p.x + p.vx * 8}px`,
            top: `${p.y + p.vy * 8}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 6px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
};
