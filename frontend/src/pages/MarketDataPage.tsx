import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { MetricCard } from '../components/data-display/MetricCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PriceChart } from '../components/data-display/PriceChart';
import {
  searchInstruments,
  fetchMarketData,
  queryMarketData,
  InstrumentSearchResult,
  IngestionSummary,
  OHLCVItem,
} from '../lib/apiClient';
import {
  Search,
  Database,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Layers,
  Download,
} from 'lucide-react';


const POPULAR_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple Inc.', asset_type: 'EQUITY' },
  { symbol: 'MSFT', name: 'Microsoft Corp', asset_type: 'EQUITY' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', asset_type: 'ETF' },
  { symbol: '^GSPC', name: 'S&P 500 Index', asset_type: 'INDEX' },
  { symbol: 'BTC-USD', name: 'Bitcoin USD', asset_type: 'CRYPTO' },
  { symbol: 'ETH-USD', name: 'Ethereum USD', asset_type: 'CRYPTO' },
];

export const MarketDataPage: React.FC = () => {
  // Search & Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InstrumentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentSearchResult>({
    symbol: 'AAPL',
    name: 'Apple Inc.',
    asset_type: 'EQUITY',
    exchange: 'NASDAQ',
    currency: 'USD',
    provider_symbol: 'AAPL',
  });

  // Controls State
  const todayStr = new Date().toISOString().split('T')[0];
  const fiveYearsAgoStr = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(fiveYearsAgoStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [frequency, setFrequency] = useState('DAILY');
  const [provider, setProvider] = useState('yahoo_finance');
  const [forceRefresh, setForceRefresh] = useState(false);

  // Ingestion & Query State
  const [isFetching, setIsFetching] = useState(false);
  const [fetchSummary, setFetchSummary] = useState<IngestionSummary | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [bars, setBars] = useState<OHLCVItem[]>([]);
  const [totalBars, setTotalBars] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [isLoadingBars, setIsLoadingBars] = useState(false);

  // Instrument Search handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setIsSearching(true);
      searchInstruments(searchQuery, provider)
        .then((res) => setSearchResults(res))
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, provider]);

  // Load existing bars when selectedInstrument or page changes
  const loadStoredBars = async () => {
    if (!selectedInstrument) return;
    setIsLoadingBars(true);
    try {
      const res = await queryMarketData({
        provider: provider,
        frequency: frequency,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      setBars(res.items);
      setTotalBars(res.total);
    } catch {
      setBars([]);
      setTotalBars(0);
    } finally {
      setIsLoadingBars(false);
    }
  };

  useEffect(() => {
    loadStoredBars();
  }, [selectedInstrument, page, provider, frequency]);

  // Handle Acquisition Fetch Trigger
  const handleFetchData = async () => {
    if (!selectedInstrument) return;
    setIsFetching(true);
    setFetchError(null);
    setFetchSummary(null);

    try {
      const res = await fetchMarketData({
        symbol: selectedInstrument.symbol,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        frequency: frequency,
        provider: provider,
        force_refresh: forceRefresh,
      });

      setFetchSummary(res.summary);
      setPage(1);
      await loadStoredBars();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Market data acquisition failed.';
      setFetchError(message);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <PageContainer
      eyebrow="Market Data Acquisition Engine"
      title="Historical Market Data & Ingestion"
      description="Database-first market data pipeline. Ingest, validate, and query daily OHLCV series across Equities, ETFs, Indices, and Crypto."
      action={
        <Badge variant="success" className="text-xs px-2.5 py-1">
          Yahoo Finance Adapter Active
        </Badge>
      }
    >
      {/* Metrics Row */}
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Active Data Provider" value="Yahoo Finance" subtitle="yfinance adapter" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Selected Instrument" value={selectedInstrument.symbol} subtitle={selectedInstrument.name} />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Stored Series Count" value={totalBars.toLocaleString()} subtitle="PostgreSQL OHLCV bars" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Frequency / Window" value={`${frequency} / 5-Yr`} subtitle="UTC timezone normalized" />
      </div>

      {/* Main Controls Card */}
      <div className="col-span-12 lg:col-span-8">
        <Card title="Acquisition Controls & Instrument Selection">
          <div className="space-y-4">
            {/* Search Input & Dropdown */}
            <div className="relative">
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Search & Select Instrument</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
                <input
                  type="text"
                  placeholder="Search symbol or name (e.g. AAPL, Microsoft, SPY, BTC)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#111827] border border-[#263244] rounded text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6]"
                />
                {isSearching && (
                  <RefreshCw className="absolute right-3 top-2.5 h-4 w-4 text-[#3B82F6] animate-spin" />
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-[#111827] border border-[#263244] rounded-md shadow-xl max-h-48 overflow-y-auto">
                  {searchResults.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => {
                        setSelectedInstrument(item);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-[#1E293B] flex items-center justify-between border-b border-[#1E293B] last:border-0"
                    >
                      <div>
                        <span className="font-bold text-[#F8FAFC] mr-2">{item.symbol}</span>
                        <span className="text-[#94A3B8]">{item.name}</span>
                      </div>
                      <Badge variant="default" className="text-[10px]">
                        {item.asset_type}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Select Buttons */}
            <div>
              <span className="text-[11px] text-[#64748B] mr-2">Quick Reference:</span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1">
                {POPULAR_SYMBOLS.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => {
                      setSelectedInstrument({
                        symbol: item.symbol,
                        name: item.name,
                        asset_type: item.asset_type,
                        exchange: 'UNKNOWN',
                        currency: 'USD',
                        provider_symbol: item.symbol,
                      });
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono-num transition-colors ${
                      selectedInstrument.symbol === item.symbol
                        ? 'bg-[#3B82F6] text-white font-medium'
                        : 'bg-[#1E293B] text-[#94A3B8] hover:bg-[#263244] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {item.symbol}
                  </button>
                ))}
              </div>
            </div>

            {/* Range, Frequency & Provider Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-[#111827] border border-[#263244] rounded text-xs text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-[#111827] border border-[#263244] rounded text-xs text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Frequency</label>
                <div className="relative">
                  <Layers className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-[#111827] border border-[#263244] rounded text-xs text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
                  >
                    <option value="DAILY">Daily (1d)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#111827] border border-[#263244] rounded text-xs text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
                >
                  <option value="yahoo_finance">Yahoo Finance</option>
                </select>
              </div>
            </div>

            {/* Options & Trigger Button */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#94A3B8] hover:text-[#F8FAFC]">
                <input
                  type="checkbox"
                  checked={forceRefresh}
                  onChange={(e) => setForceRefresh(e.target.checked)}
                  className="rounded border-[#263244] bg-[#111827] text-[#3B82F6] focus:ring-0"
                />
                Force Refresh (Re-fetch existing range)
              </label>

              <button
                onClick={handleFetchData}
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
                    Fetch Historical Data
                  </>
                )}
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Ingestion Summary / Status Side Panel */}
      <div className="col-span-12 lg:col-span-4">
        <Card title="Acquisition Activity Summary">
          {fetchError && (
            <div className="p-3 bg-[#7F1D1D]/30 border border-[#EF4444]/40 rounded text-xs text-[#FCA5A5] flex items-start gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-[#EF4444] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Acquisition Error</span>
                {fetchError}
              </div>
            </div>
          )}

          {fetchSummary ? (
            <div className="space-y-3 text-xs font-mono-num">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-[#94A3B8]">Status</span>
                <Badge variant={fetchSummary.status === 'COMPLETED' ? 'success' : 'warning'}>
                  {fetchSummary.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-[#111827] rounded border border-[#263244]">
                  <span className="text-[#64748B] block text-[10px]">Received</span>
                  <span className="font-semibold text-[#F8FAFC]">{fetchSummary.rows_received.toLocaleString()}</span>
                </div>
                <div className="p-2 bg-[#111827] rounded border border-[#263244]">
                  <span className="text-[#64748B] block text-[10px]">Inserted</span>
                  <span className="font-semibold text-[#10B981]">{fetchSummary.rows_inserted.toLocaleString()}</span>
                </div>
                <div className="p-2 bg-[#111827] rounded border border-[#263244]">
                  <span className="text-[#64748B] block text-[10px]">Skipped (Cached)</span>
                  <span className="font-semibold text-[#3B82F6]">{fetchSummary.rows_skipped.toLocaleString()}</span>
                </div>
                <div className="p-2 bg-[#111827] rounded border border-[#263244]">
                  <span className="text-[#64748B] block text-[10px]">Invalid</span>
                  <span className="font-semibold text-[#EF4444]">{fetchSummary.rows_invalid.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-[11px] text-[#64748B] pt-1">
                Duration: {fetchSummary.duration_ms} ms
              </div>

              {fetchSummary.warnings.length > 0 && (
                <div className="p-2 bg-[#1E293B] rounded text-[11px] text-[#F59E0B] space-y-1">
                  {fetchSummary.warnings.map((w, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[#64748B]">
              <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <span>No acquisition run executed yet.</span>
              <p className="text-[11px] mt-1 text-[#475569]">Select parameters above and click Fetch Data.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Historical Price Chart */}
      <div className="col-span-12">
        <Card title={`Close Price Time Series (${selectedInstrument.symbol})`}>
          <PriceChart bars={bars} height={280} />
        </Card>
      </div>

      {/* Historical Data Table */}
      <div className="col-span-12">
        <Card
          title="Stored Market Data Records (PostgreSQL)"
          action={
            <span className="text-xs text-[#64748B] font-mono-num">
              Total Bars: {totalBars.toLocaleString()}
            </span>
          }
        >
          {isLoadingBars ? (
            <div className="py-12 text-center text-xs text-[#64748B]">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#3B82F6]" />
              Loading market data records...
            </div>
          ) : bars.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B]">
              No historical data stored in PostgreSQL for {selectedInstrument.symbol}. Use the Acquisition panel above to fetch data.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#263244] text-[#94A3B8] font-medium bg-[#111827]/50">
                    <th className="py-2.5 px-3">Date (UTC)</th>
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

              {/* Pagination Controls */}
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#1E293B] text-xs font-mono-num">
                <span className="text-[#64748B]">
                  Showing Page {page} of {Math.max(1, Math.ceil(totalBars / pageSize))} ({totalBars} total rows)
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
      </div>
    </PageContainer>
  );
};
