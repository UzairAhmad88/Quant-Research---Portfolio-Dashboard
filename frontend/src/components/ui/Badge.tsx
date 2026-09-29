import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
    success: 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]',
    warning: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
    danger: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]',
    info: 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]',
    outline: 'bg-transparent text-[#64748B] border-[#CBD5E1]',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono-num font-medium border uppercase tracking-wider ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
