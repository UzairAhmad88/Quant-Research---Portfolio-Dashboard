import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-1 focus:ring-[#3B82F6] disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-xs px-3.5 py-1.5 gap-2',
    lg: 'text-sm px-4 py-2 gap-2',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-[#3B82F6] text-white hover:bg-[#2563EB] active:bg-[#1D4ED8]',
    secondary: 'bg-[#151F2E] text-[#E5E7EB] border border-[#263244] hover:bg-[#1C2A3E] hover:border-[#334155]',
    outline: 'bg-transparent text-[#E5E7EB] border border-[#263244] hover:bg-[#151F2E]',
    ghost: 'bg-transparent text-[#94A3B8] hover:text-[#E5E7EB] hover:bg-[#151F2E]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
