import React, { useState } from 'react';
import { Settings, ChevronDown } from 'lucide-react';

export const DashboardMainChart: React.FC = () => {
  const [activeTimeframe, setActiveTimeframe] = useState('1Y');
  const [activeInterval, setActiveInterval] = useState('Daily');
  const [isIntervalOpen, setIsIntervalOpen] = useState(false);

  const timeframes = ['1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'];

  // 1-year simulated realistic candlestick data for AAPL
  // Simulating 52 weeks / months from Oct to Sep
  const months = ['Oct', 'Nov', 'Dec', '2026', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

  // Candlesticks coordinates normalized:
  // Chart coordinate space: viewBox="0 0 760 290"
  // Price range 150 to 250 -> height 210
  // Volume subpane -> y: 220 to 270 (height 50)
  // X range: 30 to 700

  // Generate 48 candlestick bars
  const candles = [
    { o: 172, h: 178, l: 168, c: 175, v: 45 },
    { o: 175, h: 182, l: 173, c: 180, v: 52 },
    { o: 180, h: 184, l: 177, c: 179, v: 40 },
    { o: 179, h: 186, l: 178, c: 185, v: 48 },
    { o: 185, h: 192, l: 183, c: 190, v: 60 },
    { o: 190, h: 196, l: 188, c: 194, v: 55 },
    { o: 194, h: 198, l: 191, c: 193, v: 42 },
    { o: 193, h: 197, l: 189, c: 191, v: 38 },
    { o: 191, h: 195, l: 187, c: 188, v: 44 },
    { o: 188, h: 190, l: 182, c: 184, v: 50 },
    { o: 184, h: 189, l: 181, c: 187, v: 46 },
    { o: 187, h: 194, l: 185, c: 192, v: 58 },
    { o: 192, h: 199, l: 190, c: 198, v: 62 },
    { o: 198, h: 202, l: 195, c: 197, v: 53 },
    { o: 197, h: 200, l: 192, c: 194, v: 49 },
    { o: 194, h: 196, l: 188, c: 190, v: 51 },
    { o: 190, h: 193, l: 184, c: 186, v: 56 },
    { o: 186, h: 188, l: 180, c: 182, v: 64 },
    { o: 182, h: 185, l: 178, c: 180, v: 70 },
    { o: 180, h: 183, l: 176, c: 178, v: 65 },
    { o: 178, h: 184, l: 175, c: 183, v: 54 },
    { o: 183, h: 189, l: 181, c: 187, v: 48 },
    { o: 187, h: 193, l: 185, c: 191, v: 52 },
    { o: 191, h: 198, l: 189, c: 196, v: 59 },
    { o: 196, h: 204, l: 194, c: 202, v: 66 },
    { o: 202, h: 208, l: 199, c: 206, v: 72 },
    { o: 206, h: 212, l: 204, c: 210, v: 68 },
    { o: 210, h: 216, l: 207, c: 214, v: 61 },
    { o: 214, h: 218, l: 210, c: 213, v: 55 },
    { o: 213, h: 217, l: 209, c: 211, v: 49 },
    { o: 211, h: 215, l: 208, c: 212, v: 50 },
    { o: 212, h: 219, l: 210, c: 217, v: 58 },
    { o: 217, h: 224, l: 215, c: 222, v: 67 },
    { o: 222, h: 228, l: 219, c: 226, v: 75 },
    { o: 226, h: 232, l: 224, c: 230, v: 80 },
    { o: 230, h: 234, l: 226, c: 228, v: 71 },
    { o: 228, h: 231, l: 222, c: 224, v: 63 },
    { o: 224, h: 227, l: 219, c: 221, v: 59 },
    { o: 221, h: 226, l: 218, c: 225, v: 62 },
    { o: 225, h: 230, l: 223, c: 228, v: 68 },
    { o: 228, h: 233, l: 226, c: 231, v: 74 },
    { o: 231, h: 236, l: 229, c: 234, v: 79 },
    { o: 234, h: 238, l: 230, c: 232, v: 72 },
    { o: 232, h: 235, l: 227, c: 229, v: 65 },
    { o: 229, h: 233, l: 225, c: 228, v: 58 },
    { o: 228, h: 232, l: 226, c: 230, v: 64 },
    { o: 230, h: 235, l: 228, c: 233, v: 70 },
    { o: 227.41, h: 229.83, l: 226.12, c: 228.90, v: 48.2 },
  ];

  // Map prices (150 to 250) to Y pixels (210 to 15)
  const minP = 150;
  const maxP = 245;
  const pToY = (p: number) => 210 - ((p - minP) / (maxP - minP)) * 195;

  // SMA 50 and 200 data points across the 48 candles
  const sma50Points = candles.map((_c, i) => {
    const x = 35 + (i / (candles.length - 1)) * 650;
    // trend starting around 175 climbing to 218.31
    const val = 173 + (i / (candles.length - 1)) * 45.31;
    return `${x.toFixed(1)},${pToY(val).toFixed(1)}`;
  }).join(' ');

  const sma200Points = candles.map((_c, i) => {
    const x = 35 + (i / (candles.length - 1)) * 650;
    // trend starting around 165 climbing to 203.74
    const val = 168 + (i / (candles.length - 1)) * 35.74;
    return `${x.toFixed(1)},${pToY(val).toFixed(1)}`;
  }).join(' ');

  return (
    <div className="bg-[#0D1525] border border-[#17253D] rounded-lg p-4 shadow-md flex flex-col justify-between">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#17253D]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">AAPL — Price Chart</h2>
          </div>
          <div className="text-xs text-[#94A3B8]">Apple Inc. • NASDAQ</div>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center bg-[#070D18] border border-[#17253D] rounded-md p-0.5">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-all ${
                  activeTimeframe === tf
                    ? 'bg-[#1D4ED8] text-white shadow-sm'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#152136]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Interval dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsIntervalOpen(!isIntervalOpen)}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#070D18] border border-[#17253D] text-[#94A3B8] hover:text-white text-xs rounded-md"
            >
              <span>{activeInterval}</span>
              <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
            </button>
            {isIntervalOpen && (
              <div className="absolute right-0 mt-1 py-1 w-24 bg-[#0D1525] border border-[#17253D] rounded shadow-lg z-10 text-xs">
                {['Daily', 'Weekly', 'Monthly'].map((intv) => (
                  <button
                    key={intv}
                    onClick={() => {
                      setActiveInterval(intv);
                      setIsIntervalOpen(false);
                    }}
                    className="w-full text-left px-3 py-1 text-[#94A3B8] hover:text-white hover:bg-[#152136]"
                  >
                    {intv}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <button className="p-1.5 bg-[#070D18] border border-[#17253D] text-[#94A3B8] hover:text-white rounded-md">
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* OHLC and indicator legend row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 pb-2 text-xs font-mono-num">
        <div className="flex items-center gap-2 text-[#94A3B8]">
          <span>O <strong className="text-[#E2E8F0] font-medium">227.41</strong></span>
          <span>H <strong className="text-[#E2E8F0] font-medium">229.83</strong></span>
          <span>L <strong className="text-[#E2E8F0] font-medium">226.12</strong></span>
          <span>C <strong className="text-[#E2E8F0] font-medium">228.90</strong></span>
          <span className="text-[#22C55E] font-medium">+1.84 (+0.81%)</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#3B82F6]"></span>
          <span>SMA (50) <strong className="text-[#3B82F6]">218.31</strong></span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#F97316]"></span>
          <span>SMA (200) <strong className="text-[#F97316]">203.74</strong></span>
        </div>
      </div>

      {/* Main Chart Canvas / SVG */}
      <div className="relative w-full h-[280px] overflow-hidden pt-1">
        <svg viewBox="0 0 760 280" className="w-full h-full select-none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="vol-grad-green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#22C55E" stopOpacity={0.15} />
            </linearGradient>
            <linearGradient id="vol-grad-red" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0.15} />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[240, 220, 200, 180, 160].map((price) => {
            const y = pToY(price);
            return (
              <g key={price}>
                <line x1="30" y1={y} x2="690" y2={y} stroke="#17253D" strokeDasharray="3 3" strokeWidth="0.8" />
                <text x="700" y={y + 3} fill="#64748B" fontSize="10" fontFamily="monospace">
                  {price.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Volume subpane separator */}
          <line x1="30" y1="215" x2="690" y2="215" stroke="#1E293B" strokeWidth="1" />
          <text x="700" y="240" fill="#64748B" fontSize="9" fontFamily="monospace">
            120M
          </text>

          {/* Candlesticks & Volume bars */}
          {candles.map((c, i) => {
            const x = 35 + (i / (candles.length - 1)) * 650;
            const isUp = c.c >= c.o;
            const yHigh = pToY(c.h);
            const yLow = pToY(c.l);
            const yOpen = pToY(c.o);
            const yClose = pToY(c.c);
            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1.5);
            const candleColor = isUp ? '#22C55E' : '#EF4444';

            // Volume bar (from y=265 upwards)
            const volHeight = (c.v / 90) * 45;
            const volY = 265 - volHeight;

            return (
              <g key={i}>
                {/* Volume bar */}
                <rect
                  x={x - 4}
                  y={volY}
                  width="8"
                  height={volHeight}
                  fill={isUp ? 'url(#vol-grad-green)' : 'url(#vol-grad-red)'}
                  rx="1"
                />

                {/* Candle Wick */}
                <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={candleColor} strokeWidth="1.2" />

                {/* Candle Body */}
                <rect
                  x={x - 4}
                  y={bodyTop}
                  width="8"
                  height={bodyHeight}
                  fill={isUp ? '#22C55E' : '#EF4444'}
                  stroke={candleColor}
                  strokeWidth="0.5"
                  rx="0.5"
                />
              </g>
            );
          })}

          {/* SMA Lines */}
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={sma50Points}
          />
          <polyline
            fill="none"
            stroke="#F97316"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={sma200Points}
          />

          {/* Right Y-axis live price tags */}
          {/* Current Price tag (228.90 Green) */}
          <g transform={`translate(695, ${pToY(228.90) - 8})`}>
            <rect x="0" y="0" width="55" height="16" fill="#166534" rx="2" />
            <text x="5" y="11" fill="#86EFAC" fontSize="9" fontWeight="bold" fontFamily="monospace">
              228.90
            </text>
          </g>

          {/* SMA 50 tag (218.31 Blue) */}
          <g transform={`translate(695, ${pToY(218.31) - 8})`}>
            <rect x="0" y="0" width="55" height="16" fill="#1E3A8A" rx="2" />
            <text x="5" y="11" fill="#93C5FD" fontSize="9" fontWeight="bold" fontFamily="monospace">
              218.31
            </text>
          </g>

          {/* SMA 200 tag (203.74 Orange) */}
          <g transform={`translate(695, ${pToY(203.74) - 8})`}>
            <rect x="0" y="0" width="55" height="16" fill="#7C2D12" rx="2" />
            <text x="5" y="11" fill="#FDBA74" fontSize="9" fontWeight="bold" fontFamily="monospace">
              203.74
            </text>
          </g>

          {/* Live volume badge */}
          <g transform="translate(35, 230)">
            <rect x="0" y="0" width="10" height="10" fill="#22C55E" rx="2" />
            <text x="16" y="9" fill="#94A3B8" fontSize="10" fontFamily="monospace">
              Volume <tspan fill="#22C55E" fontWeight="bold">48.2M</tspan>
            </text>
          </g>

          {/* X Axis Month Labels */}
          {months.map((m, idx) => {
            const x = 35 + (idx / (months.length - 1)) * 650;
            return (
              <text
                key={m}
                x={x}
                y="278"
                fill={m === '2026' ? '#E2E8F0' : '#64748B'}
                fontSize="10"
                fontWeight={m === '2026' ? 'bold' : 'normal'}
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {m}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
