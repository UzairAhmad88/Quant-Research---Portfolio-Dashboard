import React from 'react';
import { VolatilitySummary } from '../../lib/apiClient';
import { Activity, ArrowUpRight, ArrowDownRight, Hash, Percent } from 'lucide-react';

interface VolatilitySummaryCardsProps {
  summary: VolatilitySummary;
  symbol: string;
  assetType: string;
}

export const VolatilitySummaryCards: React.FC<VolatilitySummaryCardsProps> = ({ summary, symbol, assetType }) => {
  const formatPct = (val: number | null) => (val !== null ? `${(val * 100).toFixed(2)}%` : 'N/A');

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Annualized Volatility (Primary metric) */}
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Annualized Volatility ({symbol})</span>
          <Percent className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="text-2xl font-mono font-semibold text-slate-100 mb-1">
          {formatPct(summary.annualized_volatility)}
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          Factor: {summary.annualization_factor} days ({assetType})
        </div>
      </div>

      {/* Daily Volatility */}
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Daily Volatility</span>
          <Activity className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="text-xl font-mono font-semibold text-slate-200 mb-1">
          {formatPct(summary.daily_volatility)}
        </div>
        <div className="text-[11px] text-slate-500 font-mono">Sample StdDev (ddof=1)</div>
      </div>

      {/* Upside Volatility */}
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Upside Volatility</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="text-xl font-mono font-semibold text-slate-200 mb-1">
          {formatPct(summary.upside_volatility)}
        </div>
        <div className="text-[11px] text-slate-500 font-mono">StdDev (R &gt; 0)</div>
      </div>

      {/* Downside Volatility */}
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Downside Volatility</span>
          <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="text-xl font-mono font-semibold text-slate-200 mb-1">
          {formatPct(summary.downside_volatility)}
        </div>
        <div className="text-[11px] text-slate-500 font-mono">StdDev (R &lt; 0)</div>
      </div>

      {/* Observations Count */}
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Observations</span>
          <Hash className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="text-xl font-mono font-semibold text-slate-200 mb-1">
          {summary.observation_count}
        </div>
        <div className="text-[11px] text-slate-500 font-mono">Valid Return Sample</div>
      </div>
    </div>
  );
};
