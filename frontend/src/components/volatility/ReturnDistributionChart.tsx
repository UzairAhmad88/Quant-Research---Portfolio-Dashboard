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
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#17211B]">
            Return Distribution Histogram ({symbol})
          </h3>
          <p className="text-xs text-[#64748B]">Frequency distribution of observed return series</p>
        </div>
        {hoveredBin && (
          <div className="bg-[#17211B] text-white border border-[#334155] px-3 py-1.5 rounded text-right shadow-md font-mono text-xs">
            <span className="text-[#94A3B8] mr-2">
              [{formatPct(hoveredBin.bin_start)} to {formatPct(hoveredBin.bin_end)}]:
            </span>
            <span className="text-[#86EFAC] font-bold">{hoveredBin.count} obs ({hoveredBin.frequency_pct.toFixed(1)}%)</span>
          </div>
        )}
      </div>

      {/* Summary statistics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-4 bg-[#F8FAF9] p-3 rounded border border-[#E5E7EB] font-mono text-xs">
        <div>
          <div className="text-[#64748B] text-[10px] font-semibold">MEAN</div>
          <div className="text-[#17211B] font-bold">{formatPct(summary.mean)}</div>
        </div>
        <div>
          <div className="text-[#64748B] text-[10px] font-semibold">MEDIAN</div>
          <div className="text-[#17211B] font-bold">{formatPct(summary.median)}</div>
        </div>
        <div>
          <div className="text-[#64748B] text-[10px] font-semibold">MIN</div>
          <div className="text-[#DC2626] font-bold">{formatPct(summary.min)}</div>
        </div>
        <div>
          <div className="text-[#64748B] text-[10px] font-semibold">MAX</div>
          <div className="text-[#15803D] font-bold">{formatPct(summary.max)}</div>
        </div>
        <div>
          <div className="text-[#64748B] text-[10px] font-semibold">STD DEV</div>
          <div className="text-[#17211B] font-bold">{formatPct(summary.std_dev)}</div>
        </div>
        <div>
          <div className="text-[#64748B] text-[10px] font-semibold">POSITIVE</div>
          <div className="text-[#15803D] font-bold">{summary.positive_observations}</div>
        </div>
        <div>
          <div className="text-[#64748B] text-[10px] font-semibold">NEGATIVE</div>
          <div className="text-[#DC2626] font-bold">{summary.negative_observations}</div>
        </div>
      </div>

      {/* Histogram SVG */}
      {histogram.length === 0 ? (
        <div className="text-center text-[#64748B] py-8">No histogram data available.</div>
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
                    stroke="#E5E7EB"
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
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={zeroX}
                      y={padding.top - 5}
                      fill="#64748B"
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
              const barColor = isPositive ? '#15803D' : '#DC2626';
              const hoverColor = isPositive ? '#16A34A' : '#EF4444';

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
