import React from 'react';
import { CorrelationPairwiseResponse } from '../../lib/apiClient';

interface PairwiseScatterPlotProps {
  pairwise: CorrelationPairwiseResponse;
}

export const PairwiseScatterPlot: React.FC<PairwiseScatterPlotProps> = ({ pairwise }) => {
  const { symbol_a, symbol_b, scatter_points, correlation, observations, min_observations_met } = pairwise;

  if (!scatter_points || scatter_points.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-500">
        <p className="text-sm font-medium">No scatter plot data available</p>
        <p className="text-xs text-slate-600 mt-1">Select valid instruments with aligned return observations.</p>
      </div>
    );
  }

  // Calculate SVG bounds & padding
  const maxA = Math.max(...scatter_points.map((p) => Math.abs(p.return_a)), 0.05);
  const maxB = Math.max(...scatter_points.map((p) => Math.abs(p.return_b)), 0.05);

  const boundA = maxA * 1.15;
  const boundB = maxB * 1.15;

  const width = 450;
  const height = 320;
  const pad = 40;

  const mapX = (valA: number) => pad + ((valA + boundA) / (2 * boundA)) * (width - 2 * pad);
  const mapY = (valB: number) => height - pad - ((valB + boundB) / (2 * boundB)) * (height - 2 * pad);

  return (
    <div className="flex flex-col space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            {symbol_a} vs {symbol_b} Return Scatter Plot
          </h3>
          <p className="text-xs text-slate-400">Pairwise aligned observation distribution</p>
        </div>
        <div className="flex items-center space-x-3 font-mono text-xs">
          <span className="text-slate-400">
            Obs: <strong className="text-slate-200">{observations}</strong>
          </span>
          <span className="text-slate-400">
            Pearson: <strong className="text-blue-400">{correlation !== null && correlation !== undefined ? correlation.toFixed(4) : 'N/A'}</strong>
          </span>
        </div>
      </div>

      {!min_observations_met && (
        <div className="rounded border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-300">
          Insufficient data for statistical confidence ({observations} observations available, min 30 required).
        </div>
      )}

      {/* SVG Scatter Canvas */}
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-lg overflow-visible font-mono text-3xs select-none">
          {/* Background Grid */}
          <rect x={pad} y={pad} width={width - 2 * pad} height={height - 2 * pad} fill="#0B1220" stroke="#1E293B" strokeWidth="1" />

          {/* Zero Axis Lines */}
          <line x1={mapX(0)} y1={pad} x2={mapX(0)} y2={height - pad} stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1={pad} y1={mapY(0)} x2={width - pad} y2={mapY(0)} stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Scatter Points */}
          {scatter_points.map((pt, idx) => {
            const cx = mapX(pt.return_a);
            const cy = mapY(pt.return_b);
            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r="3"
                className="fill-blue-500/80 stroke-blue-300/60 hover:fill-emerald-400 hover:r-5 transition-all duration-150"
              >
                <title>
                  {`${new Date(pt.timestamp).toLocaleDateString()}\n${symbol_a}: ${(pt.return_a * 100).toFixed(2)}%\n${symbol_b}: ${(pt.return_b * 100).toFixed(2)}%`}
                </title>
              </circle>
            );
          })}

          {/* Axis Labels */}
          <text x={width / 2} y={height - 10} fill="#94A3B8" textAnchor="middle" className="text-2xs font-semibold">
            {symbol_a} Return (%)
          </text>
          <text x={12} y={height / 2} fill="#94A3B8" textAnchor="middle" transform={`rotate(-90 12 ${height / 2})`} className="text-2xs font-semibold">
            {symbol_b} Return (%)
          </text>
        </svg>
      </div>
    </div>
  );
};
