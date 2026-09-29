import React from 'react';
import { DrawdownPoint, DrawdownPeriod } from '../../types/backtest';
import { Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface CurrentDrawdownStatusProps {
  drawdownSeries: DrawdownPoint[];
  periods: DrawdownPeriod[];
  isLoading?: boolean;
}

export const CurrentDrawdownStatus: React.FC<CurrentDrawdownStatusProps> = ({
  drawdownSeries,
  periods,
  isLoading = false,
}) => {
  if (isLoading || !drawdownSeries || drawdownSeries.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 text-text-secondary text-sm shadow-xs font-mono">
        Loading current drawdown status...
      </div>
    );
  }

  const latestPoint = drawdownSeries[drawdownSeries.length - 1];
  const activePeriod = periods.find((p) => p.status === 'ACTIVE');
  const isAtPeak = Math.abs(latestPoint.drawdown_percentage) < 1e-6;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (ts?: string | null) => {
    if (!ts) return '—';
    return ts.split('T')[0];
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 font-mono shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand-primary" />
          <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Current Drawdown Status
          </h4>
        </div>
        <div>
          {isAtPeak ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> AT_PEAK
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
              <ShieldAlert className="h-3.5 w-3.5" /> IN_DRAWDOWN
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 text-xs">
        {/* Current Drawdown % */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <span className="text-[10px] text-text-secondary uppercase block font-semibold">Current Drawdown %</span>
          <div className={`text-base font-bold mt-1 ${isAtPeak ? 'text-emerald-700' : 'text-rose-700'}`}>
            {(latestPoint.drawdown_percentage * 100).toFixed(2)}%
          </div>
          <span className="text-[10px] text-text-muted mt-0.5 block">Relative to Peak</span>
        </div>

        {/* Current Drawdown Amount */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <span className="text-[10px] text-text-secondary uppercase block font-semibold">Current Loss ($)</span>
          <div className={`text-base font-bold mt-1 ${isAtPeak ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatCurrency(latestPoint.drawdown_amount)}
          </div>
          <span className="text-[10px] text-text-muted mt-0.5 block">Nominal Difference</span>
        </div>

        {/* Running Peak Equity */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <span className="text-[10px] text-text-secondary uppercase block font-semibold">Running Peak</span>
          <div className="text-base font-bold text-emerald-700 mt-1">
            {formatCurrency(latestPoint.running_peak)}
          </div>
          <span className="text-[10px] text-text-muted mt-0.5 block">High-Water Mark</span>
        </div>

        {/* Active Peak Timestamp */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <span className="text-[10px] text-text-secondary uppercase block font-semibold">Peak Timestamp</span>
          <div className="text-sm font-bold text-text-primary mt-1">
            {activePeriod ? formatDate(activePeriod.peak_timestamp) : formatDate(latestPoint.timestamp)}
          </div>
          <span className="text-[10px] text-text-muted mt-0.5 block">High Point Established</span>
        </div>

        {/* Current Duration */}
        <div className="bg-surface border border-border rounded-lg p-3 col-span-2 md:col-span-1">
          <span className="text-[10px] text-text-secondary uppercase block font-semibold">Drawdown Duration</span>
          <div className="text-base font-bold text-text-primary mt-1">
            {activePeriod ? `${activePeriod.duration_days} days` : '0 days'}
          </div>
          <span className="text-[10px] text-text-muted mt-0.5 block">
            {activePeriod ? 'Unrecovered' : 'At High-Water Mark'}
          </span>
        </div>
      </div>
    </div>
  );
};
