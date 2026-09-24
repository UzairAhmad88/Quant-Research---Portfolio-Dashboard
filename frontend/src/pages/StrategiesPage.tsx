import React, { useState, useEffect } from 'react';
import { Sliders, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  fetchInstruments,
  fetchMovingAverageStrategy,
  InstrumentItem,
  MovingAverageStrategyResponse,
} from '../lib/apiClient';
import { StrategyConfigPanel, StrategyConfig } from '../components/strategies/StrategyConfigPanel';
import { StrategySummaryCards } from '../components/strategies/StrategySummaryCards';
import { StrategyPriceChart } from '../components/strategies/StrategyPriceChart';
import { CrossoverTable } from '../components/strategies/CrossoverTable';

export const StrategiesPage: React.FC = () => {
  // Available instruments
  const [availableInstruments, setAvailableInstruments] = useState<InstrumentItem[]>([]);

  // Default configuration
  const [config, setConfig] = useState<StrategyConfig>({
    instrumentId: '',
    dateRange: '1Y',
    priceSource: 'adjusted',
    maType: 'sma',
    fastWindow: 20,
    slowWindow: 50,
  });

  // Strategy response state
  const [strategyData, setStrategyData] = useState<MovingAverageStrategyResponse | null>(null);

  // Loading & error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch available instruments on mount
  useEffect(() => {
    fetchInstruments({ limit: 50, active: true })
      .then((res) => {
        setAvailableInstruments(res.items);
        if (res.items.length > 0) {
          setConfig((prev) => ({
            ...prev,
            instrumentId: res.items[0].id,
          }));
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const getStartDate = (rangeStr: string) => {
    const now = new Date();
    if (rangeStr === '1M') now.setMonth(now.getMonth() - 1);
    else if (rangeStr === '3M') now.setMonth(now.getMonth() - 3);
    else if (rangeStr === '6M') now.setMonth(now.getMonth() - 6);
    else if (rangeStr === '1Y') now.setFullYear(now.getFullYear() - 1);
    else if (rangeStr === '3Y') now.setFullYear(now.getFullYear() - 3);
    else if (rangeStr === '5Y') now.setFullYear(now.getFullYear() - 5);
    else return undefined;
    return now.toISOString();
  };

  // Load strategy analytics
  const loadStrategy = async (cfg: StrategyConfig) => {
    if (!cfg.instrumentId) return;

    try {
      setIsLoading(true);
      setErrorMsg(null);

      const res = await fetchMovingAverageStrategy({
        instrument_id: cfg.instrumentId,
        start_date: getStartDate(cfg.dateRange),
        price_source: cfg.priceSource,
        ma_type: cfg.maType,
        fast_window: cfg.fastWindow,
        slow_window: cfg.slowWindow,
      });

      setStrategyData(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to execute moving average strategy');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (config.instrumentId) {
      loadStrategy(config);
    }
  }, [config.instrumentId]);

  const handleApplyConfig = (newConfig: StrategyConfig) => {
    setConfig(newConfig);
    loadStrategy(newConfig);
  };

  const handleResetConfig = () => {
    const defaultConfig: StrategyConfig = {
      instrumentId: availableInstruments[0]?.id || '',
      dateRange: '1Y',
      priceSource: 'adjusted',
      maType: 'sma',
      fastWindow: 20,
      slowWindow: 50,
    };
    setConfig(defaultConfig);
    loadStrategy(defaultConfig);
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#263244] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-blue-400" />
            Moving Average Strategy Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Quantitative research signal generator (BUY / SELL / HOLD) &amp; bullish/bearish crossover detector
          </p>
        </div>

        {strategyData && (
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-[#151F2E] border border-[#263244] px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Quality: <strong className="text-slate-200">{strategyData.quality_status}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Configuration Panel */}
      <StrategyConfigPanel
        availableInstruments={availableInstruments}
        currentConfig={config}
        onApplyConfig={handleApplyConfig}
        onResetConfig={handleResetConfig}
        isLoading={isLoading}
      />

      {/* Error Alert */}
      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-900/60 rounded-lg p-4 flex items-center gap-3 text-rose-300 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Insufficient Data Alert */}
      {strategyData && !strategyData.is_sufficient && (
        <div className="bg-amber-950/40 border border-amber-900/60 rounded-lg p-4 flex items-center gap-3 text-amber-300 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <div className="font-semibold">Insufficient Data Warning</div>
            <div className="text-xs text-amber-400/80">{strategyData.message}</div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
          <span>Executing moving average strategy &amp; evaluating crossover signals...</span>
        </div>
      ) : strategyData && strategyData.is_sufficient ? (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <StrategySummaryCards summary={strategyData.summary} />

          {/* Strategy Price Chart */}
          <StrategyPriceChart
            series={strategyData.series}
            crossovers={strategyData.crossovers}
            symbol={strategyData.summary.symbol}
            fastWindow={strategyData.summary.fast_window}
            slowWindow={strategyData.summary.slow_window}
            maType={strategyData.summary.ma_type}
          />

          {/* Crossover Table */}
          <CrossoverTable
            crossovers={strategyData.crossovers}
            symbol={strategyData.summary.symbol}
          />
        </div>
      ) : availableInstruments.length === 0 ? (
        <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-12 text-center text-slate-400">
          No instruments available in database. Add instruments in the Market Data workspace.
        </div>
      ) : null}
    </div>
  );
};
