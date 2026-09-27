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

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#3B82F6',
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
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-8 text-center text-sm text-[#94A3B8]">
        Loading simulation portfolio trajectory...
      </div>
    );
  }

  if (!states || states.length === 0) {
    return (
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-8 text-center text-sm text-[#94A3B8]">
        No portfolio state trajectory records available.
      </div>
    );
  }

  return (
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-[#E5E7EB] uppercase tracking-wider font-mono">
            Historical Portfolio Valuation Trajectory
          </h4>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Portfolio value ($) over time (Cash + Mark-to-Market Long Position)
          </p>
        </div>
      </div>
      <div ref={containerRef} className="w-full rounded border border-[#263244] overflow-hidden" />
    </div>
  );
};
