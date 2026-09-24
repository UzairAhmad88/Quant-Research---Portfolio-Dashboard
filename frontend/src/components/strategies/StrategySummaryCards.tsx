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
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';
      case 'SELL':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
      default:
        return 'text-slate-300 bg-[#0B1220] border-[#263244]';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Current Signal State */}
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Current Signal State</span>
          <Activity className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`inline-block px-3 py-1 rounded border font-mono font-bold text-lg tracking-wide ${getSignalBadgeClass(
              summary.current_signal
            )}`}
          >
            {summary.current_signal}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono mt-1">
          Research State (Not an executed order)
        </div>
      </div>

      {/* MA Windows Configuration */}
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Moving Average Windows</span>
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="text-xl font-mono font-semibold text-slate-100 mb-1">
          {summary.ma_type} ({summary.fast_window} / {summary.slow_window})
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          Fast {summary.fast_window}d | Slow {summary.slow_window}d
        </div>
      </div>

      {/* Bullish Crossovers (BUY Events) */}
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Bullish Crossovers</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="text-xl font-mono font-semibold text-emerald-400 mb-1">
          {summary.bullish_crossover_count}
        </div>
        <div className="text-[11px] text-slate-500 font-mono">BUY Signal Events</div>
      </div>

      {/* Bearish Crossovers (SELL Events) */}
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Bearish Crossovers</span>
          <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="text-xl font-mono font-semibold text-amber-400 mb-1">
          {summary.bearish_crossover_count}
        </div>
        <div className="text-[11px] text-slate-500 font-mono">SELL Signal Events</div>
      </div>

      {/* Observation Count & Last Crossover */}
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Last Crossover</span>
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="text-sm font-mono font-semibold text-slate-200 mb-1 truncate">
          {formatDate(summary.last_crossover)}
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          {summary.observation_count} total bars
        </div>
      </div>
    </div>
  );
};
