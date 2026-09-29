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
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
      <div className="p-4 border-b border-border flex items-center justify-between bg-surface">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Volatility Comparison Summary</h3>
          <p className="text-xs text-text-muted">
            Multi-instrument variability metrics ({returnType.toUpperCase()} returns, {priceSource} price)
          </p>
        </div>
        <div className="text-xs text-text-muted font-mono">
          {instruments.length} Instruments Selected
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-surface text-text-muted border-b border-border">
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
          <tbody className="divide-y divide-border text-text-secondary">
            {instruments.map((item) => (
              <tr key={item.instrument_id} className="hover:bg-surface/60 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-text-primary">{item.symbol}</div>
                  <div className="text-[11px] text-text-muted font-sans">{item.name || item.symbol}</div>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] bg-surface-elevated border border-border text-text-secondary">
                    {item.asset_type}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-text-primary">
                  {item.is_sufficient ? item.observation_count : <span className="text-amber-600">&lt; 30 (Insufficient)</span>}
                </td>
                <td className="py-3 px-4 text-right text-text-primary">{formatPct(item.daily_volatility)}</td>
                <td className="py-3 px-4 text-right font-semibold text-brand-primary">
                  {formatPct(item.annualized_volatility)}
                </td>
                <td className="py-3 px-4 text-right text-financial-positive">{formatPct(item.upside_volatility)}</td>
                <td className="py-3 px-4 text-right text-amber-600">{formatPct(item.downside_volatility)}</td>
                <td className="py-3 px-4 text-center text-text-muted">
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
