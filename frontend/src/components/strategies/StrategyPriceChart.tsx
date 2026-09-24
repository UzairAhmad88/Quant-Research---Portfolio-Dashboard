import React, { useState, useMemo } from 'react';
import { StrategyObservation, CrossoverEvent } from '../../lib/apiClient';

interface StrategyPriceChartProps {
  series: StrategyObservation[];
  crossovers: CrossoverEvent[];
  symbol: string;
  fastWindow: number;
  slowWindow: number;
  maType: string;
}

export const StrategyPriceChart: React.FC<StrategyPriceChartProps> = ({
  series,
  crossovers,
  symbol,
  fastWindow,
  slowWindow,
  maType,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute min/max scale across prices and MAs
  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    series.forEach((pt) => {
      if (pt.price !== null && !isNaN(pt.price)) {
        min = Math.min(min, pt.price);
        max = Math.max(max, pt.price);
      }
      if (pt.fast_ma !== null && !isNaN(pt.fast_ma)) {
        min = Math.min(min, pt.fast_ma);
        max = Math.max(max, pt.fast_ma);
      }
      if (pt.slow_ma !== null && !isNaN(pt.slow_ma)) {
        min = Math.min(min, pt.slow_ma);
        max = Math.max(max, pt.slow_ma);
      }
    });

    if (min === Infinity) return { minVal: 0, maxVal: 100 };
    const pad = (max - min) * 0.08;
    return { minVal: min - pad, maxVal: max + pad };
  }, [series]);

  const chartHeight = 320;
  const padding = { top: 25, right: 35, bottom: 45, left: 65 };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  const formatPrice = (val: number | null) => (val !== null ? `$${val.toFixed(2)}` : 'N/A');

  if (series.length === 0) {
    return (
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-6 text-center text-slate-400">
        No price or strategy data available.
      </div>
    );
  }

  const hoverPoint = hoveredIndex !== null ? series[hoveredIndex] : null;

  return (
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-5">
      {/* Chart Header & Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            Price &amp; Moving Average Overlay ({symbol})
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            {maType} Fast ({fastWindow}d) vs Slow ({slowWindow}d) Crossover Overlay
          </p>
        </div>

        {/* Legend & Hover Info */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-slate-400 rounded-full" />
            <span className="text-slate-400">Price</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-blue-500 rounded-full" />
            <span className="text-blue-400">Fast MA ({fastWindow})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-500 rounded-full" />
            <span className="text-amber-400">Slow MA ({slowWindow})</span>
          </div>
        </div>
      </div>

      {/* Hover Info Tooltip Header */}
      {hoverPoint && (
        <div className="bg-[#0B1220]/90 border border-[#263244] px-3 py-2 rounded mb-3 flex flex-wrap items-center justify-between font-mono text-xs text-slate-300">
          <div>
            <span className="text-slate-500 mr-1.5">Date:</span>
            <span className="text-slate-200 font-semibold">{formatDate(hoverPoint.timestamp)}</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1.5">Price:</span>
            <span className="text-slate-200 font-semibold">{formatPrice(hoverPoint.price)}</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1.5">Fast MA:</span>
            <span className="text-blue-400 font-semibold">{formatPrice(hoverPoint.fast_ma)}</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1.5">Slow MA:</span>
            <span className="text-amber-400 font-semibold">{formatPrice(hoverPoint.slow_ma)}</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1.5">Signal:</span>
            <span
              className={`font-semibold ${
                hoverPoint.signal === 'BUY'
                  ? 'text-emerald-400'
                  : hoverPoint.signal === 'SELL'
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}
            >
              {hoverPoint.signal}
            </span>
          </div>
        </div>
      )}

      {/* SVG Canvas Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 800 ${chartHeight}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Y Axis Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
            const yVal = minVal + (maxVal - minVal) * (1 - ratio);
            const yPos = padding.top + ratio * (chartHeight - padding.top - padding.bottom);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={800 - padding.right}
                  y2={yPos}
                  stroke="#1E293B"
                  strokeDasharray={ratio === 0 ? undefined : '3 3'}
                />
                <text
                  x={padding.left - 8}
                  y={yPos + 4}
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  ${yVal.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Helper function to generate SVG path string */}
          {(() => {
            const totalWidth = 800 - padding.left - padding.right;
            const totalHeight = chartHeight - padding.top - padding.bottom;

            const getX = (idx: number) =>
              padding.left + (idx / (series.length - 1 || 1)) * totalWidth;

            const getY = (val: number) => {
              const norm = (val - minVal) / (maxVal - minVal || 1);
              return chartHeight - padding.bottom - norm * totalHeight;
            };

            // 1. Price Path
            const pricePath = series.reduce((acc, pt, idx) => {
              const x = getX(idx);
              const y = getY(pt.price);
              return acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
            }, '');

            // 2. Fast MA Path
            const fastPath = series.reduce((acc, pt, idx) => {
              if (pt.fast_ma === null) return acc;
              const x = getX(idx);
              const y = getY(pt.fast_ma);
              return acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
            }, '');

            // 3. Slow MA Path
            const slowPath = series.reduce((acc, pt, idx) => {
              if (pt.slow_ma === null) return acc;
              const x = getX(idx);
              const y = getY(pt.slow_ma);
              return acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
            }, '');

            return (
              <>
                {/* Price Line */}
                <path d={pricePath} fill="none" stroke="#64748B" strokeWidth="1.5" strokeOpacity="0.8" />

                {/* Slow MA Line */}
                <path d={slowPath} fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />

                {/* Fast MA Line */}
                <path d={fastPath} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />

                {/* Crossover Markers */}
                {crossovers.map((cross, cIdx) => {
                  const sIdx = series.findIndex((pt) => pt.timestamp === cross.timestamp);
                  if (sIdx === -1) return null;

                  const x = getX(sIdx);
                  const y = getY(cross.price);
                  const isBullish = cross.event_type === 'BULLISH';

                  return (
                    <g key={cIdx} className="cursor-pointer">
                      {isBullish ? (
                        // Bullish BUY Triangle Marker (▲)
                        <polygon
                          points={`${x},${y - 14} ${x - 6},${y - 4} ${x + 6},${y - 4}`}
                          fill="#10B981"
                          stroke="#0B1220"
                          strokeWidth="1.5"
                        />
                      ) : (
                        // Bearish SELL Triangle Marker (▼)
                        <polygon
                          points={`${x},${y + 14} ${x - 6},${y + 4} ${x + 6},${y + 4}`}
                          fill="#F59E0B"
                          stroke="#0B1220"
                          strokeWidth="1.5"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Invisible hover rects */}
                {series.map((_, idx) => {
                  const x = getX(idx);
                  const colWidth = totalWidth / series.length;
                  return (
                    <rect
                      key={idx}
                      x={x - colWidth / 2}
                      y={padding.top}
                      width={colWidth}
                      height={totalHeight}
                      fill="transparent"
                      className="cursor-crosshair"
                      onMouseEnter={() => setHoveredIndex(idx)}
                    />
                  );
                })}

                {/* Hover Vertical Crosshair Line */}
                {hoveredIndex !== null && (
                  <g>
                    <line
                      x1={getX(hoveredIndex)}
                      y1={padding.top}
                      x2={getX(hoveredIndex)}
                      y2={chartHeight - padding.bottom}
                      stroke="#475569"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={getX(hoveredIndex)}
                      cy={getY(series[hoveredIndex].price)}
                      r="4"
                      fill="#3B82F6"
                      stroke="#0B1220"
                      strokeWidth="2"
                    />
                  </g>
                )}
              </>
            );
          })()}

          {/* X Axis Time Labels */}
          {series.length > 0 &&
            [0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
              const idx = Math.min(
                Math.floor(ratio * (series.length - 1)),
                series.length - 1
              );
              const pt = series[idx];
              const x = padding.left + ratio * (800 - padding.left - padding.right);

              return (
                <text
                  key={ratio}
                  x={x}
                  y={chartHeight - 12}
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {formatDate(pt.timestamp)}
                </text>
              );
            })}
        </svg>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-mono">
        <span>▲ Green = Bullish BUY Crossover | ▼ Amber = Bearish SELL Crossover</span>
        <span>Warm-up offset: First {slowWindow - 1} bars</span>
      </div>
    </div>
  );
};
