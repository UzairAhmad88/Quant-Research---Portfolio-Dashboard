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

    // 1. Main Equity Series
    const lineSeries = chart.addSeries(LineSeries, {
      color: '#166534',
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
        color: '#94A3B8',
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
            color: isBuy ? '#166534' : '#DC2626',
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
      <div className="bg-card border border-border rounded-xl p-12 text-center text-sm font-mono text-text-secondary shadow-xs">
        Calculating portfolio equity & drawdown analytics trajectory...
      </div>
    );
  }

  if (!equityPoints || equityPoints.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center text-sm font-mono text-text-secondary shadow-xs">
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
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <span className="text-[10px] text-text-secondary uppercase block font-semibold">Final Portfolio Value</span>
          <div className="text-xl font-bold text-text-primary mt-1">{formatCurrency(latestEquity.portfolio_value)}</div>
          <span className="text-[10px] text-text-muted mt-1 block">Initial Baseline: {formatCurrency(initialCapital)}</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <span className="text-[10px] text-text-secondary uppercase block font-semibold">Cumulative Return</span>
          <div className={`text-xl font-bold mt-1 ${totalReturnPct >= 0 ? 'text-forest-600' : 'text-rose-600'}`}>
            {totalReturnPct >= 0 ? '+' : ''}
            {totalReturnPct.toFixed(2)}%
          </div>
          <span className="text-[10px] text-text-muted mt-1 block">Over Simulation Horizon</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <span className="text-[10px] text-text-secondary uppercase block font-semibold">Maximum Drawdown</span>
          <div className="text-xl font-bold text-rose-600 mt-1">{maxDrawdownPct.toFixed(2)}%</div>
          <span className="text-[10px] text-text-muted mt-1 block">Peak-to-Trough Maximum Loss</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <span className="text-[10px] text-text-secondary uppercase block font-semibold">Drawdown Periods</span>
          <div className="text-xl font-bold text-text-primary mt-1">{periods.length}</div>
          <span className="text-[10px] text-text-muted mt-1 block">
            {periods.some((p) => p.status === 'ACTIVE') ? '1 Active Drawdown' : 'All Recovered'}
          </span>
        </div>
      </div>

      {/* 2. Synchronized Equity Chart Workspace */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-border font-mono">
          <div>
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-forest-600" />
              Portfolio Equity Curve & High-Water Mark
            </h4>
            <p className="text-xs text-text-secondary mt-0.5 font-sans">
              Authoritative backtest portfolio valuation with initial baseline and peak overlays
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Range controls */}
            <div className="flex items-center bg-forest-50/50 rounded-lg border border-forest-100 p-0.5">
              {(['1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRangeFilter(r)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
                    rangeFilter === r
                      ? 'bg-forest-700 text-white font-semibold shadow-xs'
                      : 'text-text-secondary hover:text-text-primary hover:bg-forest-100/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Toggle series checkboxes */}
            <div className="flex items-center gap-3 text-[11px] text-text-secondary">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-text-primary">
                <input
                  type="checkbox"
                  checked={showPeak}
                  onChange={(e) => setShowPeak(e.target.checked)}
                  className="rounded border-border text-forest-600 focus:ring-forest-500"
                />
                <span className="text-forest-700 font-medium">Peak Line</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-text-primary">
                <input
                  type="checkbox"
                  checked={showBaseline}
                  onChange={(e) => setShowBaseline(e.target.checked)}
                  className="rounded border-border text-forest-600 focus:ring-forest-500"
                />
                <span className="text-text-secondary font-medium">Baseline</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-text-primary">
                <input
                  type="checkbox"
                  checked={showTradeMarkers}
                  onChange={(e) => setShowTradeMarkers(e.target.checked)}
                  className="rounded border-border text-forest-600 focus:ring-forest-500"
                />
                <span className="text-forest-600 font-medium">Trade Markers</span>
              </label>
            </div>
          </div>
        </div>

        {/* Hover Readout Bar */}
        {hoveredPoint && (
          <div className="mb-3 px-3 py-1.5 bg-forest-50/50 border border-forest-100 rounded-lg text-xs font-mono flex flex-wrap items-center justify-between gap-4 text-text-secondary">
            <div>
              Date: <span className="text-text-primary font-bold">{hoveredPoint.timestamp.split('T')[0]}</span>
            </div>
            <div>
              Valuation: <span className="text-forest-700 font-bold">{formatCurrency(hoveredPoint.portfolio_value)}</span>
            </div>
            <div>
              Peak: <span className="text-forest-600 font-bold">{formatCurrency(hoveredPoint.running_peak)}</span>
            </div>
            <div>
              Cum. Return:{' '}
              <span className={hoveredPoint.cumulative_return >= 0 ? 'text-forest-700 font-bold' : 'text-rose-600 font-bold'}>
                {(hoveredPoint.cumulative_return * 100).toFixed(2)}%
              </span>
            </div>
            <div>
              Drawdown:{' '}
              <span className="text-rose-600 font-bold">
                {((hoveredPoint.drawdown_percentage ?? hoveredPoint.drawdown ?? 0) * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {/* Equity Line Chart Container */}
        <div ref={containerRef} className="w-full rounded-lg border border-border overflow-hidden bg-white shadow-xs" />
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
