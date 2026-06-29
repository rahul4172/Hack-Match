import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

type GlowVariant = 'cyan' | 'purple' | 'green' | 'orange' | 'red' | 'default';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: GlowVariant;
  tilt?: boolean;
  glow?: boolean;
  onClick?: () => void;
  delay?: number;
}

const glowColors: Record<GlowVariant, string> = {
  cyan: 'rgba(88, 166, 255, 0.45)',
  purple: 'rgba(188, 140, 255, 0.45)',
  green: 'rgba(63, 185, 80, 0.45)',
  orange: 'rgba(251, 146, 60, 0.45)',
  red: 'rgba(248, 113, 113, 0.45)',
  default: 'rgba(88, 166, 255, 0.35)',
};

export function GlowCard({
  children,
  className = '',
  variant = 'default',
  tilt = true,
  glow = true,
  onClick,
  delay = 0,
}: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!tilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    x.set((clientX - rect.left) / rect.width - 0.5);
    y.set((clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const glowColor = glowColors[variant];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      style={tilt ? { rotateX, rotateY, transformPerspective: 1000 } : undefined}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onTouchMove={handleMove}
      onTouchEnd={handleLeave}
      onClick={onClick}
      className={`glow-card group relative rounded-2xl sm:rounded-3xl ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {glow && (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ boxShadow: `0 0 40px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.1)` }}
        />
      )}
      <div className="glow-card-inner relative h-full overflow-hidden rounded-2xl sm:rounded-3xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {children}
      </div>
    </motion.div>
  );
}
