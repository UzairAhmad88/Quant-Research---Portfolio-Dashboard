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
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-8 text-center text-sm text-[#94A3B8]">
        Loading portfolio state history...
      </div>
    );
  }

  if (!states || states.length === 0) {
    return (
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-8 text-center text-sm text-[#94A3B8]">
        No portfolio state history records available.
      </div>
    );
  }

  const visibleStates = states.slice(0, displayCount);

  return (
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg overflow-hidden">
      <div className="p-4 border-b border-[#263244] flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[#E5E7EB] uppercase tracking-wider font-mono">
          Portfolio Simulation State History ({states.length} bars)
        </h4>
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <span>Showing top {visibleStates.length} records</span>
          {states.length > displayCount && (
            <button
              onClick={() => setDisplayCount((prev) => prev + 200)}
              className="px-2 py-0.5 rounded bg-[#111827] text-[#3B82F6] border border-[#263244] hover:bg-[#1f293d]"
            >
              Load More
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-left text-xs text-[#E5E7EB] font-mono">
          <thead className="bg-[#111827] text-[#94A3B8] uppercase text-[10px] border-b border-[#263244] sticky top-0">
            <tr>
              <th className="py-2.5 px-4 font-semibold">Observation Date</th>
              <th className="py-2.5 px-4 font-semibold text-right">Cash ($)</th>
              <th className="py-2.5 px-4 font-semibold text-right">Position (Units)</th>
              <th className="py-2.5 px-4 font-semibold text-right">Market Price ($)</th>
              <th className="py-2.5 px-4 font-semibold text-right">Position Value ($)</th>
              <th className="py-2.5 px-4 font-semibold text-right">Portfolio Value ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#263244]">
            {visibleStates.map((s) => (
              <tr key={s.id} className="hover:bg-[#111827]/50 transition-colors">
                <td className="py-2.5 px-4 text-[#94A3B8]">{s.timestamp.split('T')[0]}</td>
                <td className="py-2.5 px-4 text-right">{formatCurrency(s.cash)}</td>
                <td className="py-2.5 px-4 text-right">{s.position_quantity.toFixed(4)}</td>
                <td className="py-2.5 px-4 text-right text-[#94A3B8]">{formatCurrency(s.market_price)}</td>
                <td className="py-2.5 px-4 text-right">{formatCurrency(s.position_value)}</td>
                <td className="py-2.5 px-4 text-right font-medium text-[#3B82F6]">{formatCurrency(s.portfolio_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
