import React from 'react';
import { useChartStore } from '../../store/useChartStore';
import { ChartSettingsPopover } from './ChartSettingsPopover';

import { CandlestickChart as CandleIcon, LineChart as LineIcon, Maximize2, BarChart2 } from 'lucide-react';

interface ChartToolbarProps {
  activePreset?: string;
  onPresetChange?: (preset: string) => void;
}

export const ChartToolbar: React.FC<ChartToolbarProps> = ({ activePreset = '5Y', onPresetChange }) => {
  const {
    chartType,
    priceMode,
    showVolume,
    setChartType,
    setPriceMode,
    toggleVolume,
    toggleFullscreen,
  } = useChartStore();

  const presets = ['1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#F8FAF9] border border-[#E5E7EB] rounded-t-md text-xs font-mono-num select-none">
      {/* Left: Chart Type & Price Mode */}
      <div className="flex items-center gap-2">
        {/* Chart Type Toggle */}
        <div className="flex items-center bg-white p-0.5 rounded-md border border-[#CBD5E1]">
          <button
            onClick={() => setChartType('candlestick')}
            title="Candlestick View"
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              chartType === 'candlestick'
                ? 'bg-[#14532D] text-white font-semibold shadow-2xs'
                : 'text-[#64748B] hover:text-[#17211B] hover:bg-[#F0FDF4]'
            }`}
          >
            <CandleIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Candles</span>
          </button>
          <button
            onClick={() => setChartType('line')}
            title="Line View"
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              chartType === 'line'
                ? 'bg-[#14532D] text-white font-semibold shadow-2xs'
                : 'text-[#64748B] hover:text-[#17211B] hover:bg-[#F0FDF4]'
            }`}
          >
            <LineIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Line</span>
          </button>
        </div>

        {/* Price Mode Toggle */}
        <div className="flex items-center bg-white p-0.5 rounded-md border border-[#CBD5E1]">
          <button
            onClick={() => setPriceMode('close')}
            className={`px-2 py-1 rounded transition-colors ${
              priceMode === 'close'
                ? 'bg-[#DCFCE7] text-[#166534] font-semibold'
                : 'text-[#64748B] hover:text-[#17211B] hover:bg-[#F0FDF4]'
            }`}
          >
            Raw
          </button>
          <button
            onClick={() => setPriceMode('adjusted_close')}
            className={`px-2 py-1 rounded transition-colors ${
              priceMode === 'adjusted_close'
                ? 'bg-[#DCFCE7] text-[#166534] font-semibold'
                : 'text-[#64748B] hover:text-[#17211B] hover:bg-[#F0FDF4]'
            }`}
          >
            Adj
          </button>
        </div>
      </div>

      {/* Center: Range Presets */}
      {onPresetChange && (
        <div className="flex items-center gap-1">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => onPresetChange(preset)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                activePreset === preset
                  ? 'bg-[#14532D] text-white font-semibold shadow-2xs'
                  : 'text-[#64748B] hover:bg-[#F0FDF4] hover:text-[#14532D]'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      )}

      {/* Right: Volume, Settings, Fullscreen */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleVolume}
          title="Toggle Volume Pane"
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors border ${
            showVolume
              ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC] font-semibold'
              : 'bg-white text-[#64748B] border-[#CBD5E1] hover:text-[#17211B] hover:bg-[#F0FDF4]'
          }`}
        >
          <BarChart2 className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Vol</span>
        </button>

        <ChartSettingsPopover />

        <button
          onClick={toggleFullscreen}
          title="Fullscreen Research View"
          className="p-1.5 bg-white hover:bg-[#F0FDF4] text-[#64748B] hover:text-[#14532D] rounded border border-[#CBD5E1] transition-colors"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
