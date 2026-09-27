import React from 'react';
import { AlertCircle } from 'lucide-react';

interface WarningBannerProps {
  title?: string;
  message: string;
  className?: string;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({
  title,
  message,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`px-4 py-2.5 rounded-md border border-[#F59E0B]/30 bg-[#F59E0B]/10 flex items-start gap-2.5 text-xs text-[#E5E7EB] ${className}`}
    >
      <AlertCircle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
      <div>
        {title && <span className="font-semibold text-[#FBBF24] mr-1">{title}:</span>}
        <span className="text-[#CBD5E1]">{message}</span>
      </div>
    </div>
  );
};
