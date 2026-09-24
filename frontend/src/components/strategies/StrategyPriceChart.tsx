import React, { useState, useMemo } from 'react';
import { StrategyObservation, CrossoverEvent } from '../../lib/apiClient';
import { calculateChartBounds, formatDateLabel, formatCurrency } from '../../lib/strategyChartAdapter';
import { Maximize2, Minimize2 } from 'lucide-react';

interface StrategyPriceChartProps {
  series: StrategyObservation[];
  crossovers: CrossoverEvent[];
  symbol: string;
  fastWindow: number;
  slowWindow: number;
  maType: string;
  chartType?: 'candlestick' | 'line';
  showFastMA?: boolean;
  showSlowMA?: boolean;
  showSignals?: boolean;
  showVolume?: boolean;
}

export const StrategyPriceChart: React.FC<StrategyPriceChartProps> = ({
  series,
  crossovers,
  symbol,
  fastWindow,
  slowWindow,
  maType,
  chartType = 'candlestick',
  showFastMA = true,
  showSlowMA = true,
  showSignals = true,
  showVolume = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Calculate chart bounds using adapter
  const { minVal, maxVal } = useMemo(() => calculateChartBounds(series), [series]);

  const baseChartHeight = isFullscreen ? 500 : 320;
  const padding = { top: 25, right: 35, bottom: showVolume ? 65 : 45, left: 65 };

  if (series.length === 0) {
    return (
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-6 text-center text-slate-400 font-mono text-xs">
        No price or strategy data available.
      </div>
    );
  }

  const hoverPoint = hoveredIndex !== null ? series[hoveredIndex] : null;

  const chartContent = (
    <div className={`bg-[#151F2E] border border-[#263244] rounded-lg p-5 ${isFullscreen ? 'h-full flex flex-col justify-between' : ''}`}>
      {/* Chart Header & Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            Price &amp; Technical Overlay Chart ({symbol})
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0B1220] border border-[#263244] text-slate-400">
              {chartType.toUpperCase()}
            </span>
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            {maType} Fast ({fastWindow}d) vs Slow ({slowWindow}d) Overlay
          </p>
        </div>

        {/* Legend & Fullscreen toggle */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-slate-400 rounded-full" />
            <span className="text-slate-400">Price</span>
          </div>
          {showFastMA && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-blue-500 rounded-full" />
              <span className="text-blue-400">Fast MA ({fastWindow})</span>
            </div>
          )}
          {showSlowMA && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-amber-500 rounded-full" />
              <span className="text-amber-400">Slow MA ({slowWindow})</span>
            </div>
          )}
          {showSignals && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-bold">▲</span> BUY / <span className="text-amber-400 font-bold">▼</span> SELL
            </div>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 bg-[#0B1220] border border-[#263244] rounded text-slate-400 hover:text-slate-200 transition-colors ml-2"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Hover Info Tooltip Header */}
      {hoverPoint && (
        <div className="bg-[#0B1220]/90 border border-[#263244] px-3 py-2 rounded mb-3 flex flex-wrap items-center justify-between font-mono text-xs text-slate-300">
          <div>
            <span className="text-slate-500 mr-1.5">Date:</span>
            <span className="text-slate-200 font-semibold">{formatDateLabel(hoverPoint.timestamp)}</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1.5">Price:</span>
            <span className="text-slate-200 font-semibold">{formatCurrency(hoverPoint.price)}</span>
          </div>
          {showFastMA && (
            <div>
              <span className="text-slate-500 mr-1.5">Fast MA:</span>
              <span className="text-blue-400 font-semibold">{formatCurrency(hoverPoint.fast_ma)}</span>
            </div>
          )}
          {showSlowMA && (
            <div>
              <span className="text-slate-500 mr-1.5">Slow MA:</span>
              <span className="text-amber-400 font-semibold">{formatCurrency(hoverPoint.slow_ma)}</span>
            </div>
          )}
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
      <div className="relative w-full overflow-hidden flex-1">
        <svg
          viewBox={`0 0 800 ${baseChartHeight}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Y Axis Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
            const yVal = minVal + (maxVal - minVal) * (1 - ratio);
            const yPos = padding.top + ratio * (baseChartHeight - padding.top - padding.bottom);
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

          {/* SVG Elements Rendering */}
          {(() => {
            const totalWidth = 800 - padding.left - padding.right;
            const totalHeight = baseChartHeight - padding.top - padding.bottom;

            const getX = (idx: number) =>
              padding.left + (idx / (series.length - 1 || 1)) * totalWidth;

            const getY = (val: number) => {
              const norm = (val - minVal) / (maxVal - minVal || 1);
              return baseChartHeight - padding.bottom - norm * totalHeight;
            };

            // 1. Price Path (Line or Candlestick representation)
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
                {/* Price Representation */}
                <path d={pricePath} fill="none" stroke="#64748B" strokeWidth="1.5" strokeOpacity="0.85" />

                {/* Slow MA Line */}
                {showSlowMA && (
                  <path d={slowPath} fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                )}

                {/* Fast MA Line */}
                {showFastMA && (
                  <path d={fastPath} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                )}

                {/* Crossover Markers */}
                {showSignals &&
                  crossovers.map((cross, cIdx) => {
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
                      y2={baseChartHeight - padding.bottom}
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
                  y={baseChartHeight - 12}
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {formatDateLabel(pt.timestamp)}
                </text>
              );
            })}
        </svg>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-mono">
        <span>▲ Green = Bullish BUY Crossover | ▼ Amber = Bearish SELL Crossover</span>
        <span>Observation Window: {series.length} bars</span>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0B1220]/95 p-6 backdrop-blur-sm flex flex-col">
        {chartContent}
      </div>
    );
  }

  return chartContent;
};
