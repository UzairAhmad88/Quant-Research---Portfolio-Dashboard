import React from 'react';
import { InstrumentVolatilityItem } from '../../lib/apiClient';

interface VolatilityComparisonChartProps {
  instruments: InstrumentVolatilityItem[];
}

export const VolatilityComparisonChart: React.FC<VolatilityComparisonChartProps> = ({ instruments }) => {
  const validItems = instruments.filter(
    (i) => i.is_sufficient && i.annualized_volatility !== null
  );

  if (validItems.length === 0) {
    return null;
  }

  const maxVol = Math.max(...validItems.map((i) => i.annualized_volatility as number), 0.1);

  return (
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Annualized Volatility Comparison</h3>
        <p className="text-xs text-slate-400">Relative annualized volatility across selected instruments</p>
      </div>

      <div className="space-y-3 font-mono text-xs">
        {validItems.map((item) => {
          const vol = item.annualized_volatility as number;
          const pctWidth = Math.min((vol / maxVol) * 100, 100);

          return (
            <div key={item.instrument_id} className="flex items-center gap-3">
              <div className="w-20 font-semibold text-slate-200 truncate" title={item.symbol}>
                {item.symbol}
              </div>
              <div className="flex-1 bg-[#0B1220] h-6 rounded border border-[#263244] overflow-hidden relative flex items-center px-2">
                <div
                  className="bg-blue-600/80 h-full absolute left-0 top-0 rounded-r transition-all duration-300"
                  style={{ width: `${pctWidth}%` }}
                />
                <span className="relative z-10 text-[11px] font-semibold text-slate-100">
                  {(vol * 100).toFixed(2)}%
                </span>
              </div>
              <div className="w-16 text-right text-slate-500 text-[11px]">
                {item.annualization_factor}d factor
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
