import React, { type ButtonHTMLAttributes } from 'react';
import './ui.css';

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
    const classes = [
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      fullWidth ? 'btn-full' : '',
      isLoading ? 'btn-loading' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="path" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          </svg>
        )}
        <span className={isLoading ? 'content-hidden' : ''}>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
