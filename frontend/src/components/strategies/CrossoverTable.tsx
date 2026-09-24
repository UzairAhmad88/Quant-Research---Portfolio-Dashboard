import React, { useState, useMemo } from 'react';
import { CrossoverEvent } from '../../lib/apiClient';
import { filterCrossoverEvents, sortCrossoverEvents, formatDateLabel, formatCurrency } from '../../lib/strategyChartAdapter';
import { Filter, ArrowUpDown } from 'lucide-react';

interface CrossoverTableProps {
  crossovers: CrossoverEvent[];
  symbol: string;
}

export const CrossoverTable: React.FC<CrossoverTableProps> = ({ crossovers, symbol }) => {
  const [filterMode, setFilterMode] = useState<'all' | 'buy' | 'sell'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const processedCrossovers = useMemo(() => {
    const filtered = filterCrossoverEvents(crossovers, filterMode);
    return sortCrossoverEvents(filtered, sortOrder);
  }, [crossovers, filterMode, sortOrder]);

  return (
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-4 border-b border-[#263244] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            Signal &amp; Crossover History Log ({symbol})
          </h3>
          <p className="text-xs text-slate-400">
            Discrete moving-average crossover events generated from validated price observations
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          {/* Signal Filter */}
          <div className="flex items-center gap-1.5 bg-[#0B1220] border border-[#263244] px-2 py-1 rounded">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as 'all' | 'buy' | 'sell')}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Signals ({crossovers.length})</option>
              <option value="buy">BUY Only</option>
              <option value="sell">SELL Only</option>
            </select>
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 bg-[#0B1220] border border-[#263244] px-2.5 py-1 rounded text-slate-300 hover:text-slate-100 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {processedCrossovers.length === 0 ? (
        <div className="p-8 text-center text-slate-500 font-mono text-xs">
          No crossover events match current filter selection ({filterMode.toUpperCase()}).
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#0B1220] text-slate-400 border-b border-[#263244]">
              <tr>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Signal Event</th>
                <th className="py-3 px-4 font-medium">Crossover Type</th>
                <th className="py-3 px-4 font-medium text-right">Observation Price</th>
                <th className="py-3 px-4 font-medium text-right">Fast MA</th>
                <th className="py-3 px-4 font-medium text-right">Slow MA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263244] text-slate-200">
              {processedCrossovers.map((cross, idx) => {
                const isBullish = cross.event_type === 'BULLISH';
                return (
                  <tr key={idx} className="hover:bg-[#1E293B]/50 transition-colors">
                    <td className="py-3 px-4 text-slate-300">{formatDateLabel(cross.timestamp)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded border text-[11px] font-bold ${
                          isBullish
                            ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80'
                            : 'text-amber-400 bg-amber-950/60 border-amber-800/80'
                        }`}
                      >
                        {cross.signal}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-400">{cross.event_type}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-100">
                      {formatCurrency(cross.price)}
                    </td>
                    <td className="py-3 px-4 text-right text-blue-400">{formatCurrency(cross.fast_ma)}</td>
                    <td className="py-3 px-4 text-right text-amber-400">{formatCurrency(cross.slow_ma)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
