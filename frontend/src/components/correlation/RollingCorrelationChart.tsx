import React, { useEffect, useRef } from 'react';
import { createChart, LineSeries, IChartApi, LineData } from 'lightweight-charts';
import { RollingCorrelationResponse } from '../../lib/apiClient';

interface RollingCorrelationChartProps {
  rollingData: RollingCorrelationResponse;
  height?: number;
}

export const RollingCorrelationChart: React.FC<RollingCorrelationChartProps> = ({
  rollingData,
  height = 320,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const { symbol_a, symbol_b, window, series } = rollingData;

  useEffect(() => {
    if (!containerRef.current || !series || series.length === 0) {
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

      // Filter valid points with numeric correlation values
      const lineData: LineData[] = series
        .filter((pt) => pt.correlation !== null && pt.correlation !== undefined)
        .map((pt) => ({
          time: new Date(pt.timestamp).toISOString().split('T')[0],
          value: pt.correlation as number,
        }));

      // Deduplicate date strings
      const uniqueLineData = lineData.filter(
        (item, index, self) => index === self.findIndex((t) => t.time === item.time)
      );

      if (uniqueLineData.length > 0) {
        const lineSeries = chart.addSeries(LineSeries, {
          color: '#14532D',
          lineWidth: 2,
        });
        lineSeries.setData(uniqueLineData);
      }

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
  }, [rollingData, height]);

  if (!series || series.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-border bg-card p-6 text-center text-text-muted shadow-card">
        <p className="text-sm font-medium">No rolling correlation data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3 rounded-lg border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Rolling Correlation ({window} Observations Window)
          </h3>
          <p className="text-xs text-text-muted">
            Time-varying Pearson correlation coefficient between {symbol_a} and {symbol_b}
          </p>
        </div>
        <span className="font-mono text-xs font-semibold text-brand-primary">
          Window: {window} Obs
        </span>
      </div>

      <div ref={containerRef} className="w-full relative overflow-hidden rounded border border-border" style={{ height }} />
    </div>
  );
};
