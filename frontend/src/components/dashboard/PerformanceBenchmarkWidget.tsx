import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';


export const PerformanceBenchmarkWidget: React.FC = () => {
  const navigate = useNavigate();
  const [activeBenchmark, setActiveBenchmark] = useState<'SPY' | 'QQQ' | 'DIA'>('SPY');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

  // Portfolio return series (%): starting 0 climbing to +32.4%
  const portfolioData = [0, 4.2, 2.1, 8.5, 6.4, 14.8, 18.2, 22.4, 28.4, 32.4];

  // Benchmark datasets
  const benchmarkDatasets: Record<'SPY' | 'QQQ' | 'DIA', { name: string; data: number[]; finalReturn: number; color: string }> = {
    SPY: {
      name: 'S&P 500 ETF',
      data: [0, 1.8, -1.2, 3.5, 4.8, 7.2, 8.9, 10.5, 12.1, 14.6],
      finalReturn: 14.6,
      color: '#D97706',
    },
    QQQ: {
      name: 'Nasdaq 100 ETF',
      data: [0, 2.9, 0.4, 5.8, 7.1, 11.4, 14.2, 16.8, 19.5, 22.8],
      finalReturn: 22.8,
      color: '#2563EB',
    },
    DIA: {
      name: 'Dow Jones ETF',
      data: [0, 0.9, -2.1, 1.4, 2.6, 4.8, 6.2, 7.4, 8.8, 10.2],
      finalReturn: 10.2,
      color: '#64748B',
    },
  };

  const currentBm = benchmarkDatasets[activeBenchmark];
  const spyData = currentBm.data;

  // SVG viewBox: 0 0 500 165
  // Y range: -10% (y=140) to +40% (y=20)
  // X range: 40 to 430
  const yMap = (val: number) => 140 - ((val - (-10)) / (45 - (-10))) * 120;
  const xMap = (idx: number) => 40 + (idx / (months.length - 1)) * 390;

  const portPoints = portfolioData
    .map((val, idx) => `${xMap(idx).toFixed(1)},${yMap(val).toFixed(1)}`)
    .join(' ');

  const portAreaPoints = `40,${yMap(0)} ${portPoints} ${xMap(portfolioData.length - 1)},${yMap(0)}`;

  const spyPoints = spyData
    .map((val, idx) => `${xMap(idx).toFixed(1)},${yMap(val).toFixed(1)}`)
    .join(' ');

  const activePort = hoveredIdx !== null ? portfolioData[hoveredIdx] : portfolioData[portfolioData.length - 1];
  const activeBm = hoveredIdx !== null ? spyData[hoveredIdx] : spyData[spyData.length - 1];
  const activeMonth = hoveredIdx !== null ? months[hoveredIdx] : 'YTD Final';
  const alphaSpread = (activePort - activeBm).toFixed(2);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
      {/* Header with Benchmark Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#E5E7EB] gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#14532D]" />
          <h3 className="text-sm font-bold text-[#17211B] tracking-tight">Performance vs Benchmark</h3>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Benchmark Selector Tabs */}
          <div className="flex items-center bg-[#F8FAF9] border border-[#CBD5E1] rounded-md p-0.5">
            {(['SPY', 'QQQ', 'DIA'] as const).map((bm) => (
              <button
                key={bm}
                onClick={() => setActiveBenchmark(bm)}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-all ${
                  activeBenchmark === bm
                    ? 'bg-[#14532D] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#17211B] hover:bg-[#F0FDF4]'
                }`}
              >
                {bm}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/returns')}
            className="text-xs text-[#14532D] hover:text-[#166534] flex items-center gap-1 font-semibold group transition-colors"
          >
            Deep Dive <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Dynamic Telemetry HUD */}
      <div className="flex items-center justify-between pt-2 text-xs font-mono-num">
        <div className="flex items-center gap-3">
          <span className="text-[#64748B] text-[11px]">{activeMonth}</span>
          <span className="text-[#14532D] font-bold">Portfolio: +{activePort.toFixed(1)}%</span>
          <span className="font-semibold" style={{ color: currentBm.color }}>
            {activeBenchmark}: +{activeBm.toFixed(1)}%
          </span>
        </div>
        <div className="text-xs font-bold text-[#15803D]">
          Alpha Spread: +{alphaSpread}%
        </div>
      </div>

      {/* Chart SVG */}
      <div
        className="relative w-full h-[165px] overflow-hidden pt-1 cursor-crosshair"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <svg
          viewBox="0 0 500 165"
          className="w-full h-full select-none"
          preserveAspectRatio="none"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * 500;
            const idx = Math.round(((mouseX - 40) / 390) * (months.length - 1));
            if (idx >= 0 && idx < months.length) {
              setHoveredIdx(idx);
            }
          }}
        >
          <defs>
            <linearGradient id="port-grad-green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14532D" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#DCFCE7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y Axis */}
          {[40, 20, 0, -10].map((val) => {
            const y = yMap(val);
            return (
              <g key={val}>
                <line
                  x1="35"
                  y1={y}
                  x2="445"
                  y2={y}
                  stroke={val === 0 ? '#CBD5E1' : '#E5E7EB'}
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
          <polygon points={portAreaPoints} fill="url(#port-grad-green)" />

          {/* Benchmark Line */}
          <polyline
            fill="none"
            stroke={currentBm.color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={spyPoints}
          />

          {/* Portfolio Line (Forest Green) */}
          <polyline
            fill="none"
            stroke="#14532D"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={portPoints}
          />

          {/* Interactive Hover Crosshair */}
          {hoveredIdx !== null && (
            <g>
              <line
                x1={xMap(hoveredIdx)}
                y1="10"
                x2={xMap(hoveredIdx)}
                y2="145"
                stroke="#166534"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <circle cx={xMap(hoveredIdx)} cy={yMap(activePort)} r="3.5" fill="#14532D" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx={xMap(hoveredIdx)} cy={yMap(activeBm)} r="3.5" fill={currentBm.color} stroke="#FFFFFF" strokeWidth="1.5" />
            </g>
          )}

          {/* Right Badges */}
          <g transform={`translate(435, ${yMap(32.4) - 9})`}>
            <rect x="0" y="0" width="55" height="18" fill="#14532D" rx="3" />
            <text x="6" y="12" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">
              +32.4%
            </text>
          </g>

          <g transform={`translate(435, ${yMap(currentBm.finalReturn) - 9})`}>
            <rect x="0" y="0" width="55" height="18" fill="#64748B" rx="3" />
            <text x="6" y="12" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">
              +{currentBm.finalReturn}%
            </text>
          </g>

          {/* X Axis Month Labels */}
          {months.map((m, idx) => (
            <text
              key={m}
              x={xMap(idx)}
              y="160"
              fill={hoveredIdx === idx ? '#17211B' : '#64748B'}
              fontWeight={hoveredIdx === idx ? 'bold' : 'normal'}
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
