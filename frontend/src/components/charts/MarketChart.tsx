import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  HistogramData,
} from 'lightweight-charts';
import { OHLCVItem } from '../../lib/apiClient';
import {
  processChartData,
  ChartCandleData,
  ChartLinePoint,
  ChartVolumePoint,
} from '../../lib/chartDataAdapter';
import { useChartStore } from '../../store/useChartStore';
import { ChartLegend, LegendData } from './ChartLegend';
import { ChartLoadingState, ChartEmptyState, ChartErrorState } from './ChartStates';

interface MarketChartProps {
  bars: OHLCVItem[];
  symbol?: string;
  height?: number;
  isLoading?: boolean;
  onFetchClick?: () => void;
}

export const MarketChart: React.FC<MarketChartProps> = ({
  bars,
  symbol = 'INSTRUMENT',
  height = 360,
  isLoading = false,
  onFetchClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const [hoveredData, setHoveredData] = useState<LegendData | null>(null);
  const [hasError, setHasError] = useState(false);

  const { chartType, priceMode, showVolume, showCrosshair, showGrid } = useChartStore();

  const normalized = processChartData(bars, priceMode);

  useEffect(() => {
    if (!containerRef.current || normalized.candlestickData.length === 0) {
      return () => {};
    }


    try {
      setHasError(false);

      // 1. Create Chart Instance
      const chart = createChart(containerRef.current, {
        height: height,
        layout: {
          background: { color: '#0B0F17' },
          textColor: '#94A3B8',
          fontSize: 11,
          fontFamily: 'monospace',
        },
        grid: {
          vertLines: { color: showGrid ? '#1E293B' : 'transparent' },
          horzLines: { color: showGrid ? '#1E293B' : 'transparent' },
        },
        crosshair: {
          mode: showCrosshair ? CrosshairMode.Normal : CrosshairMode.Hidden,
          vertLine: {
            color: '#60A5FA',
            width: 1,
            style: 2, // Dashed
          },
          horzLine: {
            color: '#60A5FA',
            width: 1,
            style: 2,
          },
        },
        rightPriceScale: {
          borderColor: '#263244',
          scaleMargins: {
            top: 0.1,
            bottom: showVolume ? 0.25 : 0.1,
          },
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

      // 2. Add Price Series using Lightweight Charts v5 addSeries API
      if (chartType === 'candlestick') {
        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#22C55E',
          downColor: '#EF4444',
          borderUpColor: '#22C55E',
          borderDownColor: '#EF4444',
          wickUpColor: '#22C55E',
          wickDownColor: '#EF4444',
        });
        candleSeries.setData(normalized.candlestickData as CandlestickData[]);
        candleSeriesRef.current = candleSeries;
      } else {
        const lineSeries = chart.addSeries(LineSeries, {
          color: '#3B82F6',
          lineWidth: 2,
        });
        lineSeries.setData(normalized.lineData as LineData[]);
        lineSeriesRef.current = lineSeries;
      }

      // 3. Add Volume Series
      if (showVolume) {
        const volumeSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume_scale',
        });

        chart.priceScale('volume_scale').applyOptions({
          scaleMargins: {
            top: 0.75,
            bottom: 0,
          },
        });

        volumeSeries.setData(normalized.volumeData as HistogramData[]);
        volumeSeriesRef.current = volumeSeries;
      }

      // 4. Crosshair Move Handler for Real-Time Legend
      chart.subscribeCrosshairMove((param) => {
        if (!param || !param.time || param.point === undefined) {
          setHoveredData(null);
          return;
        }

        const dateStr = String(param.time);

        let cData: ChartCandleData | null = null;
        if (chartType === 'candlestick' && candleSeriesRef.current) {
          cData = (param.seriesData.get(candleSeriesRef.current) as ChartCandleData) || null;
        } else if (lineSeriesRef.current) {
          const lData = param.seriesData.get(lineSeriesRef.current) as ChartLinePoint;
          if (lData) {
            cData = {
              time: dateStr,
              open: lData.value,
              high: lData.value,
              low: lData.value,
              close: lData.value,
            };
          }
        }

        let volVal: number | undefined = undefined;
        if (volumeSeriesRef.current) {
          const vData = param.seriesData.get(volumeSeriesRef.current) as ChartVolumePoint;
          if (vData) volVal = vData.value;
        }

        if (cData) {
          setHoveredData({
            time: dateStr,
            open: cData.open,
            high: cData.high,
            low: cData.low,
            close: cData.close,
            volume: volVal,
          });
        }
      });

      // 5. Fit content
      chart.timeScale().fitContent();

      // 6. Resize Observer
      const resizeObserver = new ResizeObserver((entries) => {
        if (entries[0] && entries[0].contentRect && chartRef.current) {
          const { width: newWidth } = entries[0].contentRect;
          chartRef.current.applyOptions({ width: newWidth });
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
      setHasError(true);
      return () => {};
    }
  }, [bars, chartType, priceMode, showVolume, showCrosshair, showGrid, height]);


  if (isLoading) {
    return <ChartLoadingState height={height} />;
  }

  if (hasError) {
    return <ChartErrorState height={height} message="Error initializing Canvas chart engine." />;
  }

  if (normalized.candlestickData.length === 0) {
    return <ChartEmptyState height={height} onFetchClick={onFetchClick} />;
  }

  return (
    <div className="relative w-full flex flex-col rounded border border-[#263244] bg-[#0B0F17] overflow-hidden select-none">
      {/* Legend Header Overlay */}
      <div className="p-2 border-b border-[#1E293B] bg-[#0B0F17]">
        <ChartLegend symbol={symbol} data={hoveredData} priceMode={priceMode} />
      </div>

      {/* Lightweight Charts Canvas Element */}
      <div ref={containerRef} className="w-full relative" style={{ height }} />
    </div>
  );
};
