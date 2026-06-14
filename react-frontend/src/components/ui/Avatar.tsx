import React from 'react';

interface AvatarProps {
  src?: string;
  alt: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, fallback, size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  };

  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden bg-gray-900 flex items-center justify-center font-mono font-bold text-cyan-400 border border-cyan-900/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] shrink-0 relative group`}>
      {/* Inner glow ring */}
      <div className="absolute inset-0 rounded-full border border-cyan-400/20 group-hover:border-cyan-400/50 transition-colors pointer-events-none" />
      
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover z-10 relative" />
      ) : (
        <span className="z-10 relative">{fallback}</span>
      )}
    </div>
  );
};
