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
          background: { color: '#FFFFFF' },
          textColor: '#64748B',
          fontSize: 11,
          fontFamily: 'monospace',
        },
        grid: {
          vertLines: { color: '#F1F5F9' },
          horzLines: { color: '#F1F5F9' },
        },
        crosshair: {
          vertLine: { color: '#14532D', width: 1, style: 2 },
          horzLine: { color: '#14532D', width: 1, style: 2 },
        },
        rightPriceScale: {
          borderColor: '#E2E8F0',
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: {
          borderColor: '#E2E8F0',
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
          topColor: 'rgba(20, 83, 45, 0.25)',
          bottomColor: 'rgba(20, 83, 45, 0.01)',
          lineColor: '#14532D',
          lineWidth: 2,
        });
        areaSeries.setData(uniqueData);
      } else {
        const lineSeries = chart.addSeries(LineSeries, {
          color: '#15803D',
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
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-border bg-card p-6 text-center text-text-muted shadow-card">
        <p className="text-sm font-medium">No performance data available</p>
        <p className="text-xs text-text-muted mt-1">Add active holdings with validated market data to generate portfolio equity curve.</p>
      </div>
    );
  }

  const latestPoint = performanceSeries[performanceSeries.length - 1];
  const displayPoint = hoveredPoint || latestPoint;

  return (
    <div className="flex flex-col space-y-3 rounded-lg border border-border bg-card p-5 shadow-card">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Portfolio Equity Curve</h3>
          <p className="text-xs text-text-muted">Historical performance tracking under buy-and-hold methodology</p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-1 rounded-md bg-surface p-1 border border-border">
          <button
            onClick={() => setViewMode('value')}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              viewMode === 'value'
                ? 'bg-brand-primary text-white shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Portfolio Value ($)
          </button>
          <button
            onClick={() => setViewMode('return')}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              viewMode === 'return'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Cumulative Return (%)
          </button>
        </div>
      </div>

      {/* Hover Info Tooltip Header */}
      {displayPoint && (
        <div className="flex items-center justify-between rounded-md bg-surface px-3 py-2 text-xs border border-border">
          <div className="flex items-center space-x-4">
            <span className="font-mono text-text-muted">
              Date: <strong className="text-text-primary">{new Date(displayPoint.timestamp).toLocaleDateString()}</strong>
            </span>
            <span className="font-mono text-text-muted">
              Portfolio Value:{' '}
              <strong className="text-brand-primary">
                ${displayPoint.portfolio_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </span>
          </div>
          <div className="font-mono">
            <span className="text-text-muted">Return: </span>
            <span
              className={`font-semibold ${
                displayPoint.cumulative_return >= 0 ? 'text-financial-positive' : 'text-financial-negative'
              }`}
            >
              {displayPoint.cumulative_return >= 0 ? '+' : ''}
              {(displayPoint.cumulative_return * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      {/* Canvas container */}
      <div ref={containerRef} className="w-full relative overflow-hidden rounded border border-border" style={{ height }} />
    </div>
  );
};
