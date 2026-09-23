import React, { useState } from 'react';
import { CorrelationMatrixResponse } from '../../lib/apiClient';

interface CorrelationHeatmapProps {
  data: CorrelationMatrixResponse;
  selectedPair?: { symA: string; symB: string } | null;
  onSelectPair?: (idA: string, idB: string, symA: string, symB: string) => void;
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({
  data,
  selectedPair,
  onSelectPair,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    symA: string;
    symB: string;
    val: number | null;
    obs: number;
    interp: string;
  } | null>(null);

  const { instruments, instrument_ids, matrix, pairwise } = data;

  if (!instruments || instruments.length === 0 || !matrix) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-500">
        <p className="text-sm font-medium">No correlation matrix data available</p>
      </div>
    );
  }

  // Get background color for matrix cell
  const getCellColor = (val: number | null, isDiagonal: boolean) => {
    if (val === null || val === undefined) return 'bg-slate-800/80 text-slate-500';
    if (isDiagonal) return 'bg-slate-800 text-slate-300 font-bold';

    if (val >= 0.8) return 'bg-emerald-600/90 text-white font-bold';
    if (val >= 0.6) return 'bg-emerald-700/80 text-emerald-100 font-semibold';
    if (val >= 0.3) return 'bg-blue-600/70 text-blue-100 font-medium';
    if (val > 0.1) return 'bg-blue-900/50 text-blue-200';
    if (val > -0.1) return 'bg-slate-900 text-slate-400';
    if (val > -0.4) return 'bg-amber-900/40 text-amber-200';
    if (val > -0.7) return 'bg-red-800/60 text-red-200 font-medium';
    return 'bg-red-600/90 text-white font-bold';
  };

  const getCellPairwiseInfo = (i: number, j: number) => {
    const symA = instruments[i];
    const symB = instruments[j];
    const val = matrix[i][j];

    const match = pairwise.find(
      (p) => (p.symbol_a === symA && p.symbol_b === symB) || (p.symbol_a === symB && p.symbol_b === symA)
    );

    return {
      symA,
      symB,
      idA: instrument_ids[i],
      idB: instrument_ids[j],
      val,
      obs: match ? match.observations : 0,
      interp: match ? match.interpretation : 'N/A',
    };
  };

  return (
    <div className="flex flex-col space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Pearson Correlation Matrix</h3>
          <p className="text-xs text-slate-400">
            Aligned return observations cross-correlation ({data.return_type.toUpperCase()} returns, {data.price_source.toUpperCase()})
          </p>
        </div>
        <span className="font-mono text-xs font-semibold text-slate-400">
          {instruments.length} × {instruments.length} Matrix
        </span>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <table className="mx-auto border-collapse font-mono text-xs select-none">
          <thead>
            <tr>
              <th className="p-2"></th>
              {instruments.map((sym, idx) => (
                <th
                  key={idx}
                  className="p-2 text-center text-xs font-bold text-slate-300 uppercase tracking-wider"
                >
                  {sym}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {instruments.map((symA, rowIdx) => (
              <tr key={rowIdx}>
                {/* Row Header */}
                <td className="p-2 pr-3 text-right font-bold text-slate-300 uppercase tracking-wider">
                  {symA}
                </td>

                {/* Matrix Cells */}
                {instruments.map((symB, colIdx) => {
                  const info = getCellPairwiseInfo(rowIdx, colIdx);
                  const isDiagonal = rowIdx === colIdx;
                  const isSelected =
                    selectedPair &&
                    ((selectedPair.symA === symA && selectedPair.symB === symB) ||
                      (selectedPair.symA === symB && selectedPair.symB === symA));

                  return (
                    <td
                      key={colIdx}
                      onMouseEnter={() =>
                        setHoveredCell({
                          symA: info.symA,
                          symB: info.symB,
                          val: info.val,
                          obs: info.obs,
                          interp: info.interp,
                        })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => {
                        if (!isDiagonal && onSelectPair) {
                          onSelectPair(info.idA, info.idB, info.symA, info.symB);
                        }
                      }}
                      className={`h-11 w-16 text-center border border-slate-800/80 cursor-pointer transition-all duration-150 ${getCellColor(
                        info.val,
                        isDiagonal
                      )} ${isSelected ? 'ring-2 ring-blue-400 z-10 scale-105' : 'hover:scale-105 hover:z-10'}`}
                    >
                      {info.val !== null && info.val !== undefined ? info.val.toFixed(2) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hover Information / Inspection Bar */}
      <div className="rounded border border-slate-800/80 bg-slate-950/60 px-4 py-2.5 text-xs">
        {hoveredCell ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-slate-200">
                {hoveredCell.symA} × {hoveredCell.symB}
              </span>
              <span className="text-slate-400">
                Observations: <strong className="text-slate-200 font-mono">{hoveredCell.obs}</strong>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-slate-400">
                Pearson Score:{' '}
                <strong className="text-blue-400 font-mono">
                  {hoveredCell.val !== null ? hoveredCell.val.toFixed(4) : 'N/A'}
                </strong>
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 font-semibold text-slate-300">
                {hoveredCell.interp}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500">
            Hover over any matrix cell to inspect pair statistics. Click a cell to open Pairwise Analysis.
          </div>
        )}
      </div>
    </div>
  );
};
