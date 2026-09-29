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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-text-primary font-mono">
              Trade #{trade.id.slice(0, 8)} Details
            </h3>
            <Badge variant={trade.exit_reason === 'FORCED_END' ? 'warning' : 'outline'}>
              {trade.exit_reason}
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-surface-elevated transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-surface border border-border">
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Gross P&L</div>
              <div className={`text-base font-mono font-semibold ${trade.gross_pnl >= 0 ? 'text-financial-positive' : 'text-financial-negative'}`}>
                ${trade.gross_pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Net P&L</div>
              <div className={`text-base font-mono font-semibold ${isNetPositive ? 'text-financial-positive' : 'text-financial-negative'}`}>
                ${trade.net_pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Trade Return</div>
              <div className={`text-base font-mono font-semibold ${trade.trade_return >= 0 ? 'text-financial-positive' : 'text-financial-negative'}`}>
                {(trade.trade_return * 100).toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Duration</div>
              <div className="text-base font-mono font-semibold text-text-primary flex items-center gap-1">
                <Clock className="w-4 h-4 text-text-muted" />
                {trade.duration_days.toFixed(1)} days
              </div>
            </div>
          </div>

          {/* Entry & Exit Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Entry Box */}
            <div className="p-4 rounded-lg bg-surface border border-border space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-sm font-semibold text-financial-positive flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  ENTRY (BUY)
                </span>
                <span className="text-xs font-mono text-text-muted">
                  {new Date(trade.entry_timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-text-muted">Execution Price:</span>
                  <span className="text-text-primary">${trade.entry_price.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Notional Value:</span>
                  <span className="text-text-primary">${trade.entry_notional.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Commission:</span>
                  <span className="text-text-secondary">${trade.entry_commission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Slippage Cost:</span>
                  <span className="text-text-secondary">${trade.entry_slippage.toFixed(2)}</span>
                </div>
                {trade.entry_signal_id && (
                  <div className="flex justify-between pt-1 border-t border-border text-[11px]">
                    <span className="text-text-muted">Signal ID:</span>
                    <span className="text-text-secondary">{trade.entry_signal_id.slice(0, 12)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Exit Box */}
            <div className="p-4 rounded-lg bg-surface border border-border space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-sm font-semibold text-financial-negative flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  EXIT (SELL)
                </span>
                <span className="text-xs font-mono text-text-muted">
                  {new Date(trade.exit_timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-text-muted">Execution Price:</span>
                  <span className="text-text-primary">${trade.exit_price.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Notional Value:</span>
                  <span className="text-text-primary">${trade.exit_notional.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Commission:</span>
                  <span className="text-text-secondary">${trade.exit_commission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Slippage Cost:</span>
                  <span className="text-text-secondary">${trade.exit_slippage.toFixed(2)}</span>
                </div>
                {trade.exit_signal_id && (
                  <div className="flex justify-between pt-1 border-t border-border text-[11px]">
                    <span className="text-text-muted">Signal ID:</span>
                    <span className="text-text-secondary">{trade.exit_signal_id.slice(0, 12)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trade Accounting Details */}
          <div className="p-4 rounded-lg bg-surface border border-border space-y-2 text-xs font-mono">
            <div className="flex justify-between text-text-muted">
              <span>Executed Position Quantity:</span>
              <span className="text-text-primary font-semibold">{trade.quantity.toFixed(4)} units</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Total Transaction Costs (Entry + Exit):</span>
              <span className="text-amber-600 font-semibold">${trade.total_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Exit Reason:</span>
              <span className="text-text-primary font-semibold">{trade.exit_reason}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 border-t border-border bg-surface">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary bg-card hover:bg-surface-elevated border border-border rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeDetailModal;
