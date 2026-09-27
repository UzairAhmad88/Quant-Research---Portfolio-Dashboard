import React from 'react';

export const PerformanceBenchmarkWidget: React.FC = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

  // Portfolio return series (%): starting 0 climbing to +28.4%
  const portfolioData = [0, 4.2, 2.1, 8.5, 6.4, 14.8, 18.2, 22.4, 28.4];

  // Benchmark SPY return series (%): starting 0 climbing to +12.1%
  const spyData = [0, 1.8, -1.2, 3.5, 4.8, 7.2, 8.9, 10.5, 12.1];

  // SVG viewBox: 0 0 500 160
  // Y range: -20% (y=140) to +40% (y=20)
  // X range: 40 to 440
  const yMap = (val: number) => 140 - ((val - (-20)) / (40 - (-20))) * 120;
  const xMap = (idx: number) => 40 + (idx / (months.length - 1)) * 390;

  const portPoints = portfolioData
    .map((val, idx) => `${xMap(idx).toFixed(1)},${yMap(val).toFixed(1)}`)
    .join(' ');

  const portAreaPoints = `40,${yMap(0)} ${portPoints} ${xMap(portfolioData.length - 1)},${yMap(0)}`;

  const spyPoints = spyData
    .map((val, idx) => `${xMap(idx).toFixed(1)},${yMap(val).toFixed(1)}`)
    .join(' ');

  return (
    <div className="bg-[#0D1525] border border-[#17253D] rounded-lg p-4 shadow-md flex flex-col justify-between">
      {/* Header with Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#17253D] gap-2">
        <h3 className="text-sm font-bold text-white tracking-tight">Performance vs Benchmark</h3>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span>
            <span className="text-[#E2E8F0] font-medium">Portfolio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
            <span className="text-[#94A3B8] font-medium">SPY (Benchmark)</span>
          </div>
        </div>
      </div>

      {/* Chart SVG */}
      <div className="relative w-full h-[175px] overflow-hidden pt-2">
        <svg viewBox="0 0 500 165" className="w-full h-full select-none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="port-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Grid lines & Y Axis */}
          {[40, 20, 0, -20].map((val) => {
            const y = yMap(val);
            return (
              <g key={val}>
                <line
                  x1="35"
                  y1={y}
                  x2="445"
                  y2={y}
                  stroke={val === 0 ? '#334155' : '#17253D'}
                  strokeDasharray={val === 0 ? 'none' : '3 3'}
                  strokeWidth="0.8"
                />
                <text x="5" y={y + 3} fill="#64748B" fontSize="9" fontFamily="monospace">
                  {val > 0 ? `+${val}%` : `${val}%`}
                </text>
              </g>
            );
          })}

          {/* Portfolio Area Fill */}
          <polygon points={portAreaPoints} fill="url(#port-grad)" />

          {/* SPY Line (Orange) */}
          <polyline
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={spyPoints}
          />

          {/* Portfolio Line (Blue) */}
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={portPoints}
          />

          {/* Right Badges */}
          {/* Portfolio Badge (+28.4% Blue) */}
          <g transform={`translate(435, ${yMap(28.4) - 9})`}>
            <rect x="0" y="0" width="55" height="18" fill="#1D4ED8" rx="3" />
            <text x="6" y="12" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">
              +28.4%
            </text>
          </g>

          {/* SPY Badge (+12.1% Orange) */}
          <g transform={`translate(435, ${yMap(12.1) - 9})`}>
            <rect x="0" y="0" width="55" height="18" fill="#B45309" rx="3" />
            <text x="6" y="12" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">
              +12.1%
            </text>
          </g>

          {/* X Axis Month Labels */}
          {months.map((m, idx) => (
            <text
              key={m}
              x={xMap(idx)}
              y="160"
              fill="#64748B"
              fontSize="9"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              {m}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};
