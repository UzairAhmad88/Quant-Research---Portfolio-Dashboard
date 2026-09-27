import React from 'react';
import { ServerOff, RefreshCw, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ProviderErrorStateProps {
  providerName?: string;
  isRateLimited?: boolean;
  retryAfterSeconds?: number;
  message?: string;
  hasCachedData?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const ProviderErrorState: React.FC<ProviderErrorStateProps> = ({
  providerName = 'Yahoo Finance',
  isRateLimited = false,
  retryAfterSeconds,
  message,
  hasCachedData = false,
  onRetry,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`p-6 rounded-md border border-[#EF4444]/30 bg-[#151F2E] flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="p-2.5 rounded-full bg-[#EF4444]/10 text-[#F87171] mb-2.5">
        <ServerOff className="w-5 h-5" />
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        <h4 className="text-sm font-semibold text-[#E5E7EB] tracking-tight">
          {providerName} Unavailable
        </h4>
        {isRateLimited && (
          <Badge variant="outline" className="text-[10px] text-[#F59E0B] border-[#F59E0B]/40 font-mono">
            RATE_LIMITED
          </Badge>
        )}
      </div>

      <p className="text-xs text-[#94A3B8] max-w-md mb-3 leading-relaxed">
        {message || (
          isRateLimited
            ? 'The third-party market data provider has throttled incoming queries. Please pause briefly before refreshing.'
            : 'Unable to connect to the external market data feed. Transient network or provider downtime detected.'
        )}
      </p>

      {hasCachedData && (
        <p className="text-[11px] text-[#22C55E] mb-4">
          ✓ Previously validated historical observations from the database are currently active below.
        </p>
      )}

      {retryAfterSeconds && (
        <div className="flex items-center gap-1.5 text-[11px] text-[#F59E0B] mb-4">
          <Clock className="w-3.5 h-3.5" />
          <span>Retry recommended after {retryAfterSeconds}s</span>
        </div>
      )}

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry Provider Sync
        </Button>
      )}
    </div>
  );
};
