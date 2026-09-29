import React from 'react';
import { Link } from 'react-router-dom';
import { Sliders, Activity, ExternalLink } from 'lucide-react';

interface StrategyHeaderProps {
  symbol: string;
  name?: string | null;
  assetType: string;
  currentSignal: string;
  actions?: React.ReactNode;
}

export const StrategyHeader: React.FC<StrategyHeaderProps> = ({
  symbol,
  name,
  assetType,
  currentSignal,
  actions,
}) => {
  const getSignalBadgeClass = (sig: string) => {
    switch (sig.toUpperCase()) {
      case 'BUY':
        return 'text-emerald-800 bg-emerald-50 border-emerald-200';
      case 'SELL':
        return 'text-amber-800 bg-amber-50 border-amber-200';
      default:
        return 'text-text-secondary bg-surface border-border';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card border border-border rounded-xl p-5 shadow-xs">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-brand-primary">
          <Sliders className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary font-mono">{symbol}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface border border-border text-text-secondary">
              {assetType}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5 font-sans">
            {name || symbol} — Historical Moving Average Crossover Research &amp; Signal Inspection
          </p>
        </div>
      </div>

      {/* Research Signal Status & Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="bg-surface border border-border px-4 py-2 rounded-xl flex items-center gap-3">
          <Activity className="w-4 h-4 text-brand-primary" />
          <div>
            <div className="text-[10px] text-text-secondary font-mono uppercase tracking-wider">
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
              <span className="text-[11px] text-text-secondary font-mono">(Historical Output)</span>
            </div>
          </div>
        </div>

        {actions}

        {/* Action button to view underlying market data */}
        <Link
          to={`/market-data?symbol=${symbol}`}
          className="px-3 py-2 bg-surface border border-border hover:bg-surface-hover text-text-primary text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors font-mono"
        >
          <span>View Market Data</span>
          <ExternalLink className="w-3.5 h-3.5 text-text-secondary" />
        </Link>
      </div>
    </div>
  );
};
