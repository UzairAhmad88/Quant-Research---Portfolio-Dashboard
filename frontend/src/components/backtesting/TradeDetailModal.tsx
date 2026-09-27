import React from 'react';
import { CompletedTrade } from '../../types/backtest';
import { Badge } from '../ui/Badge';
import { X, Clock } from 'lucide-react';

interface TradeDetailModalProps {
  trade: CompletedTrade | null;
  onClose: () => void;
}

export const TradeDetailModal: React.FC<TradeDetailModalProps> = ({ trade, onClose }) => {
  if (!trade) return null;

  const isNetPositive = trade.net_pnl >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#263244] bg-[#0B1220]/50">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-100 font-mono">
              Trade #{trade.id.slice(0, 8)} Details
            </h3>
            <Badge variant={trade.exit_reason === 'FORCED_END' ? 'warning' : 'outline'}>
              {trade.exit_reason}
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-[#0B1220]/80 border border-[#263244]">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Gross P&L</div>
              <div className={`text-base font-mono font-semibold ${trade.gross_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${trade.gross_pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Net P&L</div>
              <div className={`text-base font-mono font-semibold ${isNetPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${trade.net_pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Trade Return</div>
              <div className={`text-base font-mono font-semibold ${trade.trade_return >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(trade.trade_return * 100).toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Duration</div>
              <div className="text-base font-mono font-semibold text-slate-200 flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                {trade.duration_days.toFixed(1)} days
              </div>
            </div>
          </div>

          {/* Entry & Exit Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Entry Box */}
            <div className="p-4 rounded-lg bg-[#0B1220]/50 border border-[#263244] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#263244]/50">
                <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  ENTRY (BUY)
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {new Date(trade.entry_timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Execution Price:</span>
                  <span className="text-slate-200">${trade.entry_price.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Notional Value:</span>
                  <span className="text-slate-200">${trade.entry_notional.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Commission:</span>
                  <span className="text-slate-300">${trade.entry_commission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Slippage Cost:</span>
                  <span className="text-slate-300">${trade.entry_slippage.toFixed(2)}</span>
                </div>
                {trade.entry_signal_id && (
                  <div className="flex justify-between pt-1 border-t border-[#263244]/50 text-[11px]">
                    <span className="text-slate-500">Signal ID:</span>
                    <span className="text-slate-400">{trade.entry_signal_id.slice(0, 12)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Exit Box */}
            <div className="p-4 rounded-lg bg-[#0B1220]/50 border border-[#263244] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#263244]/50">
                <span className="text-sm font-semibold text-rose-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  EXIT (SELL)
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {new Date(trade.exit_timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Execution Price:</span>
                  <span className="text-slate-200">${trade.exit_price.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Notional Value:</span>
                  <span className="text-slate-200">${trade.exit_notional.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Commission:</span>
                  <span className="text-slate-300">${trade.exit_commission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Slippage Cost:</span>
                  <span className="text-slate-300">${trade.exit_slippage.toFixed(2)}</span>
                </div>
                {trade.exit_signal_id && (
                  <div className="flex justify-between pt-1 border-t border-[#263244]/50 text-[11px]">
                    <span className="text-slate-500">Signal ID:</span>
                    <span className="text-slate-400">{trade.exit_signal_id.slice(0, 12)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trade Accounting Details */}
          <div className="p-4 rounded-lg bg-[#0B1220]/30 border border-[#263244] space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Executed Position Quantity:</span>
              <span className="text-slate-200 font-semibold">{trade.quantity.toFixed(4)} units</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total Transaction Costs (Entry + Exit):</span>
              <span className="text-amber-400 font-semibold">${trade.total_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Exit Reason:</span>
              <span className="text-slate-200 font-semibold">{trade.exit_reason}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 border-t border-[#263244] bg-[#0B1220]/50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeDetailModal;
