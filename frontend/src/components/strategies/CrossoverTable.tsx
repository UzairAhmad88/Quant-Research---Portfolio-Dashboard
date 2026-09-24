import React from 'react';
import { CrossoverEvent } from '../../lib/apiClient';

interface CrossoverTableProps {
  crossovers: CrossoverEvent[];
  symbol: string;
}

export const CrossoverTable: React.FC<CrossoverTableProps> = ({ crossovers, symbol }) => {
  const formatDate = (isoStr: string) => {
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

  const formatPrice = (val: number) => `$${val.toFixed(2)}`;

  return (
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg overflow-hidden">
      <div className="p-4 border-b border-[#263244] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            Signal &amp; Crossover History Log ({symbol})
          </h3>
          <p className="text-xs text-slate-400">
            Discrete moving-average crossover events generated from validated price observations
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          {crossovers.length} Events Recorded
        </div>
      </div>

      {crossovers.length === 0 ? (
        <div className="p-8 text-center text-slate-500 font-mono text-xs">
          No crossover events generated in selected period. Moving averages remained on the same side.
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
              {crossovers.map((cross, idx) => {
                const isBullish = cross.event_type === 'BULLISH';
                return (
                  <tr key={idx} className="hover:bg-[#1E293B]/50 transition-colors">
                    <td className="py-3 px-4 text-slate-300">{formatDate(cross.timestamp)}</td>
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
                      {formatPrice(cross.price)}
                    </td>
                    <td className="py-3 px-4 text-right text-blue-400">{formatPrice(cross.fast_ma)}</td>
                    <td className="py-3 px-4 text-right text-amber-400">{formatPrice(cross.slow_ma)}</td>
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
