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
        background: { color: '#111827' },
        textColor: '#94A3B8',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1F293D' },
        horzLines: { color: '#1F293D' },
      },
      rightPriceScale: {
        borderColor: '#263244',
      },
      timeScale: {
        borderColor: '#263244',
        timeVisible: true,
      },
    });

    chartRef.current = chart;

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#EF4444',
      topColor: 'rgba(239, 68, 68, 0.02)',
      bottomColor: 'rgba(239, 68, 68, 0.35)',
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
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-8 text-center text-sm text-[#94A3B8]">
        Loading underwater drawdown series...
      </div>
    );
  }

  if (!series || series.length === 0) {
    return (
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-8 text-center text-sm text-[#94A3B8]">
        No drawdown series available.
      </div>
    );
  }

  return (
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-[#E5E7EB] uppercase tracking-wider font-mono">
            Underwater / Drawdown % Chart
          </h4>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Drawdown percentage depth from running peak over time (0% to negative peak loss)
          </p>
        </div>
      </div>
      <div ref={containerRef} className="w-full rounded border border-[#263244] overflow-hidden" />
    </div>
  );
};
