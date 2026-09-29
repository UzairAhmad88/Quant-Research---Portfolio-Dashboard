import React, { useEffect, useRef } from 'react';
import { createChart, AreaSeries, IChartApi, ISeriesApi } from 'lightweight-charts';
import { DrawdownPoint } from '../../types/backtest';

interface UnderwaterChartProps {
  series: DrawdownPoint[];
  isLoading?: boolean;
  height?: number;
  highlightInterval?: { start: string; end: string } | null;
  onCrosshairMove?: (time: string | null) => void;
}

export const UnderwaterChart: React.FC<UnderwaterChartProps> = ({
  series,
  isLoading = false,
  height = 240,
  highlightInterval = null,
  onCrosshairMove,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);

  useEffect(() => {
    if (!containerRef.current || !series || series.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: height,
      layout: {
        background: { color: '#FFFFFF' },
        textColor: '#64748B',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#F1F5F9' },
        horzLines: { color: '#F1F5F9' },
      },
      rightPriceScale: {
        borderColor: '#E2E8F0',
      },
      timeScale: {
        borderColor: '#E2E8F0',
        timeVisible: true,
      },
    });

    chartRef.current = chart;

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#DC2626',
      topColor: 'rgba(220, 38, 38, 0.02)',
      bottomColor: 'rgba(220, 38, 38, 0.25)',
      lineWidth: 2,
      priceFormat: {
        type: 'custom',
        formatter: (val: number) => `${val.toFixed(2)}%`,
      },
    });

    areaSeriesRef.current = areaSeries;

    const dataPoints = series.map((s) => ({
      time: s.timestamp.split('T')[0],
      value: s.drawdown_percentage * 100,
    }));

    areaSeries.setData(dataPoints);
    chart.timeScale().fitContent();

    if (onCrosshairMove) {
      chart.subscribeCrosshairMove((param) => {
        if (param.time) {
          let timeStr: string | null = null;
          if (typeof param.time === 'string') {
            timeStr = param.time;
          } else if (typeof param.time === 'object' && param.time !== null && 'year' in param.time) {
            const t = param.time as any;
            timeStr = `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`;
          }
          onCrosshairMove(timeStr);
        } else {
          onCrosshairMove(null);
        }
      });
    }

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [series, height, onCrosshairMove]);

  // Handle zoom/scroll when highlightInterval changes
  useEffect(() => {
    if (!chartRef.current || !highlightInterval || !series || series.length === 0) return;
    try {
      const startDate = highlightInterval.start.split('T')[0];
      const endDate = highlightInterval.end.split('T')[0];
      chartRef.current.timeScale().setVisibleRange({
        from: startDate as any,
        to: endDate as any,
      });
    } catch {
      // Ignore timestamp range errors
    }
  }, [highlightInterval, series]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-text-secondary font-mono shadow-xs">
        Loading underwater drawdown series...
      </div>
    );
  }

  if (!series || series.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-text-secondary font-mono shadow-xs">
        No drawdown series available.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider font-mono">
            Underwater / Drawdown % Chart
          </h4>
          <p className="text-xs text-text-secondary mt-0.5 font-sans">
            Drawdown percentage depth from running peak over time (0% to negative peak loss)
          </p>
        </div>
      </div>
      <div ref={containerRef} className="w-full rounded-lg border border-border overflow-hidden bg-white shadow-xs" />
    </div>
  );
};
