import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, LineSeries, HistogramSeries } from 'lightweight-charts';
import { ReturnObservationItem } from '../../lib/apiClient';


interface ReturnChartProps {
  series: ReturnObservationItem[];
  symbol: string;
  chartMode: 'cumulative' | 'periodic';
  returnType: 'simple' | 'log';
  height?: number;
  isLoading?: boolean;
}

export const ReturnChart: React.FC<ReturnChartProps> = ({
  series,
  symbol,
  chartMode,
  returnType,
  height = 360,
  isLoading = false,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const [legendData, setLegendData] = useState<{
    date?: string;
    price?: number;
    periodicReturn?: number;
    cumulativeReturn?: number;
  }>({});

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up existing instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    if (isLoading || series.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { color: '#0B1220' },
        textColor: '#94A3B8',
        fontSize: 12,
        fontFamily: 'JetBrains Mono, monospace',
      },
      grid: {
        vertLines: { color: '#1E293B' },
        horzLines: { color: '#1E293B' },
      },
      crosshair: {
        mode: 0, // Normal crosshair
        vertLine: { color: '#3B82F6', width: 1, style: 3 },
        horzLine: { color: '#3B82F6', width: 1, style: 3 },
      },
      timeScale: {
        borderColor: '#263244',
        timeVisible: false,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#263244',
      },
    });

    chartRef.current = chart;

    if (chartMode === 'cumulative') {
      const lineSeries = chart.addSeries(LineSeries, {
        color: '#3B82F6',
        lineWidth: 2,
        priceFormat: {
          type: 'custom',
          formatter: (price: number) => `${(price * 100).toFixed(2)}%`,
        },
      });

      const lineData = series.map((item) => ({
        time: item.timestamp.split('T')[0],
        value: item.cumulative_return,
      }));

      lineSeries.setData(lineData);
    } else {
      const histogramSeries = chart.addSeries(HistogramSeries, {
        priceFormat: {
          type: 'custom',
          formatter: (price: number) => `${(price * 100).toFixed(2)}%`,
        },
      });

      const barData = series
        .filter((item) => item.simple_return !== undefined && item.simple_return !== null)
        .map((item) => {
          const val = returnType === 'log' ? (item.log_return ?? 0) : (item.simple_return ?? 0);
          return {
            time: item.timestamp.split('T')[0],
            value: val,
            color: val >= 0 ? '#22C55E' : '#EF4444',
          };
        });

      histogramSeries.setData(barData);
    }

    chart.timeScale().fitContent();

    // Crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || param.point === undefined || param.point.x < 0) {
        setLegendData({});
        return;
      }

      const dateStr = typeof param.time === 'string' ? param.time : '';
      const matchingObs = series.find((s) => s.timestamp.startsWith(dateStr));

      if (matchingObs) {
        setLegendData({
          date: dateStr,
          price: matchingObs.price,
          periodicReturn: returnType === 'log' ? matchingObs.log_return : matchingObs.simple_return,
          cumulativeReturn: matchingObs.cumulative_return,
        });
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
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
  }, [series, chartMode, returnType, height, isLoading]);

  const latestObs = series.length > 0 ? series[series.length - 1] : null;
  const displayDate = legendData.date || (latestObs ? latestObs.timestamp.split('T')[0] : '—');
  const displayPrice = legendData.price !== undefined ? legendData.price : (latestObs ? latestObs.price : undefined);
  const displayPeriodic = legendData.periodicReturn !== undefined
    ? legendData.periodicReturn
    : (latestObs ? (returnType === 'log' ? latestObs.log_return : latestObs.simple_return) : undefined);
  const displayCumulative = legendData.cumulativeReturn !== undefined ? legendData.cumulativeReturn : (latestObs ? latestObs.cumulative_return : undefined);

  return (
    <div className="relative w-full bg-[#0B1220] border border-[#263244] rounded-lg overflow-hidden">
      {/* Legend Overlay */}
      <div className="absolute top-3 left-3 z-10 p-2 bg-[#151F2E]/90 border border-[#263244] rounded text-xs font-mono backdrop-blur-xs flex items-center gap-4 text-slate-300">
        <span className="font-semibold text-slate-100">{symbol}</span>
        <span>Date: <strong className="text-slate-100">{displayDate}</strong></span>
        {displayPrice !== undefined && <span>Price: <strong className="text-slate-100">${displayPrice.toFixed(2)}</strong></span>}
        {displayPeriodic !== undefined && (
          <span>
            {returnType === 'log' ? 'Log Return' : 'Return'}:{' '}
            <strong className={displayPeriodic >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {displayPeriodic >= 0 ? '+' : ''}{(displayPeriodic * 100).toFixed(2)}%
            </strong>
          </span>
        )}
        {displayCumulative !== undefined && (
          <span>
            Cumulative:{' '}
            <strong className={displayCumulative >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {displayCumulative >= 0 ? '+' : ''}{(displayCumulative * 100).toFixed(2)}%
            </strong>
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[360px] text-xs font-mono text-slate-400 animate-pulse">
          Calculating return metrics...
        </div>
      ) : series.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[360px] text-xs text-slate-400">
          No validated market data available for the selected return window.
        </div>
      ) : (
        <div ref={chartContainerRef} className="w-full h-full" style={{ height: `${height}px` }} />
      )}
    </div>
  );
};
