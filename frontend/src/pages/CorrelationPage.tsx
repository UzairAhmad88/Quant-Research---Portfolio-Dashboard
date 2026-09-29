import React, { useState, useEffect } from 'react';
import {
  Grid,
  X,
  RefreshCw,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import {
  fetchInstruments,
  fetchCorrelationMatrix,
  fetchPairwiseCorrelation,
  fetchRollingCorrelation,
  InstrumentItem,
  CorrelationMatrixResponse,
  CorrelationPairwiseResponse,
  RollingCorrelationResponse,
} from '../lib/apiClient';
import { CorrelationHeatmap } from '../components/correlation/CorrelationHeatmap';
import { PairwiseScatterPlot } from '../components/correlation/PairwiseScatterPlot';
import { RollingCorrelationChart } from '../components/correlation/RollingCorrelationChart';

import { useResearchContext } from '../hooks/useResearchContext';
import { ResearchContextBar } from '../components/navigation/ResearchContextBar';
import { Breadcrumbs } from '../components/navigation/Breadcrumbs';
import { ExportMenu } from '../components/common/ExportMenu';
import { getCorrelationExportUrl } from '../services/exportService';

export const CorrelationPage: React.FC = () => {
  const { context } = useResearchContext();

  // Instrument selection state
  const [availableInstruments, setAvailableInstruments] = useState<InstrumentItem[]>([]);
  const [selectedInstruments, setSelectedInstruments] = useState<InstrumentItem[]>([]);

  // Controls state
  const [dateRange, setDateRange] = useState<string>(context.rangePreset || '1Y');
  const [returnType, setReturnType] = useState<'simple' | 'log'>('simple');
  const [priceSource, setPriceSource] = useState<'adjusted' | 'close'>(context.priceSource || 'adjusted');
  const [alignmentMode, setAlignmentMode] = useState<'pairwise_complete' | 'common_intersection'>('pairwise_complete');
  const [rollingWindow, setRollingWindow] = useState<number>(60);

  // Analytics data state
  const [matrixData, setMatrixData] = useState<CorrelationMatrixResponse | null>(null);
  const [selectedPair, setSelectedPair] = useState<{ idA: string; idB: string; symA: string; symB: string } | null>(null);
  const [pairwiseData, setPairwiseData] = useState<CorrelationPairwiseResponse | null>(null);
  const [rollingData, setRollingData] = useState<RollingCorrelationResponse | null>(null);

  // Loading & error states
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch available instruments & sync multi-instrument URL context
  useEffect(() => {
    fetchInstruments({ limit: 50, active: true })
      .then((res) => {
        setAvailableInstruments(res.items);
        if (res.items.length > 0) {
          if (context.symbols && context.symbols.length > 0) {
            const matched = res.items.filter((i) =>
              context.symbols?.some((s) => s.toUpperCase() === i.symbol.toUpperCase())
            );
            setSelectedInstruments(matched.length >= 2 ? matched : res.items.slice(0, Math.min(4, res.items.length)));
          } else {
            setSelectedInstruments(res.items.slice(0, Math.min(4, res.items.length)));
          }
        }
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Failed to load instruments.');
      });
  }, [context.symbols]);

  // Compute startDate based on range selection
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

  // Load Matrix Data
  const loadMatrix = async () => {
    if (selectedInstruments.length < 2) {
      setMatrixData(null);
      return;
    }

    try {
      setIsLoadingMatrix(true);
      setErrorMsg(null);
      const res = await fetchCorrelationMatrix({
        instrument_ids: selectedInstruments.map((i) => i.id),
        start_date: getStartDate(dateRange),
        return_type: returnType,
        price_source: priceSource,
        alignment_mode: alignmentMode,
      });
      setMatrixData(res);

      // Auto select first pair if no pair selected
      if (res.instruments.length >= 2 && !selectedPair) {
        setSelectedPair({
          idA: res.instrument_ids[0],
          idB: res.instrument_ids[1],
          symA: res.instruments[0],
          symB: res.instruments[1],
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to calculate correlation matrix.');
    } finally {
      setIsLoadingMatrix(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, [selectedInstruments, dateRange, returnType, priceSource, alignmentMode]);

  // Load Pairwise & Rolling data when selectedPair or params change
  const loadPairwiseAndRolling = async () => {
    if (!selectedPair) return;

    try {
      const [pRes, rRes] = await Promise.all([
        fetchPairwiseCorrelation({
          instrument_a: selectedPair.idA,
          instrument_b: selectedPair.idB,
          start_date: getStartDate(dateRange),
          return_type: returnType,
          price_source: priceSource,
        }),
        fetchRollingCorrelation({
          instrument_a: selectedPair.idA,
          instrument_b: selectedPair.idB,
          window: rollingWindow,
          start_date: getStartDate(dateRange),
          return_type: returnType,
          price_source: priceSource,
        }),
      ]);
      setPairwiseData(pRes);
      setRollingData(rRes);
    } catch (err: any) {
      console.error('Failed to load pairwise correlation:', err);
    }
  };

  useEffect(() => {
    loadPairwiseAndRolling();
  }, [selectedPair, dateRange, returnType, priceSource, rollingWindow]);

  // Add instrument to selection
  const handleAddInstrument = (inst: InstrumentItem) => {
    if (selectedInstruments.some((i) => i.id === inst.id)) return;
    if (selectedInstruments.length >= 20) {
      alert('Maximum 20 instruments can be analyzed at once.');
      return;
    }
    setSelectedInstruments([...selectedInstruments, inst]);
  };

  const handleRemoveInstrument = (instId: string) => {
    const remaining = selectedInstruments.filter((i) => i.id !== instId);
    setSelectedInstruments(remaining);
    if (selectedPair && (selectedPair.idA === instId || selectedPair.idB === instId)) {
      setSelectedPair(null);
    }
  };

  // Compute summary stats
  const validPairwise = matrixData ? matrixData.pairwise.filter((p) => p.correlation !== null) : [];
  const avgCorr =
    validPairwise.length > 0
      ? validPairwise.reduce((acc, curr) => acc + (curr.correlation || 0), 0) / validPairwise.length
      : 0;

  const highestPair =
    validPairwise.length > 0
      ? [...validPairwise].sort((a, b) => (b.correlation || 0) - (a.correlation || 0))[0]
      : null;

  const lowestPair =
    validPairwise.length > 0
      ? [...validPairwise].sort((a, b) => (a.correlation || 0) - (b.correlation || 0))[0]
      : null;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Correlation' }, { label: `${selectedInstruments.length} Assets` }]} />
      <ResearchContextBar availableInstruments={availableInstruments} showInstrumentSelect={false} />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-5 shadow-card">
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-800 border border-emerald-200">
            <Grid className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">Correlation Analyzer & Matrix</h1>
            <p className="text-xs text-text-muted">
              Multi-instrument return cross-correlation, pairwise distribution scatter, and rolling window stability
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <ExportMenu
            disabled={!matrixData || selectedInstruments.length < 2}
            options={[
              {
                id: 'corr-matrix-csv',
                label: 'Correlation Matrix CSV',
                format: 'csv',
                url: getCorrelationExportUrl({
                  format: 'csv',
                  dataType: 'matrix',
                  instrumentIds: selectedInstruments.map((i) => i.id),
                  startDate: context.startDate,
                  endDate: context.endDate,
                  priceSource,
                  returnType,
                }),
                description: 'Cross-instrument correlation coefficient grid',
              },
              {
                id: 'corr-matrix-json',
                label: 'Correlation Matrix JSON',
                format: 'json',
                url: getCorrelationExportUrl({
                  format: 'json',
                  dataType: 'matrix',
                  instrumentIds: selectedInstruments.map((i) => i.id),
                  startDate: context.startDate,
                  endDate: context.endDate,
                  priceSource,
                  returnType,
                }),
                description: 'Full matrix payload with pairwise statistics',
              },
              ...(selectedPair
                ? [
                    {
                      id: 'corr-pair-csv',
                      label: `Pairwise (${selectedPair.symA}/${selectedPair.symB}) CSV`,
                      format: 'csv' as const,
                      url: getCorrelationExportUrl({
                        format: 'csv',
                        dataType: 'pairwise',
                        instrumentA: selectedPair.idA,
                        instrumentB: selectedPair.idB,
                        startDate: context.startDate,
                        endDate: context.endDate,
                        priceSource,
                        returnType,
                      }),
                      description: 'Pairwise observations and correlation',
                    },
                    {
                      id: 'corr-rolling-csv',
                      label: `Rolling ${rollingWindow}d (${selectedPair.symA}/${selectedPair.symB}) CSV`,
                      format: 'csv' as const,
                      url: getCorrelationExportUrl({
                        format: 'csv',
                        dataType: 'rolling',
                        instrumentA: selectedPair.idA,
                        instrumentB: selectedPair.idB,
                        window: rollingWindow,
                        startDate: context.startDate,
                        endDate: context.endDate,
                        priceSource,
                        returnType,
                      }),
                      description: 'Rolling window correlation series',
                    },
                  ]
                : []),
            ]}
          />
          <button
            onClick={loadMatrix}
            className="rounded-md border border-border bg-card p-2 text-text-muted hover:bg-surface hover:text-text-primary transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingMatrix ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center space-x-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-financial-negative">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Controls & Instrument Selector Bar */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-card">
        {/* Selected Instruments Tags */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-text-muted">Analyzed Instruments ({selectedInstruments.length}/20):</span>
          {selectedInstruments.map((inst) => (
            <span
              key={inst.id}
              className="inline-flex items-center space-x-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900"
            >
              <span>{inst.symbol}</span>
              <button
                onClick={() => handleRemoveInstrument(inst.id)}
                className="rounded text-emerald-700 hover:text-financial-negative transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}

          {/* Instrument Selector Dropdown */}
          <select
            onChange={(e) => {
              const found = availableInstruments.find((i) => i.id === e.target.value);
              if (found) handleAddInstrument(found);
            }}
            value=""
            className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          >
            <option value="" disabled>
              + Add Registered Instrument
            </option>
            {availableInstruments
              .filter((i) => !selectedInstruments.some((s) => s.id === i.id))
              .map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.symbol} — {inst.name} ({inst.asset_type})
                </option>
              ))}
          </select>
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-3 text-xs">
          {/* Date Range */}
          <div className="flex items-center space-x-1">
            <span className="text-text-muted">Range:</span>
            {['1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'].map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                  dateRange === r ? 'bg-brand-primary text-white shadow-xs' : 'text-text-muted hover:bg-surface hover:text-text-primary'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Return Type & Price Source */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="text-text-muted">Returns:</span>
              <button
                onClick={() => setReturnType('simple')}
                className={`rounded px-2 py-1 font-semibold transition-colors ${
                  returnType === 'simple' ? 'bg-brand-primary text-white shadow-xs' : 'text-text-muted hover:bg-surface hover:text-text-primary'
                }`}
              >
                Simple
              </button>
              <button
                onClick={() => setReturnType('log')}
                className={`rounded px-2 py-1 font-semibold transition-colors ${
                  returnType === 'log' ? 'bg-brand-primary text-white shadow-xs' : 'text-text-muted hover:bg-surface hover:text-text-primary'
                }`}
              >
                Log
              </button>
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-text-muted">Price:</span>
              <button
                onClick={() => setPriceSource('adjusted')}
                className={`rounded px-2 py-1 font-semibold transition-colors ${
                  priceSource === 'adjusted' ? 'bg-brand-primary text-white shadow-xs' : 'text-text-muted hover:bg-surface hover:text-text-primary'
                }`}
              >
                Adjusted
              </button>
              <button
                onClick={() => setPriceSource('close')}
                className={`rounded px-2 py-1 font-semibold transition-colors ${
                  priceSource === 'close' ? 'bg-brand-primary text-white shadow-xs' : 'text-text-muted hover:bg-surface hover:text-text-primary'
                }`}
              >
                Raw Close
              </button>
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-text-muted">Alignment:</span>
              <button
                onClick={() => setAlignmentMode('pairwise_complete')}
                className={`rounded px-2 py-1 font-semibold transition-colors ${
                  alignmentMode === 'pairwise_complete' ? 'bg-brand-primary text-white shadow-xs' : 'text-text-muted hover:bg-surface hover:text-text-primary'
                }`}
              >
                Pairwise Complete
              </button>
              <button
                onClick={() => setAlignmentMode('common_intersection')}
                className={`rounded px-2 py-1 font-semibold transition-colors ${
                  alignmentMode === 'common_intersection' ? 'bg-brand-primary text-white shadow-xs' : 'text-text-muted hover:bg-surface hover:text-text-primary'
                }`}
              >
                Common Intersection
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Bar */}
      {matrixData && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4 shadow-card">
            <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">Instruments Analyzed</span>
            <div className="mt-1 font-mono text-base font-bold text-text-primary">{matrixData.instruments.length}</div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-card">
            <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">Average Pairwise Correlation</span>
            <div className="mt-1 font-mono text-base font-bold text-brand-primary">{avgCorr.toFixed(4)}</div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-card">
            <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">Highest Positive Pair</span>
            <div className="mt-1 font-mono text-sm font-bold text-financial-positive">
              {highestPair ? `${highestPair.symbol_a} × ${highestPair.symbol_b} (${highestPair.correlation?.toFixed(2)})` : '—'}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-card">
            <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">Lowest Pairwise Pair</span>
            <div className="mt-1 font-mono text-sm font-bold text-amber-600">
              {lowestPair ? `${lowestPair.symbol_a} × ${lowestPair.symbol_b} (${lowestPair.correlation?.toFixed(2)})` : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Correlation Matrix Heatmap */}
      {matrixData && (
        <CorrelationHeatmap
          data={matrixData}
          selectedPair={selectedPair}
          onSelectPair={(idA, idB, symA, symB) => setSelectedPair({ idA, idB, symA, symB })}
        />
      )}

      {/* Pairwise Analysis & Rolling Window Workspace */}
      {pairwiseData && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Pairwise Scatter Plot */}
          <div className="lg:col-span-6">
            <PairwiseScatterPlot pairwise={pairwiseData} />
          </div>

          {/* Rolling Correlation Chart */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2 text-xs shadow-card">
              <span className="font-semibold text-text-primary">Rolling Window Size:</span>
              <div className="flex items-center space-x-1 font-mono">
                {[30, 60, 90, 120, 252].map((w) => (
                  <button
                    key={w}
                    onClick={() => setRollingWindow(w)}
                    className={`rounded px-2.5 py-1 text-2xs font-semibold transition-colors ${
                      rollingWindow === w ? 'bg-brand-primary text-white shadow-xs' : 'text-text-muted hover:bg-surface hover:text-text-primary'
                    }`}
                  >
                    {w}D
                  </button>
                ))}
              </div>
            </div>

            {rollingData && <RollingCorrelationChart rollingData={rollingData} height={280} />}
          </div>
        </div>
      )}

      {/* Pairwise Table */}
      {matrixData && matrixData.pairwise.length > 0 && (
        <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-4 bg-surface">
            <div className="flex items-center space-x-2">
              <Layers className="h-4 w-4 text-brand-primary" />
              <h3 className="text-sm font-semibold text-text-primary">Pairwise Correlation Breakdown</h3>
            </div>
            <span className="font-mono text-xs text-text-muted">{matrixData.pairwise.length} Pair Relationships</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface text-2xs uppercase tracking-wider text-text-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3">Pair</th>
                  <th className="px-4 py-3 text-right">Pearson Correlation ($\rho$)</th>
                  <th className="px-4 py-3 text-right">Aligned Observations</th>
                  <th className="px-4 py-3">Qualitative Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-text-secondary font-mono">
                {matrixData.pairwise.map((item, idx) => (
                  <tr
                    key={idx}
                    onClick={() => {
                      const idA = matrixData.instrument_ids[matrixData.instruments.indexOf(item.symbol_a)];
                      const idB = matrixData.instrument_ids[matrixData.instruments.indexOf(item.symbol_b)];
                      if (idA && idB) {
                        setSelectedPair({ idA, idB, symA: item.symbol_a, symB: item.symbol_b });
                      }
                    }}
                    className="hover:bg-surface/60 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-text-primary">
                      {item.symbol_a} × {item.symbol_b}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-brand-primary">
                      {item.correlation !== null && item.correlation !== undefined ? item.correlation.toFixed(4) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-text-muted">{item.observations}</td>
                    <td className="px-4 py-3 font-sans text-text-muted">{item.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
