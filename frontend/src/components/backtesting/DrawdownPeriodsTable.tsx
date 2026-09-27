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
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-8 text-center text-sm text-[#94A3B8]">
        Analyzing drawdown periods...
      </div>
    );
  }

  if (!periods || periods.length === 0) {
    return (
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-6 text-center text-sm text-[#94A3B8]">
        <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-2 opacity-80" />
        <div className="font-semibold text-[#E5E7EB]">No Drawdown Periods Detected</div>
        <div className="text-xs text-[#94A3B8] mt-1">
          Portfolio maintained peak equity trajectory throughout the simulation without continuous decline.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-[#E5E7EB] uppercase tracking-wider font-mono flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-500" />
            Detected Drawdown Periods ({periods.length})
          </h4>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Historical peak-to-trough drawdowns and recovery durations. Click a period to inspect and highlight on charts.
          </p>
        </div>
        {selectedPeriod && onSelectPeriod && (
          <button
            onClick={() => onSelectPeriod(null)}
            className="text-xs text-[#3B82F6] hover:underline font-mono"
          >
            Clear Selection
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded border border-[#263244]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#111827] text-[11px] font-mono uppercase tracking-wider text-[#94A3B8] border-b border-[#263244]">
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-white"
                onClick={() => handleSort('peak_timestamp')}
              >
                <div className="flex items-center gap-1">
                  Peak Date
                  {sortField === 'peak_timestamp' && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-white"
                onClick={() => handleSort('trough_timestamp')}
              >
                <div className="flex items-center gap-1">
                  Trough Date
                  {sortField === 'trough_timestamp' && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </th>
              <th className="py-2.5 px-3">Recovery Date</th>
              <th
                className="py-2.5 px-3 text-right cursor-pointer hover:text-white"
                onClick={() => handleSort('drawdown_percentage')}
              >
                <div className="flex items-center justify-end gap-1">
                  Depth (%)
                  {sortField === 'drawdown_percentage' && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">Loss ($)</th>
              <th
                className="py-2.5 px-3 text-right cursor-pointer hover:text-white"
                onClick={() => handleSort('duration_days')}
              >
                <div className="flex items-center justify-end gap-1">
                  Duration
                  {sortField === 'duration_days' && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </th>
              <th
                className="py-2.5 px-3 text-right cursor-pointer hover:text-white"
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
          <tbody className="divide-y divide-[#263244] text-xs font-mono">
            {sortedPeriods.map((period, idx) => {
              const isSelected = selectedPeriod?.peak_timestamp === period.peak_timestamp && selectedPeriod?.trough_timestamp === period.trough_timestamp;
              return (
                <tr
                  key={idx}
                  onClick={() => onSelectPeriod && onSelectPeriod(isSelected ? null : period)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-950/40 border-l-2 border-l-blue-500 text-white font-semibold'
                      : 'hover:bg-[#111827]/60 text-[#E5E7EB]'
                  }`}
                >
                  <td className="py-2.5 px-3">{formatDate(period.peak_timestamp)}</td>
                  <td className="py-2.5 px-3">{formatDate(period.trough_timestamp)}</td>
                  <td className="py-2.5 px-3 text-[#94A3B8]">{formatDate(period.recovery_timestamp)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-red-400">
                    {(period.drawdown_percentage * 100).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-red-300">
                    {formatCurrency(period.drawdown_amount)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#94A3B8]">
                    {period.duration_days}d
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#94A3B8]">
                    {period.recovery_duration_days !== null && period.recovery_duration_days !== undefined
                      ? `${period.recovery_duration_days}d`
                      : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {period.status === 'RECOVERED' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                        <CheckCircle className="h-3 w-3" /> Recovered
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/50">
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
        <div className="mt-4 p-4 bg-[#111827] border border-[#263244] rounded-lg text-xs font-mono space-y-2">
          <div className="flex items-center justify-between text-[#E5E7EB] font-semibold border-b border-[#263244] pb-2">
            <span>Selected Drawdown Inspection Detail</span>
            <span className="text-red-400 font-bold">
              {(selectedPeriod.drawdown_percentage * 100).toFixed(2)}% ({formatCurrency(selectedPeriod.drawdown_amount)})
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[#94A3B8] pt-1">
            <div>
              <span className="block text-[10px] uppercase text-[#64748B]">Peak Equity</span>
              <span className="text-[#E5E7EB] font-bold">{formatCurrency(selectedPeriod.peak_equity)}</span>
              <span className="block text-[10px] text-[#64748B] mt-0.5">{formatDate(selectedPeriod.peak_timestamp)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-[#64748B]">Trough Equity</span>
              <span className="text-red-400 font-bold">{formatCurrency(selectedPeriod.trough_equity)}</span>
              <span className="block text-[10px] text-[#64748B] mt-0.5">{formatDate(selectedPeriod.trough_timestamp)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-[#64748B]">Time to Trough</span>
              <span className="text-[#E5E7EB] font-bold">
                {Math.round(
                  (new Date(selectedPeriod.trough_timestamp).getTime() - new Date(selectedPeriod.peak_timestamp).getTime()) /
                    (1000 * 3600 * 24)
                )}d
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-[#64748B]">Recovery Duration</span>
              <span className="text-[#E5E7EB] font-bold">
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
