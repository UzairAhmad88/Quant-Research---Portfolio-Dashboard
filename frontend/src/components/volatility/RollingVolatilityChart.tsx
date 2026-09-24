import React, { useState, useMemo } from 'react';
import { RollingVolatilityPoint } from '../../lib/apiClient';

interface RollingVolatilityChartProps {
  series: RollingVolatilityPoint[];
  symbol: string;
  windowSize: number;
  isAnnualized: boolean;
}

export const RollingVolatilityChart: React.FC<RollingVolatilityChartProps> = ({
  series,
  symbol,
  windowSize,
  isAnnualized,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter valid data points for min/max scale calculation
  const validValues = useMemo(() => {
    return series
      .map((p) => p.rolling_volatility)
      .filter((v): v is number => v !== null && !isNaN(v));
  }, [series]);

  const minVal = useMemo(() => (validValues.length > 0 ? Math.min(...validValues) * 0.9 : 0), [validValues]);
  const maxVal = useMemo(() => (validValues.length > 0 ? Math.max(...validValues) * 1.1 : 0.3), [validValues]);

  const chartHeight = 280;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  const formatPct = (val: number | null) => {
    if (val === null) return 'N/A';
    return `${(val * 100).toFixed(2)}%`;
  };

  if (series.length === 0) {
    return (
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-6 text-center text-slate-400">
        No rolling volatility data available.
      </div>
    );
  }

  const hoverPoint = hoveredIndex !== null ? series[hoveredIndex] : null;

  return (
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            Rolling Volatility Time Series ({symbol})
          </h3>
          <p className="text-xs text-slate-400">
            {windowSize}-observation rolling standard deviation ({isAnnualized ? 'Annualized' : 'Daily'})
          </p>
        </div>
        {hoverPoint && (
          <div className="bg-[#0B1220]/90 border border-[#263244] px-3 py-1.5 rounded text-right shadow-lg font-mono text-xs">
            <span className="text-slate-400 mr-2">{formatDate(hoverPoint.timestamp)}:</span>
            <span className="text-blue-400 font-semibold">{formatPct(hoverPoint.rolling_volatility)}</span>
          </div>
        )}
      </div>

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
                  {(yVal * 100).toFixed(1)}%
                </text>
              </g>
            );
          })}

          {/* Line Path */}
          {series.length > 1 && (
            <path
              d={series.reduce((acc, pt, idx) => {
                const x =
                  padding.left +
                  (idx / (series.length - 1)) * (800 - padding.left - padding.right);

                if (pt.rolling_volatility === null) return acc;

                const normalizedY =
                  (pt.rolling_volatility - minVal) / (maxVal - minVal || 1);
                const y =
                  chartHeight -
                  padding.bottom -
                  normalizedY * (chartHeight - padding.top - padding.bottom);

                return acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
              }, '')}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Hover Circles & Crosshair */}
          {series.map((_, idx) => {
            const x =
              padding.left +
              (idx / (series.length - 1)) * (800 - padding.left - padding.right);

            return (
              <rect
                key={idx}
                x={x - (800 - padding.left - padding.right) / (series.length * 2)}
                y={padding.top}
                width={(800 - padding.left - padding.right) / series.length}
                height={chartHeight - padding.top - padding.bottom}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredIndex(idx)}
              />
            );
          })}

          {hoveredIndex !== null && series[hoveredIndex]?.rolling_volatility !== null && (
            <g>
              {(() => {
                const idx = hoveredIndex;
                const pt = series[idx];
                const x =
                  padding.left +
                  (idx / (series.length - 1)) * (800 - padding.left - padding.right);
                const normalizedY =
                  ((pt.rolling_volatility as number) - minVal) / (maxVal - minVal || 1);
                const y =
                  chartHeight -
                  padding.bottom -
                  normalizedY * (chartHeight - padding.top - padding.bottom);

                return (
                  <>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={chartHeight - padding.bottom}
                      stroke="#475569"
                      strokeDasharray="2 2"
                    />
                    <circle cx={x} cy={y} r="4" fill="#3B82F6" stroke="#0B1220" strokeWidth="2" />
                  </>
                );
              })()}
            </g>
          )}

          {/* X Axis Time Labels */}
          {series.length > 0 &&
            [0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
              const idx = Math.min(
                Math.floor(ratio * (series.length - 1)),
                series.length - 1
              );
              const pt = series[idx];
              const x =
                padding.left +
                ratio * (800 - padding.left - padding.right);

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
        <span>* First {windowSize - 1} observations return N/A (initial window offset)</span>
        <span>Window: {windowSize} observations</span>
      </div>
    </div>
  );
};
