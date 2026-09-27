import React from 'react';

export const PortfolioAllocationWidget: React.FC = () => {
  const holdings = [
    { symbol: 'AAPL', name: 'Apple Inc.', pct: 28.4, color: '#3B82F6' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', pct: 22.1, color: '#06B6D4' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', pct: 15.7, color: '#10B981' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', pct: 12.3, color: '#F59E0B' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', pct: 11.8, color: '#A855F7' },
    { symbol: 'Others', name: 'Diversified', pct: 9.7, color: '#EC4899' },
  ];

  // SVG Donut calculation:
  // Circle radius 70, strokeWidth 24, center (100, 100)
  // Circumference = 2 * PI * 70 = 439.82
  const circumference = 2 * Math.PI * 70;
  let accumulatedPercent = 0;

  return (
    <div className="bg-[#0D1525] border border-[#17253D] rounded-lg p-4 shadow-md flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#17253D]">
        <h3 className="text-sm font-bold text-white tracking-tight">Portfolio Allocation</h3>
      </div>

      {/* Content: Donut Chart + Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-3">
        {/* Donut Chart SVG (5 cols) */}
        <div className="sm:col-span-6 flex items-center justify-center relative">
          <svg viewBox="0 0 200 200" className="w-44 h-44 -rotate-90 transform">
            {holdings.map((item, idx) => {
              const strokeDasharray = `${(item.pct / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += item.pct;

              return (
                <circle
                  key={idx}
                  cx="100"
                  cy="100"
                  r="70"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="24"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 hover:opacity-80"
                />
              );
            })}
          </svg>

          {/* Donut Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-base font-bold font-mono-num text-white">$124,840</span>
            <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-medium">Total Value</span>
          </div>
        </div>

        {/* Legend List (6 cols) */}
        <div className="sm:col-span-6 space-y-1.5 pl-2">
          {holdings.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="font-semibold text-[#E2E8F0]">{item.symbol}</span>
              </div>
              <span className="font-mono-num text-[#94A3B8] font-medium">{item.pct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
