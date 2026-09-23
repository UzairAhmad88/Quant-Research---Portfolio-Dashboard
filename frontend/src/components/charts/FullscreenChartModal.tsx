import React, { useEffect } from 'react';
import { useChartStore } from '../../store/useChartStore';
import { MarketChart } from './MarketChart';
import { ChartToolbar } from './ChartToolbar';
import { OHLCVItem } from '../../lib/apiClient';
import { Minimize2 } from 'lucide-react';


interface FullscreenChartModalProps {
  bars: OHLCVItem[];
  symbol?: string;
  activePreset?: string;
  onPresetChange?: (preset: string) => void;
}

export const FullscreenChartModal: React.FC<FullscreenChartModalProps> = ({
  bars,
  symbol = 'INSTRUMENT',
  activePreset,
  onPresetChange,
}) => {
  const { isFullscreen, toggleFullscreen } = useChartStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, toggleFullscreen]);

  if (!isFullscreen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B0F17] p-4 text-[#F8FAFC]">
      {/* Modal Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#263244] mb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold font-mono-num text-[#F8FAFC]">{symbol}</h2>
          <span className="text-xs text-[#94A3B8]">Fullscreen Research Workstation Chart</span>
        </div>

        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E293B] hover:bg-[#263244] text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-medium rounded transition-colors"
        >
          <Minimize2 className="h-4 w-4" />
          Exit Fullscreen <span className="text-[10px] text-[#64748B]">(ESC)</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-2">
        <ChartToolbar activePreset={activePreset} onPresetChange={onPresetChange} />
      </div>

      {/* Expanded Canvas Chart */}
      <div className="flex-1 w-full bg-[#0B0F17] rounded border border-[#263244] overflow-hidden">
        <MarketChart bars={bars} symbol={symbol} height={window.innerHeight - 180} />
      </div>
    </div>
  );
};
