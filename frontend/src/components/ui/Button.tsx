import React, { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    
    const baseClasses = "inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-all duration-250 relative overflow-hidden select-none active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-gradient-to-br from-primary to-[#ff8a00] text-white shadow-[0_4px_14px_0_rgba(255,107,53,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,53,0.23)] hover:-translate-y-[1px]",
      secondary: "bg-secondary text-white hover:bg-secondary-hover hover:-translate-y-[1px]",
      outline: "bg-transparent text-primary border-[1.5px] border-primary hover:bg-primary/10",
      ghost: "bg-transparent text-text-secondary hover:bg-black/5 hover:text-text-primary",
      danger: "bg-error text-white hover:bg-red-600 hover:shadow-[0_4px_14px_0_rgba(239,68,68,0.39)]"
    };

    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-11 px-5 text-base",
      lg: "h-[52px] px-7 text-lg"
    };

    const classes = [
      baseClasses,
      variants[variant],
      sizes[size],
      fullWidth ? 'w-full' : '',
      isLoading ? 'text-transparent pointer-events-none' : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-current z-10">
            <svg className="w-5 h-5 animate-[spin_2s_linear_infinite]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        <span className={isLoading ? 'opacity-0' : ''}>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
