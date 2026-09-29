import React, { useState } from 'react';
import { DrawdownPeriod } from '../../types/backtest';
import { CheckCircle, Clock, ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface DrawdownPeriodsTableProps {
  periods: DrawdownPeriod[];
  isLoading?: boolean;
  selectedPeriod?: DrawdownPeriod | null;
  onSelectPeriod?: (period: DrawdownPeriod | null) => void;
}

type SortField = 'peak_timestamp' | 'trough_timestamp' | 'drawdown_percentage' | 'duration_days' | 'recovery_duration_days';

export const DrawdownPeriodsTable: React.FC<DrawdownPeriodsTableProps> = ({
  periods,
  isLoading = false,
  selectedPeriod = null,
  onSelectPeriod,
}) => {
  const [sortField, setSortField] = useState<SortField>('drawdown_percentage');
  const [sortAsc, setSortAsc] = useState<boolean>(true); // deepest drawdowns (most negative) first by default

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'peak_timestamp' ? false : true);
    }
  };

  const sortedPeriods = [...periods].sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];

    if (valA === null || valA === undefined) valA = sortAsc ? Infinity : -Infinity;
    if (valB === null || valB === undefined) valB = sortAsc ? Infinity : -Infinity;

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const formatDate = (ts?: string | null) => {
    if (!ts) return '—';
    return ts.split('T')[0];
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-text-secondary font-mono shadow-xs">
        Analyzing drawdown periods...
      </div>
    );
  }

  if (!periods || periods.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center text-sm text-text-secondary shadow-xs">
        <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto mb-2 opacity-80" />
        <div className="font-semibold text-text-primary">No Drawdown Periods Detected</div>
        <div className="text-xs text-text-secondary mt-1">
          Portfolio maintained peak equity trajectory throughout the simulation without continuous decline.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider font-mono flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-600" />
            Detected Drawdown Periods ({periods.length})
          </h4>
          <p className="text-xs text-text-secondary mt-0.5 font-sans">
            Historical peak-to-trough drawdowns and recovery durations. Click a period to inspect and highlight on charts.
          </p>
        </div>
        {selectedPeriod && onSelectPeriod && (
          <button
            onClick={() => onSelectPeriod(null)}
            className="text-xs text-brand-primary hover:underline font-mono"
          >
            Clear Selection
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface text-[11px] font-mono uppercase tracking-wider text-text-secondary border-b border-border">
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-text-primary"
                onClick={() => handleSort('peak_timestamp')}
              >
                <div className="flex items-center gap-1">
                  Peak Date
                  {sortField === 'peak_timestamp' && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-text-primary"
                onClick={() => handleSort('trough_timestamp')}
              >
                <div className="flex items-center gap-1">
                  Trough Date
                  {sortField === 'trough_timestamp' && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </th>
              <th className="py-2.5 px-3">Recovery Date</th>
              <th
                className="py-2.5 px-3 text-right cursor-pointer hover:text-text-primary"
                onClick={() => handleSort('drawdown_percentage')}
              >
                <div className="flex items-center justify-end gap-1">
                  Depth (%)
                  {sortField === 'drawdown_percentage' && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">Loss ($)</th>
              <th
                className="py-2.5 px-3 text-right cursor-pointer hover:text-text-primary"
                onClick={() => handleSort('duration_days')}
              >
                <div className="flex items-center justify-end gap-1">
                  Duration
                  {sortField === 'duration_days' && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </th>
              <th
                className="py-2.5 px-3 text-right cursor-pointer hover:text-text-primary"
                onClick={() => handleSort('recovery_duration_days')}
              >
                <div className="flex items-center justify-end gap-1">
                  Recovery
                  {sortField === 'recovery_duration_days' && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs font-mono">
            {sortedPeriods.map((period, idx) => {
              const isSelected = selectedPeriod?.peak_timestamp === period.peak_timestamp && selectedPeriod?.trough_timestamp === period.trough_timestamp;
              return (
                <tr
                  key={idx}
                  onClick={() => onSelectPeriod && onSelectPeriod(isSelected ? null : period)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-brand-primary/10 border-l-2 border-l-brand-primary text-text-primary font-semibold'
                      : 'hover:bg-surface-hover text-text-primary'
                  }`}
                >
                  <td className="py-2.5 px-3">{formatDate(period.peak_timestamp)}</td>
                  <td className="py-2.5 px-3">{formatDate(period.trough_timestamp)}</td>
                  <td className="py-2.5 px-3 text-text-secondary">{formatDate(period.recovery_timestamp)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                    {(period.drawdown_percentage * 100).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-600 font-semibold">
                    {formatCurrency(period.drawdown_amount)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-text-secondary">
                    {period.duration_days}d
                  </td>
                  <td className="py-2.5 px-3 text-right text-text-secondary">
                    {period.recovery_duration_days !== null && period.recovery_duration_days !== undefined
                      ? `${period.recovery_duration_days}d`
                      : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {period.status === 'RECOVERED' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <CheckCircle className="h-3 w-3" /> Recovered
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                        <Clock className="h-3 w-3" /> Active
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedPeriod && (
        <div className="mt-4 p-4 bg-surface border border-border rounded-lg text-xs font-mono space-y-2">
          <div className="flex items-center justify-between text-text-primary font-semibold border-b border-border pb-2">
            <span>Selected Drawdown Inspection Detail</span>
            <span className="text-rose-700 font-bold">
              {(selectedPeriod.drawdown_percentage * 100).toFixed(2)}% ({formatCurrency(selectedPeriod.drawdown_amount)})
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-text-secondary pt-1">
            <div>
              <span className="block text-[10px] uppercase text-text-muted">Peak Equity</span>
              <span className="text-text-primary font-bold">{formatCurrency(selectedPeriod.peak_equity)}</span>
              <span className="block text-[10px] text-text-muted mt-0.5">{formatDate(selectedPeriod.peak_timestamp)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-text-muted">Trough Equity</span>
              <span className="text-rose-700 font-bold">{formatCurrency(selectedPeriod.trough_equity)}</span>
              <span className="block text-[10px] text-text-muted mt-0.5">{formatDate(selectedPeriod.trough_timestamp)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-text-muted">Time to Trough</span>
              <span className="text-text-primary font-bold">
                {Math.round(
                  (new Date(selectedPeriod.trough_timestamp).getTime() - new Date(selectedPeriod.peak_timestamp).getTime()) /
                    (1000 * 3600 * 24)
                )}d
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-text-muted">Recovery Duration</span>
              <span className="text-text-primary font-bold">
                {selectedPeriod.recovery_duration_days !== null && selectedPeriod.recovery_duration_days !== undefined
                  ? `${selectedPeriod.recovery_duration_days}d`
                  : 'Unrecovered (Active)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
