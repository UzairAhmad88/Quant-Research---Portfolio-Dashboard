import React from 'react';
import { Link } from 'react-router-dom';
import { Sliders, Activity, ExternalLink } from 'lucide-react';

interface StrategyHeaderProps {
  symbol: string;
  name?: string | null;
  assetType: string;
  currentSignal: string;
}

export const StrategyHeader: React.FC<StrategyHeaderProps> = ({
  symbol,
  name,
  assetType,
  currentSignal,
}) => {
  const getSignalBadgeClass = (sig: string) => {
    switch (sig.toUpperCase()) {
      case 'BUY':
        return 'text-emerald-400 bg-emerald-950/80 border-emerald-700/80';
      case 'SELL':
        return 'text-amber-400 bg-amber-950/80 border-amber-700/80';
      default:
        return 'text-slate-300 bg-[#0B1220] border-[#263244]';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#151F2E] border border-[#263244] rounded-lg p-5">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-[#0B1220] border border-[#263244] rounded-lg text-blue-400">
          <Sliders className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono">{symbol}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0B1220] border border-[#263244] text-slate-400">
              {assetType}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            {name || symbol} — Historical Moving Average Crossover Research &amp; Signal Inspection
          </p>
        </div>
      </div>

      {/* Research Signal Status & Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="bg-[#0B1220] border border-[#263244] px-4 py-2 rounded-lg flex items-center gap-3">
          <Activity className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              Research Signal State
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`px-2.5 py-0.5 rounded border text-xs font-mono font-bold ${getSignalBadgeClass(
                  currentSignal
                )}`}
              >
                {currentSignal}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">(Historical Output)</span>
            </div>
          </div>
        </div>

        {/* Action button to view underlying market data */}
        <Link
          to={`/market-data?symbol=${symbol}`}
          className="px-3 py-2 bg-[#0B1220] border border-[#263244] hover:bg-[#1E293B] text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors font-mono"
        >
          <span>View Market Data</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>
    </div>
  );
};
