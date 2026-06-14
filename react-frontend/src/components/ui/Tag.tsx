import React from 'react';

interface TagProps {
  label: string;
  color?: 'blue' | 'green' | 'purple' | 'gray';
}

export const Tag: React.FC<TagProps> = ({ label, color = 'gray' }) => {
  const colors = {
    blue: 'bg-cyan-950/30 text-cyan-400 border-cyan-800/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
    green: 'bg-emerald-950/30 text-emerald-400 border-emerald-800/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    purple: 'bg-fuchsia-950/30 text-fuchsia-400 border-fuchsia-800/50 shadow-[0_0_10px_rgba(217,70,239,0.2)]',
    gray: 'bg-white/5 text-gray-400 border-white/10'
  };

  return (
    <span className={`px-2.5 py-1 rounded font-mono text-[10px] uppercase tracking-wider font-semibold border backdrop-blur-sm transition-all hover:scale-105 ${colors[color]}`}>
      {label}
    </span>
  );
};
