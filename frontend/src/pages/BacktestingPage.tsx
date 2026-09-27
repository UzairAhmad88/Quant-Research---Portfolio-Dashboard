import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { Badge } from '../components/ui/Badge';
import { BacktestConfigPanel } from '../components/backtesting/BacktestConfigPanel';
import { BacktestSummaryCard } from '../components/backtesting/BacktestSummaryCard';
import { PerformanceMetricsCard } from '../components/backtesting/PerformanceMetricsCard';
import { EquityAnalyticsWorkspace } from '../components/backtesting/EquityAnalyticsWorkspace';
import { TradeEventsTable } from '../components/backtesting/TradeEventsTable';
import { CompletedTradesTable } from '../components/backtesting/CompletedTradesTable';
import { TradeDetailModal } from '../components/backtesting/TradeDetailModal';
import { PortfolioStateTable } from '../components/backtesting/PortfolioStateTable';
import { BacktestReportView } from '../components/backtesting/report/BacktestReportView';
import { fetchInstruments, fetchMovingAverageStrategy } from '../lib/apiClient';
import {
  useRunBacktest,
  useBacktestDetail,
  useBacktestTrades,
  useBacktestPortfolioStates,
  useBacktestCompletedTrades,
  useBacktestPerformance,
  useBacktestEquity,
  useBacktestDrawdownSeries,
  useBacktestDrawdownPeriods,
  useBacktestReport
} from '../hooks/useBacktests';
import { BacktestCreatePayload, CompletedTrade } from '../types/backtest';
import { Instrument } from '../types/instrument';
import { PlayCircle, AlertCircle, FileText, Activity } from 'lucide-react';

import { ResearchContextBar } from '../components/navigation/ResearchContextBar';
import { Breadcrumbs } from '../components/navigation/Breadcrumbs';
import { useSearchParams } from 'react-router-dom';
import { ExportMenu, ExportOption } from '../components/common/ExportMenu';
import { getBacktestExportUrl } from '../services/exportService';

