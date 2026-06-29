import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const base = 'relative inline-flex items-center justify-center font-display tracking-wide rounded-[14px] transition-all duration-250 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508] overflow-hidden group disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      primary: 'btn-primary',
      secondary: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400/50 font-semibold',
      outline: 'bg-transparent border border-white/15 text-slate-300 hover:text-white hover:border-white/30 hover:bg-white/5 font-semibold',
      ghost: 'bg-transparent text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 border border-transparent font-semibold',
    };

    const sizes = {
      sm: 'text-xs px-4 py-2 min-h-[44px]',
      md: 'px-6 min-h-[44px]', // btn-primary handles md padding & font-size
      lg: 'text-base px-8 py-3.5 min-h-[48px]',
    };

    return (
      <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
        {variant === 'primary' && (
          <span className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        )}
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);
Button.displayName = 'Button';
