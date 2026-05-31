import React, { type InputHTMLAttributes } from 'react';
import './ui.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, leftIcon, id, ...props }, ref) => {
    const inputId = id || Math.random().toString(36).substr(2, 9);
    
    return (
      <div className={`input-group ${className}`}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <div className="input-wrapper">
          {leftIcon && <div className="input-icon-left">{leftIcon}</div>}
          <input
            ref={ref}
            id={inputId}
            className={`input-field ${error ? 'input-error' : ''} ${leftIcon ? 'has-icon-left' : ''}`}
            {...props}
          />
        </div>
        {error && <span className="input-error-text animate-slide-up">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
