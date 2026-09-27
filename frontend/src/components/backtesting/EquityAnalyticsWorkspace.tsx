import React, { useState, useEffect, useRef } from 'react';
import { createChart, LineSeries, IChartApi, ISeriesApi, SeriesMarker, createSeriesMarkers } from 'lightweight-charts';
import {
  EquityPoint,
  DrawdownPoint,
  DrawdownPeriod,
  TradeEvent
} from '../../types/backtest';
import { UnderwaterChart } from './UnderwaterChart';
import { DrawdownPeriodsTable } from './DrawdownPeriodsTable';
import { CurrentDrawdownStatus } from './CurrentDrawdownStatus';
import { BarChart2 } from 'lucide-react';

interface EquityAnalyticsWorkspaceProps {
  equityPoints: EquityPoint[];
  drawdownPoints: DrawdownPoint[];
  periods: DrawdownPeriod[];
  trades?: TradeEvent[];
  initialCapital: number;
  isLoading?: boolean;
}

export const EquityAnalyticsWorkspace: React.FC<EquityAnalyticsWorkspaceProps> = ({
  equityPoints,
  drawdownPoints,
  periods,
  trades = [],
  initialCapital,
  isLoading = false,
}) => {
  // Chart toggle controls
  const [showPeak, setShowPeak] = useState<boolean>(true);
  const [showBaseline, setShowBaseline] = useState<boolean>(true);
  const [showTradeMarkers, setShowTradeMarkers] = useState<boolean>(true);
  const [rangeFilter, setRangeFilter] = useState<'1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'MAX'>('MAX');
  const [selectedPeriod, setSelectedPeriod] = useState<DrawdownPeriod | null>(null);

  // Synchronized crosshair date
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Chart reference
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const equitySeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const peakSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const baselineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Filter points based on range filter
  const getFilteredEquityPoints = () => {
    if (rangeFilter === 'MAX' || equityPoints.length === 0) return equityPoints;
    const lastDateStr = equityPoints[equityPoints.length - 1].timestamp;
    const lastDate = new Date(lastDateStr);
    let cutoff = new Date(lastDate);

    if (rangeFilter === '1M') cutoff.setMonth(cutoff.getMonth() - 1);
    else if (rangeFilter === '3M') cutoff.setMonth(cutoff.getMonth() - 3);
    else if (rangeFilter === '6M') cutoff.setMonth(cutoff.getMonth() - 6);
    else if (rangeFilter === '1Y') cutoff.setFullYear(cutoff.getFullYear() - 1);
    else if (rangeFilter === '3Y') cutoff.setFullYear(cutoff.getFullYear() - 3);
    else if (rangeFilter === '5Y') cutoff.setFullYear(cutoff.getFullYear() - 5);

    return equityPoints.filter((pt) => new Date(pt.timestamp) >= cutoff);
  };

  const filteredEquityPoints = getFilteredEquityPoints();

  useEffect(() => {
    if (!containerRef.current || !filteredEquityPoints || filteredEquityPoints.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 320,
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

    // 1. Main Equity Series
    const lineSeries = chart.addSeries(LineSeries, {
      color: '#3B82F6',
      lineWidth: 2,
      priceFormat: {
        type: 'volume',
        precision: 2,
      },
    });
    equitySeriesRef.current = lineSeries;

    const dataPoints = filteredEquityPoints.map((s) => ({
      time: s.timestamp.split('T')[0],
      value: s.portfolio_value,
    }));
    lineSeries.setData(dataPoints);

    // 2. Running Peak Series (optional)
    if (showPeak) {
      const peakSeries = chart.addSeries(LineSeries, {
        color: '#22C55E',
        lineWidth: 1,
        lineStyle: 2, // dashed
        priceFormat: {
          type: 'volume',
          precision: 2,
        },
      });
      peakSeriesRef.current = peakSeries;

      const peakDataPoints = filteredEquityPoints.map((s) => ({
        time: s.timestamp.split('T')[0],
        value: s.running_peak,
      }));
      peakSeries.setData(peakDataPoints);
    }

    // 3. Initial Capital Baseline (optional)
    if (showBaseline) {
      const baselineSeries = chart.addSeries(LineSeries, {
        color: '#64748B',
        lineWidth: 1,
        lineStyle: 3, // dotted
        priceFormat: {
          type: 'volume',
          precision: 2,
        },
      });
      baselineSeriesRef.current = baselineSeries;

      const baselineDataPoints = filteredEquityPoints.map((s) => ({
        time: s.timestamp.split('T')[0],
        value: initialCapital,
      }));
      baselineSeries.setData(baselineDataPoints);
    }

    // 4. Trade Markers (optional)
    if (showTradeMarkers && trades && trades.length > 0) {
      const markers: SeriesMarker<any>[] = [];
      const pointDates = new Set(filteredEquityPoints.map((p) => p.timestamp.split('T')[0]));

      trades.forEach((t) => {
        const tradeDate = t.execution_timestamp.split('T')[0];
        if (pointDates.has(tradeDate)) {
          const isBuy = t.side === 'BUY';
          markers.push({
            time: tradeDate,
            position: isBuy ? 'belowBar' : 'aboveBar',
            color: isBuy ? '#22C55E' : '#EF4444',
            shape: isBuy ? 'arrowUp' : 'arrowDown',
            text: `${t.side} @ $${t.execution_price.toFixed(2)}`,
          });
        }
      });

      // Sort markers chronologically
      markers.sort((a, b) => String(a.time).localeCompare(String(b.time)));
      createSeriesMarkers(lineSeries, markers);
    }

    chart.timeScale().fitContent();

    // Crosshair listener for tooltip sync
    chart.subscribeCrosshairMove((param) => {
      if (param.time) {
        let timeStr: string | null = null;
        if (typeof param.time === 'string') {
          timeStr = param.time;
        } else if (typeof param.time === 'object' && param.time !== null && 'year' in param.time) {
          const t = param.time as any;
          timeStr = `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`;
        }
        setHoveredDate(timeStr);
      } else {
        setHoveredDate(null);
      }
    });

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
  }, [filteredEquityPoints, showPeak, showBaseline, showTradeMarkers, trades, initialCapital]);

  // Highlight interval when period is selected
  useEffect(() => {
    if (!chartRef.current || !selectedPeriod || !filteredEquityPoints || filteredEquityPoints.length === 0) return;
    try {
      const startDate = selectedPeriod.peak_timestamp.split('T')[0];
      const endDate = selectedPeriod.recovery_timestamp
        ? selectedPeriod.recovery_timestamp.split('T')[0]
        : filteredEquityPoints[filteredEquityPoints.length - 1].timestamp.split('T')[0];

      chartRef.current.timeScale().setVisibleRange({
        from: startDate as any,
        to: endDate as any,
      });
    } catch {
      // Ignore timestamp errors
    }
  }, [selectedPeriod, filteredEquityPoints]);

  if (isLoading) {
    return (
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-12 text-center text-sm text-[#94A3B8]">
        Calculating portfolio equity & drawdown analytics trajectory...
      </div>
    );
  }

  if (!equityPoints || equityPoints.length === 0) {
    return (
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-12 text-center text-sm text-[#94A3B8]">
        No portfolio state observations available for equity analytics.
      </div>
    );
  }

  const latestEquity = equityPoints[equityPoints.length - 1];
  const totalReturnPct = (latestEquity.portfolio_value / initialCapital - 1) * 100;
  const maxDrawdownPct = Math.min(...equityPoints.map((p) => p.drawdown_percentage ?? p.drawdown ?? 0)) * 100;

  const hoveredPoint = hoveredDate
    ? equityPoints.find((p) => p.timestamp.split('T')[0] === hoveredDate)
    : null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* 1. Metric Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-4">
          <span className="text-[10px] text-[#94A3B8] uppercase block font-semibold">Final Portfolio Value</span>
          <div className="text-xl font-bold text-[#E5E7EB] mt-1">{formatCurrency(latestEquity.portfolio_value)}</div>
          <span className="text-[10px] text-[#64748B] mt-1 block">Initial Baseline: {formatCurrency(initialCapital)}</span>
        </div>

        <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-4">
          <span className="text-[10px] text-[#94A3B8] uppercase block font-semibold">Cumulative Return</span>
          <div className={`text-xl font-bold mt-1 ${totalReturnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalReturnPct >= 0 ? '+' : ''}
            {totalReturnPct.toFixed(2)}%
          </div>
          <span className="text-[10px] text-[#64748B] mt-1 block">Over Simulation Horizon</span>
        </div>

        <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-4">
          <span className="text-[10px] text-[#94A3B8] uppercase block font-semibold">Maximum Drawdown</span>
          <div className="text-xl font-bold text-red-400 mt-1">{maxDrawdownPct.toFixed(2)}%</div>
          <span className="text-[10px] text-[#64748B] mt-1 block">Peak-to-Trough Maximum Loss</span>
        </div>

        <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-4">
          <span className="text-[10px] text-[#94A3B8] uppercase block font-semibold">Drawdown Periods</span>
          <div className="text-xl font-bold text-[#E5E7EB] mt-1">{periods.length}</div>
          <span className="text-[10px] text-[#64748B] mt-1 block">
            {periods.some((p) => p.status === 'ACTIVE') ? '1 Active Drawdown' : 'All Recovered'}
          </span>
        </div>
      </div>

      {/* 2. Synchronized Equity Chart Workspace */}
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-5">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-[#263244] font-mono">
          <div>
            <h4 className="text-sm font-semibold text-[#E5E7EB] uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-[#3B82F6]" />
              Portfolio Equity Curve & High-Water Mark
            </h4>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Authoritative backtest portfolio valuation with initial baseline and peak overlays
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Range controls */}
            <div className="flex items-center bg-[#111827] rounded border border-[#263244] p-0.5">
              {(['1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRangeFilter(r)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    rangeFilter === r
                      ? 'bg-[#3B82F6] text-white font-bold'
                      : 'text-[#94A3B8] hover:text-[#E5E7EB]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Toggle series checkboxes */}
            <div className="flex items-center gap-3 text-[11px] text-[#94A3B8]">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showPeak}
                  onChange={(e) => setShowPeak(e.target.checked)}
                  className="rounded border-[#263244] bg-[#111827] text-blue-500 focus:ring-0"
                />
                <span className="text-emerald-400 font-bold">Peak Line</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showBaseline}
                  onChange={(e) => setShowBaseline(e.target.checked)}
                  className="rounded border-[#263244] bg-[#111827] text-blue-500 focus:ring-0"
                />
                <span className="text-[#64748B] font-bold">Baseline</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showTradeMarkers}
                  onChange={(e) => setShowTradeMarkers(e.target.checked)}
                  className="rounded border-[#263244] bg-[#111827] text-blue-500 focus:ring-0"
                />
                <span className="text-blue-400 font-bold">Trade Markers</span>
              </label>
            </div>
          </div>
        </div>

        {/* Hover Readout Bar */}
        {hoveredPoint && (
          <div className="mb-3 px-3 py-1.5 bg-[#111827] border border-[#263244] rounded text-xs font-mono flex flex-wrap items-center justify-between gap-4 text-[#94A3B8]">
            <div>
              Date: <span className="text-[#E5E7EB] font-bold">{hoveredPoint.timestamp.split('T')[0]}</span>
            </div>
            <div>
              Valuation: <span className="text-blue-400 font-bold">{formatCurrency(hoveredPoint.portfolio_value)}</span>
            </div>
            <div>
              Peak: <span className="text-emerald-400 font-bold">{formatCurrency(hoveredPoint.running_peak)}</span>
            </div>
            <div>
              Cum. Return:{' '}
              <span className={hoveredPoint.cumulative_return >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {(hoveredPoint.cumulative_return * 100).toFixed(2)}%
              </span>
            </div>
            <div>
              Drawdown:{' '}
              <span className="text-red-400 font-bold">
                {((hoveredPoint.drawdown_percentage ?? hoveredPoint.drawdown ?? 0) * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {/* Equity Line Chart Container */}
        <div ref={containerRef} className="w-full rounded border border-[#263244] overflow-hidden" />
      </div>

      {/* 3. Underwater Chart */}
      <UnderwaterChart
        series={drawdownPoints}
        isLoading={isLoading}
        highlightInterval={
          selectedPeriod
            ? {
                start: selectedPeriod.peak_timestamp,
                end: selectedPeriod.recovery_timestamp || equityPoints[equityPoints.length - 1].timestamp,
              }
            : null
        }
      />

      {/* 4. Current Drawdown Status Card */}
      <CurrentDrawdownStatus
        drawdownSeries={drawdownPoints}
        periods={periods}
        isLoading={isLoading}
      />

      {/* 5. Drawdown Periods Table */}
      <DrawdownPeriodsTable
        periods={periods}
        isLoading={isLoading}
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
      />
    </div>
  );
};
