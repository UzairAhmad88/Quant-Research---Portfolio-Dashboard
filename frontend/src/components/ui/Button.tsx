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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-[#14532D] disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-2xs';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-xs px-3.5 py-1.5 gap-2',
    lg: 'text-sm px-4 py-2 gap-2',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-[#14532D] text-white hover:bg-[#166534] active:bg-[#0B3D2E] border border-transparent shadow-xs font-semibold',
    secondary: 'bg-white text-[#334155] border border-[#CBD5E1] hover:bg-[#F0FDF4] hover:border-[#14532D]/40 hover:text-[#14532D]',
    outline: 'bg-transparent text-[#334155] border border-[#CBD5E1] hover:bg-[#F0FDF4] hover:text-[#14532D]',
    ghost: 'bg-transparent text-[#14532D] hover:bg-[#F0FDF4] hover:text-[#0B3D2E]',
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
