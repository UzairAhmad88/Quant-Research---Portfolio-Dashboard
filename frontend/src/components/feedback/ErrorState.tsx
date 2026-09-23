import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load data',
  message = 'Something went wrong while preparing the requested quantitative dataset.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`p-6 rounded-md border border-[#EF4444]/30 bg-[#EF4444]/5 flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="p-2.5 rounded-full bg-[#EF4444]/10 text-[#F87171] mb-2.5">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h4 className="text-xs font-semibold text-[#E5E7EB] tracking-tight mb-1">
        {title}
      </h4>
      <p className="text-xs text-[#94A3B8] max-w-sm mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry Request
        </Button>
      )}
    </div>
  );
};
