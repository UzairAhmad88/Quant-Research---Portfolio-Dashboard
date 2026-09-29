import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ModuleErrorStateProps {
  title?: string;
  message?: string;
  code?: string;
  requestId?: string;
  details?: unknown;
  onRetry?: () => void;
  className?: string;
}

export const ModuleErrorState: React.FC<ModuleErrorStateProps> = ({
  title = 'Module Operation Failed',
  message = 'An unexpected error occurred during analytical evaluation.',
  code = 'ERROR',
  requestId,
  details,
  onRetry,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyReqId = () => {
    if (requestId) {
      navigator.clipboard.writeText(requestId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="alert"
      className={`p-6 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="p-2.5 rounded-full bg-rose-100 text-rose-700 mb-2.5">
        <AlertTriangle className="w-5 h-5" />
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        <h4 className="text-sm font-semibold text-text-primary tracking-tight">
          {title}
        </h4>
        {code && (
          <Badge variant="outline" className="text-[10px] text-rose-800 border-rose-300 bg-rose-50 font-mono">
            {code}
          </Badge>
        )}
      </div>

      <p className="text-xs text-text-secondary max-w-md mb-4 leading-relaxed">
        {message}
      </p>

      {requestId && (
        <div className="flex items-center gap-2 mb-4 text-[11px] text-text-secondary font-mono bg-card px-2.5 py-1 rounded-lg border border-border shadow-xs">
          <span>ReqID: {requestId}</span>
          <button
            onClick={handleCopyReqId}
            className="hover:text-text-primary transition-colors"
            title="Copy Request ID"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      )}

      {Boolean(details) && (
        <div className="w-full max-w-md mb-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] text-text-secondary hover:text-text-primary flex items-center justify-center gap-1 mx-auto transition-colors font-medium"
          >
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showDetails ? 'Hide Diagnostics' : 'View Diagnostics'}
          </button>

          {showDetails && (
            <pre className="mt-2 p-3 text-left bg-card border border-border rounded-lg text-[10px] font-mono text-rose-800 overflow-x-auto max-h-40 shadow-xs">
              {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
            </pre>
          )}
        </div>
      )}

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry Module
        </Button>
      )}
    </div>
  );
};
