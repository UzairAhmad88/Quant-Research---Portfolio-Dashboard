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
    <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-brand-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Strategy Parameters &amp; Rule Engine</h3>
        </div>
        <div className="text-xs text-text-secondary font-mono">
          Moving Average Crossover Generator
        </div>
      </div>

      <form onSubmit={handleApply} className="space-y-4">
        {/* Preset Strategy Templates */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-text-secondary font-medium">Quick Presets:</span>
          <button
            type="button"
            onClick={() => {
              setFastWindow(50);
              setSlowWindow(200);
              setMaType('sma');
              setValidationError(null);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors ${
              fastWindow === 50 && slowWindow === 200 && maType === 'sma'
                ? 'bg-brand-primary/10 border-brand-primary text-brand-primary font-semibold'
                : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:border-border-hover'
            }`}
          >
            Golden Cross (50 / 200 SMA)
          </button>
          <button
            type="button"
            onClick={() => {
              setFastWindow(20);
              setSlowWindow(50);
              setMaType('ema');
              setValidationError(null);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors ${
              fastWindow === 20 && slowWindow === 50 && maType === 'ema'
                ? 'bg-brand-primary/10 border-brand-primary text-brand-primary font-semibold'
                : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:border-border-hover'
            }`}
          >
            Momentum Trend (20 / 50 EMA)
          </button>
          <button
            type="button"
            onClick={() => {
              setFastWindow(5);
              setSlowWindow(20);
              setMaType('sma');
              setValidationError(null);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors ${
              fastWindow === 5 && slowWindow === 20 && maType === 'sma'
                ? 'bg-brand-primary/10 border-brand-primary text-brand-primary font-semibold'
                : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:border-border-hover'
            }`}
          >
            Swing Scalper (5 / 20 SMA)
          </button>
          <button
            type="button"
            onClick={() => {
              setFastWindow(9);
              setSlowWindow(21);
              setMaType('ema');
              setValidationError(null);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors ${
              fastWindow === 9 && slowWindow === 21 && maType === 'ema'
                ? 'bg-brand-primary/10 border-brand-primary text-brand-primary font-semibold'
                : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:border-border-hover'
            }`}
          >
            Trend Pullback (9 / 21 EMA)
          </button>
        </div>

        {/* Main Calculation Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
          {/* Instrument Select */}
          <div>
            <label className="text-text-secondary block mb-1 font-medium">Target Instrument</label>
            <select
              value={instrumentId}
              onChange={(e) => setInstrumentId(e.target.value)}
              className="w-full bg-surface border border-border text-text-primary rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-brand-primary"
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
            <label className="text-text-secondary block mb-1 font-medium">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-surface border border-border text-text-primary rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-brand-primary"
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
            <label className="text-text-secondary block mb-1 font-medium">Price Source</label>
            <select
              value={priceSource}
              onChange={(e) => setPriceSource(e.target.value as 'adjusted' | 'close')}
              className="w-full bg-surface border border-border text-text-primary rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-brand-primary"
            >
              <option value="adjusted">Adjusted Close</option>
              <option value="close">Unadjusted Close</option>
            </select>
          </div>

          {/* MA Type */}
          <div>
            <label className="text-text-secondary block mb-1 font-medium">MA Type</label>
            <select
              value={maType}
              onChange={(e) => setMaType(e.target.value as 'sma' | 'ema')}
              className="w-full bg-surface border border-border text-text-primary rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-brand-primary"
            >
              <option value="sma">SMA (Simple)</option>
              <option value="ema">EMA (Exponential)</option>
            </select>
          </div>

          {/* Fast Window */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-text-secondary font-medium">Fast Window</label>
              <span className="text-[10px] text-brand-primary font-mono font-bold">{fastWindow}d</span>
            </div>
            <input
              type="number"
              min={1}
              max={500}
              value={fastWindow}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFastWindow(val);
                if (val >= slowWindow) {
                  setValidationError(`Fast window (${val}) must be strictly less than slow window (${slowWindow}).`);
                } else {
                  setValidationError(null);
                }
              }}
              className="w-full bg-surface border border-border text-text-primary rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-brand-primary"
            />
          </div>

          {/* Slow Window */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-text-secondary font-medium">Slow Window</label>
              <span className={`text-[10px] font-mono font-bold ${slowWindow > fastWindow ? 'text-emerald-600' : 'text-rose-600'}`}>
                Δ{slowWindow - fastWindow}d
              </span>
            </div>
            <input
              type="number"
              min={2}
              max={1000}
              value={slowWindow}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSlowWindow(val);
                if (fastWindow >= val) {
                  setValidationError(`Fast window (${fastWindow}) must be strictly less than slow window (${val}).`);
                } else {
                  setValidationError(null);
                }
              }}
              className="w-full bg-surface border border-border text-text-primary rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-brand-primary"
            />
          </div>
        </div>

        {/* Display & Chart Overlay Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Eye className="w-3.5 h-3.5" />
              <span className="font-semibold">Chart Overlays:</span>
            </div>

            {/* Chart Type */}
            <div className="flex items-center bg-surface border border-border rounded-lg p-0.5 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => setChartType('candlestick')}
                className={`px-2.5 py-0.5 rounded-md transition-colors ${
                  chartType === 'candlestick' ? 'bg-brand-primary text-white font-semibold' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Candlestick
              </button>
              <button
                type="button"
                onClick={() => setChartType('line')}
                className={`px-2.5 py-0.5 rounded-md transition-colors ${
                  chartType === 'line' ? 'bg-brand-primary text-white font-semibold' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Line
              </button>
            </div>

            {/* Checkboxes */}
            <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary font-mono text-xs">
              <input
                type="checkbox"
                checked={showFastMA}
                onChange={(e) => setShowFastMA(e.target.checked)}
                className="accent-brand-primary rounded"
              />
              <span>Fast MA</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary font-mono text-xs">
              <input
                type="checkbox"
                checked={showSlowMA}
                onChange={(e) => setShowSlowMA(e.target.checked)}
                className="accent-amber-600 rounded"
              />
              <span>Slow MA</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary font-mono text-xs">
              <input
                type="checkbox"
                checked={showSignals}
                onChange={(e) => setShowSignals(e.target.checked)}
                className="accent-emerald-600 rounded"
              />
              <span>Signals (▲/▼)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary font-mono text-xs">
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
              className="px-3 py-1.5 bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-1.5 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isLoading ? 'Executing...' : 'Apply Strategy'}
            </button>
          </div>
        </div>

        {/* Local Validation Error */}
        {validationError && (
          <div className="text-xs text-rose-700 font-mono bg-rose-50 p-2.5 rounded-lg border border-rose-200">
            {validationError}
          </div>
        )}
      </form>
    </div>
  );
};
