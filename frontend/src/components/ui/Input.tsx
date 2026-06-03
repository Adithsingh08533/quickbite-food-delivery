import React, { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, leftIcon, id, ...props }, ref) => {
    const inputId = id || Math.random().toString(36).substr(2, 9);
    
    return (
      <div className={`flex flex-col gap-1.5 w-full ${className}`}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-secondary">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 text-text-muted flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full h-[46px] px-4 text-base text-text-primary bg-gray-50 border-[1.5px] rounded-md transition-all duration-150 outline-none placeholder:text-text-muted focus:bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 ${
              leftIcon ? 'pl-[42px]' : ''
            } ${
              error ? 'border-error bg-error-bg focus:border-error focus:ring-error/10' : 'border-gray-200'
            }`}
            {...props}
          />
        </div>
        {error && <span className="text-[13px] font-medium text-error animate-slide-up">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
