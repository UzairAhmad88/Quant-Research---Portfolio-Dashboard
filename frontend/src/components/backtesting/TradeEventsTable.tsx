import React from 'react';
import { TradeEvent } from '../../types/backtest';
import { formatTradeSideBadge } from '../../lib/backtestAdapter';

interface TradeEventsTableProps {
  trades: TradeEvent[];
  isLoading?: boolean;
}

export const TradeEventsTable: React.FC<TradeEventsTableProps> = ({ trades, isLoading }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-text-secondary font-mono shadow-xs">
        Loading simulated trade events...
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-text-secondary font-mono shadow-xs">
        No trade executions were generated for this historical simulation period.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
      <div className="p-4 border-b border-border flex items-center justify-between bg-surface">
        <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider font-mono">
          Simulated Trade Executions ({trades.length})
        </h4>
        <span className="text-xs text-text-secondary font-mono">NEXT_OPEN Execution Model</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-text-primary font-mono">
          <thead className="bg-surface text-text-secondary uppercase text-[10px] border-b border-border">
            <tr>
              <th className="py-2.5 px-4 font-semibold">Signal Date</th>
              <th className="py-2.5 px-4 font-semibold">Execution Date</th>
              <th className="py-2.5 px-4 font-semibold">Side</th>
              <th className="py-2.5 px-4 font-semibold text-right">Exec Price</th>
              <th className="py-2.5 px-4 font-semibold text-right">Quantity</th>
              <th className="py-2.5 px-4 font-semibold text-right">Notional Value</th>
              <th className="py-2.5 px-4 font-semibold text-right">Commission</th>
              <th className="py-2.5 px-4 font-semibold text-right">Slippage</th>
              <th className="py-2.5 px-4 font-semibold text-right">Cash After</th>
              <th className="py-2.5 px-4 font-semibold">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {trades.map((t) => {
              const badge = formatTradeSideBadge(t.side);
              return (
                <tr key={t.id} className="hover:bg-surface-hover transition-colors">
                  <td className="py-2.5 px-4 text-text-secondary">{t.signal_timestamp.split('T')[0]}</td>
                  <td className="py-2.5 px-4 font-semibold text-text-primary">{t.execution_timestamp.split('T')[0]}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        badge.variant === 'positive'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : badge.variant === 'negative'
                          ? 'bg-rose-50 text-rose-800 border border-rose-300'
                          : 'bg-surface text-text-secondary border border-border'
                      }`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium">{formatCurrency(t.execution_price)}</td>
                  <td className="py-2.5 px-4 text-right">{t.quantity.toFixed(4)}</td>
                  <td className="py-2.5 px-4 text-right font-medium">{formatCurrency(t.notional_value)}</td>
                  <td className="py-2.5 px-4 text-right text-text-secondary">{formatCurrency(t.commission)}</td>
                  <td className="py-2.5 px-4 text-right text-text-secondary">{formatCurrency(t.slippage)}</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-brand-primary">{formatCurrency(t.cash_after)}</td>
                  <td className="py-2.5 px-4 text-text-secondary text-[11px]">{t.execution_reason}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
