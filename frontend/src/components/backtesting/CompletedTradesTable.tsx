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
      <div className="p-8 text-center border border-[#263244] rounded-lg bg-[#151F2E]/60">
        <p className="text-slate-400 text-sm font-mono">No completed round-trip trades recorded for this backtest.</p>
      </div>
    );
  }

  return (
    <div className="border border-[#263244] rounded-lg bg-[#151F2E] overflow-hidden shadow-lg">
      <div className="px-5 py-3 border-b border-[#263244] bg-[#0B1220]/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Completed Trades Lifecycle
          </h3>
          <Badge variant="outline" className="font-mono text-xs">
            {trades.length} {trades.length === 1 ? 'Trade' : 'Trades'}
          </Badge>
        </div>
        <span className="text-xs text-slate-500 font-mono hidden sm:inline">
          Click row for accounting details
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-[#0B1220] text-slate-400 border-b border-[#263244] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-4 font-semibold">Trade #</th>
              <th className="py-2.5 px-4 font-semibold">Entry Date</th>
              <th className="py-2.5 px-4 font-semibold">Exit Date</th>
              <th className="py-2.5 px-4 font-semibold text-right">Entry Price</th>
              <th className="py-2.5 px-4 font-semibold text-right">Exit Price</th>
              <th className="py-2.5 px-4 font-semibold text-right">Quantity</th>
              <th className="py-2.5 px-4 font-semibold text-right">Total Cost</th>
              <th className="py-2.5 px-4 font-semibold text-right">Gross P&L</th>
              <th className="py-2.5 px-4 font-semibold text-right">Net P&L</th>
              <th className="py-2.5 px-4 font-semibold text-right">Return</th>
              <th className="py-2.5 px-4 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#263244]/60">
            {trades.map((t, idx) => {
              const isProfit = t.net_pnl >= 0;
              return (
                <tr
                  key={t.id || idx}
                  onClick={() => onSelectTrade?.(t)}
                  className="hover:bg-[#1E293B]/70 cursor-pointer transition-colors text-slate-300"
                >
                  <td className="py-2.5 px-4 text-slate-400 font-medium">#{idx + 1}</td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {new Date(t.entry_timestamp).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {new Date(t.exit_timestamp).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium text-slate-200">
                    ${t.entry_price.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium text-slate-200">
                    ${t.exit_price.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-300">
                    {t.quantity.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-amber-400 font-medium">
                    ${t.total_cost.toFixed(2)}
                  </td>
                  <td className={`py-2.5 px-4 text-right font-semibold ${t.gross_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${t.gross_pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`py-2.5 px-4 text-right font-semibold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${t.net_pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`py-2.5 px-4 text-right font-semibold ${t.trade_return >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
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
