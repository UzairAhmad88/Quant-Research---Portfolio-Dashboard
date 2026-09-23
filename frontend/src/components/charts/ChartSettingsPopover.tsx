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
            ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
            : 'bg-[#1E293B] text-[#94A3B8] border-[#263244] hover:bg-[#263244] hover:text-[#F8FAFC]'
        }`}
      >
        <Settings className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#111827] border border-[#263244] rounded-lg shadow-2xl z-30 p-3 text-xs select-none">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E293B] mb-3">
            <span className="font-semibold text-[#F8FAFC]">Chart Visualization Settings</span>
            <button onClick={() => setIsOpen(false)} className="text-[#64748B] hover:text-[#F8FAFC]">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Chart Type */}
            <div>
              <label className="block text-[11px] font-medium text-[#64748B] mb-1">Series Type</label>
              <div className="grid grid-cols-2 gap-1 bg-[#0B0F17] p-1 rounded border border-[#1E293B]">
                <button
                  onClick={() => setChartType('candlestick')}
                  className={`py-1 text-center rounded transition-colors ${
                    chartType === 'candlestick'
                      ? 'bg-[#3B82F6] text-white font-medium'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  Candlestick
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`py-1 text-center rounded transition-colors ${
                    chartType === 'line'
                      ? 'bg-[#3B82F6] text-white font-medium'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  Line
                </button>
              </div>
            </div>

            {/* Price Mode */}
            <div>
              <label className="block text-[11px] font-medium text-[#64748B] mb-1">Price Mode</label>
              <div className="grid grid-cols-2 gap-1 bg-[#0B0F17] p-1 rounded border border-[#1E293B]">
                <button
                  onClick={() => setPriceMode('close')}
                  className={`py-1 text-center rounded transition-colors ${
                    priceMode === 'close'
                      ? 'bg-[#3B82F6] text-white font-medium'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  Raw Close
                </button>
                <button
                  onClick={() => setPriceMode('adjusted_close')}
                  className={`py-1 text-center rounded transition-colors ${
                    priceMode === 'adjusted_close'
                      ? 'bg-[#3B82F6] text-white font-medium'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  Adj Close
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-1.5 pt-1 border-t border-[#1E293B]">
              <label
                onClick={toggleVolume}
                className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]"
              >
                <span>Volume Pane</span>
                {showVolume && <Check className="h-3.5 w-3.5 text-[#3B82F6]" />}
              </label>

              <label
                onClick={toggleCrosshair}
                className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]"
              >
                <span>Crosshair</span>
                {showCrosshair && <Check className="h-3.5 w-3.5 text-[#3B82F6]" />}
              </label>

              <label
                onClick={toggleGrid}
                className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]"
              >
                <span>Grid Lines</span>
                {showGrid && <Check className="h-3.5 w-3.5 text-[#3B82F6]" />}
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
