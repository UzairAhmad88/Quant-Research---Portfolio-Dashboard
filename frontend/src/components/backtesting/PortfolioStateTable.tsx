import React, { useState } from 'react';
import { PortfolioState } from '../../types/backtest';

interface PortfolioStateTableProps {
  states: PortfolioState[];
  isLoading?: boolean;
}

export const PortfolioStateTable: React.FC<PortfolioStateTableProps> = ({ states, isLoading }) => {
  const [displayCount, setDisplayCount] = useState<number>(100);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-text-secondary font-mono shadow-xs">
        Loading portfolio state history...
      </div>
    );
  }

  if (!states || states.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-text-secondary font-mono shadow-xs">
        No portfolio state history records available.
      </div>
    );
  }

  const visibleStates = states.slice(0, displayCount);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
      <div className="p-4 border-b border-border flex items-center justify-between bg-surface">
        <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider font-mono">
          Portfolio Simulation State History ({states.length} bars)
        </h4>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span>Showing top {visibleStates.length} records</span>
          {states.length > displayCount && (
            <button
              onClick={() => setDisplayCount((prev) => prev + 200)}
              className="px-2.5 py-1 rounded-lg bg-card text-brand-primary border border-border hover:bg-surface-hover font-semibold shadow-xs"
            >
              Load More
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-left text-xs text-text-primary font-mono">
          <thead className="bg-surface text-text-secondary uppercase text-[10px] border-b border-border sticky top-0">
            <tr>
              <th className="py-2.5 px-4 font-semibold">Observation Date</th>
              <th className="py-2.5 px-4 font-semibold text-right">Cash ($)</th>
              <th className="py-2.5 px-4 font-semibold text-right">Position (Units)</th>
              <th className="py-2.5 px-4 font-semibold text-right">Market Price ($)</th>
              <th className="py-2.5 px-4 font-semibold text-right">Position Value ($)</th>
              <th className="py-2.5 px-4 font-semibold text-right">Portfolio Value ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibleStates.map((s) => (
              <tr key={s.id} className="hover:bg-surface-hover transition-colors">
                <td className="py-2.5 px-4 text-text-secondary">{s.timestamp.split('T')[0]}</td>
                <td className="py-2.5 px-4 text-right">{formatCurrency(s.cash)}</td>
                <td className="py-2.5 px-4 text-right">{s.position_quantity.toFixed(4)}</td>
                <td className="py-2.5 px-4 text-right text-text-secondary">{formatCurrency(s.market_price)}</td>
                <td className="py-2.5 px-4 text-right">{formatCurrency(s.position_value)}</td>
                <td className="py-2.5 px-4 text-right font-bold text-brand-primary">{formatCurrency(s.portfolio_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