export const BacktestingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlSymbol = searchParams.get('symbol');
  const urlInstrumentId = searchParams.get('instrument_id');
  const urlBacktestId = searchParams.get('backtest_id') || searchParams.get('id');
  const urlView = searchParams.get('view');

  const { data: instrumentsData } = useQuery({
    queryKey: ['instruments', 'backtesting'],
    queryFn: () => fetchInstruments({ limit: 100 }),
  });

  const instruments: (Instrument & { symbol: string })[] = (instrumentsData?.items || []).map((item) => ({
    id: item.id,
    symbol: item.symbol,
    ticker: item.symbol,
    name: item.name,
    assetClass: item.asset_type as any,
    currency: item.currency as any,
    exchange: item.exchange,
    isActive: true,
  }));

  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>('');
  const [activeBacktestId, setActiveBacktestId] = useState<string | null>(urlBacktestId);
  const [selectedTrade, setSelectedTrade] = useState<CompletedTrade | null>(null);
  const [viewMode, setViewMode] = useState<'workspace' | 'report'>(urlView === 'report' ? 'report' : 'workspace');

  // Auto-select instrument matching URL or first instrument if none selected
  useEffect(() => {
    if (instruments.length > 0) {
      if (urlInstrumentId) {
        setSelectedInstrumentId(urlInstrumentId);
      } else if (urlSymbol) {
        const found = instruments.find((i) => i.ticker.toUpperCase() === urlSymbol.toUpperCase());
        if (found) setSelectedInstrumentId(found.id);
        else if (!selectedInstrumentId) setSelectedInstrumentId(instruments[0].id);
      } else if (!selectedInstrumentId) {
        setSelectedInstrumentId(instruments[0].id);
      }
    }
  }, [instruments, urlInstrumentId, urlSymbol]);

  useEffect(() => {
    if (urlBacktestId) {
      setActiveBacktestId(urlBacktestId);
    }
  }, [urlBacktestId]);

  // Compute/retrieve Moving Average strategy signals to resolve strategy_configuration_id
  const { data: maStrategy } = useQuery({
    queryKey: ['moving-average-strategy', selectedInstrumentId],
    queryFn: () =>
      fetchMovingAverageStrategy({
        instrument_id: selectedInstrumentId,
        price_source: 'adjusted',
        ma_type: 'sma',
        fast_window: 10,
        slow_window: 20,
      }),
    enabled: Boolean(selectedInstrumentId),
  });

  const strategyConfigurationId = maStrategy?.summary?.instrument_id
    ? (maStrategy as any).summary?.strategy_configuration_id || maStrategy.summary?.instrument_id
    : undefined;

  // Backtest Mutation & Detail Queries
  const runBacktestMutation = useRunBacktest();
  const { data: activeBacktest } = useBacktestDetail(activeBacktestId || undefined);
  const { data: tradeEvents, isLoading: tradesLoading } = useBacktestTrades(activeBacktestId || undefined);
  const { data: completedTrades } = useBacktestCompletedTrades(activeBacktestId || undefined);
  const { data: portfolioStates, isLoading: statesLoading } = useBacktestPortfolioStates(activeBacktestId || undefined);
  const { data: performanceMetrics, isLoading: performanceLoading } = useBacktestPerformance(activeBacktestId || undefined);
  const { data: equityData, isLoading: equityLoading } = useBacktestEquity(activeBacktestId || undefined);
  const { data: drawdownSeriesData, isLoading: drawdownLoading } = useBacktestDrawdownSeries(activeBacktestId || undefined);
  const { data: drawdownPeriodsData, isLoading: periodsLoading } = useBacktestDrawdownPeriods(activeBacktestId || undefined);
  const { data: reportData, isLoading: reportLoading } = useBacktestReport(activeBacktestId || undefined);

  const latestState = portfolioStates && portfolioStates.length > 0 ? portfolioStates[portfolioStates.length - 1] : undefined;

  const handleRunBacktest = (payload: BacktestCreatePayload) => {
    runBacktestMutation.mutate(payload, {
      onSuccess: (res) => {
        setActiveBacktestId(res.id);
      },
    });
  };

  const backtestExportOptions: ExportOption[] = activeBacktest
    ? [
        {
          label: 'Backtest Research Report (PDF)',
          format: 'PDF',
          description: 'Institutional printable PDF with summary, metrics, and methodology',
          url: getBacktestExportUrl({ backtestId: activeBacktest.id, dataType: 'report', format: 'pdf' }),
        },
        {
          label: 'Backtest Report (JSON)',
          format: 'JSON',
          description: 'Full machine-readable BacktestReport DTO specification',
          url: getBacktestExportUrl({ backtestId: activeBacktest.id, dataType: 'report', format: 'json' }),
        },
        {
          label: 'Backtest Report Summary (CSV)',
          format: 'CSV',
          description: 'Tabular configuration, performance, and summary metrics',
          url: getBacktestExportUrl({ backtestId: activeBacktest.id, dataType: 'report', format: 'csv' }),
        },
        {
          label: 'Executed Trades (CSV)',
          format: 'CSV',
          description: 'Chronological trade records with execution prices, quantities, and fees',
          url: getBacktestExportUrl({ backtestId: activeBacktest.id, dataType: 'trades', format: 'csv' }),
        },
        {
          label: 'Equity Trajectory (CSV)',
          format: 'CSV',
          description: 'Daily cash, positions valuation, total equity, and period returns',
          url: getBacktestExportUrl({ backtestId: activeBacktest.id, dataType: 'equity', format: 'csv' }),
        },
        {
          label: 'Drawdown Series (CSV)',
          format: 'CSV',
          description: 'Daily peak equity, drawdown dollar value, and drawdown percentage',
          url: getBacktestExportUrl({ backtestId: activeBacktest.id, dataType: 'drawdown', format: 'csv' }),
        },
        {
          label: 'Portfolio States (CSV)',
          format: 'CSV',
          description: 'Daily cash balance, gross portfolio value, and positions snapshot',
          url: getBacktestExportUrl({ backtestId: activeBacktest.id, dataType: 'states', format: 'csv' }),
        },
      ]
    : [];

  return (
    <PageContainer
      eyebrow="Historical Simulation & Performance Engine"
      title="Backtest Research Workstation & Reporting System"
      description="Consolidated quantitative backtest research workspace providing interactive equity/drawdown trajectories, performance risk metrics, and structured reproducible research reports."
      action={<Badge variant="success">Phase 05 — Step 20 Active</Badge>}
    >
      <div className="col-span-12 space-y-3">
        <Breadcrumbs
          items={[
            { label: 'Backtesting' },
            ...(activeBacktest ? [{ label: `Backtest #${activeBacktest.id.slice(0, 8)}` }] : []),
            ...(viewMode === 'report' ? [{ label: 'Research Report (v1.0)' }] : []),
          ]}
        />
        <ResearchContextBar availableInstruments={instruments} />
      </div>

      {/* 1. Configuration Panel */}
      <div className="col-span-12">
        <BacktestConfigPanel
          instruments={instruments}
          selectedInstrumentId={selectedInstrumentId}
          onSelectInstrument={setSelectedInstrumentId}
          strategyConfigurationId={strategyConfigurationId}
          onRunBacktest={handleRunBacktest}
          isLoading={runBacktestMutation.isPending}
        />
      </div>

      {/* Mutation Error Notification */}
      {runBacktestMutation.isError && (
        <div className="col-span-12 p-4 bg-red-950/40 border border-red-800/60 rounded-lg text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <div>
            <div className="font-semibold">Backtest Simulation Failed</div>
            <div className="text-xs text-red-300/80 mt-0.5">
              {runBacktestMutation.error.message || 'An unexpected error occurred during historical simulation.'}
            </div>
          </div>
        </div>
      )}

      {/* View Mode Toggle Bar & Export Controls */}
      {activeBacktest && (
        <div className="col-span-12 bg-[#151F2E] border border-[#263244] rounded-lg p-3 font-mono flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#94A3B8]">
            Active Backtest ID: <span className="text-[#E5E7EB] font-bold">{activeBacktest.id}</span>
          </div>

          <div className="flex items-center gap-3">
            <ExportMenu options={backtestExportOptions} />

            <div className="flex items-center gap-2 bg-[#111827] rounded p-1 border border-[#263244]">
              <button
                onClick={() => setViewMode('workspace')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
                  viewMode === 'workspace'
                    ? 'bg-[#3B82F6] text-white font-bold'
                    : 'text-[#94A3B8] hover:text-[#E5E7EB]'
                }`}
              >
                <Activity className="h-3.5 w-3.5" /> Interactive Analytics
              </button>

              <button
                onClick={() => setViewMode('report')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
                  viewMode === 'report'
                    ? 'bg-[#3B82F6] text-white font-bold'
                    : 'text-[#94A3B8] hover:text-[#E5E7EB]'
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Research Report (v1.0)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Simulation Results */}
      {activeBacktest ? (
        viewMode === 'report' ? (
          <div className="col-span-12">
            {reportData ? (
              <BacktestReportView report={reportData} isLoading={reportLoading} />
            ) : (
              <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-12 text-center text-sm font-mono text-[#94A3B8]">
                Generating structured quantitative research report DTO...
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Summary Card */}
            <div className="col-span-12">
              <BacktestSummaryCard backtest={activeBacktest} latestState={latestState} />
            </div>

            {/* Quantitative Performance Metrics Card */}
            <div className="col-span-12">
              <PerformanceMetricsCard metrics={performanceMetrics} isLoading={performanceLoading} />
            </div>

            {/* Dedicated Equity & Drawdown Analytics Workspace */}
            <div className="col-span-12">
              <EquityAnalyticsWorkspace
                equityPoints={equityData?.equity_series || []}
                drawdownPoints={drawdownSeriesData?.drawdown_series || []}
                periods={drawdownPeriodsData?.periods || []}
                trades={tradeEvents || []}
                initialCapital={activeBacktest.initial_capital}
                isLoading={equityLoading || drawdownLoading || periodsLoading}
              />
            </div>

            {/* Completed Round-Trip Trades Table */}
            <div className="col-span-12">
              <CompletedTradesTable trades={completedTrades || []} onSelectTrade={setSelectedTrade} />
            </div>

            {/* Execution History Table */}
            <div className="col-span-12">
              <TradeEventsTable trades={tradeEvents || []} isLoading={tradesLoading} />
            </div>

            {/* Raw Portfolio State History Table */}
            <div className="col-span-12">
              <PortfolioStateTable states={portfolioStates || []} isLoading={statesLoading} />
            </div>
          </>
        )
      ) : (
        <div className="col-span-12 bg-[#151F2E] border border-[#263244] rounded-lg p-12 text-center">
          <PlayCircle className="h-12 w-12 text-[#94A3B8] mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-[#E5E7EB]">No Backtest Simulation Active</h3>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto mt-1 leading-relaxed">
            Select an instrument, set execution parameters above, and click <strong>Run Historical Backtest</strong> to execute a reproducible chronological simulation and generate a quantitative research report.
          </p>
        </div>
      )}

      {/* Trade Detail Modal */}
      <TradeDetailModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
    </PageContainer>
  );
};


