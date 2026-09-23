import React, { useEffect, useRef, useState } from 'react';
import { createChart, LineSeries, AreaSeries, IChartApi, LineData } from 'lightweight-charts';
import { PerformancePoint } from '../../lib/apiClient';

interface PortfolioPerformanceChartProps {
  performanceSeries: PerformancePoint[];
  height?: number;
}

export const PortfolioPerformanceChart: React.FC<PortfolioPerformanceChartProps> = ({
  performanceSeries,
  height = 360,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const [viewMode, setViewMode] = useState<'value' | 'return'>('value');
  const [hoveredPoint, setHoveredPoint] = useState<PerformancePoint | null>(null);

  useEffect(() => {
    if (!containerRef.current || !performanceSeries || performanceSeries.length === 0) {
      return () => {};
    }

    try {
      const chart = createChart(containerRef.current, {
        height: height,
        layout: {
          background: { color: '#0B1220' },
          textColor: '#94A3B8',
          fontSize: 11,
          fontFamily: 'monospace',
        },
        grid: {
          vertLines: { color: '#1E293B' },
          horzLines: { color: '#1E293B' },
        },
        crosshair: {
          vertLine: { color: '#3B82F6', width: 1, style: 2 },
          horzLine: { color: '#3B82F6', width: 1, style: 2 },
        },
        rightPriceScale: {
          borderColor: '#263244',
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: {
          borderColor: '#263244',
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: true,
        handleScale: true,
      });

      chartRef.current = chart;

      // Transform performance series to lightweight-charts format
      const formattedData: LineData[] = performanceSeries.map((pt) => {
        // Normalize date to YYYY-MM-DD string format
        const dateStr = new Date(pt.timestamp).toISOString().split('T')[0];
        const val = viewMode === 'value' ? pt.portfolio_value : pt.cumulative_return * 100;
        return {
          time: dateStr,
          value: val,
        };
      });

      // Filter unique timestamps if any duplicate dates exist
      const uniqueData = formattedData.filter(
        (item, index, self) => index === self.findIndex((t) => t.time === item.time)
      );

      if (viewMode === 'value') {
        const areaSeries = chart.addSeries(AreaSeries, {
          topColor: 'rgba(59, 130, 246, 0.4)',
          bottomColor: 'rgba(59, 130, 246, 0.0)',
          lineColor: '#3B82F6',
          lineWidth: 2,
        });
        areaSeries.setData(uniqueData);
      } else {
        const lineSeries = chart.addSeries(LineSeries, {
          color: '#22C55E',
          lineWidth: 2,
        });
        lineSeries.setData(uniqueData);
      }

      // Crosshair Hover Handler
      chart.subscribeCrosshairMove((param) => {
        if (!param || !param.time || param.point === undefined) {
          setHoveredPoint(null);
          return;
        }

        const dateStr = String(param.time);
        const pt = performanceSeries.find((p) => {
          const pStr = new Date(p.timestamp).toISOString().split('T')[0];
          return pStr === dateStr;
        });

        if (pt) {
          setHoveredPoint(pt);
        }
      });

      chart.timeScale().fitContent();

      const resizeObserver = new ResizeObserver((entries) => {
        if (entries[0] && entries[0].contentRect && chartRef.current) {
          chartRef.current.applyOptions({ width: entries[0].contentRect.width });
        }
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    } catch (err) {
      console.error('LightweightCharts error:', err);
      return () => {};
    }
  }, [performanceSeries, viewMode, height]);

  if (!performanceSeries || performanceSeries.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-500">
        <p className="text-sm font-medium">No performance data available</p>
        <p className="text-xs text-slate-600 mt-1">Add active holdings with validated market data to generate portfolio equity curve.</p>
      </div>
    );
  }

  const latestPoint = performanceSeries[performanceSeries.length - 1];
  const displayPoint = hoveredPoint || latestPoint;

  return (
    <div className="flex flex-col space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Portfolio Equity Curve</h3>
          <p className="text-xs text-slate-400">Historical performance tracking under buy-and-hold methodology</p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-1 rounded bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setViewMode('value')}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              viewMode === 'value'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Portfolio Value ($)
          </button>
          <button
            onClick={() => setViewMode('return')}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              viewMode === 'return'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cumulative Return (%)
          </button>
        </div>
      </div>

      {/* Hover Info Tooltip Header */}
      {displayPoint && (
        <div className="flex items-center justify-between rounded bg-slate-950/60 px-3 py-2 text-xs border border-slate-800/80">
          <div className="flex items-center space-x-4">
            <span className="font-mono text-slate-400">
              Date: <strong className="text-slate-200">{new Date(displayPoint.timestamp).toLocaleDateString()}</strong>
            </span>
            <span className="font-mono text-slate-400">
              Portfolio Value:{' '}
              <strong className="text-blue-400">
                ${displayPoint.portfolio_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </span>
          </div>
          <div className="font-mono">
            <span className="text-slate-400">Return: </span>
            <span
              className={`font-semibold ${
                displayPoint.cumulative_return >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {displayPoint.cumulative_return >= 0 ? '+' : ''}
              {(displayPoint.cumulative_return * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      {/* Canvas container */}
      <div ref={containerRef} className="w-full relative overflow-hidden rounded border border-slate-800/80" style={{ height }} />
    </div>
  );
};
