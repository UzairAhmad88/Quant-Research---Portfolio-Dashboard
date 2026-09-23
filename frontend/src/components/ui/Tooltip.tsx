import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, position = 'right', children }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && content && (
        <div
          className={`absolute z-[400] px-2 py-1 text-[11px] font-mono-num font-medium text-[#E5E7EB] bg-[#1E293B] border border-[#263244] rounded shadow-md whitespace-nowrap pointer-events-none ${positionClasses[position]}`}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
};
