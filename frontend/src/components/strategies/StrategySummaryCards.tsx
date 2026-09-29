import React from 'react';
import { StrategySummary } from '../../lib/apiClient';
import { Activity, ArrowUpRight, ArrowDownRight, Calendar, Sliders } from 'lucide-react';

interface StrategySummaryCardsProps {
  summary: StrategySummary;
}

export const StrategySummaryCards: React.FC<StrategySummaryCardsProps> = ({ summary }) => {
  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return 'None';
    try {
      return new Date(isoStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  const getSignalBadgeClass = (sig: string) => {
    switch (sig.toUpperCase()) {
      case 'BUY':
        return 'text-emerald-800 bg-emerald-50 border-emerald-300';
      case 'SELL':
        return 'text-amber-800 bg-amber-50 border-amber-300';
      default:
        return 'text-text-secondary bg-surface border-border';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Current Signal State */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
          <span>Current Signal State</span>
          <Activity className="w-3.5 h-3.5 text-brand-primary" />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`inline-block px-3 py-1 rounded-lg border font-mono font-bold text-lg tracking-wide ${getSignalBadgeClass(
              summary.current_signal
            )}`}
          >
            {summary.current_signal}
          </span>
        </div>
        <div className="text-[11px] text-text-muted font-mono mt-1">
          Research State (Not an order)
        </div>
      </div>

      {/* MA Windows Configuration */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
          <span>Moving Average Windows</span>
          <Sliders className="w-3.5 h-3.5 text-text-secondary" />
        </div>
        <div className="text-xl font-mono font-semibold text-text-primary mb-1">
          {summary.ma_type.toUpperCase()} ({summary.fast_window} / {summary.slow_window})
        </div>
        <div className="text-[11px] text-text-muted font-mono">
          Fast {summary.fast_window}d | Slow {summary.slow_window}d
        </div>
      </div>

      {/* Bullish Crossovers (BUY Events) */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
          <span>Bullish Crossovers</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div className="text-xl font-mono font-semibold text-emerald-600 mb-1">
          {summary.bullish_crossover_count}
        </div>
        <div className="text-[11px] text-text-muted font-mono">BUY Signal Events</div>
      </div>

      {/* Bearish Crossovers (SELL Events) */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
          <span>Bearish Crossovers</span>
          <ArrowDownRight className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <div className="text-xl font-mono font-semibold text-amber-600 mb-1">
          {summary.bearish_crossover_count}
        </div>
        <div className="text-[11px] text-text-muted font-mono">SELL Signal Events</div>
      </div>

      {/* Observation Count & Last Crossover */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
          <span>Last Crossover</span>
          <Calendar className="w-3.5 h-3.5 text-text-secondary" />
        </div>
        <div className="text-sm font-mono font-semibold text-text-primary mb-1 truncate">
          {formatDate(summary.last_crossover)}
        </div>
        <div className="text-[11px] text-text-muted font-mono">
          {summary.observation_count} total bars
        </div>
      </div>
    </div>
  );
};
