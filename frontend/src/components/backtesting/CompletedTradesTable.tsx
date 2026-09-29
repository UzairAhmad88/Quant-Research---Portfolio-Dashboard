import React from 'react';
import { CompletedTrade } from '../../types/backtest';
import { Badge } from '../ui/Badge';

interface CompletedTradesTableProps {
  trades: CompletedTrade[];
  onSelectTrade?: (trade: CompletedTrade) => void;
}

export const CompletedTradesTable: React.FC<CompletedTradesTableProps> = ({ trades, onSelectTrade }) => {
  if (!trades || trades.length === 0) {
    return (
      <div className="p-8 text-center border border-border rounded-xl bg-card shadow-xs">
        <p className="text-text-secondary text-sm font-mono">No completed round-trip trades recorded for this backtest.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
      <div className="px-5 py-3.5 border-b border-border bg-surface flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider font-mono">
            Completed Trades Lifecycle
          </h3>
          <Badge variant="outline" className="font-mono text-xs">
            {trades.length} {trades.length === 1 ? 'Trade' : 'Trades'}
          </Badge>
        </div>
        <span className="text-xs text-text-secondary font-mono hidden sm:inline">
          Click row for accounting details
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-surface text-text-secondary border-b border-border uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-2.5 px-4 font-semibold">Trade #</th>
              <th className="py-2.5 px-4 font-semibold">Entry Date</th>
              <th className="py-2.5 px-4 font-semibold">Exit Date</th>
              <th className="py-2.5 px-4 font-semibold text-right">Entry Price</th>
              <th className="py-2.5 px-4 font-semibold text-right">Exit Price</th>
              <th className="py-2.5 px-4 font-semibold text-right">Quantity</th>
              <th className="py-2.5 px-4 font-semibold text-right">Total Cost</th>
              <th className="py-2.5 px-4 font-semibold text-right">Gross P&amp;L</th>
              <th className="py-2.5 px-4 font-semibold text-right">Net P&amp;L</th>
              <th className="py-2.5 px-4 font-semibold text-right">Return</th>
              <th className="py-2.5 px-4 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {trades.map((t, idx) => {
              const isProfit = t.net_pnl >= 0;
              return (
                <tr
                  key={t.id || idx}
                  onClick={() => onSelectTrade?.(t)}
                  className="hover:bg-surface-hover cursor-pointer transition-colors text-text-primary"
                >
                  <td className="py-2.5 px-4 text-text-secondary font-medium">#{idx + 1}</td>
                  <td className="py-2.5 px-4 text-text-secondary">
                    {new Date(t.entry_timestamp).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-4 text-text-secondary">
                    {new Date(t.exit_timestamp).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium text-text-primary">
                    ${t.entry_price.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium text-text-primary">
                    ${t.exit_price.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-text-secondary">
                    {t.quantity.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-amber-800 font-medium">
                    ${t.total_cost.toFixed(2)}
                  </td>
                  <td className={`py-2.5 px-4 text-right font-semibold ${t.gross_pnl >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    ${t.gross_pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`py-2.5 px-4 text-right font-semibold ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                    ${t.net_pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`py-2.5 px-4 text-right font-semibold ${t.trade_return >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {(t.trade_return * 100).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <Badge variant={t.exit_reason === 'FORCED_END' ? 'warning' : 'outline'} className="text-[10px]">
                      {t.exit_reason === 'FORCED_END' ? 'FORCED' : 'CLOSED'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompletedTradesTable;
