import React from 'react';
import { SignalEvent } from '../../types/signal';
import {
  X,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Hash,
  Clock,
  DollarSign,
  Cpu,
  LineChart,
} from 'lucide-react';

interface SignalDetailModalProps {
  signal: SignalEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onViewOnChart?: (timestamp: string) => void;
}

export const SignalDetailModal: React.FC<SignalDetailModalProps> = ({
  signal,
  isOpen,
  onClose,
  onViewOnChart,
}) => {
  if (!isOpen || !signal) return null;

  const isBuy = signal.signal_type === 'BUY';
  const formattedDate = new Date(signal.timestamp).toISOString().replace('T', ' ').substring(0, 19);
  const metadata = signal.metadata || {};
  const config = signal.configuration;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isBuy ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {isBuy ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                Signal Inspection Detail
                <span className={`px-2 py-0.5 text-xs font-mono font-medium rounded ${
                  isBuy ? 'bg-emerald-50 text-financial-positive border border-emerald-200' : 'bg-red-50 text-financial-negative border border-red-200'
                }`}>
                  {signal.signal_type}
                </span>
              </h3>
              <p className="text-xs text-text-muted font-mono">ID: {signal.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Top Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-surface border border-border">
              <span className="text-[11px] font-medium text-text-muted flex items-center gap-1.5 mb-1">
                <Clock className="h-3.5 w-3.5 text-brand-primary" /> Timestamp
              </span>
              <p className="text-xs font-mono font-semibold text-text-primary">{formattedDate}</p>
            </div>

            <div className="p-3 rounded-lg bg-surface border border-border">
              <span className="text-[11px] font-medium text-text-muted flex items-center gap-1.5 mb-1">
                <DollarSign className="h-3.5 w-3.5 text-financial-positive" /> Price
              </span>
              <p className="text-sm font-mono font-bold text-text-primary">
                ${Number(signal.price).toFixed(2)}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface border border-border">
              <span className="text-[11px] font-medium text-text-muted flex items-center gap-1.5 mb-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-800" /> Research State
              </span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${
                signal.signal_state === 'BULLISH' ? 'text-financial-positive bg-emerald-50 border border-emerald-200' :
                signal.signal_state === 'BEARISH' ? 'text-financial-negative bg-red-50 border border-red-200' : 'text-text-muted bg-surface-elevated border border-border'
              }`}>
                {signal.signal_state}
              </span>
            </div>
          </div>

          {/* Strategy Context Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <Cpu className="h-4 w-4 text-brand-primary" /> Strategy Context
            </h4>
            <div className="rounded-lg bg-surface border border-border p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-text-muted block text-[11px]">Strategy Type</span>
                  <span className="font-mono font-medium text-text-primary">{signal.strategy_type}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px]">Source</span>
                  <span className="font-mono font-medium text-brand-primary">{signal.source}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px]">Moving Average Type</span>
                  <span className="font-mono font-medium text-text-primary">
                    {metadata.ma_type || config?.ma_type || 'SMA'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px]">Price Source</span>
                  <span className="font-mono font-medium text-text-primary">
                    {metadata.price_source || config?.price_source || 'Adjusted Close'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px]">Fast Window</span>
                  <span className="font-mono font-medium text-text-primary">
                    {metadata.fast_window || config?.fast_window || 20} bars
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px]">Slow Window</span>
                  <span className="font-mono font-medium text-text-primary">
                    {metadata.slow_window || config?.slow_window || 50} bars
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Signal Indicator Values */}
          {(metadata.fast_ma !== undefined || metadata.slow_ma !== undefined) && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
                <LineChart className="h-4 w-4 text-amber-600" /> Technical Indicators
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-surface border border-border">
                  <span className="text-[11px] text-text-muted block">Fast MA Value</span>
                  <span className="text-xs font-mono font-bold text-brand-primary">
                    {metadata.fast_ma !== null ? Number(metadata.fast_ma).toFixed(2) : 'N/A'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface border border-border">
                  <span className="text-[11px] text-text-muted block">Slow MA Value</span>
                  <span className="text-xs font-mono font-bold text-amber-600">
                    {metadata.slow_ma !== null ? Number(metadata.slow_ma).toFixed(2) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Audit & Hash info */}
          <div className="rounded-lg bg-surface border border-border p-3 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-text-muted font-mono">
              <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> Config Hash:</span>
              <span className="text-text-primary truncate max-w-[260px]">
                {config?.configuration_hash || 'N/A'}
              </span>
            </div>
            <p className="text-text-muted italic">
              Signals are standardized historical research outputs and do not represent executed orders or positions.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 bg-surface">
          {onViewOnChart && (
            <button
              onClick={() => {
                onViewOnChart(signal.timestamp);
                onClose();
              }}
              className="px-4 py-2 text-xs font-medium text-brand-primary hover:text-brand-deep hover:bg-emerald-50 rounded-md border border-brand-primary/30 transition-colors flex items-center gap-1.5"
            >
              <LineChart className="h-4 w-4" /> Focus on Chart
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary bg-card hover:bg-surface border border-border rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
