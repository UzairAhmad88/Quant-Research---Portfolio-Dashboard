import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import {
  fetchInstruments,
  fetchMovingAverageStrategy,
  InstrumentItem,
  MovingAverageStrategyResponse,
} from '../lib/apiClient';
import { StrategyHeader } from '../components/strategies/StrategyHeader';
import { StrategyConfigPanel, StrategyConfig } from '../components/strategies/StrategyConfigPanel';
import { StrategySummaryCards } from '../components/strategies/StrategySummaryCards';
import { StrategyPriceChart } from '../components/strategies/StrategyPriceChart';
import { CrossoverTable } from '../components/strategies/CrossoverTable';
import { MethodologyPanel } from '../components/strategies/MethodologyPanel';
import { StrategyDataQuality } from '../components/strategies/StrategyDataQuality';

export const StrategiesPage: React.FC = () => {
  // Available instruments
  const [availableInstruments, setAvailableInstruments] = useState<InstrumentItem[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentItem | null>(null);

  // Default configuration
  const [config, setConfig] = useState<StrategyConfig>({
    instrumentId: '',
    dateRange: '1Y',
    priceSource: 'adjusted',
    maType: 'sma',
    fastWindow: 20,
    slowWindow: 50,
    chartType: 'candlestick',
    showFastMA: true,
    showSlowMA: true,
    showSignals: true,
    showVolume: false,
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
          setSelectedInstrument(res.items[0]);
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

    const inst = availableInstruments.find((i) => i.id === cfg.instrumentId);
    if (inst) setSelectedInstrument(inst);

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
      chartType: 'candlestick',
      showFastMA: true,
      showSlowMA: true,
      showSignals: true,
      showVolume: false,
    };
    setConfig(defaultConfig);
    loadStrategy(defaultConfig);
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100 p-6 space-y-6">
      {/* Strategy Header */}
      {selectedInstrument ? (
        <StrategyHeader
          symbol={selectedInstrument.symbol}
          name={selectedInstrument.name}
          assetType={selectedInstrument.asset_type}
          currentSignal={strategyData?.summary.current_signal || 'HOLD'}
        />
      ) : (
        <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-5">
          <h1 className="text-xl font-bold text-slate-100 font-mono">Moving Average Strategy Engine</h1>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Historical moving-average crossover research &amp; signal inspection
          </p>
        </div>
      )}

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
        <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-12 text-center text-slate-400 font-mono text-xs">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
          <span>Calculating moving averages &amp; detecting crossover signals...</span>
        </div>
      ) : strategyData && strategyData.is_sufficient ? (
        <div className="space-y-6">
          {/* Strategy Summary Metric Cards */}
          <StrategySummaryCards summary={strategyData.summary} />

          {/* Main Strategy Research Chart */}
          <StrategyPriceChart
            series={strategyData.series}
            crossovers={strategyData.crossovers}
            symbol={strategyData.summary.symbol}
            fastWindow={strategyData.summary.fast_window}
            slowWindow={strategyData.summary.slow_window}
            maType={strategyData.summary.ma_type}
            chartType={config.chartType}
            showFastMA={config.showFastMA}
            showSlowMA={config.showSlowMA}
            showSignals={config.showSignals}
            showVolume={config.showVolume}
          />

          {/* Crossover History Log Table */}
          <CrossoverTable
            crossovers={strategyData.crossovers}
            symbol={strategyData.summary.symbol}
          />

          {/* Bottom Side-by-Side: Methodology & Data Quality Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MethodologyPanel
              maType={strategyData.summary.ma_type}
              fastWindow={strategyData.summary.fast_window}
              slowWindow={strategyData.summary.slow_window}
              priceSource={strategyData.summary.price_source}
            />
            <StrategyDataQuality
              qualityStatus={strategyData.quality_status}
              qualityWarning={strategyData.quality_warning}
              observationCount={strategyData.summary.observation_count}
              priceSource={strategyData.summary.price_source}
            />
          </div>
        </div>
      ) : availableInstruments.length === 0 ? (
        <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-12 text-center text-slate-400 font-mono text-xs">
          No instruments available in database. Add instruments in the Market Data workspace.
        </div>
      ) : null}
    </div>
  );
};
