"use client";

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  onSwipe: (direction: 'left' | 'right') => void;
}

export const Card: React.FC<CardProps> = ({ children, onSwipe }) => {
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);
  
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  // Dynamic border glow based on drag direction
  const borderColor = useTransform(
    x,
    [-150, 0, 150],
    ['rgba(239, 68, 68, 0.5)', 'rgba(255, 255, 255, 0.1)', 'rgba(16, 185, 129, 0.5)']
  );
  const boxShadow = useTransform(
    x,
    [-150, 0, 150],
    [
      '0 0 30px rgba(239, 68, 68, 0.2)', 
      '0 8px 32px 0 rgba(0,0,0,0.36)', 
      '0 0 30px rgba(16, 185, 129, 0.2)'
    ]
  );

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      setExitX(200);
      onSwipe('right');
    } else if (info.offset.x < -100) {
      setExitX(-200);
      onSwipe('left');
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, borderColor, boxShadow }}
      drag="x"
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      whileTap={{ cursor: 'grabbing' }}
      className="absolute w-[384px] h-[500px] glass rounded-2xl overflow-hidden cursor-grab flex flex-col group"
    >
      {/* Glossy reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {children}
    </motion.div>
  );
};
