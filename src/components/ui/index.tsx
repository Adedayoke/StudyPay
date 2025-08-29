/**
 * Base UI Components
 * Clean, reusable components with Solana brand styling
 */

import React from 'react';

// =============================================================================
// Button Component
// =============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  className = '', 
  children, 
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-colors duration-200 flex items-center justify-center';
  
  const variantClasses = {
    primary: 'bg-solana-purple-500 hover:bg-solana-purple-600 text-white border border-solana-purple-500',
    secondary: 'bg-dark-bg-secondary hover:bg-dark-bg-tertiary text-dark-text-primary border border-dark-border-secondary',
    danger: 'bg-red-600 hover:bg-red-700 text-white border border-red-600',
    success: 'bg-solana-green-500 hover:bg-solana-green-600 text-black border border-solana-green-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const disabledClasses = 'opacity-50 cursor-not-allowed';
  
  return (
    <button
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${sizeClasses[size]}
        ${(disabled || loading) ? disabledClasses : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
      )}
      {children}
    </button>
  );
}

// =============================================================================
// Card Component
// =============================================================================

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };
  
  return (
    <div className={`
      bg-dark-bg-secondary rounded-lg border border-dark-border-primary shadow-dark
      ${paddingClasses[padding]}
      ${className}
    `}>
      {children}
    </div>
  );
}

// =============================================================================
// Input Component
// =============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export function Input({ label, error, helpText, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-dark-text-primary">
          {label}
        </label>
      )}
      
      <input
        className={`
          w-full px-3 py-2 border rounded-lg text-base
          bg-dark-bg-tertiary text-dark-text-primary placeholder-dark-text-muted
          focus:outline-none focus:ring-2 focus:ring-solana-purple-500 focus:border-transparent
          ${error ? 'border-red-500 bg-red-900/20' : 'border-dark-border-secondary'}
          ${className}
        `}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      
      {helpText && !error && (
        <p className="text-sm text-dark-text-muted">{helpText}</p>
      )}
    </div>
  );
}

// =============================================================================
// Loading Spinner Component
// =============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };
  
  return (
    <div className={`
      animate-spin rounded-full border-b-2 border-solana-purple-500
      ${sizeClasses[size]}
      ${className}
    `} />
  );
}

// =============================================================================
// Alert Component
// =============================================================================

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ type = 'info', title, children, className = '' }: AlertProps) {
  const typeClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };
  
  return (
    <div className={`
      border rounded-lg p-4
      ${typeClasses[type]}
      ${className}
    `}>
      {title && (
        <h4 className="font-medium mb-1">{title}</h4>
      )}
      <div className="text-sm">{children}</div>
    </div>
  );
}

// =============================================================================
// Badge Component
// =============================================================================

interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'primary', children, className = '' }: BadgeProps) {
  const variantClasses = {
    primary: 'bg-solana-purple-100 text-solana-purple-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-solana-green-100 text-solana-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
  };
  
  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${variantClasses[variant]}
      ${className}
    `}>
      {children}
    </span>
  );
}

// =============================================================================
// Modal Component
// =============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal content */}
        <div className={`
          relative bg-white rounded-lg shadow-xl w-full
          ${sizeClasses[size]}
        `}>
          {title && (
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            </div>
          )}
          
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
