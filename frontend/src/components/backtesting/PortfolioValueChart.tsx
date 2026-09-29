import React, { useEffect, useRef } from 'react';
import { createChart, LineSeries, IChartApi } from 'lightweight-charts';
import { PortfolioState } from '../../types/backtest';

interface PortfolioValueChartProps {
  states: PortfolioState[];
  isLoading?: boolean;
  height?: number;
}

export const PortfolioValueChart: React.FC<PortfolioValueChartProps> = ({
  states,
  isLoading = false,
  height = 320,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || !states || states.length === 0) return;

    // Clean up prior chart instance
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

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#14532D',
      lineWidth: 2,
      priceFormat: {
        type: 'volume',
        precision: 2,
      },
    });

    const dataPoints = states.map((s) => ({
      time: s.timestamp.split('T')[0],
      value: s.portfolio_value,
    }));

    lineSeries.setData(dataPoints);
    chart.timeScale().fitContent();

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
  }, [states, height]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-text-secondary font-mono shadow-xs">
        Loading simulation portfolio trajectory...
      </div>
    );
  }

  if (!states || states.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-text-secondary font-mono shadow-xs">
        No portfolio state trajectory records available.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider font-mono">
            Historical Portfolio Valuation Trajectory
          </h4>
          <p className="text-xs text-text-secondary mt-0.5">
            Portfolio value ($) over time (Cash + Mark-to-Market Long Position)
          </p>
        </div>
      </div>
      <div ref={containerRef} className="w-full rounded-lg border border-border overflow-hidden bg-white shadow-xs" />
    </div>
  );
};
