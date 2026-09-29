import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, LineSeries, HistogramSeries } from 'lightweight-charts';
import { Database, Download } from 'lucide-react';
import { ReturnObservationItem } from '../../lib/apiClient';


interface ReturnChartProps {
  series: ReturnObservationItem[];
  symbol: string;
  chartMode: 'cumulative' | 'periodic';
  returnType: 'simple' | 'log';
  height?: number;
  isLoading?: boolean;
  onIngestData?: () => void;
  isIngesting?: boolean;
}

export const ReturnChart: React.FC<ReturnChartProps> = ({
  series,
  symbol,
  chartMode,
  returnType,
  height = 360,
  isLoading = false,
  onIngestData,
  isIngesting = false,
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
        background: { color: '#FFFFFF' },
        textColor: '#64748B',
        fontSize: 12,
        fontFamily: 'JetBrains Mono, monospace',
      },
      grid: {
        vertLines: { color: '#E5E7EB' },
        horzLines: { color: '#E5E7EB' },
      },
      crosshair: {
        mode: 0, // Normal crosshair
        vertLine: { color: '#14532D', width: 1, style: 3 },
        horzLine: { color: '#14532D', width: 1, style: 3 },
      },
      timeScale: {
        borderColor: '#E5E7EB',
        timeVisible: false,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#E5E7EB',
      },
    });

    chartRef.current = chart;

    if (chartMode === 'cumulative') {
      const lineSeries = chart.addSeries(LineSeries, {
        color: '#14532D',
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
            color: val >= 0 ? '#16A34A' : '#DC2626',
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
    <div className="relative w-full bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-sm">
      {/* Legend Overlay */}
      <div className="absolute top-3 left-3 z-10 p-2 bg-white/95 border border-[#E5E7EB] rounded text-xs font-mono shadow-sm flex items-center gap-4 text-[#64748B]">
        <span className="font-bold text-[#17211B]">{symbol}</span>
        <span>Date: <strong className="text-[#17211B]">{displayDate}</strong></span>
        {displayPrice !== undefined && <span>Price: <strong className="text-[#17211B]">${displayPrice.toFixed(2)}</strong></span>}
        {displayPeriodic !== undefined && (
          <span>
            {returnType === 'log' ? 'Log Return' : 'Return'}:{' '}
            <strong className={displayPeriodic >= 0 ? 'text-[#15803D]' : 'text-[#DC2626]'}>
              {displayPeriodic >= 0 ? '+' : ''}{(displayPeriodic * 100).toFixed(2)}%
            </strong>
          </span>
        )}
        {displayCumulative !== undefined && (
          <span>
            Cumulative:{' '}
            <strong className={displayCumulative >= 0 ? 'text-[#15803D]' : 'text-[#DC2626]'}>
              {displayCumulative >= 0 ? '+' : ''}{(displayCumulative * 100).toFixed(2)}%
            </strong>
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[360px] text-xs font-mono text-[#64748B] animate-pulse">
          Calculating return metrics...
        </div>
      ) : series.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[360px] p-6 text-center space-y-3 bg-white">
          <div className="w-10 h-10 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#14532D]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#17211B]">
              No Validated Market Data Available for {symbol || 'Target'}
            </div>
            <p className="text-xs text-[#64748B] mt-1 max-w-md">
              Historical price observations for this instrument have not been ingested for the selected window ({returnType} return).
            </p>
          </div>
          {onIngestData && (
            <button
              onClick={onIngestData}
              disabled={isIngesting}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-[#14532D] hover:bg-[#166534] disabled:bg-[#14532D]/50 text-xs font-semibold text-white rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Download className={`w-3.5 h-3.5 ${isIngesting ? 'animate-spin' : ''}`} />
              <span>{isIngesting ? 'Downloading Real Market Data...' : `Download ${symbol || 'Instrument'} Market Data`}</span>
            </button>
          )}
        </div>
      ) : (
        <div ref={chartContainerRef} className="w-full h-full" style={{ height: `${height}px` }} />
      )}
    </div>
  );
};
