import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  fetchInstruments,
  fetchVolatilityAnalytics,
  InstrumentItem,
  SingleVolatilityResponse,
  MultiVolatilityResponse,
} from '../lib/apiClient';
import { VolatilitySummaryCards } from '../components/volatility/VolatilitySummaryCards';
import { RollingVolatilityChart } from '../components/volatility/RollingVolatilityChart';
import { ReturnDistributionChart } from '../components/volatility/ReturnDistributionChart';
import { VolatilityComparisonTable } from '../components/volatility/VolatilityComparisonTable';
import { VolatilityComparisonChart } from '../components/volatility/VolatilityComparisonChart';

export const VolatilityPage: React.FC = () => {
  // Mode: 'single' or 'comparison'
  const [analysisMode, setAnalysisMode] = useState<'single' | 'comparison'>('single');

  // Available instruments
  const [availableInstruments, setAvailableInstruments] = useState<InstrumentItem[]>([]);

  // Selection states
  const [singleInstrument, setSingleInstrument] = useState<InstrumentItem | null>(null);
  const [selectedInstruments, setSelectedInstruments] = useState<InstrumentItem[]>([]);

  // Controls states
  const [dateRange, setDateRange] = useState<string>('1Y');
  const [returnType, setReturnType] = useState<'simple' | 'log'>('simple');
  const [priceSource, setPriceSource] = useState<'adjusted' | 'close'>('adjusted');
  const [rollingWindow, setRollingWindow] = useState<number>(20);
  const [isAnnualized, setIsAnnualized] = useState<boolean>(true);

  // Response data states
  const [singleData, setSingleData] = useState<SingleVolatilityResponse | null>(null);
  const [multiData, setMultiData] = useState<MultiVolatilityResponse | null>(null);

  // Loading & error
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load available instruments
  useEffect(() => {
    fetchInstruments({ limit: 50, active: true })
      .then((res) => {
        setAvailableInstruments(res.items);
        if (res.items.length > 0) {
          setSingleInstrument(res.items[0]);
          setSelectedInstruments(res.items.slice(0, Math.min(3, res.items.length)));
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

  // Fetch Volatility Data
  const loadVolatility = async () => {
    setErrorMsg(null);

    if (analysisMode === 'single') {
      if (!singleInstrument) return;
      try {
        setIsLoading(true);
        const res = await fetchVolatilityAnalytics({
          instrument_id: singleInstrument.id,
          start_date: getStartDate(dateRange),
          price_source: priceSource,
          return_type: returnType,
          rolling_window: rollingWindow,
          annualized: isAnnualized,
        });
        setSingleData(res as SingleVolatilityResponse);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to fetch volatility analytics');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (selectedInstruments.length === 0) return;
      try {
        setIsLoading(true);
        const res = await fetchVolatilityAnalytics({
          instrument_ids: selectedInstruments.map((i) => i.id),
          start_date: getStartDate(dateRange),
          price_source: priceSource,
          return_type: returnType,
        });
        setMultiData(res as MultiVolatilityResponse);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to fetch multi-instrument volatility comparison');
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadVolatility();
  }, [
    analysisMode,
    singleInstrument,
    selectedInstruments,
    dateRange,
    returnType,
    priceSource,
    rollingWindow,
    isAnnualized,
  ]);

  const toggleSelectInstrument = (inst: InstrumentItem) => {
    if (selectedInstruments.some((i) => i.id === inst.id)) {
      setSelectedInstruments(selectedInstruments.filter((i) => i.id !== inst.id));
    } else {
      setSelectedInstruments([...selectedInstruments, inst]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#263244] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-400" />
            Volatility Analyzer &amp; Risk Measurement
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Historical variability, rolling volatility, upside/downside risk &amp; return distribution statistics
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-[#151F2E] border border-[#263244] p-1 rounded-lg">
          <button
            onClick={() => setAnalysisMode('single')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              analysisMode === 'single'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Single Instrument Analysis
          </button>
          <button
            onClick={() => setAnalysisMode('comparison')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              analysisMode === 'comparison'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Multi-Instrument Comparison
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Instrument Selection Control */}
          {analysisMode === 'single' ? (
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-400">Target Instrument:</label>
              <select
                value={singleInstrument?.id || ''}
                onChange={(e) => {
                  const inst = availableInstruments.find((i) => i.id === e.target.value);
                  if (inst) setSingleInstrument(inst);
                }}
                className="bg-[#0B1220] border border-[#263244] text-slate-200 text-xs rounded px-3 py-1.5 font-mono focus:outline-none focus:border-blue-500"
              >
                {availableInstruments.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.symbol} — {inst.name || inst.asset_type} ({inst.asset_type})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 mr-1">Comparison Set:</span>
              {selectedInstruments.map((inst) => (
                <span
                  key={inst.id}
                  className="bg-[#0B1220] border border-[#263244] text-xs font-mono px-2.5 py-1 rounded-md text-slate-200 flex items-center gap-1.5"
                >
                  {inst.symbol}
                  <button
                    onClick={() => toggleSelectInstrument(inst)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {/* Add Instrument Dropdown */}
              <select
                onChange={(e) => {
                  const inst = availableInstruments.find((i) => i.id === e.target.value);
                  if (inst) toggleSelectInstrument(inst);
                  e.target.value = '';
                }}
                defaultValue=""
                className="bg-[#0B1220] border border-[#263244] text-slate-400 text-xs rounded px-2.5 py-1 font-mono hover:text-slate-200 cursor-pointer"
              >
                <option value="" disabled>
                  + Add Instrument
                </option>
                {availableInstruments
                  .filter((i) => !selectedInstruments.some((s) => s.id === i.id))
                  .map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.symbol} ({inst.asset_type})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Quick Refresh */}
          <button
            onClick={loadVolatility}
            disabled={isLoading}
            className="p-1.5 bg-[#0B1220] border border-[#263244] rounded text-slate-400 hover:text-slate-200 disabled:opacity-50"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-3 border-t border-[#263244] text-xs">
          {/* Date Range */}
          <div>
            <label className="text-slate-400 block mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-[#0B1220] border border-[#263244] text-slate-200 rounded px-2.5 py-1 font-mono"
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
              className="w-full bg-[#0B1220] border border-[#263244] text-slate-200 rounded px-2.5 py-1 font-mono"
            >
              <option value="adjusted">Adjusted Close</option>
              <option value="close">Unadjusted Close</option>
            </select>
          </div>

          {/* Return Type */}
          <div>
            <label className="text-slate-400 block mb-1">Return Type</label>
            <select
              value={returnType}
              onChange={(e) => setReturnType(e.target.value as 'simple' | 'log')}
              className="w-full bg-[#0B1220] border border-[#263244] text-slate-200 rounded px-2.5 py-1 font-mono"
            >
              <option value="simple">Simple Return (R_t)</option>
              <option value="log">Log Return (r_t)</option>
            </select>
          </div>

          {/* Rolling Window */}
          {analysisMode === 'single' && (
            <div>
              <label className="text-slate-400 block mb-1">Rolling Window (obs)</label>
              <select
                value={rollingWindow}
                onChange={(e) => setRollingWindow(Number(e.target.value))}
                className="w-full bg-[#0B1220] border border-[#263244] text-slate-200 rounded px-2.5 py-1 font-mono"
              >
                <option value={10}>10 observations</option>
                <option value={20}>20 observations (Default)</option>
                <option value={30}>30 observations</option>
                <option value={60}>60 observations</option>
                <option value={90}>90 observations</option>
                <option value={120}>120 observations</option>
                <option value={252}>252 observations</option>
              </select>
            </div>
          )}

          {/* Annualization Toggle */}
          {analysisMode === 'single' && (
            <div>
              <label className="text-slate-400 block mb-1">Annualized Mode</label>
              <select
                value={isAnnualized ? 'true' : 'false'}
                onChange={(e) => setIsAnnualized(e.target.value === 'true')}
                className="w-full bg-[#0B1220] border border-[#263244] text-slate-200 rounded px-2.5 py-1 font-mono"
              >
                <option value="true">Annualized Volatility</option>
                <option value="false">Daily Volatility</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-900/60 rounded-lg p-4 flex items-center gap-3 text-rose-300 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Insufficient Data Warning Banner */}
      {analysisMode === 'single' && singleData && !singleData.is_sufficient && (
        <div className="bg-amber-950/40 border border-amber-900/60 rounded-lg p-4 flex items-center gap-3 text-amber-300 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <div className="font-semibold">Insufficient Data Warning</div>
            <div className="text-xs text-amber-400/80">{singleData.message}</div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
          <span>Calculating return volatility &amp; distribution metrics...</span>
        </div>
      ) : analysisMode === 'single' && singleData ? (
        <div className="space-y-6">
          {/* Volatility Summary Cards */}
          <VolatilitySummaryCards
            summary={singleData.summary}
            symbol={singleData.symbol}
            assetType={singleData.asset_type}
          />

          {/* Rolling Volatility Chart */}
          <RollingVolatilityChart
            series={singleData.rolling_series}
            symbol={singleData.symbol}
            windowSize={singleData.rolling_window}
            isAnnualized={singleData.annualized}
          />

          {/* Return Distribution Chart */}
          <ReturnDistributionChart
            distribution={singleData.distribution}
            symbol={singleData.symbol}
          />
        </div>
      ) : analysisMode === 'comparison' && multiData ? (
        <div className="space-y-6">
          <VolatilityComparisonChart instruments={multiData.instruments} />
          <VolatilityComparisonTable
            instruments={multiData.instruments}
            returnType={multiData.return_type}
            priceSource={multiData.price_source}
          />
        </div>
      ) : null}
    </div>
  );
};
