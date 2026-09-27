import { useState } from 'react';
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
      className={`p-6 rounded-md border border-[#EF4444]/30 bg-[#151F2E] flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="p-2.5 rounded-full bg-[#EF4444]/10 text-[#F87171] mb-2.5">
        <AlertTriangle className="w-5 h-5" />
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        <h4 className="text-sm font-semibold text-[#E5E7EB] tracking-tight">
          {title}
        </h4>
        {code && (
          <Badge variant="outline" className="text-[10px] text-[#F87171] border-[#EF4444]/40 font-mono">
            {code}
          </Badge>
        )}
      </div>

      <p className="text-xs text-[#94A3B8] max-w-md mb-4 leading-relaxed">
        {message}
      </p>

      {requestId && (
        <div className="flex items-center gap-2 mb-4 text-[11px] text-[#64748B] font-mono bg-[#111827] px-2.5 py-1 rounded border border-[#263244]">
          <span>ReqID: {requestId}</span>
          <button
            onClick={handleCopyReqId}
            className="hover:text-[#E5E7EB] transition-colors"
            title="Copy Request ID"
          >
            {copied ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      )}

      {Boolean(details) && (
        <div className="w-full max-w-md mb-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] text-[#64748B] hover:text-[#94A3B8] flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showDetails ? 'Hide Diagnostics' : 'View Diagnostics'}
          </button>

          {showDetails && (
            <pre className="mt-2 p-3 text-left bg-[#111827] border border-[#263244] rounded text-[10px] font-mono text-[#F87171] overflow-x-auto max-h-40">
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
