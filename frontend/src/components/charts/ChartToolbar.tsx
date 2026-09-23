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
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#111827] border border-[#263244] rounded-t-lg text-xs font-mono-num select-none">
      {/* Left: Chart Type & Price Mode */}
      <div className="flex items-center gap-2">
        {/* Chart Type Toggle */}
        <div className="flex items-center bg-[#0B0F17] p-0.5 rounded border border-[#1E293B]">
          <button
            onClick={() => setChartType('candlestick')}
            title="Candlestick View"
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              chartType === 'candlestick'
                ? 'bg-[#3B82F6] text-white font-medium'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
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
                ? 'bg-[#3B82F6] text-white font-medium'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <LineIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Line</span>
          </button>
        </div>

        {/* Price Mode Toggle */}
        <div className="flex items-center bg-[#0B0F17] p-0.5 rounded border border-[#1E293B]">
          <button
            onClick={() => setPriceMode('close')}
            className={`px-2 py-1 rounded transition-colors ${
              priceMode === 'close'
                ? 'bg-[#1E293B] text-[#F8FAFC] font-medium'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Raw
          </button>
          <button
            onClick={() => setPriceMode('adjusted_close')}
            className={`px-2 py-1 rounded transition-colors ${
              priceMode === 'adjusted_close'
                ? 'bg-[#1E293B] text-[#F8FAFC] font-medium'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
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
                  ? 'bg-[#3B82F6] text-white font-medium'
                  : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC]'
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
              ? 'bg-[#1E293B] text-[#F8FAFC] border-[#263244]'
              : 'bg-[#0B0F17] text-[#64748B] border-[#1E293B] hover:text-[#F8FAFC]'
          }`}
        >
          <BarChart2 className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Vol</span>
        </button>

        <ChartSettingsPopover />

        <button
          onClick={toggleFullscreen}
          title="Fullscreen Research View"
          className="p-1.5 bg-[#1E293B] hover:bg-[#263244] text-[#94A3B8] hover:text-[#F8FAFC] rounded border border-[#263244] transition-colors"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
