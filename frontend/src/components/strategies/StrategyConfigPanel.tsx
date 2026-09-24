import React, { useState } from 'react';
import { InstrumentItem } from '../../lib/apiClient';
import { SlidersHorizontal, RotateCcw, Play, Eye } from 'lucide-react';

export interface StrategyConfig {
  instrumentId: string;
  dateRange: string;
  priceSource: 'adjusted' | 'close';
  maType: 'sma' | 'ema';
  fastWindow: number;
  slowWindow: number;
  chartType: 'candlestick' | 'line';
  showFastMA: boolean;
  showSlowMA: boolean;
  showSignals: boolean;
  showVolume: boolean;
}

interface StrategyConfigPanelProps {
  availableInstruments: InstrumentItem[];
  currentConfig: StrategyConfig;
  onApplyConfig: (newConfig: StrategyConfig) => void;
  onResetConfig: () => void;
  isLoading: boolean;
}

export const StrategyConfigPanel: React.FC<StrategyConfigPanelProps> = ({
  availableInstruments,
  currentConfig,
  onApplyConfig,
  onResetConfig,
  isLoading,
}) => {
  const [instrumentId, setInstrumentId] = useState<string>(currentConfig.instrumentId);
  const [dateRange, setDateRange] = useState<string>(currentConfig.dateRange);
  const [priceSource, setPriceSource] = useState<'adjusted' | 'close'>(currentConfig.priceSource);
  const [maType, setMaType] = useState<'sma' | 'ema'>(currentConfig.maType);
  const [fastWindow, setFastWindow] = useState<number>(currentConfig.fastWindow);
  const [slowWindow, setSlowWindow] = useState<number>(currentConfig.slowWindow);

  // Overlay preferences
  const [chartType, setChartType] = useState<'candlestick' | 'line'>(currentConfig.chartType);
  const [showFastMA, setShowFastMA] = useState<boolean>(currentConfig.showFastMA);
  const [showSlowMA, setShowSlowMA] = useState<boolean>(currentConfig.showSlowMA);
  const [showSignals, setShowSignals] = useState<boolean>(currentConfig.showSignals);
  const [showVolume, setShowVolume] = useState<boolean>(currentConfig.showVolume);

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (fastWindow <= 0 || slowWindow <= 0) {
      setValidationError('Window sizes must be positive integers.');
      return;
    }

    if (fastWindow >= slowWindow) {
      setValidationError(`Fast window (${fastWindow}) must be strictly less than slow window (${slowWindow}).`);
      return;
    }

    onApplyConfig({
      instrumentId,
      dateRange,
      priceSource,
      maType,
      fastWindow,
      slowWindow,
      chartType,
      showFastMA,
      showSlowMA,
      showSignals,
      showVolume,
    });
  };

  const handleReset = () => {
    setValidationError(null);
    onResetConfig();
  };

  return (
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-[#263244] pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-200">Strategy Parameters &amp; Rule Engine</h3>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Moving Average Crossover Generator
        </div>
      </div>

      <form onSubmit={handleApply} className="space-y-4">
        {/* Main Calculation Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
          {/* Instrument Select */}
          <div>
            <label className="text-slate-400 block mb-1">Target Instrument</label>
            <select
              value={instrumentId}
              onChange={(e) => setInstrumentId(e.target.value)}
              className="w-full bg-[#0B1220] border border-[#263244] text-slate-200 rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-blue-500"
            >
              {availableInstruments.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.symbol} ({inst.asset_type})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Preset */}
          <div>
            <label className="text-slate-400 block mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-[#0B1220] border border-[#263244] text-slate-200 rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-blue-500"
            >
              <option value="1M">1 Month</option>
              <option value="3M">3 Months</option>
              <option value="6M">6 Months</option>
              <option value="1Y">1 Year (Default)</option>
              <option value="3Y">3 Years</option>
              <option value="5Y">5 Years</option>
              <option value="MAX">Max Available</option>
            </select>
          </div>

          {/* Price Source */}
          <div>
            <label className="text-slate-400 block mb-1">Price Source</label>
            <select
              value={priceSource}
              onChange={(e) => setPriceSource(e.target.value as 'adjusted' | 'close')}
              className="w-full bg-[#0B1220] border border-[#263244] text-slate-200 rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-blue-500"
            >
              <option value="adjusted">Adjusted Close</option>
              <option value="close">Unadjusted Close</option>
            </select>
          </div>

          {/* MA Type */}
          <div>
            <label className="text-slate-400 block mb-1">MA Type</label>
            <select
              value={maType}
              onChange={(e) => setMaType(e.target.value as 'sma' | 'ema')}
              className="w-full bg-[#0B1220] border border-[#263244] text-slate-200 rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-blue-500"
            >
              <option value="sma">SMA (Simple)</option>
              <option value="ema">EMA (Exponential)</option>
            </select>
          </div>

          {/* Fast Window */}
          <div>
            <label className="text-slate-400 block mb-1">Fast Window (obs)</label>
            <input
              type="number"
              min={1}
              max={500}
              value={fastWindow}
              onChange={(e) => setFastWindow(Number(e.target.value))}
              className="w-full bg-[#0B1220] border border-[#263244] text-slate-200 rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Slow Window */}
          <div>
            <label className="text-slate-400 block mb-1">Slow Window (obs)</label>
            <input
              type="number"
              min={2}
              max={1000}
              value={slowWindow}
              onChange={(e) => setSlowWindow(Number(e.target.value))}
              className="w-full bg-[#0B1220] border border-[#263244] text-slate-200 rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Display & Chart Overlay Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#263244] text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Eye className="w-3.5 h-3.5" />
              <span className="font-semibold">Chart Overlays:</span>
            </div>

            {/* Chart Type */}
            <div className="flex items-center bg-[#0B1220] border border-[#263244] rounded p-0.5 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => setChartType('candlestick')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  chartType === 'candlestick' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Candlestick
              </button>
              <button
                type="button"
                onClick={() => setChartType('line')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  chartType === 'line' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Line
              </button>
            </div>

            {/* Checkboxes */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-mono">
              <input
                type="checkbox"
                checked={showFastMA}
                onChange={(e) => setShowFastMA(e.target.checked)}
                className="accent-blue-500 rounded"
              />
              <span>Fast MA</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-mono">
              <input
                type="checkbox"
                checked={showSlowMA}
                onChange={(e) => setShowSlowMA(e.target.checked)}
                className="accent-amber-500 rounded"
              />
              <span>Slow MA</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-mono">
              <input
                type="checkbox"
                checked={showSignals}
                onChange={(e) => setShowSignals(e.target.checked)}
                className="accent-emerald-500 rounded"
              />
              <span>Signals (▲/▼)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-mono">
              <input
                type="checkbox"
                checked={showVolume}
                onChange={(e) => setShowVolume(e.target.checked)}
                className="accent-slate-500 rounded"
              />
              <span>Volume</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 bg-[#0B1220] border border-[#263244] text-slate-400 hover:text-slate-200 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isLoading ? 'Executing...' : 'Apply Strategy'}
            </button>
          </div>
        </div>

        {/* Local Validation Error */}
        {validationError && (
          <div className="text-xs text-rose-400 font-mono bg-rose-950/40 p-2 rounded border border-rose-900/60">
            {validationError}
          </div>
        )}
      </form>
    </div>
  );
};
