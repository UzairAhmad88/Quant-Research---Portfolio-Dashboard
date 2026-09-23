import React, { useState, useEffect } from 'react';
import {
  Grid,
  X,
  RefreshCw,
  AlertTriangle,
  Download,
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

export const CorrelationPage: React.FC = () => {
  // Instrument selection state
  const [availableInstruments, setAvailableInstruments] = useState<InstrumentItem[]>([]);
  const [selectedInstruments, setSelectedInstruments] = useState<InstrumentItem[]>([]);

  // Controls state
  const [dateRange, setDateRange] = useState<string>('1Y');
  const [returnType, setReturnType] = useState<'simple' | 'log'>('simple');
  const [priceSource, setPriceSource] = useState<'adjusted' | 'close'>('adjusted');
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

  // Fetch available instruments on mount
  useEffect(() => {
    fetchInstruments({ limit: 50, active: true })
      .then((res) => {
        setAvailableInstruments(res.items);
        // Default select first 4 instruments if available
        if (res.items.length >= 2 && selectedInstruments.length === 0) {
          setSelectedInstruments(res.items.slice(0, Math.min(4, res.items.length)));
        }
      })
      .catch((err) => console.error(err));
  }, []);

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

  // CSV Export of matrix
  const handleExportCsv = () => {
    if (!matrixData) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Symbol,' + matrixData.instruments.join(',') + '\n';

    matrixData.matrix.forEach((row, idx) => {
      csvContent += matrixData.instruments[idx] + ',' + row.map((v) => (v !== null ? v.toFixed(4) : '')).join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `correlation_matrix_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-400 border border-blue-500/20">
            <Grid className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Correlation Analyzer & Matrix</h1>
            <p className="text-xs text-slate-400">
              Multi-instrument return cross-correlation, pairwise distribution scatter, and rolling window stability
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCsv}
            disabled={!matrixData}
            className="flex items-center space-x-1.5 rounded border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-slate-400" />
            <span>Export Matrix CSV</span>
          </button>
          <button
            onClick={loadMatrix}
            className="rounded border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingMatrix ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center space-x-2 rounded-lg border border-red-500/50 bg-red-950/40 p-4 text-sm text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Controls & Instrument Selector Bar */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-4 backdrop-blur-sm">
        {/* Selected Instruments Tags */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Analyzed Instruments ({selectedInstruments.length}/20):</span>
          {selectedInstruments.map((inst) => (
            <span
              key={inst.id}
              className="inline-flex items-center space-x-1.5 rounded border border-blue-500/30 bg-blue-950/40 px-2.5 py-1 text-xs font-semibold text-blue-300"
            >
              <span>{inst.symbol}</span>
              <button
                onClick={() => handleRemoveInstrument(inst.id)}
                className="rounded text-blue-400 hover:text-red-400"
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
            className="rounded border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
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
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-3 text-xs">
          {/* Date Range */}
          <div className="flex items-center space-x-1">
            <span className="text-slate-400">Range:</span>
            {['1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'].map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`rounded px-2.5 py-1 font-semibold ${
                  dateRange === r ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Return Type & Price Source */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="text-slate-400">Returns:</span>
              <button
                onClick={() => setReturnType('simple')}
                className={`rounded px-2 py-1 font-semibold ${
                  returnType === 'simple' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                Simple
              </button>
              <button
                onClick={() => setReturnType('log')}
                className={`rounded px-2 py-1 font-semibold ${
                  returnType === 'log' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                Log
              </button>
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-slate-400">Price:</span>
              <button
                onClick={() => setPriceSource('adjusted')}
                className={`rounded px-2 py-1 font-semibold ${
                  priceSource === 'adjusted' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                Adjusted
              </button>
              <button
                onClick={() => setPriceSource('close')}
                className={`rounded px-2 py-1 font-semibold ${
                  priceSource === 'close' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                Raw Close
              </button>
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-slate-400">Alignment:</span>
              <button
                onClick={() => setAlignmentMode('pairwise_complete')}
                className={`rounded px-2 py-1 font-semibold ${
                  alignmentMode === 'pairwise_complete' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                Pairwise Complete
              </button>
              <button
                onClick={() => setAlignmentMode('common_intersection')}
                className={`rounded px-2 py-1 font-semibold ${
                  alignmentMode === 'common_intersection' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
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
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Instruments Analyzed</span>
            <div className="mt-1 font-mono text-base font-bold text-slate-100">{matrixData.instruments.length}</div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Average Pairwise Correlation</span>
            <div className="mt-1 font-mono text-base font-bold text-blue-400">{avgCorr.toFixed(4)}</div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Highest Positive Pair</span>
            <div className="mt-1 font-mono text-sm font-bold text-emerald-400">
              {highestPair ? `${highestPair.symbol_a} × ${highestPair.symbol_b} (${highestPair.correlation?.toFixed(2)})` : '—'}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Lowest Pairwise Pair</span>
            <div className="mt-1 font-mono text-sm font-bold text-amber-400">
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
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs">
              <span className="font-semibold text-slate-300">Rolling Window Size:</span>
              <div className="flex items-center space-x-1 font-mono">
                {[30, 60, 90, 120, 252].map((w) => (
                  <button
                    key={w}
                    onClick={() => setRollingWindow(w)}
                    className={`rounded px-2.5 py-1 text-2xs font-semibold ${
                      rollingWindow === w ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
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
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-900">
            <div className="flex items-center space-x-2">
              <Layers className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-200">Pairwise Correlation Breakdown</h3>
            </div>
            <span className="font-mono text-xs text-slate-400">{matrixData.pairwise.length} Pair Relationships</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-2xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Pair</th>
                  <th className="px-4 py-3 text-right">Pearson Correlation ($\rho$)</th>
                  <th className="px-4 py-3 text-right">Aligned Observations</th>
                  <th className="px-4 py-3">Qualitative Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
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
                    className="hover:bg-slate-800/40 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      {item.symbol_a} × {item.symbol_b}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-400">
                      {item.correlation !== null && item.correlation !== undefined ? item.correlation.toFixed(4) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">{item.observations}</td>
                    <td className="px-4 py-3 font-sans text-slate-400">{item.interpretation}</td>
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
