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
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-8 text-center text-sm text-[#94A3B8]">
        Loading simulated trade events...
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-8 text-center text-sm text-[#94A3B8]">
        No trade executions were generated for this historical simulation period.
      </div>
    );
  }

  return (
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg overflow-hidden">
      <div className="p-4 border-b border-[#263244] flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[#E5E7EB] uppercase tracking-wider font-mono">
          Simulated Trade Executions ({trades.length})
        </h4>
        <span className="text-xs text-[#94A3B8]">NEXT_OPEN Execution Model</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#E5E7EB] font-mono">
          <thead className="bg-[#111827] text-[#94A3B8] uppercase text-[10px] border-b border-[#263244]">
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
          <tbody className="divide-y divide-[#263244]">
            {trades.map((t) => {
              const badge = formatTradeSideBadge(t.side);
              return (
                <tr key={t.id} className="hover:bg-[#111827]/50 transition-colors">
                  <td className="py-2.5 px-4 text-[#94A3B8]">{t.signal_timestamp.split('T')[0]}</td>
                  <td className="py-2.5 px-4 font-medium text-[#E5E7EB]">{t.execution_timestamp.split('T')[0]}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        badge.variant === 'positive'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                          : badge.variant === 'negative'
                          ? 'bg-red-950/80 text-red-400 border border-red-800/80'
                          : 'bg-[#111827] text-[#94A3B8] border border-[#263244]'
                      }`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium">{formatCurrency(t.execution_price)}</td>
                  <td className="py-2.5 px-4 text-right">{t.quantity.toFixed(4)}</td>
                  <td className="py-2.5 px-4 text-right font-medium">{formatCurrency(t.notional_value)}</td>
                  <td className="py-2.5 px-4 text-right text-[#94A3B8]">{formatCurrency(t.commission)}</td>
                  <td className="py-2.5 px-4 text-right text-[#94A3B8]">{formatCurrency(t.slippage)}</td>
                  <td className="py-2.5 px-4 text-right font-medium">{formatCurrency(t.cash_after)}</td>
                  <td className="py-2.5 px-4 text-[#94A3B8] text-[11px]">{t.execution_reason}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
