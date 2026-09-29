import React from 'react';
import { RefreshCw, Database, AlertTriangle } from 'lucide-react';

interface ChartStateProps {
  height?: number;
}

export const ChartLoadingState: React.FC<ChartStateProps> = ({ height = 340 }) => (
  <div
    className="w-full flex flex-col items-center justify-center rounded-md border border-[#E5E7EB] bg-white p-6 text-center select-none shadow-2xs"
    style={{ height }}
  >
    <RefreshCw className="h-8 w-8 text-[#14532D] animate-spin mb-3 opacity-90" />
    <span className="text-xs font-semibold text-[#17211B]">Loading Historical Market Chart...</span>
    <span className="text-[11px] font-mono-num text-[#64748B] mt-1">Processing OHLCV series & time scale</span>
  </div>
);

export const ChartEmptyState: React.FC<{ height?: number; onFetchClick?: () => void }> = ({
  height = 340,
  onFetchClick,
}) => (
  <div
    className="w-full flex flex-col items-center justify-center rounded-md border border-[#E5E7EB] bg-white p-6 text-center select-none shadow-2xs"
    style={{ height }}
  >
    <Database className="h-10 w-10 text-[#14532D] opacity-40 mb-3" />
    <span className="text-sm font-semibold text-[#17211B]">No Chart Data Available</span>
    <p className="text-xs text-[#64748B] max-w-sm mt-1 mb-4">
      Historical price series has not been fetched for this instrument and date window.
    </p>
    {onFetchClick && (
      <button
        onClick={onFetchClick}
        className="px-4 py-1.5 bg-[#14532D] hover:bg-[#166534] text-white rounded-md text-xs font-medium transition-colors shadow-2xs"
      >
        Fetch Market Data
      </button>
    )}
  </div>
);

export const ChartErrorState: React.FC<{ height?: number; message?: string; onRetry?: () => void }> = ({
  height = 340,
  message = 'Failed to render market data chart.',
  onRetry,
}) => (
  <div
    className="w-full flex flex-col items-center justify-center rounded-md border border-[#FECACA] bg-[#FEF2F2] p-6 text-center select-none"
    style={{ height }}
  >
    <AlertTriangle className="h-9 w-9 text-[#DC2626] mb-2" />
    <span className="text-xs font-semibold text-[#991B1B]">Visualization Error</span>
    <p className="text-xs text-[#B91C1C] max-w-sm mt-1 mb-3">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-3 py-1.5 bg-white hover:bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA] rounded-md text-xs font-medium transition-colors"
      >
        Retry Visualization
      </button>
    )}
  </div>
);
