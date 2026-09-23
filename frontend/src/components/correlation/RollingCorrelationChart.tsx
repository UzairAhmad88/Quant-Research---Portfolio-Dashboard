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
          color: '#3B82F6',
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
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-500">
        <p className="text-sm font-medium">No rolling correlation data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            Rolling Correlation ({window} Observations Window)
          </h3>
          <p className="text-xs text-slate-400">
            Time-varying Pearson correlation coefficient between {symbol_a} and {symbol_b}
          </p>
        </div>
        <span className="font-mono text-xs font-semibold text-blue-400">
          Window: {window} Obs
        </span>
      </div>

      <div ref={containerRef} className="w-full relative overflow-hidden rounded border border-slate-800/80" style={{ height }} />
    </div>
  );
};
