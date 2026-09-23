import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ icon, className = '', ...props }) => {
  return (
    <div className="relative flex items-center w-full">
      {icon && (
        <div className="absolute left-2.5 text-[#94A3B8] pointer-events-none flex items-center justify-center">
          {icon}
        </div>
      )}
      <input
        className={`w-full bg-[#111827] border border-[#263244] rounded text-xs text-[#E5E7EB] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors ${
          icon ? 'pl-8 pr-3 py-1.5' : 'px-3 py-1.5'
        } ${className}`}
        {...props}
      />
    </div>
  );
};
