import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { MetricCard } from '../components/data-display/MetricCard';
import { ReturnChart } from '../components/returns/ReturnChart';
import {
  fetchInstruments,
  fetchReturns,
  fetchMarketData,
  InstrumentItem,
  ReturnAnalysisResponse,
} from '../lib/apiClient';
import { FileSpreadsheet, AlertTriangle } from 'lucide-react';

import { useResearchContext } from '../hooks/useResearchContext';
import { ResearchContextBar } from '../components/navigation/ResearchContextBar';
import { Breadcrumbs } from '../components/navigation/Breadcrumbs';
import { ExportMenu } from '../components/common/ExportMenu';
import { getReturnsExportUrl, triggerDownload } from '../services/exportService';

const DEFAULT_PRESET_INSTRUMENTS: InstrumentItem[] = [
  { id: 'inst-tsla', symbol: 'TSLA', name: 'Tesla, Inc.', asset_type: 'EQUITY', exchange: 'NASDAQ', currency: 'USD', active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'inst-aapl', symbol: 'AAPL', name: 'Apple Inc.', asset_type: 'EQUITY', exchange: 'NASDAQ', currency: 'USD', active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'inst-msft', symbol: 'MSFT', name: 'Microsoft Corporation', asset_type: 'EQUITY', exchange: 'NASDAQ', currency: 'USD', active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'inst-nvda', symbol: 'NVDA', name: 'NVIDIA Corporation', asset_type: 'EQUITY', exchange: 'NASDAQ', currency: 'USD', active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'inst-spy', symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', asset_type: 'ETF', exchange: 'NYSE Arca', currency: 'USD', active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'inst-qqq', symbol: 'QQQ', name: 'Invesco QQQ Trust', asset_type: 'ETF', exchange: 'NASDAQ', currency: 'USD', active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'inst-googl', symbol: 'GOOGL', name: 'Alphabet Inc.', asset_type: 'EQUITY', exchange: 'NASDAQ', currency: 'USD', active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'inst-amzn', symbol: 'AMZN', name: 'Amazon.com, Inc.', asset_type: 'EQUITY', exchange: 'NASDAQ', currency: 'USD', active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

export const ReturnsPage: React.FC = () => {
  const { context } = useResearchContext();

  // Instrument Master State
  const [instruments, setInstruments] = useState<InstrumentItem[]>(DEFAULT_PRESET_INSTRUMENTS);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentItem | null>(DEFAULT_PRESET_INSTRUMENTS[0]);

  // Date Range Presets State
  const todayStr = new Date().toISOString().split('T')[0];
  const fiveYearsAgoStr = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(context.startDate || fiveYearsAgoStr);
  const [endDate, setEndDate] = useState(context.endDate || todayStr);
  const [activePreset, setActivePreset] = useState<string>(context.rangePreset || '5Y');

  // Return Parameters State
  const [priceSource, setPriceSource] = useState<'adjusted' | 'close'>(context.priceSource || 'adjusted');
  const [returnType, setReturnType] = useState<'simple' | 'log'>('simple');
  const [chartMode, setChartMode] = useState<'cumulative' | 'periodic'>('cumulative');

  // Return Analysis Data State
  const [returnAnalysis, setReturnAnalysis] = useState<ReturnAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Table Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // 1. Load available instruments & parse URL research context
  useEffect(() => {
    fetchInstruments({ limit: 100 })
      .then((res) => {
        const list = res.items.length > 0 ? res.items : DEFAULT_PRESET_INSTRUMENTS;
        setInstruments(list);
        const searchSym = (context.symbol || 'TSLA').toUpperCase();
        const matched = list.find(
          (i) =>
            i.symbol.toUpperCase() === searchSym ||
            (context.instrumentId && i.id === context.instrumentId)
        );
        setSelectedInstrument(
          matched || {
            id: `custom-${searchSym}`,
            symbol: searchSym,
            name: `${searchSym} Asset`,
            asset_type: 'EQUITY',
            exchange: 'NASDAQ',
            currency: 'USD',
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        );
      })
      .catch(() => {
        setInstruments(DEFAULT_PRESET_INSTRUMENTS);
        const searchSym = (context.symbol || 'TSLA').toUpperCase();
        const matched = DEFAULT_PRESET_INSTRUMENTS.find((i) => i.symbol === searchSym);
        setSelectedInstrument(matched || DEFAULT_PRESET_INSTRUMENTS[0]);
      });
  }, [context.symbol, context.instrumentId]);

  // Ingest market data manually or on demand
  const handleIngestData = async (targetSym?: string) => {
    const sym = targetSym || selectedInstrument?.symbol || context.symbol || 'TSLA';
    setIsIngesting(true);
    setErrorMsg(null);
    try {
      await fetchMarketData({
        symbol: sym,
        provider: 'yahoo_finance',
        frequency: 'DAILY',
        start_date: startDate,
        end_date: endDate,
      });
      const res = await fetchInstruments({ limit: 100 });
      if (res.items.length > 0) {
        setInstruments(res.items);
        const matched = res.items.find((i) => i.symbol.toUpperCase() === sym.toUpperCase());
        if (matched) {
          setSelectedInstrument(matched);
        }
      }
      await loadReturnAnalysis(sym);
    } catch (err: any) {
      setErrorMsg(err.message || 'Market data ingestion failed.');
    } finally {
      setIsIngesting(false);
    }
  };

  // 2. Fetch Return Analysis when parameters change
  const loadReturnAnalysis = async (explicitSym?: string) => {
    const targetSymbol = explicitSym || selectedInstrument?.symbol || 'TSLA';
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Resolve true DB instrument UUID
      let instId = selectedInstrument?.id;
      if (!instId || instId.startsWith('inst-') || instId.startsWith('custom-')) {
        const instRes = await fetchInstruments({ limit: 100 }).catch(() => ({ items: [] }));
        const found = instRes.items.find((i) => i.symbol.toUpperCase() === targetSymbol.toUpperCase());
        if (found) {
          instId = found.id;
          setSelectedInstrument(found);
        }
      }

      // 2. If instrument is not yet in database, ingest it from Yahoo Finance
      if (!instId || instId.startsWith('inst-') || instId.startsWith('custom-')) {
        await fetchMarketData({
          symbol: targetSymbol,
          provider: 'yahoo_finance',
          frequency: 'DAILY',
          start_date: startDate,
          end_date: endDate,
        }).catch(() => null);

        const instRes = await fetchInstruments({ limit: 100 }).catch(() => ({ items: [] }));
        const found = instRes.items.find((i) => i.symbol.toUpperCase() === targetSymbol.toUpperCase());
        if (found) {
          instId = found.id;
          setSelectedInstrument(found);
        }
      }

      if (!instId) {
        setIsLoading(false);
        return;
      }

      const res = await fetchReturns({
        instrument_id: instId,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        price_source: priceSource,
        return_type: returnType,
      });

      if (res.series.length === 0) {
        // Attempt quick on-demand backfill
        await fetchMarketData({
          symbol: targetSymbol,
          provider: 'yahoo_finance',
          frequency: 'DAILY',
          start_date: startDate,
          end_date: endDate,
        }).catch(() => null);

        const retryRes = await fetchReturns({
          instrument_id: instId,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          price_source: priceSource,
          return_type: returnType,
        }).catch(() => null);

        if (retryRes && retryRes.series.length > 0) {
          setReturnAnalysis(retryRes);
        } else {
          setReturnAnalysis(res);
        }
      } else {
        setReturnAnalysis(res);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to calculate return analysis.');
      setReturnAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedInstrument) {
      loadReturnAnalysis();
    }
  }, [selectedInstrument?.symbol, startDate, endDate, priceSource, returnType]);

  // Handle Preset Button Click
  const handlePresetChange = (preset: string) => {
    setActivePreset(preset);
    const now = new Date();
    let start = new Date();

    switch (preset) {
      case '1M':
        start.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        start.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        start.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        start.setFullYear(now.getFullYear() - 1);
        break;
      case '3Y':
        start.setFullYear(now.getFullYear() - 3);
        break;
      case '5Y':
        start.setFullYear(now.getFullYear() - 5);
        break;
      case 'MAX':
        start = new Date('2000-01-01');
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  };

  const summary = returnAnalysis?.summary;

  const series = returnAnalysis?.series || [];

  // Table pagination items
  const totalItems = series.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const displayedSeries = series.slice((page - 1) * pageSize, page * pageSize);

  const formatPct = (val?: number | null) => {
    if (val === undefined || val === null) return '—';
    const formatted = (val * 100).toFixed(2) + '%';
    return val > 0 ? `+${formatted}` : formatted;
  };

  return (
    <PageContainer
      eyebrow="Quantitative Analytics Engine"
      title="Return Calculator & Return Analytics"
      description="Compute simple and logarithmic returns, cumulative performance wealth curves, CAGR annualized performance, and return distributions from validated market data."
      action={
        <div className="flex items-center gap-2">
          {returnAnalysis && (
            <Badge variant={returnAnalysis.quality_status === 'GOOD' ? 'success' : 'warning'}>
              Quality: {returnAnalysis.quality_status}
            </Badge>
          )}
          <ExportMenu
            disabled={!selectedInstrument || !returnAnalysis || series.length === 0}
            options={[
              {
                id: 'returns-csv',
                label: 'Returns Series CSV',
                format: 'csv',
                url: getReturnsExportUrl({
                  instrumentId: selectedInstrument?.id || '',
                  format: 'csv',
                  startDate,
                  endDate,
                  priceSource,
                  returnType,
                }),
                description: 'Date, price, and mathematical return series',
              },
              {
                id: 'returns-json',
                label: 'Returns Analysis JSON',
                format: 'json',
                url: getReturnsExportUrl({
                  instrumentId: selectedInstrument?.id || '',
                  format: 'json',
                  startDate,
                  endDate,
                  priceSource,
                  returnType,
                }),
                description: 'Full metrics and series payload with metadata',
              },
            ]}
          />
        </div>
      }
    >
      <div className="col-span-12 space-y-3">
        <Breadcrumbs items={[{ label: 'Returns' }, { label: selectedInstrument?.symbol || 'Instrument' }]} />
        <ResearchContextBar availableInstruments={instruments} />
      </div>
      {/* Research Controls Toolbar */}
      <div className="col-span-12">
        <Card className="p-4 bg-card border-border text-text-primary shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Instrument Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">Target:</span>
              <div className="relative">
                <select
                  value={selectedInstrument?.symbol || ''}
                  onChange={(e) => {
                    const sym = e.target.value;
                    const inst = instruments.find((i) => i.symbol === sym) || {
                      id: `custom-${sym}`,
                      symbol: sym,
                      name: `${sym} Asset`,
                      asset_type: 'EQUITY',
                      exchange: 'NASDAQ',
                      currency: 'USD',
                      active: true,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    };
                    setSelectedInstrument(inst);
                  }}
                  className="bg-surface border border-border text-text-primary rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-brand-primary cursor-pointer"
                >
                  {instruments.map((inst) => (
                    <option key={inst.symbol} value={inst.symbol}>
                      {inst.symbol} — {inst.name} ({inst.asset_type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Presets */}
            <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border">
              {['1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetChange(preset)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors ${
                    activePreset === preset
                      ? 'bg-brand-primary text-white font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Price Source & Return Type Switches */}
            <div className="flex items-center gap-3">
              {/* Price Source */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-text-secondary">Price:</span>
                <button
                  onClick={() => setPriceSource('adjusted')}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                    priceSource === 'adjusted'
                      ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30 font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Adjusted
                </button>
                <button
                  onClick={() => setPriceSource('close')}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                    priceSource === 'close'
                      ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30 font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Close
                </button>
              </div>

              {/* Return Type */}
              <div className="flex items-center gap-1 text-xs border-l border-border pl-3">
                <span className="text-text-secondary">Return:</span>
                <button
                  onClick={() => setReturnType('simple')}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                    returnType === 'simple'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Simple
                </button>
                <button
                  onClick={() => setReturnType('log')}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                    returnType === 'log'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Log
                </button>
              </div>

              {/* Chart Mode */}
              <div className="flex items-center gap-1 text-xs border-l border-border pl-3">
                <button
                  onClick={() => setChartMode('cumulative')}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                    chartMode === 'cumulative'
                      ? 'bg-brand-primary text-white font-semibold'
                      : 'bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-border'
                  }`}
                >
                  Cumulative Chart
                </button>
                <button
                  onClick={() => setChartMode('periodic')}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                    chartMode === 'periodic'
                      ? 'bg-brand-primary text-white font-semibold'
                      : 'bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-border'
                  }`}
                >
                  Periodic Bars
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Error / Validation Warning State */}
      {errorMsg && (
        <div className="col-span-12">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-mono text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard
          label="Period Return"
          value={formatPct(summary?.period_return)}
          subtitle={`Total performance (${startDate} → ${endDate})`}
          tooltipText="Total cumulative simple/logarithmic percentage price return over the entire chosen date window."
        />
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard
          label="Annualized CAGR"
          metricKey="annualized_return"
          value={formatPct(summary?.annualized_return)}
          subtitle={`Compounded annual return (${summary?.annualization_factor || 252} days factor)`}
        />
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard
          label="Positive / Negative Periods"
          value={summary ? `${summary.positive_periods} / ${summary.negative_periods}` : '—'}
          subtitle="Count of winning vs losing days"
          tooltipText="Ratio and count of trading sessions resulting in positive versus negative periodic returns."
        />
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard
          label="Best / Worst Period"
          value={summary ? `${formatPct(summary.best_period)} / ${formatPct(summary.worst_period)}` : '—'}
          subtitle="Extreme single-day performance observations"
          tooltipText="The highest single-day gain versus the lowest single-day maximum loss observed in the sample."
        />
      </div>

      {/* Interactive Return Chart */}
      <div className="col-span-12">
        <ReturnChart
          series={series}
          symbol={selectedInstrument?.symbol || 'ASSET'}
          chartMode={chartMode}
          returnType={returnType}
          height={380}
          isLoading={isLoading}
          onIngestData={() => handleIngestData(selectedInstrument?.symbol)}
          isIngesting={isIngesting}
        />
      </div>

      {/* Return Series Table */}
      <div className="col-span-12">
        <Card
          title="Daily Return Series Table"
          action={
            <button
              onClick={() => {
                if (selectedInstrument) {
                  triggerDownload(
                    getReturnsExportUrl({
                      instrumentId: selectedInstrument.id,
                      format: 'csv',
                      returnType,
                      priceSource,
                      startDate,
                      endDate,
                    })
                  );
                }
              }}
              disabled={series.length === 0 || !selectedInstrument}
              className="flex items-center gap-1.5 px-3 py-1 bg-surface hover:bg-surface-hover text-text-primary rounded-lg text-xs font-medium transition-colors disabled:opacity-40 border border-border"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-brand-primary" />
              Export Return CSV
            </button>
          }
        >
          {isLoading ? (
            <div className="py-12 text-center text-xs font-mono text-text-secondary animate-pulse">
              Computing return series...
            </div>
          ) : series.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-secondary">
              No return records computed. Ensure market data exists for the selected date range.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-border bg-surface text-text-secondary uppercase text-[10px]">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Price ({priceSource})</th>
                      <th className="py-2.5 px-3 text-right">Simple Return (R_t)</th>
                      <th className="py-2.5 px-3 text-right">Log Return (r_t)</th>
                      <th className="py-2.5 px-3 text-right">Cumulative (C_t)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-text-primary">
                    {displayedSeries.map((obs, idx) => (
                      <tr key={idx} className="hover:bg-surface/60 transition-colors">
                        <td className="py-2 px-3 text-text-secondary">{obs.timestamp.split('T')[0]}</td>
                        <td className="py-2 px-3 text-right font-semibold text-text-primary">${obs.price.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-semibold">
                          {obs.simple_return !== undefined && obs.simple_return !== null ? (
                            <span className={obs.simple_return >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                              {obs.simple_return >= 0 ? '+' : ''}{(obs.simple_return * 100).toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right text-text-secondary font-semibold">
                          {obs.log_return !== undefined && obs.log_return !== null ? (
                            <span className={obs.log_return >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                              {obs.log_return >= 0 ? '+' : ''}{(obs.log_return * 100).toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold">
                          <span className={obs.cumulative_return >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                            {obs.cumulative_return >= 0 ? '+' : ''}{(obs.cumulative_return * 100).toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-border bg-surface text-xs font-mono text-text-secondary mt-2 rounded-b-lg">
                  <span>
                    Page {page} of {totalPages} ({totalItems} records)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="px-2.5 py-1 bg-card border border-border hover:bg-surface-hover text-text-primary rounded-lg disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages}
                      className="px-2.5 py-1 bg-card border border-border hover:bg-surface-hover text-text-primary rounded-lg disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};
