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
      className={`bg-[#151F2E] border border-[#263244] rounded-md p-5 shadow-sm text-[#E5E7EB] ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#263244]">
          <div>
            {title && <h3 className="text-sm font-semibold text-[#E5E7EB] tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
