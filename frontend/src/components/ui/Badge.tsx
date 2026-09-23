import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-[#1E293B] text-[#94A3B8] border-[#263244]',
    success: 'bg-[#22C55E]/10 text-[#4ADE80] border-[#22C55E]/30',
    warning: 'bg-[#F59E0B]/10 text-[#FBBF24] border-[#F59E0B]/30',
    danger: 'bg-[#EF4444]/10 text-[#F87171] border-[#EF4444]/30',
    info: 'bg-[#3B82F6]/10 text-[#60A5FA] border-[#3B82F6]/30',
    outline: 'bg-transparent text-[#94A3B8] border-[#263244]',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono-num font-medium border uppercase tracking-wider ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
