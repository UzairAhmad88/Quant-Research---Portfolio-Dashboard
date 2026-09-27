import React, { useState } from 'react';
import { Instrument } from '../../types/instrument';
import { BacktestCreatePayload } from '../../types/backtest';
import { Button } from '../ui/Button';
import { Play, AlertCircle, RefreshCw } from 'lucide-react';

interface BacktestConfigPanelProps {
  instruments: Instrument[];
  selectedInstrumentId: string;
  onSelectInstrument: (id: string) => void;
  strategyConfigurationId?: string;
  onRunBacktest: (payload: BacktestCreatePayload) => void;
  isLoading: boolean;
}

export const BacktestConfigPanel: React.FC<BacktestConfigPanelProps> = ({
  instruments,
  selectedInstrumentId,
  onSelectInstrument,
  strategyConfigurationId,
  onRunBacktest,
  isLoading,
}) => {
  const [initialCapital, setInitialCapital] = useState<number>(100000);
  const [executionTiming, setExecutionTiming] = useState<'NEXT_OPEN'>('NEXT_OPEN');
  const [positionSizing, setPositionSizing] = useState<'FULL_CAPITAL'>('FULL_CAPITAL');
  const [commission, setCommission] = useState<number>(0);
  const [slippage, setSlippage] = useState<number>(0);
  const [direction, setDirection] = useState<'LONG_ONLY'>('LONG_ONLY');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedInstrumentId) {
      setErrorMsg('Please select an instrument.');
      return;
    }

    if (!strategyConfigurationId) {
      setErrorMsg('Strategy configuration is required. Please compute strategy signals first.');
      return;
    }

    if (initialCapital <= 0 || isNaN(initialCapital)) {
      setErrorMsg('Initial capital must be strictly positive (> 0).');
      return;
    }

    if (commission < 0 || isNaN(commission)) {
      setErrorMsg('Commission rate cannot be negative.');
      return;
    }

    if (slippage < 0 || isNaN(slippage)) {
      setErrorMsg('Slippage rate cannot be negative.');
      return;
    }

    onRunBacktest({
      instrument_id: selectedInstrumentId,
      strategy_configuration_id: strategyConfigurationId,
      initial_capital: initialCapital,
      execution_timing: executionTiming,
      position_sizing: positionSizing,
      commission,
      slippage,
      direction,
    });
  };

  return (
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between border-b border-[#263244] pb-3 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[#E5E7EB] flex items-center gap-2 font-mono uppercase tracking-wider">
            <Play className="h-4 w-4 text-[#3B82F6]" />
            Backtest Simulation Configuration
          </h3>
          <p className="text-xs text-[#94A3B8] font-sans mt-0.5">
            Configure chronological trade simulation, execution timing models, and realistic transaction cost friction.
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111827] text-[#94A3B8] border border-[#263244]">
          Deterministic Execution Engine
        </span>
      </div>

      {/* Preset Backtest Scenarios (HCI: Recognition over Recall) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-[#94A3B8] font-medium">Simulation Presets:</span>
        <button
          type="button"
          onClick={() => {
            setInitialCapital(100000);
            setCommission(0.0005);
            setSlippage(0.0002);
            setErrorMsg(null);
          }}
          className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-colors ${
            initialCapital === 100000 && commission === 0.0005 && slippage === 0.0002
              ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-[#60A5FA] font-bold'
              : 'bg-[#0B1220] border-[#263244] text-[#94A3B8] hover:text-[#E5E7EB]'
          }`}
        >
          Institutional Standard ($100k, 5bps comm, 2bps slip)
        </button>
        <button
          type="button"
          onClick={() => {
            setInitialCapital(100000);
            setCommission(0);
            setSlippage(0);
            setErrorMsg(null);
          }}
          className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-colors ${
            initialCapital === 100000 && commission === 0 && slippage === 0
              ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-[#60A5FA] font-bold'
              : 'bg-[#0B1220] border-[#263244] text-[#94A3B8] hover:text-[#E5E7EB]'
          }`}
        >
          Zero-Friction Baseline ($100k, $0 fees)
        </button>
        <button
          type="button"
          onClick={() => {
            setInitialCapital(500000);
            setCommission(0.001);
            setSlippage(0.001);
            setErrorMsg(null);
          }}
          className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-colors ${
            initialCapital === 500000 && commission === 0.001 && slippage === 0.001
              ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-[#60A5FA] font-bold'
              : 'bg-[#0B1220] border-[#263244] text-[#94A3B8] hover:text-[#E5E7EB]'
          }`}
        >
          High-Friction Stress ($500k, 10bps comm, 10bps slip)
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded text-red-300 text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Instrument Selector */}
        <div>
          <label className="block text-xs text-[#94A3B8] font-medium mb-1">Instrument</label>
          <select
            value={selectedInstrumentId}
            onChange={(e) => onSelectInstrument(e.target.value)}
            className="w-full bg-[#0B1220] border border-[#263244] text-[#E5E7EB] text-sm rounded px-3 py-2 focus:outline-none focus:border-[#3B82F6]"
          >
            <option value="">-- Select Instrument --</option>
            {instruments.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.ticker} — {inst.name} ({inst.assetClass})
              </option>
            ))}
          </select>
        </div>

        {/* Initial Capital */}
        <div>
          <label className="block text-xs text-[#94A3B8] font-medium mb-1">Initial Capital ($)</label>
          <input
            type="number"
            min="1"
            step="1000"
            value={initialCapital}
            onChange={(e) => setInitialCapital(parseFloat(e.target.value) || 0)}
            className="w-full bg-[#0B1220] border border-[#263244] text-[#E5E7EB] text-sm rounded px-3 py-2 focus:outline-none focus:border-[#3B82F6]"
          />
        </div>

        {/* Execution Timing */}
        <div>
          <label className="block text-xs text-[#94A3B8] font-medium mb-1">Execution Timing</label>
          <select
            value={executionTiming}
            onChange={(e) => setExecutionTiming(e.target.value as 'NEXT_OPEN')}
            className="w-full bg-[#0B1220] border border-[#263244] text-[#E5E7EB] text-sm rounded px-3 py-2 focus:outline-none focus:border-[#3B82F6]"
          >
            <option value="NEXT_OPEN">Next Observation Open (NEXT_OPEN)</option>
          </select>
        </div>

        {/* Position Sizing */}
        <div>
          <label className="block text-xs text-[#94A3B8] font-medium mb-1">Position Sizing</label>
          <select
            value={positionSizing}
            onChange={(e) => setPositionSizing(e.target.value as 'FULL_CAPITAL')}
            className="w-full bg-[#0B1220] border border-[#263244] text-[#E5E7EB] text-sm rounded px-3 py-2 focus:outline-none focus:border-[#3B82F6]"
          >
            <option value="FULL_CAPITAL">Full Capital (100% Available Cash)</option>
          </select>
        </div>

        {/* Commission */}
        <div>
          <label className="block text-xs text-[#94A3B8] font-medium mb-1">Commission Rate (bps / fractional)</label>
          <input
            type="number"
            min="0"
            step="0.0001"
            value={commission}
            onChange={(e) => setCommission(parseFloat(e.target.value) || 0)}
            placeholder="0.0000"
            className="w-full bg-[#0B1220] border border-[#263244] text-[#E5E7EB] text-sm rounded px-3 py-2 focus:outline-none focus:border-[#3B82F6]"
          />
          <span className="text-[10px] text-[#94A3B8]">Default: 0 (Zero Cost)</span>
        </div>

        {/* Slippage */}
        <div>
          <label className="block text-xs text-[#94A3B8] font-medium mb-1">Slippage Rate (bps / fractional)</label>
          <input
            type="number"
            min="0"
            step="0.0001"
            value={slippage}
            onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
            placeholder="0.0000"
            className="w-full bg-[#0B1220] border border-[#263244] text-[#E5E7EB] text-sm rounded px-3 py-2 focus:outline-none focus:border-[#3B82F6]"
          />
          <span className="text-[10px] text-[#94A3B8]">Default: 0 (Zero Cost)</span>
        </div>

        {/* Direction */}
        <div>
          <label className="block text-xs text-[#94A3B8] font-medium mb-1">Direction Mode</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as 'LONG_ONLY')}
            className="w-full bg-[#0B1220] border border-[#263244] text-[#E5E7EB] text-sm rounded px-3 py-2 focus:outline-none focus:border-[#3B82F6]"
          >
            <option value="LONG_ONLY">Long Only (No Shorting / Leverage)</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="flex items-end">
          <Button
            type="submit"
            disabled={isLoading || !selectedInstrumentId || !strategyConfigurationId}
            className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white font-medium py-2 px-4 rounded text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Executing Backtest...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                Run Historical Backtest
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
