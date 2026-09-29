import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, action, children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-[#17211B] ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E7EB]">
          <div>
            {title && <h3 className="text-sm font-semibold text-[#17211B] tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
