import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = 'relative inline-flex items-center justify-center font-mono font-medium tracking-wide rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black overflow-hidden group';
    
    const variants = {
      primary: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] focus:ring-cyan-500',
      secondary: 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white focus:ring-gray-500',
      outline: 'bg-transparent border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500',
      ghost: 'bg-transparent text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10'
    };
    
    const sizes = {
      sm: 'text-xs px-4 py-2',
      md: 'text-sm px-6 py-2.5',
      lg: 'text-base px-8 py-3.5 uppercase tracking-widest'
    };

    const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <button ref={ref} className={classes} {...props}>
        {/* Subtle scanline effect on primary button */}
        {variant === 'primary' && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
        )}
        <span className="relative z-10">{props.children}</span>
      </button>
    );
  }
);
Button.displayName = 'Button';
