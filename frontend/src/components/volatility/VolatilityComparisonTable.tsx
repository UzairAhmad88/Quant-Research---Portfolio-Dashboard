import React from 'react';
import { InstrumentVolatilityItem } from '../../lib/apiClient';

interface VolatilityComparisonTableProps {
  instruments: InstrumentVolatilityItem[];
  returnType: string;
  priceSource: string;
}

export const VolatilityComparisonTable: React.FC<VolatilityComparisonTableProps> = ({
  instruments,
  returnType,
  priceSource,
}) => {
  const formatPct = (val: number | null) => (val !== null ? `${(val * 100).toFixed(2)}%` : 'N/A');

  return (
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg overflow-hidden">
      <div className="p-4 border-b border-[#263244] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Volatility Comparison Summary</h3>
          <p className="text-xs text-slate-400">
            Multi-instrument variability metrics ({returnType.toUpperCase()} returns, {priceSource} price)
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          {instruments.length} Instruments Selected
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-[#0B1220] text-slate-400 border-b border-[#263244]">
            <tr>
              <th className="py-3 px-4 font-medium">Instrument</th>
              <th className="py-3 px-4 font-medium">Asset Type</th>
              <th className="py-3 px-4 font-medium text-right">Observations</th>
              <th className="py-3 px-4 font-medium text-right">Daily Volatility</th>
              <th className="py-3 px-4 font-medium text-right">Annualized Volatility</th>
              <th className="py-3 px-4 font-medium text-right">Upside Volatility</th>
              <th className="py-3 px-4 font-medium text-right">Downside Volatility</th>
              <th className="py-3 px-4 font-medium text-center">Factor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#263244] text-slate-200">
            {instruments.map((item) => (
              <tr key={item.instrument_id} className="hover:bg-[#1E293B]/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-100">{item.symbol}</div>
                  <div className="text-[11px] text-slate-500 font-sans">{item.name || item.symbol}</div>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-[#0B1220] border border-[#263244] text-slate-400">
                    {item.asset_type}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-slate-300">
                  {item.is_sufficient ? item.observation_count : <span className="text-amber-400">&lt; 30 (Insufficient)</span>}
                </td>
                <td className="py-3 px-4 text-right text-slate-200">{formatPct(item.daily_volatility)}</td>
                <td className="py-3 px-4 text-right font-semibold text-blue-400">
                  {formatPct(item.annualized_volatility)}
                </td>
                <td className="py-3 px-4 text-right text-emerald-400">{formatPct(item.upside_volatility)}</td>
                <td className="py-3 px-4 text-right text-amber-400">{formatPct(item.downside_volatility)}</td>
                <td className="py-3 px-4 text-center text-slate-400">
                  {item.annualization_factor}d
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
