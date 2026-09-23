import React from 'react';
import { AllocationItem } from '../../lib/apiClient';

interface PortfolioAllocationChartProps {
  items: AllocationItem[];
}

export const PortfolioAllocationChart: React.FC<PortfolioAllocationChartProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-500">
        <p className="text-sm font-medium">No allocation data available</p>
      </div>
    );
  }

  const totalValue = items.reduce((acc, curr) => acc + curr.value, 0);

  // Generate SVG pie segments
  let cumulativePercent = 0;
  const segments = items.map((item) => {
    const startPercent = cumulativePercent;
    const itemPercent = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    cumulativePercent += itemPercent;
    return {
      ...item,
      startPercent,
      itemPercent,
    };
  });

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * (percent / 100));
    const y = Math.sin(2 * Math.PI * (percent / 100));
    return [x, y];
  };

  return (
    <div className="flex flex-col space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Portfolio Allocation</h3>
          <p className="text-xs text-slate-400">Asset distribution by invested market value</p>
        </div>
        <span className="font-mono text-xs font-semibold text-slate-400">
          Total: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
        {/* SVG Donut Chart */}
        <div className="flex items-center justify-center md:col-span-5">
          <div className="relative h-44 w-44">
            <svg viewBox="-1 -1 2 2" className="h-full w-full -rotate-90 transform overflow-visible">
              {segments.map((seg, idx) => {
                if (seg.itemPercent >= 99.99) {
                  return (
                    <circle
                      key={idx}
                      cx="0"
                      cy="0"
                      r="0.75"
                      fill="none"
                      stroke={seg.color || '#3B82F6'}
                      strokeWidth="0.35"
                    />
                  );
                }

                const [startX, startY] = getCoordinatesForPercent(seg.startPercent);
                const [endX, endY] = getCoordinatesForPercent(seg.startPercent + seg.itemPercent);
                const largeArcFlag = seg.itemPercent > 50 ? 1 : 0;
                const pathData = [
                  `M ${startX * 0.75} ${startY * 0.75}`,
                  `A 0.75 0.75 0 ${largeArcFlag} 1 ${endX * 0.75} ${endY * 0.75}`,
                ].join(' ');

                return (
                  <path
                    key={idx}
                    d={pathData}
                    fill="none"
                    stroke={seg.color || '#3B82F6'}
                    strokeWidth="0.35"
                    className="transition-all duration-300 hover:opacity-80"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Holdings</span>
              <span className="font-mono text-base font-bold text-slate-100">{items.length}</span>
            </div>
          </div>
        </div>

        {/* Legend Table */}
        <div className="space-y-2 md:col-span-7">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded border border-slate-800/60 bg-slate-950/40 px-3 py-2 text-xs"
            >
              <div className="flex items-center space-x-2.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color || '#3B82F6' }} />
                <span className="font-semibold text-slate-200">{item.label}</span>
                {item.symbol && item.symbol !== item.label && (
                  <span className="font-mono text-slate-500">({item.symbol})</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-mono text-slate-300">
                  ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="w-12 text-right font-mono font-semibold text-blue-400">
                  {item.weight.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
