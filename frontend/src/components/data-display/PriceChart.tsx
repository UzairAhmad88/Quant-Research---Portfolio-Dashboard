import React, { useState } from 'react';
import { OHLCVItem } from '../../lib/apiClient';

interface PriceChartProps {
  bars: OHLCVItem[];
  height?: number;
}

export const PriceChart: React.FC<PriceChartProps> = ({ bars, height = 300 }) => {
  const [hoveredBar, setHoveredBar] = useState<OHLCVItem | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  if (!bars || bars.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center rounded border border-[#263244] bg-[#0B0F17]"
        style={{ height }}
      >
        <span className="text-xs font-mono-num text-[#64748B]">No price history available to display chart.</span>
      </div>
    );
  }

  // Sort bars chronologically
  const sortedBars = [...bars].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const prices = sortedBars.map((b) => b.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const width = 800;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Compute SVG point coordinates
  const points = sortedBars.map((bar, i) => {
    const x = padding.left + (i / Math.max(1, sortedBars.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((bar.close - minPrice) / priceRange) * graphHeight;
    return { x, y, bar };
  });

  const pathD = points.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
    ''
  );

  const areaD = `${pathD} L ${points[points.length - 1].x},${height - padding.bottom} L ${padding.left},${height - padding.bottom} Z`;

  // Format date ticks for X axis
  const tickCount = Math.min(6, sortedBars.length);
  const xTicks = Array.from({ length: tickCount }).map((_, idx) => {
    const index = Math.floor((idx / (tickCount - 1)) * (sortedBars.length - 1));
    return points[index];
  });

  // Y axis price ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const val = minPrice + pct * priceRange;
    const y = padding.top + graphHeight - pct * graphHeight;
    return { val, y };
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    
    // Find closest data point
    let closest = points[0];
    let minDiff = Math.abs(mouseX - closest.x);
    for (let i = 1; i < points.length; i++) {
      const diff = Math.abs(mouseX - points[i].x);
      if (diff < minDiff) {
        minDiff = diff;
        closest = points[i];
      }
    }
    setHoveredBar(closest.bar);
    setHoverPos({ x: closest.x, y: closest.y });
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
    setHoverPos(null);
  };

  return (
    <div className="relative w-full rounded border border-[#263244] bg-[#0B0F17] p-3 overflow-hidden select-none">
      {/* Metrics Header Bar */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#1E293B] text-xs font-mono-num">
        <div className="flex items-center gap-4 text-[#94A3B8]">
          <span>Observations: <strong className="text-[#F8FAFC]">{sortedBars.length}</strong></span>
          <span>Min: <strong className="text-[#EF4444]">${minPrice.toFixed(2)}</strong></span>
          <span>Max: <strong className="text-[#10B981]">${maxPrice.toFixed(2)}</strong></span>
          <span>Latest: <strong className="text-[#3B82F6]">${sortedBars[sortedBars.length - 1].close.toFixed(2)}</strong></span>
        </div>
        {hoveredBar && (
          <div className="text-[#3B82F6] font-medium">
            {new Date(hoveredBar.timestamp).toLocaleDateString()} — Close: ${hoveredBar.close.toFixed(2)} (Vol: {hoveredBar.volume.toLocaleString()})
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto cursor-crosshair overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={t.y}
              x2={width - padding.right}
              y2={t.y}
              stroke="#1E293B"
              strokeDasharray="3 3"
            />
            <text
              x={padding.left - 8}
              y={t.y + 4}
              fill="#64748B"
              fontSize="10"
              fontFamily="monospace"
              textAnchor="end"
            >
              ${t.val.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaD} fill="url(#priceGradient)" />

        {/* Main Line */}
        <path d={pathD} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* X Axis Labels */}
        {xTicks.map((pt, i) => (
          <text
            key={i}
            x={pt.x}
            y={height - 12}
            fill="#64748B"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="middle"
          >
            {new Date(pt.bar.timestamp).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
          </text>
        ))}

        {/* Hover Crosshair & Dot */}
        {hoverPos && (
          <g>
            <line
              x1={hoverPos.x}
              y1={padding.top}
              x2={hoverPos.x}
              y2={height - padding.bottom}
              stroke="#60A5FA"
              strokeDasharray="2 2"
            />
            <line
              x1={padding.left}
              y1={hoverPos.y}
              x2={width - padding.right}
              y2={hoverPos.y}
              stroke="#60A5FA"
              strokeDasharray="2 2"
            />
            <circle cx={hoverPos.x} cy={hoverPos.y} r="4" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  );
};
