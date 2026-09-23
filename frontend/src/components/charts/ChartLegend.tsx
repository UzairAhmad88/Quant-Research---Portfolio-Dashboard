import React from 'react';

export interface LegendData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  change?: number;
  changePercent?: number;
}

interface ChartLegendProps {
  symbol: string;
  data: LegendData | null;
  priceMode: 'close' | 'adjusted_close';
}

export const ChartLegend: React.FC<ChartLegendProps> = ({ symbol, data, priceMode }) => {
  if (!data) {
    return (
      <div className="flex items-center gap-4 text-xs font-mono-num text-[#64748B] py-1 px-3 bg-[#0B0F17]/80 rounded border border-[#1E293B]/60">
        <span className="font-bold text-[#F8FAFC]">{symbol}</span>
        <span>Hover over candles to view OHLCV values</span>
      </div>
    );
  }

  const change = data.change ?? (data.close - data.open);
  const changePercent = data.changePercent ?? ((data.close - data.open) / data.open) * 100;
  const isUp = change >= 0;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono-num py-1 px-3 bg-[#0B0F17]/90 rounded border border-[#263244] shadow-md select-none">
      <div className="flex items-center gap-2">
        <span className="font-bold text-[#F8FAFC]">{symbol}</span>
        <span className="text-[#94A3B8]">{data.time}</span>
        {priceMode === 'adjusted_close' && (
          <span className="text-[10px] text-[#3B82F6] px-1 py-0.2 bg-[#3B82F6]/10 rounded border border-[#3B82F6]/30">
            Adj
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span>O <strong className="text-[#F8FAFC]">${data.open.toFixed(2)}</strong></span>
        <span>H <strong className="text-[#10B981]">${data.high.toFixed(2)}</strong></span>
        <span>L <strong className="text-[#EF4444]">${data.low.toFixed(2)}</strong></span>
        <span>C <strong className="text-[#F8FAFC]">${data.close.toFixed(2)}</strong></span>
        
        <span className={isUp ? 'text-[#10B981] font-medium' : 'text-[#EF4444] font-medium'}>
          {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{changePercent.toFixed(2)}%)
        </span>

        {data.volume !== undefined && (
          <span className="text-[#94A3B8]">
            Vol <strong className="text-[#F8FAFC]">{data.volume.toLocaleString()}</strong>
          </span>
        )}
      </div>
    </div>
  );
};
