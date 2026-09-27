import React from 'react';
import { AlertCircle } from 'lucide-react';

interface InlineErrorProps {
  message?: string;
  field?: string;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({
  message,
  field,
  className = '',
}) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`flex items-center gap-1.5 text-xs text-[#EF4444] mt-1 ${className}`}
    >
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{field ? `${field}: ${message}` : message}</span>
    </div>
  );
};
