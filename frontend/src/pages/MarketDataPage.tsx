import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { MarketChart } from '../components/charts/MarketChart';
import { ChartToolbar } from '../components/charts/ChartToolbar';
import { FullscreenChartModal } from '../components/charts/FullscreenChartModal';
import { AddInstrumentModal } from '../components/modals/AddInstrumentModal';
import { IngestionDetailModal } from '../components/modals/IngestionDetailModal';
import {
  fetchInstruments,
  updateInstrument,
  fetchMarketData,
  queryMarketData,
  fetchCoverage,
  fetchIngestionLogs,
  exportMarketDataCsv,
  InstrumentItem,
  IngestionSummary,
  CoverageInfo,
  IngestionLogItem,
  OHLCVItem,
} from '../lib/apiClient';
import {
  Search,
  Database,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Download,
  Plus,
  ArrowUpDown,
  Power,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const MarketDataPage: React.FC = () => {
  // Instrument Master State
  const [instruments, setInstruments] = useState<InstrumentItem[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentItem | null>(null);
  const [instSearchQuery, setInstSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoadingInstruments, setIsLoadingInstruments] = useState(true);

  // Date Range Presets State
  const todayStr = new Date().toISOString().split('T')[0];
  const fiveYearsAgoStr = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(fiveYearsAgoStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [activePreset, setActivePreset] = useState<string>('5Y');
  const [frequency] = useState('DAILY');
  const [provider] = useState('yahoo_finance');
  const [forceRefresh, setForceRefresh] = useState(false);

  // Coverage & Acquisition State
  const [coverage, setCoverage] = useState<CoverageInfo | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchSummary, setFetchSummary] = useState<IngestionSummary | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Data Table & Sorting State
  const [bars, setBars] = useState<OHLCVItem[]>([]);
  const [totalBars, setTotalBars] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isLoadingBars, setIsLoadingBars] = useState(false);

  // Ingestion Logs State
  const [ingestionLogs, setIngestionLogs] = useState<IngestionLogItem[]>([]);
  const [selectedLog, setSelectedLog] = useState<IngestionLogItem | null>(null);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  // Deactivation Confirmation Modal State
  const [isDeactivating, setIsDeactivating] = useState(false);

  // 1. Load instruments list
  const loadInstrumentsList = async () => {
    setIsLoadingInstruments(true);
    try {
      const res = await fetchInstruments({ limit: 100 });
      setInstruments(res.items);
      if (res.items.length > 0 && !selectedInstrument) {
        setSelectedInstrument(res.items[0]);
      }
    } catch {
      setInstruments([]);
    } finally {
      setIsLoadingInstruments(false);
    }
  };

  useEffect(() => {
    loadInstrumentsList();
  }, []);

  // 2. Load Coverage, Ingestion Logs, and OHLCV Data when selected instrument or range changes
  const loadWorkspaceData = async () => {
    if (!selectedInstrument) return;
    setIsLoadingBars(true);

    try {
      // Fetch Coverage
      const cov = await fetchCoverage(
        selectedInstrument.id,
        new Date(startDate).toISOString(),
        new Date(endDate).toISOString()
      );
      setCoverage(cov);

      // Fetch Bars
      const res = await queryMarketData({
        instrument_id: selectedInstrument.id,
        frequency: frequency,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });

      // Apply sorting if needed
      let fetchedBars = res.items;
      if (sortOrder === 'asc') {
        fetchedBars = [...fetchedBars].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      } else {
        fetchedBars = [...fetchedBars].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }

      setBars(fetchedBars);
      setTotalBars(res.total);

      // Fetch Ingestion Logs
      const logs = await fetchIngestionLogs(selectedInstrument.id, 10);
      setIngestionLogs(logs);
    } catch {
      setBars([]);
      setTotalBars(0);
      setCoverage(null);
    } finally {
      setIsLoadingBars(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [selectedInstrument, startDate, endDate, page, sortOrder, frequency]);

  // Date Range Presets Handler
  const handlePresetChange = (preset: string) => {
    setActivePreset(preset);
    const end = new Date();
    let start = new Date();

    switch (preset) {
      case '1M':
        start.setMonth(end.getMonth() - 1);
        break;
      case '3M':
        start.setMonth(end.getMonth() - 3);
        break;
      case '6M':
        start.setMonth(end.getMonth() - 6);
        break;
      case '1Y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case '3Y':
        start.setFullYear(end.getFullYear() - 3);
        break;
      case '5Y':
        start.setFullYear(end.getFullYear() - 5);
        break;
      case 'MAX':
        start.setFullYear(end.getFullYear() - 20);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setPage(1);
  };

  // Acquisition Trigger Handler
  const handleFetchData = async (force: boolean = false) => {
    if (!selectedInstrument) return;
    setIsFetching(true);
    setFetchError(null);
    setFetchSummary(null);

    try {
      const res = await fetchMarketData({
        instrument_id: selectedInstrument.id,
        symbol: selectedInstrument.symbol,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        frequency: frequency,
        provider: provider,
        force_refresh: force || forceRefresh,
      });

      setFetchSummary(res.summary);
      setPage(1);
      await loadWorkspaceData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Acquisition request failed.';
      setFetchError(message);
    } finally {
      setIsFetching(false);
    }
  };

  // CSV Export Handler
  const handleExportCsv = async () => {
    if (!selectedInstrument) return;
    try {
      const csvStr = await exportMarketDataCsv(
        selectedInstrument.id,
        new Date(startDate).toISOString(),
        new Date(endDate).toISOString()
      );

      const blob = new Blob([csvStr], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedInstrument.symbol}_market_data.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert(`CSV Export error: ${err instanceof Error ? err.message : 'Export failed'}`);
    }
  };

  // Toggle Active Status Handler
  const handleToggleActive = async () => {
    if (!selectedInstrument) return;
    setIsDeactivating(true);
    try {
      const updated = await updateInstrument(selectedInstrument.id, {
        active: !selectedInstrument.active,
      });
      setSelectedInstrument(updated);
      await loadInstrumentsList();
    } catch (err: unknown) {
      alert(`Status update error: ${err instanceof Error ? err.message : 'Update failed'}`);
    } finally {
      setIsDeactivating(false);
    }
  };

  const filteredInstruments = instruments.filter(
    (i) =>
      i.symbol.toLowerCase().includes(instSearchQuery.toLowerCase()) ||
      i.name.toLowerCase().includes(instSearchQuery.toLowerCase())
  );

  return (
    <PageContainer
      eyebrow="Quantitative Research Workspace"
      title="Market Data & Interactive Visualization"
      description="Interactive OHLCV research charting engine, timestamp validation, database coverage analysis, and historical data export."
      action={
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded text-xs font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Instrument
        </button>
      }
    >
      {/* Workspace Main Grid */}
      <div className="col-span-12 grid grid-cols-12 gap-5">
        {/* Left Sidebar: Instrument Master List (3 cols) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-3">
          <Card title="Saved Instrument Universe">
            {/* Search filter */}
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
              <input
                type="text"
                placeholder="Filter saved symbols..."
                value={instSearchQuery}
                onChange={(e) => setInstSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#111827] border border-[#263244] rounded text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            {/* List */}
            {isLoadingInstruments ? (
              <div className="py-8 text-center text-xs text-[#64748B]">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[#3B82F6]" />
                Loading instruments...
              </div>
            ) : filteredInstruments.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#64748B]">
                No instruments found. Click &quot;Add Instrument&quot; above to register symbols.
              </div>
            ) : (
              <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                {filteredInstruments.map((inst) => {
                  const isSelected = selectedInstrument?.id === inst.id;
                  return (
                    <button
                      key={inst.id}
                      onClick={() => {
                        setSelectedInstrument(inst);
                        setPage(1);
                      }}
                      className={`w-full text-left p-2.5 rounded text-xs transition-colors flex items-center justify-between border ${
                        isSelected
                          ? 'bg-[#1E293B] border-[#3B82F6] text-[#F8FAFC]'
                          : 'bg-[#0B0F17] border-[#1E293B] text-[#94A3B8] hover:bg-[#111827] hover:text-[#F8FAFC]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold font-mono-num text-[#F8FAFC]">
                          <span>{inst.symbol}</span>
                          {!inst.active && (
                            <span className="text-[10px] text-[#EF4444] font-normal">(Inactive)</span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate max-w-[140px]">{inst.name}</div>
                      </div>
                      <Badge variant="default" className="text-[10px] px-1.5 py-0.5">
                        {inst.asset_type}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Main Panel: Selected Instrument Research Workspace (9 cols) */}
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-4">
          {selectedInstrument ? (
            <>
              {/* Header Card */}
              <Card>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold font-mono-num text-[#F8FAFC]">{selectedInstrument.symbol}</h2>
                      <Badge variant="info">{selectedInstrument.asset_type}</Badge>
                      <Badge variant={selectedInstrument.active ? 'success' : 'danger'}>
                        {selectedInstrument.active ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      {selectedInstrument.name} · {selectedInstrument.exchange} · {selectedInstrument.currency} · Provider Symbol: <code className="text-[#3B82F6] font-mono-num">{selectedInstrument.provider_symbol || selectedInstrument.symbol}</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleActive}
                      disabled={isDeactivating}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
                        selectedInstrument.active
                          ? 'bg-[#7F1D1D]/20 text-[#F87171] border-[#EF4444]/40 hover:bg-[#7F1D1D]/40'
                          : 'bg-[#14532D]/20 text-[#4ADE80] border-[#22C55E]/40 hover:bg-[#14532D]/40'
                      }`}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {selectedInstrument.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>
                </div>
              </Card>

              {/* Data Range Presets & Acquisition Controls Bar */}
              <Card title="Acquisition Controls & Range Presets">
                <div className="space-y-3">
                  {/* Preset Toolbar */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-xs text-[#64748B] font-mono-num mr-1">Presets:</span>
                    {['1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handlePresetChange(preset)}
                        className={`px-3 py-1 rounded text-xs font-mono-num font-medium transition-colors ${
                          activePreset === preset
                            ? 'bg-[#3B82F6] text-white'
                            : 'bg-[#1E293B] text-[#94A3B8] hover:bg-[#263244] hover:text-[#F8FAFC]'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {/* Date Input Pickers */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] text-[#94A3B8] mb-1">Start Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            setActivePreset('CUSTOM');
                          }}
                          className="w-full pl-8 pr-2 py-1.5 bg-[#111827] border border-[#263244] rounded text-xs text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#94A3B8] mb-1">End Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            setActivePreset('CUSTOM');
                          }}
                          className="w-full pl-8 pr-2 py-1.5 bg-[#111827] border border-[#263244] rounded text-xs text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#94A3B8] mb-1">Frequency</label>
                      <select
                        value={frequency}
                        disabled
                        className="w-full px-2 py-1.5 bg-[#111827] border border-[#263244] rounded text-xs text-[#F8FAFC] opacity-75"
                      >
                        <option value="DAILY">Daily (1d)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#94A3B8] mb-1">Provider</label>
                      <select
                        value={provider}
                        disabled
                        className="w-full px-2 py-1.5 bg-[#111827] border border-[#263244] rounded text-xs text-[#F8FAFC] opacity-75"
                      >
                        <option value="yahoo_finance">Yahoo Finance</option>
                      </select>
                    </div>
                  </div>

                  {/* Actions & Force Refresh */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#94A3B8] hover:text-[#F8FAFC]">
                      <input
                        type="checkbox"
                        checked={forceRefresh}
                        onChange={(e) => setForceRefresh(e.target.checked)}
                        className="rounded border-[#263244] bg-[#111827] text-[#3B82F6]"
                      />
                      Force Refresh (Ignore Cache)
                    </label>

                    <button
                      onClick={() => handleFetchData(false)}
                      disabled={isFetching}
                      className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {isFetching ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Fetching Data...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Fetch Market Data
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {fetchError && (
                  <div className="mt-3 p-3 bg-[#7F1D1D]/30 border border-[#EF4444]/40 rounded-lg text-xs text-[#FCA5A5] flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-[#EF4444] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Acquisition Failure:</span>
                      {fetchError}
                    </div>
                  </div>
                )}
              </Card>

              {/* Coverage & Missing Range Awareness Banner */}
              {coverage && (
                <div className="p-3 bg-[#111827] border border-[#263244] rounded-lg text-xs font-mono-num flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[#94A3B8]">
                    <Database className="h-4 w-4 text-[#3B82F6] shrink-0" />
                    <div>
                      <span className="text-[#F8FAFC]">PostgreSQL Coverage: </span>
                      {coverage.min_timestamp ? (
                        <span>
                          {new Date(coverage.min_timestamp).toLocaleDateString()} $\rightarrow$ {new Date(coverage.max_timestamp!).toLocaleDateString()} ({coverage.total_bars} bars stored)
                        </span>
                      ) : (
                        <span className="text-[#EAB308]">No historical data stored in DB</span>
                      )}
                    </div>
                  </div>

                  {coverage.has_missing_range && (
                    <div className="flex items-center gap-2">
                      <span className="text-[#F59E0B] text-[11px] font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Missing Coverage Gap Detected
                      </span>
                      <button
                        onClick={() => handleFetchData(false)}
                        className="px-2.5 py-1 bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/40 hover:bg-[#F59E0B]/30 rounded text-[11px] font-medium transition-colors"
                      >
                        Fetch Missing Data
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Ingestion Result Summary */}
              {fetchSummary && (
                <div className="p-3 bg-[#14532D]/20 border border-[#22C55E]/30 rounded-lg text-xs font-mono-num space-y-2">
                  <div className="flex items-center justify-between text-[#4ADE80]">
                    <span className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Acquisition Complete ({fetchSummary.status})
                    </span>
                    <span className="text-[11px] text-[#94A3B8]">Duration: {fetchSummary.duration_ms} ms</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="bg-[#111827] p-1.5 rounded border border-[#263244]">
                      <span className="text-[#64748B] block text-[10px]">Received</span>
                      <span className="font-semibold text-[#F8FAFC]">{fetchSummary.rows_received}</span>
                    </div>
                    <div className="bg-[#111827] p-1.5 rounded border border-[#263244]">
                      <span className="text-[#64748B] block text-[10px]">Inserted</span>
                      <span className="font-semibold text-[#10B981]">{fetchSummary.rows_inserted}</span>
                    </div>
                    <div className="bg-[#111827] p-1.5 rounded border border-[#263244]">
                      <span className="text-[#64748B] block text-[10px]">Skipped</span>
                      <span className="font-semibold text-[#3B82F6]">{fetchSummary.rows_skipped}</span>
                    </div>
                    <div className="bg-[#111827] p-1.5 rounded border border-[#263244]">
                      <span className="text-[#64748B] block text-[10px]">Invalid</span>
                      <span className="font-semibold text-[#EF4444]">{fetchSummary.rows_invalid}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Institutional Market Chart */}
              <div className="space-y-0">
                <ChartToolbar activePreset={activePreset} onPresetChange={handlePresetChange} />
                <MarketChart
                  bars={bars}
                  symbol={selectedInstrument.symbol}
                  height={360}
                  isLoading={isLoadingBars}
                  onFetchClick={() => handleFetchData(false)}
                />
              </div>

              {/* Fullscreen Modal View */}
              <FullscreenChartModal
                bars={bars}
                symbol={selectedInstrument.symbol}
                activePreset={activePreset}
                onPresetChange={handlePresetChange}
              />

              {/* Historical Data Table */}
              <Card
                title="Historical OHLCV Data Records"
                action={
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExportCsv}
                      disabled={bars.length === 0}
                      className="flex items-center gap-1.5 px-3 py-1 bg-[#1E293B] hover:bg-[#263244] text-[#F8FAFC] rounded text-xs font-medium transition-colors disabled:opacity-40 border border-[#263244]"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-[#10B981]" />
                      Export CSV
                    </button>
                    <span className="text-xs text-[#64748B] font-mono-num">
                      Total: {totalBars.toLocaleString()}
                    </span>
                  </div>
                }
              >
                {isLoadingBars ? (
                  <div className="py-12 text-center text-xs text-[#64748B]">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#3B82F6]" />
                    Loading database records...
                  </div>
                ) : bars.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#64748B]">
                    No historical data available for selected range. Click &quot;Fetch Market Data&quot; to download series.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#263244] text-[#94A3B8] font-medium bg-[#111827]/50">
                          <th className="py-2.5 px-3">
                            <button
                              onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
                              className="flex items-center gap-1 hover:text-[#F8FAFC]"
                            >
                              Date (UTC)
                              <ArrowUpDown className="h-3 w-3" />
                            </button>
                          </th>
                          <th className="py-2.5 px-3 text-right">Open</th>
                          <th className="py-2.5 px-3 text-right">High</th>
                          <th className="py-2.5 px-3 text-right">Low</th>
                          <th className="py-2.5 px-3 text-right">Close</th>
                          <th className="py-2.5 px-3 text-right">Adj Close</th>
                          <th className="py-2.5 px-3 text-right">Volume</th>
                          <th className="py-2.5 px-3 text-center">Provider</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E293B] font-mono-num text-[#F8FAFC]">
                        {bars.map((bar) => (
                          <tr key={bar.id} className="hover:bg-[#1E293B]/40 transition-colors">
                            <td className="py-2 px-3 text-[#94A3B8]">
                              {new Date(bar.timestamp).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-3 text-right">${bar.open.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right text-[#10B981]">${bar.high.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right text-[#EF4444]">${bar.low.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right font-semibold">${bar.close.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right text-[#94A3B8]">
                              {bar.adjusted_close ? `$${bar.adjusted_close.toFixed(2)}` : '-'}
                            </td>
                            <td className="py-2 px-3 text-right text-[#94A3B8]">
                              {bar.volume.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <Badge variant="default" className="text-[10px]">
                                {bar.provider}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#1E293B] text-xs font-mono-num">
                      <span className="text-[#64748B]">
                        Page {page} of {Math.max(1, Math.ceil(totalBars / pageSize))} ({totalBars} total rows)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className="px-2.5 py-1 bg-[#1E293B] hover:bg-[#263244] text-[#F8FAFC] rounded disabled:opacity-40"
                        >
                          Previous
                        </button>
                        <button
                          disabled={page >= Math.ceil(totalBars / pageSize)}
                          onClick={() => setPage((p) => p + 1)}
                          className="px-2.5 py-1 bg-[#1E293B] hover:bg-[#263244] text-[#F8FAFC] rounded disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Collapsible Ingestion Audit History */}
              <Card
                title="Acquisition Audit History"
                action={
                  <button
                    onClick={() => setIsLogsOpen((o) => !o)}
                    className="flex items-center gap-1 text-xs text-[#3B82F6] hover:text-[#60A5FA]"
                  >
                    {isLogsOpen ? (
                      <>
                        <ChevronUp className="h-4 w-4" /> Hide History
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" /> Show History ({ingestionLogs.length})
                      </>
                    )}
                  </button>
                }
              >
                {isLogsOpen && (
                  <div className="space-y-2 pt-2">
                    {ingestionLogs.length === 0 ? (
                      <div className="py-6 text-center text-xs text-[#64748B]">
                        No acquisition audit logs found for this instrument.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono-num">
                          <thead>
                            <tr className="border-b border-[#263244] text-[#94A3B8] bg-[#111827]/50">
                              <th className="py-2 px-3">Timestamp</th>
                              <th className="py-2 px-3">Provider</th>
                              <th className="py-2 px-3">Requested Window</th>
                              <th className="py-2 px-3 text-right">Inserted</th>
                              <th className="py-2 px-3 text-right">Skipped</th>
                              <th className="py-2 px-3 text-center">Status</th>
                              <th className="py-2 px-3 text-right">Duration</th>
                              <th className="py-2 px-3 text-center">Detail</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1E293B] text-[#F8FAFC]">
                            {ingestionLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-[#1E293B]/40">
                                <td className="py-2 px-3 text-[#94A3B8]">
                                  {new Date(log.created_at).toLocaleString()}
                                </td>
                                <td className="py-2 px-3">{log.provider}</td>
                                <td className="py-2 px-3 text-[#94A3B8]">
                                  {new Date(log.requested_start).toLocaleDateString()} $\rightarrow$ {new Date(log.requested_end).toLocaleDateString()}
                                </td>
                                <td className="py-2 px-3 text-right text-[#10B981]">{log.rows_inserted}</td>
                                <td className="py-2 px-3 text-right text-[#3B82F6]">{log.rows_skipped}</td>
                                <td className="py-2 px-3 text-center">
                                  <Badge variant={log.status === 'COMPLETED' ? 'success' : 'warning'} className="text-[10px]">
                                    {log.status}
                                  </Badge>
                                </td>
                                <td className="py-2 px-3 text-right text-[#94A3B8]">{log.duration_ms} ms</td>
                                <td className="py-2 px-3 text-center">
                                  <button
                                    onClick={() => setSelectedLog(log)}
                                    className="p-1 text-[#3B82F6] hover:text-[#60A5FA]"
                                  >
                                    <Activity className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </>
          ) : (
            <Card>
              <div className="py-16 text-center text-xs text-[#64748B]">
                <Database className="h-10 w-10 mx-auto mb-3 opacity-40 text-[#3B82F6]" />
                <span className="text-sm font-semibold text-[#F8FAFC]">No Instrument Selected</span>
                <p className="mt-1">Select an instrument from the left master list or add a new one.</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Add Instrument Modal */}
      <AddInstrumentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={(newInst) => {
          setSelectedInstrument(newInst);
          loadInstrumentsList();
        }}
      />

      {/* Ingestion Detail Audit Modal */}
      <IngestionDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </PageContainer>
  );
};
