import React from 'react';

interface MonogramLogoProps {
  collapsed?: boolean;
  className?: string;
}

export const MonogramLogo: React.FC<MonogramLogoProps> = ({ collapsed = false, className = '' }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Minimal Geometric Monogram Logo */}
      <div className="relative flex items-center justify-center w-8 h-8 rounded bg-[#151F2E] border border-[#263244] text-[#3B82F6] font-mono-num font-bold text-xs tracking-wider shadow-sm flex-shrink-0 group hover:border-[#3B82F6]/50 transition-colors">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#3B82F6]"
        >
          {/* Geometric Q + Trend Line Monogram Concept */}
          <path d="M12 3v18M3 12h18" strokeOpacity="0.15" strokeDasharray="2 2" />
          <circle cx="12" cy="12" r="8" strokeWidth="2.2" className="stroke-[#3B82F6]" />
          <path d="M16 16l4 4" strokeWidth="2.5" className="stroke-[#3B82F6]" />
          <path d="M8 14l3-3 2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-[#22C55E]" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col leading-tight overflow-hidden">
          <span className="font-semibold text-xs text-[#E5E7EB] tracking-tight uppercase">
            Quant Research
          </span>
          <span className="text-[10px] text-[#94A3B8] tracking-widest uppercase font-mono-num">
            Dashboard v0.1
          </span>
        </div>
      )}
    </div>
  );
};
