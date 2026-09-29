import React from 'react';
import { Backtest } from '../../types/backtest';
import { DollarSign, ShieldCheck, Activity, BarChart2 } from 'lucide-react';

interface BacktestSummaryCardProps {
  backtest: Backtest;
  latestState?: {
    position_quantity: number;
    market_price: number;
    position_value: number;
    unrealized_pnl: number;
  };
}

export const BacktestSummaryCard: React.FC<BacktestSummaryCardProps> = ({ backtest, latestState }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);

  const isOpen = (latestState?.position_quantity ?? backtest.final_position) > 0;
  const unrealizedPnL = latestState?.unrealized_pnl ?? 0.0;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-card">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <span className="text-xs text-text-muted font-mono">BACKTEST ID: {backtest.id}</span>
          <h3 className="text-lg font-semibold text-text-primary mt-0.5">
            Historical Simulation Overview — {backtest.symbol || 'Instrument'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-1 rounded-md font-mono font-medium border ${
              isOpen
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-surface-elevated text-text-muted border-border'
            }`}
          >
            POSITION: {isOpen ? 'OPEN' : 'FLAT'}
          </span>
          <span
            className={`text-xs px-2.5 py-1 rounded-md font-mono font-medium border ${
              backtest.status === 'COMPLETED'
                ? 'bg-emerald-50 text-financial-positive border-emerald-200'
                : backtest.status === 'COMPLETED_WITH_WARNINGS'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-red-50 text-financial-negative border-red-200'
            }`}
          >
            {backtest.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Initial Capital */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="text-[11px] text-text-muted flex items-center gap-1 font-medium">
            <DollarSign className="h-3.5 w-3.5 text-text-muted" />
            Initial Capital
          </div>
          <div className="text-base font-semibold text-text-primary mt-1 font-mono">
            {formatCurrency(backtest.initial_capital)}
          </div>
        </div>

        {/* Current / Final Cash */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="text-[11px] text-text-muted flex items-center gap-1 font-medium">
            <DollarSign className="h-3.5 w-3.5 text-text-muted" />
            Ending Cash
          </div>
          <div className="text-base font-semibold text-text-primary mt-1 font-mono">
            {formatCurrency(backtest.final_cash)}
          </div>
        </div>

        {/* Position Quantity */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="text-[11px] text-text-muted flex items-center gap-1 font-medium">
            <Activity className="h-3.5 w-3.5 text-text-muted" />
            Ending Position
          </div>
          <div className="text-base font-semibold text-text-primary mt-1 font-mono">
            {backtest.final_position.toFixed(4)} units
          </div>
        </div>

        {/* Final Portfolio Value */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="text-[11px] text-text-muted flex items-center gap-1 font-medium">
            <BarChart2 className="h-3.5 w-3.5 text-brand-primary" />
            Ending Portfolio Value
          </div>
          <div className="text-base font-semibold text-brand-primary mt-1 font-mono">
            {formatCurrency(backtest.final_portfolio_value)}
          </div>
        </div>

        {/* Unrealized PnL */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="text-[11px] text-text-muted flex items-center gap-1 font-medium">
            <Activity className="h-3.5 w-3.5 text-text-muted" />
            Unrealized P&L
          </div>
          <div className={`text-base font-semibold mt-1 font-mono ${unrealizedPnL >= 0 ? 'text-financial-positive' : 'text-financial-negative'}`}>
            {formatCurrency(unrealizedPnL)}
          </div>
        </div>

        {/* Executed Trades Count */}
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="text-[11px] text-text-muted flex items-center gap-1 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-financial-positive" />
            Trade Events
          </div>
          <div className="text-base font-semibold text-financial-positive mt-1 font-mono">
            {backtest.trade_count} trades
          </div>
        </div>
      </div>

      {/* Assumptions Footer */}
      <div className="bg-surface border border-border rounded-lg px-3 py-2 flex flex-wrap items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-4 font-mono">
          <span>Execution: <strong className="text-text-primary">{backtest.execution_timing}</strong></span>
          <span>Sizing: <strong className="text-text-primary">{backtest.position_sizing}</strong></span>
          <span>Direction: <strong className="text-text-primary">{backtest.direction}</strong></span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span>Commission Rate: <strong className="text-text-primary">{(backtest.commission * 100).toFixed(2)}%</strong></span>
          <span>Slippage Rate: <strong className="text-text-primary">{(backtest.slippage * 100).toFixed(2)}%</strong></span>
        </div>
      </div>
    </div>
  );
};
