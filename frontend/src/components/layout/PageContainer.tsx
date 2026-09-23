import React from 'react';

interface PageContainerProps {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  eyebrow,
  description,
  action,
  children,
}) => {
  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#263244]">
        <div>
          {eyebrow && (
            <div className="text-[10px] font-mono-num font-semibold text-[#64748B] tracking-wider uppercase mb-0.5">
              {eyebrow}
            </div>
          )}
          <h1 className="text-display tracking-tight text-[#E5E7EB]">{title}</h1>
          {description && (
            <p className="text-secondary-body mt-1 max-w-3xl leading-relaxed">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0 flex items-center gap-2">{action}</div>}
      </div>

      {/* 12-Column Responsive Dashboard Grid Container */}
      <div className="grid grid-cols-12 gap-4">
        {children}
      </div>
    </div>
  );
};
