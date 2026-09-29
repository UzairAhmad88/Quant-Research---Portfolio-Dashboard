import React, { useState, useRef, useEffect } from 'react';
import { useChartStore } from '../../store/useChartStore';
import { Settings, Check, X } from 'lucide-react';

export const ChartSettingsPopover: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const {
    chartType,
    priceMode,
    showVolume,
    showCrosshair,
    showGrid,
    setChartType,
    setPriceMode,
    toggleVolume,
    toggleCrosshair,
    toggleGrid,
  } = useChartStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        title="Chart Settings"
        className={`p-1.5 rounded transition-colors border ${
          isOpen
            ? 'bg-[#14532D] text-white border-[#14532D]'
            : 'bg-white text-[#64748B] border-[#CBD5E1] hover:bg-[#F0FDF4] hover:text-[#14532D]'
        }`}
      >
        <Settings className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-lg shadow-xl z-30 p-3 text-xs select-none">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB] mb-3">
            <span className="font-semibold text-[#17211B]">Chart Settings</span>
            <button onClick={() => setIsOpen(false)} className="text-[#64748B] hover:text-[#17211B]">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Chart Type */}
            <div>
              <label className="block text-[11px] font-medium text-[#64748B] mb-1">Series Type</label>
              <div className="grid grid-cols-2 gap-1 bg-[#F8FAF9] p-1 rounded-md border border-[#E5E7EB]">
                <button
                  onClick={() => setChartType('candlestick')}
                  className={`py-1 text-center rounded transition-colors ${
                    chartType === 'candlestick'
                      ? 'bg-[#14532D] text-white font-semibold shadow-2xs'
                      : 'text-[#64748B] hover:text-[#17211B] hover:bg-white'
                  }`}
                >
                  Candlestick
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`py-1 text-center rounded transition-colors ${
                    chartType === 'line'
                      ? 'bg-[#14532D] text-white font-semibold shadow-2xs'
                      : 'text-[#64748B] hover:text-[#17211B] hover:bg-white'
                  }`}
                >
                  Line
                </button>
              </div>
            </div>

            {/* Price Mode */}
            <div>
              <label className="block text-[11px] font-medium text-[#64748B] mb-1">Price Mode</label>
              <div className="grid grid-cols-2 gap-1 bg-[#F8FAF9] p-1 rounded-md border border-[#E5E7EB]">
                <button
                  onClick={() => setPriceMode('close')}
                  className={`py-1 text-center rounded transition-colors ${
                    priceMode === 'close'
                      ? 'bg-[#14532D] text-white font-semibold shadow-2xs'
                      : 'text-[#64748B] hover:text-[#17211B] hover:bg-white'
                  }`}
                >
                  Raw Close
                </button>
                <button
                  onClick={() => setPriceMode('adjusted_close')}
                  className={`py-1 text-center rounded transition-colors ${
                    priceMode === 'adjusted_close'
                      ? 'bg-[#14532D] text-white font-semibold shadow-2xs'
                      : 'text-[#64748B] hover:text-[#17211B] hover:bg-white'
                  }`}
                >
                  Adj Close
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-1.5 pt-1 border-t border-[#E5E7EB]">
              <label
                onClick={toggleVolume}
                className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-[#F0FDF4] text-[#334155] hover:text-[#14532D]"
              >
                <span>Volume Pane</span>
                {showVolume && <Check className="h-3.5 w-3.5 text-[#14532D]" />}
              </label>

              <label
                onClick={toggleCrosshair}
                className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-[#F0FDF4] text-[#334155] hover:text-[#14532D]"
              >
                <span>Crosshair</span>
                {showCrosshair && <Check className="h-3.5 w-3.5 text-[#14532D]" />}
              </label>

              <label
                onClick={toggleGrid}
                className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-[#F0FDF4] text-[#334155] hover:text-[#14532D]"
              >
                <span>Grid Lines</span>
                {showGrid && <Check className="h-3.5 w-3.5 text-[#14532D]" />}
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
