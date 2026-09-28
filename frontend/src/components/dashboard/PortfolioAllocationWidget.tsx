import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, ArrowRight } from 'lucide-react';

export interface PortfolioAllocationWidgetProps {
  onSelectInstrument?: (symbol: string) => void;
}

export const PortfolioAllocationWidget: React.FC<PortfolioAllocationWidgetProps> = ({
  onSelectInstrument,
}) => {
  const navigate = useNavigate();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const holdings = [

    { symbol: 'AAPL', name: 'Apple Inc.', value: 333815.87, pct: 28.4, color: '#3B82F6' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', value: 259765.17, pct: 22.1, color: '#06B6D4' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', value: 184539.05, pct: 15.7, color: '#10B981' },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', value: 144575.18, pct: 12.3, color: '#F59E0B' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', value: 138698.14, pct: 11.8, color: '#A855F7' },
    { symbol: 'CASH', name: 'USD Yield Buffer', value: 114014.58, pct: 9.7, color: '#64748B' },
  ];

  // SVG Donut calculation:
  // Circle radius 70, strokeWidth 24, center (100, 100)
  // Circumference = 2 * PI * 70 = 439.82
  const circumference = 2 * Math.PI * 70;
  let accumulatedPercent = 0;

  const activeHolding = hoveredIdx !== null ? holdings[hoveredIdx] : null;

  const handleHoldingClick = (symbol: string) => {
    if (symbol !== 'CASH' && onSelectInstrument) {
      onSelectInstrument(symbol);
    }
    navigate('/portfolios');
  };

  return (
    <div className="bg-[#0D1525] border border-[#17253D] rounded-lg p-4 shadow-md flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#17253D]">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-[#3B82F6]" />
          <h3 className="text-sm font-bold text-white tracking-tight">Portfolio Allocation (Alpha Tech)</h3>
        </div>
        <button
          onClick={() => navigate('/portfolios')}
          className="text-xs text-[#3B82F6] hover:text-[#60A5FA] flex items-center gap-1 font-medium group transition-colors"
        >
          Manage <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Content: Donut Chart + Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-3">
        {/* Donut Chart SVG (6 cols) */}
        <div className="sm:col-span-6 flex items-center justify-center relative">
          <svg viewBox="0 0 200 200" className="w-44 h-44 -rotate-90 transform cursor-pointer">
            {holdings.map((item, idx) => {
              const strokeDasharray = `${(item.pct / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += item.pct;
              const isHovered = hoveredIdx === idx;

              return (
                <circle
                  key={item.symbol}
                  cx="100"
                  cy="100"
                  r={isHovered ? '73' : '70'}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={isHovered ? '28' : '24'}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => handleHoldingClick(item.symbol)}
                  className="transition-all duration-200 cursor-pointer"
                  opacity={hoveredIdx === null || isHovered ? 1 : 0.45}
                />
              );
            })}
          </svg>

          {/* Donut Center Dynamic Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-base font-bold font-mono-num text-white">
              {activeHolding ? `$${activeHolding.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '$1,175,408'}
            </span>
            <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-semibold">
              {activeHolding ? `${activeHolding.symbol} (${activeHolding.pct}%)` : 'Total Alpha Value'}
            </span>
          </div>
        </div>

        {/* Legend List (6 cols) */}
        <div className="sm:col-span-6 space-y-1.5 pl-2">
          {holdings.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={item.symbol}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => handleHoldingClick(item.symbol)}
                role="button"
                tabIndex={0}
                className={`flex items-center justify-between p-1 rounded text-xs transition-all cursor-pointer ${
                  isHovered ? 'bg-[#152136] scale-[1.02]' : 'hover:bg-[#152136]/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform"
                    style={{
                      backgroundColor: item.color,
                      transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                    }}
                  ></span>
                  <span className="font-semibold text-[#E2E8F0] group-hover:text-white truncate">
                    {item.symbol}
                  </span>
                  <span className="text-[10px] text-[#64748B] hidden md:inline truncate">{item.name}</span>
                </div>
                <div className="text-right font-mono-num shrink-0">
                  <span className="text-[#E2E8F0] font-medium">{item.pct.toFixed(1)}%</span>
                  <span className="text-[10px] text-[#64748B] ml-1.5 hidden lg:inline">
                    ${(item.value / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
