import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { LineChart } from 'lucide-react';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  height?: number | string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

const timeframes = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  height = 320,
  action,
  children,
}) => {
  const [activeTimeframe, setActiveTimeframe] = useState('1M');

  return (
    <Card
      title={title}
      subtitle={subtitle}
      action={
        <div className="flex items-center gap-3">
          {/* Timeframe Selector */}
          <div className="flex items-center gap-0.5 p-0.5 rounded bg-[#111827] border border-[#263244]">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono-num font-medium transition-colors ${
                  activeTimeframe === tf
                    ? 'bg-[#3B82F6] text-white'
                    : 'text-[#94A3B8] hover:text-[#E5E7EB] hover:bg-[#151F2E]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          {action}
        </div>
      }
    >
      <div
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
        className="relative w-full rounded border border-[#263244]/80 bg-[#111827]/60 overflow-hidden flex items-center justify-center p-4"
      >
        {/* Minimal Grid Background Effect */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#263244 1px, transparent 1px), linear-gradient(90deg, #263244 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {children ? (
          <div className="relative z-10 w-full h-full">{children}</div>
        ) : (
          <div className="relative z-10 flex flex-col items-center justify-center text-center p-6">
            <div className="p-3 rounded-full bg-[#151F2E] border border-[#263244] text-[#3B82F6] mb-3">
              <LineChart className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-semibold text-[#E5E7EB] tracking-tight uppercase mb-1">
              Quantitative Chart Placeholder ({activeTimeframe})
            </h4>
            <p className="text-xs text-[#94A3B8] max-w-sm">
              Chart canvas ready. Interactive price, return, and volatility rendering modules will activate in dedicated analytics steps.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
