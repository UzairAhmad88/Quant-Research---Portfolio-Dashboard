import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { MetricCard } from '../components/data-display/MetricCard';
import { ReturnChart } from '../components/returns/ReturnChart';
import {
  fetchInstruments,
  fetchReturns,
  InstrumentItem,
  ReturnAnalysisResponse,
} from '../lib/apiClient';
import { FileSpreadsheet, AlertTriangle } from 'lucide-react';

export const ReturnsPage: React.FC = () => {
  // Instrument Master State
  const [instruments, setInstruments] = useState<InstrumentItem[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentItem | null>(null);


  // Date Range Presets State
  const todayStr = new Date().toISOString().split('T')[0];
  const fiveYearsAgoStr = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(fiveYearsAgoStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [activePreset, setActivePreset] = useState<string>('5Y');

  // Return Parameters State
  const [priceSource, setPriceSource] = useState<'adjusted' | 'close'>('adjusted');
  const [returnType, setReturnType] = useState<'simple' | 'log'>('simple');
  const [chartMode, setChartMode] = useState<'cumulative' | 'periodic'>('cumulative');

  // Return Analysis Data State
  const [returnAnalysis, setReturnAnalysis] = useState<ReturnAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Table Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // 1. Load available instruments
  useEffect(() => {
    fetchInstruments({ limit: 100 })
      .then((res) => {
        setInstruments(res.items);
        if (res.items.length > 0) {
          setSelectedInstrument(res.items[0]);
        }
      })
      .catch(() => setInstruments([]));
  }, []);

  // 2. Fetch Return Analysis when parameters change
  const loadReturnAnalysis = async () => {
    if (!selectedInstrument) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetchReturns({
        instrument_id: selectedInstrument.id,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        price_source: priceSource,
        return_type: returnType,
      });
      setReturnAnalysis(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to calculate return analysis.');
      setReturnAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReturnAnalysis();
  }, [selectedInstrument, startDate, endDate, priceSource, returnType]);

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

  // CSV Export for Return Series
  const handleExportCsv = () => {
    if (!returnAnalysis || returnAnalysis.series.length === 0) return;

    const headers = ['Date', 'Price', 'Simple Return', 'Log Return', 'Cumulative Return'];
    const rows = returnAnalysis.series.map((item) => [
      item.timestamp.split('T')[0],
      item.price.toFixed(4),
      item.simple_return !== undefined && item.simple_return !== null ? (item.simple_return * 100).toFixed(4) + '%' : '',
      item.log_return !== undefined && item.log_return !== null ? (item.log_return * 100).toFixed(4) + '%' : '',
      (item.cumulative_return * 100).toFixed(4) + '%',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `returns_${selectedInstrument?.symbol}_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        </div>
      }
    >
      {/* Research Controls Toolbar */}
      <div className="col-span-12">
        <Card className="p-4 bg-[#151F2E] border-[#263244] text-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Instrument Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Target:</span>
              <div className="relative">
                <select
                  value={selectedInstrument?.id || ''}
                  onChange={(e) => {
                    const inst = instruments.find((i) => i.id === e.target.value);
                    if (inst) setSelectedInstrument(inst);
                  }}
                  className="bg-[#0F172A] border border-[#263244] text-slate-100 rounded px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  {instruments.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.symbol} — {inst.name} ({inst.asset_type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Presets */}
            <div className="flex items-center gap-1 bg-[#0F172A] p-1 rounded border border-[#263244]">
              {['1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetChange(preset)}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                    activePreset === preset
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E293B]'
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
                <span className="text-slate-400">Price:</span>
                <button
                  onClick={() => setPriceSource('adjusted')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    priceSource === 'adjusted'
                      ? 'bg-[#1E293B] text-blue-400 border border-blue-500/50 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Adjusted
                </button>
                <button
                  onClick={() => setPriceSource('close')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    priceSource === 'close'
                      ? 'bg-[#1E293B] text-blue-400 border border-blue-500/50 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Close
                </button>
              </div>

              {/* Return Type */}
              <div className="flex items-center gap-1 text-xs border-l border-[#263244] pl-3">
                <span className="text-slate-400">Return:</span>
                <button
                  onClick={() => setReturnType('simple')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    returnType === 'simple'
                      ? 'bg-[#1E293B] text-emerald-400 border border-emerald-500/50 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Simple
                </button>
                <button
                  onClick={() => setReturnType('log')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    returnType === 'log'
                      ? 'bg-[#1E293B] text-emerald-400 border border-emerald-500/50 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Log
                </button>
              </div>

              {/* Chart Mode */}
              <div className="flex items-center gap-1 text-xs border-l border-[#263244] pl-3">
                <button
                  onClick={() => setChartMode('cumulative')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    chartMode === 'cumulative'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-[#0F172A] text-slate-300 hover:bg-[#1E293B]'
                  }`}
                >
                  Cumulative Chart
                </button>
                <button
                  onClick={() => setChartMode('periodic')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    chartMode === 'periodic'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-[#0F172A] text-slate-300 hover:bg-[#1E293B]'
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
          <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-xs font-mono text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
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
        />
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard
          label="Annualized CAGR"
          value={formatPct(summary?.annualized_return)}
          subtitle={`Compounded annual return (${summary?.annualization_factor || 252} days factor)`}
        />
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard
          label="Positive / Negative Periods"
          value={summary ? `${summary.positive_periods} / ${summary.negative_periods}` : '—'}
          subtitle="Count of winning vs losing days"
        />
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard
          label="Best / Worst Period"
          value={summary ? `${formatPct(summary.best_period)} / ${formatPct(summary.worst_period)}` : '—'}
          subtitle="Extreme single-day performance observations"
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
        />
      </div>

      {/* Return Series Table */}
      <div className="col-span-12">
        <Card
          title="Daily Return Series Table"
          action={
            <button
              onClick={handleExportCsv}
              disabled={series.length === 0}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#1E293B] hover:bg-[#263244] text-slate-100 rounded text-xs font-medium transition-colors disabled:opacity-40 border border-[#263244]"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              Export Return CSV
            </button>
          }
        >
          {isLoading ? (
            <div className="py-12 text-center text-xs font-mono text-slate-400 animate-pulse">
              Computing return series...
            </div>
          ) : series.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No return records computed. Ensure market data exists for the selected date range.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#263244] bg-[#0F172A] text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Price ({priceSource})</th>
                      <th className="py-2.5 px-3 text-right">Simple Return (R_t)</th>
                      <th className="py-2.5 px-3 text-right">Log Return (r_t)</th>
                      <th className="py-2.5 px-3 text-right">Cumulative (C_t)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B] text-slate-200">
                    {displayedSeries.map((obs, idx) => (
                      <tr key={idx} className="hover:bg-[#1E293B]/40">
                        <td className="py-2 px-3 text-slate-400">{obs.timestamp.split('T')[0]}</td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-100">${obs.price.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right">
                          {obs.simple_return !== undefined && obs.simple_return !== null ? (
                            <span className={obs.simple_return >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {obs.simple_return >= 0 ? '+' : ''}{(obs.simple_return * 100).toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {obs.log_return !== undefined && obs.log_return !== null ? (
                            <span className={obs.log_return >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {obs.log_return >= 0 ? '+' : ''}{(obs.log_return * 100).toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold">
                          <span className={obs.cumulative_return >= 0 ? 'text-emerald-400' : 'text-red-400'}>
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
                <div className="flex items-center justify-between p-3 border-t border-[#263244] bg-[#0F172A] text-xs font-mono text-slate-400 mt-2">
                  <span>
                    Page {page} of {totalPages} ({totalItems} records)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="px-2.5 py-1 bg-[#1E293B] hover:bg-[#28354A] text-slate-200 rounded disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages}
                      className="px-2.5 py-1 bg-[#1E293B] hover:bg-[#28354A] text-slate-200 rounded disabled:opacity-40"
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
