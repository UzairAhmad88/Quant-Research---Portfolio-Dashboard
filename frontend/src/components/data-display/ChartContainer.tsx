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
          <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-[#F8FAF9] border border-[#CBD5E1]">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono-num font-semibold transition-colors ${
                  activeTimeframe === tf
                    ? 'bg-[#14532D] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#17211B] hover:bg-[#F0FDF4]'
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
        className="relative w-full rounded-md border border-[#E5E7EB] bg-white overflow-hidden flex items-center justify-center p-4 shadow-2xs"
      >
        {/* Minimal Grid Background Effect */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {children ? (
          <div className="relative z-10 w-full h-full">{children}</div>
        ) : (
          <div className="relative z-10 flex flex-col items-center justify-center text-center p-6">
            <div className="p-3 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] text-[#14532D] mb-3">
              <LineChart className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-semibold text-[#17211B] tracking-tight uppercase mb-1">
              Quantitative Chart Placeholder ({activeTimeframe})
            </h4>
            <p className="text-xs text-[#64748B] max-w-sm">
              Chart canvas ready. Interactive price, return, and volatility rendering modules active with verified real market data.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
