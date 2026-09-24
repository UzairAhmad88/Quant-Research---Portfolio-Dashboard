import React, { useState } from 'react';
import { ReturnDistributionResponse } from '../../lib/apiClient';

interface ReturnDistributionChartProps {
  distribution: ReturnDistributionResponse;
  symbol: string;
}

export const ReturnDistributionChart: React.FC<ReturnDistributionChartProps> = ({ distribution, symbol }) => {
  const [hoveredBinIndex, setHoveredBinIndex] = useState<number | null>(null);

  const { summary, histogram } = distribution;

  const maxCount = Math.max(...histogram.map((b) => b.count), 1);
  const chartHeight = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };

  const formatPct = (val: number) => `${(val * 100).toFixed(2)}%`;

  const hoveredBin = hoveredBinIndex !== null ? histogram[hoveredBinIndex] : null;

  return (
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            Return Distribution Histogram ({symbol})
          </h3>
          <p className="text-xs text-slate-400">Frequency distribution of observed return series</p>
        </div>
        {hoveredBin && (
          <div className="bg-[#0B1220]/90 border border-[#263244] px-3 py-1.5 rounded text-right shadow-lg font-mono text-xs">
            <span className="text-slate-400 mr-2">
              [{formatPct(hoveredBin.bin_start)} to {formatPct(hoveredBin.bin_end)}]:
            </span>
            <span className="text-blue-400 font-semibold">{hoveredBin.count} obs ({hoveredBin.frequency_pct.toFixed(1)}%)</span>
          </div>
        )}
      </div>

      {/* Summary statistics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-4 bg-[#0B1220] p-3 rounded border border-[#263244] font-mono text-xs">
        <div>
          <div className="text-slate-500 text-[10px]">MEAN</div>
          <div className="text-slate-200">{formatPct(summary.mean)}</div>
        </div>
        <div>
          <div className="text-slate-500 text-[10px]">MEDIAN</div>
          <div className="text-slate-200">{formatPct(summary.median)}</div>
        </div>
        <div>
          <div className="text-slate-500 text-[10px]">MIN</div>
          <div className="text-amber-400">{formatPct(summary.min)}</div>
        </div>
        <div>
          <div className="text-slate-500 text-[10px]">MAX</div>
          <div className="text-emerald-400">{formatPct(summary.max)}</div>
        </div>
        <div>
          <div className="text-slate-500 text-[10px]">STD DEV</div>
          <div className="text-slate-200">{formatPct(summary.std_dev)}</div>
        </div>
        <div>
          <div className="text-slate-500 text-[10px]">POSITIVE</div>
          <div className="text-emerald-400">{summary.positive_observations}</div>
        </div>
        <div>
          <div className="text-slate-500 text-[10px]">NEGATIVE</div>
          <div className="text-amber-400">{summary.negative_observations}</div>
        </div>
      </div>

      {/* Histogram SVG */}
      {histogram.length === 0 ? (
        <div className="text-center text-slate-500 py-8">No histogram data available.</div>
      ) : (
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 800 ${chartHeight}`}
            className="w-full h-auto overflow-visible select-none"
            onMouseLeave={() => setHoveredBinIndex(null)}
          >
            {/* Y Axis Grid lines */}
            {[0, 0.5, 1.0].map((ratio) => {
              const yVal = Math.round(maxCount * (1 - ratio));
              const yPos = padding.top + ratio * (chartHeight - padding.top - padding.bottom);
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={800 - padding.right}
                    y2={yPos}
                    stroke="#1E293B"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padding.left - 8}
                    y={yPos + 4}
                    fill="#64748B"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {yVal}
                  </text>
                </g>
              );
            })}

            {/* Zero Return Reference Line */}
            {(() => {
              const minB = histogram[0].bin_start;
              const maxB = histogram[histogram.length - 1].bin_end;
              if (minB <= 0 && maxB >= 0) {
                const zeroRatio = (0 - minB) / (maxB - minB || 1);
                const zeroX = padding.left + zeroRatio * (800 - padding.left - padding.right);
                return (
                  <g>
                    <line
                      x1={zeroX}
                      y1={padding.top}
                      x2={zeroX}
                      y2={chartHeight - padding.bottom}
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={zeroX}
                      y={padding.top - 5}
                      fill="#94A3B8"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      0.0% Ref
                    </text>
                  </g>
                );
              }
              return null;
            })()}

            {/* Histogram Bars */}
            {histogram.map((bin, idx) => {
              const totalWidth = 800 - padding.left - padding.right;
              const barWidth = totalWidth / histogram.length - 2;
              const x = padding.left + idx * (totalWidth / histogram.length) + 1;

              const heightRatio = bin.count / maxCount;
              const barHeight = heightRatio * (chartHeight - padding.top - padding.bottom);
              const y = chartHeight - padding.bottom - barHeight;

              // Color based on positive/negative region
              const isPositive = bin.bin_center >= 0;
              const barColor = isPositive ? '#3B82F6' : '#64748B';
              const hoverColor = isPositive ? '#60A5FA' : '#94A3B8';

              return (
                <rect
                  key={idx}
                  x={x}
                  y={y}
                  width={Math.max(barWidth, 1)}
                  height={Math.max(barHeight, 1)}
                  fill={hoveredBinIndex === idx ? hoverColor : barColor}
                  rx="1"
                  className="cursor-pointer transition-colors duration-150"
                  onMouseEnter={() => setHoveredBinIndex(idx)}
                />
              );
            })}

            {/* X Axis Range Labels */}
            {histogram.length > 0 && (
              <g>
                <text
                  x={padding.left}
                  y={chartHeight - 12}
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="start"
                >
                  {formatPct(histogram[0].bin_start)}
                </text>
                <text
                  x={800 - padding.right}
                  y={chartHeight - 12}
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {formatPct(histogram[histogram.length - 1].bin_end)}
                </text>
              </g>
            )}
          </svg>
        </div>
      )}
    </div>
  );
};
