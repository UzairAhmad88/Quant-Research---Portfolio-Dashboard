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
    <div className="fixed inset-0 z-50 flex flex-col bg-background p-4 text-text-primary">
      {/* Modal Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border mb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold font-mono-num text-forest-700">{symbol}</h2>
          <span className="text-xs text-text-secondary">Fullscreen Research Workstation Chart</span>
        </div>

        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-forest-50 text-text-primary text-xs font-medium rounded-lg border border-border transition-colors shadow-xs"
        >
          <Minimize2 className="h-4 w-4 text-forest-700" />
          Exit Fullscreen <span className="text-[10px] text-text-muted">(ESC)</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-2">
        <ChartToolbar activePreset={activePreset} onPresetChange={onPresetChange} />
      </div>

      {/* Expanded Canvas Chart */}
      <div className="flex-1 w-full bg-card rounded-xl border border-border overflow-hidden shadow-xs">
        <MarketChart bars={bars} symbol={symbol} height={window.innerHeight - 180} />
      </div>
    </div>
  );
};
