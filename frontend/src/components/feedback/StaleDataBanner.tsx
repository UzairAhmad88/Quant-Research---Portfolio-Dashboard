import React from 'react';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface StaleDataBannerProps {
  lastUpdated?: string;
  warningMessage?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export const StaleDataBanner: React.FC<StaleDataBannerProps> = ({
  lastUpdated,
  warningMessage,
  onRefresh,
  isRefreshing = false,
  className = '',
}) => {
  return (
    <div
      role="status"
      className={`px-4 py-2.5 rounded-md border border-[#F59E0B]/30 bg-[#F59E0B]/10 flex flex-wrap items-center justify-between gap-3 text-xs text-[#E5E7EB] ${className}`}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
        <div>
          <span className="font-semibold text-[#FBBF24]">Cached / Stale Data: </span>
          <span className="text-[#CBD5E1]">
            {warningMessage || 'Provider refresh was unavailable. Displaying previously cached and validated observations.'}
          </span>
          {lastUpdated && (
            <span className="ml-2 text-[#94A3B8] font-mono text-[11px] inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Observed: {lastUpdated}
            </span>
          )}
        </div>
      </div>

      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          icon={<RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />}
        >
          {isRefreshing ? 'Syncing...' : 'Force Refresh'}
        </Button>
      )}
    </div>
  );
};
