import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ icon, className = '', ...props }) => {
  return (
    <div className="relative flex items-center w-full">
      {icon && (
        <div className="absolute left-2.5 text-[#64748B] pointer-events-none flex items-center justify-center">
          {icon}
        </div>
      )}
      <input
        className={`w-full bg-white border border-[#CBD5E1] rounded-md text-xs text-[#17211B] placeholder-[#94A3B8] focus:outline-none focus:border-[#14532D] focus:ring-1 focus:ring-[#14532D] transition-colors shadow-2xs ${
          icon ? 'pl-8 pr-3 py-1.5' : 'px-3 py-1.5'
        } ${className}`}
        {...props}
      />
    </div>
  );
};
