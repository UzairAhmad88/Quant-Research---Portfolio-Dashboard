import React from 'react';
import { RefreshCw, Database, AlertTriangle } from 'lucide-react';

interface ChartStateProps {
  height?: number;
}

export const ChartLoadingState: React.FC<ChartStateProps> = ({ height = 340 }) => (
  <div
    className="w-full flex flex-col items-center justify-center rounded border border-[#263244] bg-[#0B0F17] p-6 text-center select-none"
    style={{ height }}
  >
    <RefreshCw className="h-8 w-8 text-[#3B82F6] animate-spin mb-3 opacity-80" />
    <span className="text-xs font-semibold text-[#F8FAFC]">Loading Historical Market Chart...</span>
    <span className="text-[11px] font-mono-num text-[#64748B] mt-1">Processing OHLCV series & time scale</span>
  </div>
);

export const ChartEmptyState: React.FC<{ height?: number; onFetchClick?: () => void }> = ({
  height = 340,
  onFetchClick,
}) => (
  <div
    className="w-full flex flex-col items-center justify-center rounded border border-[#263244] bg-[#0B0F17] p-6 text-center select-none"
    style={{ height }}
  >
    <Database className="h-10 w-10 text-[#3B82F6] opacity-40 mb-3" />
    <span className="text-sm font-semibold text-[#F8FAFC]">No Chart Data Available</span>
    <p className="text-xs text-[#94A3B8] max-w-sm mt-1 mb-4">
      Historical price series has not been fetched for this instrument and date window.
    </p>
    {onFetchClick && (
      <button
        onClick={onFetchClick}
        className="px-4 py-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded text-xs font-medium transition-colors"
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
    className="w-full flex flex-col items-center justify-center rounded border border-[#EF4444]/30 bg-[#7F1D1D]/20 p-6 text-center select-none"
    style={{ height }}
  >
    <AlertTriangle className="h-9 w-9 text-[#EF4444] mb-2" />
    <span className="text-xs font-semibold text-[#F87171]">Visualization Error</span>
    <p className="text-xs text-[#FCA5A5] max-w-sm mt-1 mb-3">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#263244] text-[#F8FAFC] rounded text-xs font-medium transition-colors"
      >
        Retry Visualization
      </button>
    )}
  </div>
);
