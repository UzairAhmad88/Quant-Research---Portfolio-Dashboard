import React from 'react';

interface MonogramLogoProps {
  collapsed?: boolean;
  className?: string;
}

export const MonogramLogo: React.FC<MonogramLogoProps> = ({ collapsed = false, className = '' }) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* 3-Bar Gradient Chart Icon in Forest Green */}
      <div className="flex items-end gap-1 h-5 flex-shrink-0">
        <span className="w-1.5 h-3.5 rounded-full bg-gradient-to-t from-[#14532D] to-[#22C55E]" />
        <span className="w-1.5 h-5 rounded-full bg-gradient-to-t from-[#0B3D2E] to-[#166534]" />
        <span className="w-1.5 h-4 rounded-full bg-gradient-to-t from-[#14532D] to-[#15803D]" />
      </div>

      {!collapsed && (
        <span className="font-bold text-sm text-[#17211B] tracking-tight font-sans">
          Quant Research
        </span>
      )}
    </div>
  );
};
