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
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#263244] pb-3">
        <div>
          <span className="text-xs text-[#94A3B8] font-mono">BACKTEST ID: {backtest.id}</span>
          <h3 className="text-lg font-semibold text-[#E5E7EB] mt-0.5">
            Historical Simulation Overview — {backtest.symbol || 'Instrument'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-1 rounded font-mono font-medium border ${
              isOpen
                ? 'bg-blue-950/60 text-blue-400 border-blue-800/80'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            POSITION: {isOpen ? 'OPEN' : 'FLAT'}
          </span>
          <span
            className={`text-xs px-2.5 py-1 rounded font-mono font-medium border ${
              backtest.status === 'COMPLETED'
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80'
                : backtest.status === 'COMPLETED_WITH_WARNINGS'
                ? 'bg-amber-950/60 text-amber-400 border-amber-800/80'
                : 'bg-red-950/60 text-red-400 border-red-800/80'
            }`}
          >
            {backtest.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Initial Capital */}
        <div className="bg-[#111827] border border-[#263244] rounded p-3">
          <div className="text-[11px] text-[#94A3B8] flex items-center gap-1 font-medium">
            <DollarSign className="h-3.5 w-3.5 text-[#94A3B8]" />
            Initial Capital
          </div>
          <div className="text-base font-semibold text-[#E5E7EB] mt-1 font-mono">
            {formatCurrency(backtest.initial_capital)}
          </div>
        </div>

        {/* Current / Final Cash */}
        <div className="bg-[#111827] border border-[#263244] rounded p-3">
          <div className="text-[11px] text-[#94A3B8] flex items-center gap-1 font-medium">
            <DollarSign className="h-3.5 w-3.5 text-[#94A3B8]" />
            Ending Cash
          </div>
          <div className="text-base font-semibold text-[#E5E7EB] mt-1 font-mono">
            {formatCurrency(backtest.final_cash)}
          </div>
        </div>

        {/* Position Quantity */}
        <div className="bg-[#111827] border border-[#263244] rounded p-3">
          <div className="text-[11px] text-[#94A3B8] flex items-center gap-1 font-medium">
            <Activity className="h-3.5 w-3.5 text-[#94A3B8]" />
            Ending Position
          </div>
          <div className="text-base font-semibold text-[#E5E7EB] mt-1 font-mono">
            {backtest.final_position.toFixed(4)} units
          </div>
        </div>

        {/* Final Portfolio Value */}
        <div className="bg-[#111827] border border-[#263244] rounded p-3">
          <div className="text-[11px] text-[#94A3B8] flex items-center gap-1 font-medium">
            <BarChart2 className="h-3.5 w-3.5 text-[#3B82F6]" />
            Ending Portfolio Value
          </div>
          <div className="text-base font-semibold text-[#3B82F6] mt-1 font-mono">
            {formatCurrency(backtest.final_portfolio_value)}
          </div>
        </div>

        {/* Unrealized PnL */}
        <div className="bg-[#111827] border border-[#263244] rounded p-3">
          <div className="text-[11px] text-[#94A3B8] flex items-center gap-1 font-medium">
            <Activity className="h-3.5 w-3.5 text-[#94A3B8]" />
            Unrealized P&L
          </div>
          <div className={`text-base font-semibold mt-1 font-mono ${unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(unrealizedPnL)}
          </div>
        </div>

        {/* Executed Trades Count */}
        <div className="bg-[#111827] border border-[#263244] rounded p-3">
          <div className="text-[11px] text-[#94A3B8] flex items-center gap-1 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-[#22C55E]" />
            Trade Events
          </div>
          <div className="text-base font-semibold text-[#22C55E] mt-1 font-mono">
            {backtest.trade_count} trades
          </div>
        </div>
      </div>

      {/* Assumptions Footer */}
      <div className="bg-[#111827]/60 border border-[#263244] rounded px-3 py-2 flex flex-wrap items-center justify-between text-xs text-[#94A3B8]">
        <div className="flex items-center gap-4 font-mono">
          <span>Execution: <strong className="text-[#E5E7EB]">{backtest.execution_timing}</strong></span>
          <span>Sizing: <strong className="text-[#E5E7EB]">{backtest.position_sizing}</strong></span>
          <span>Direction: <strong className="text-[#E5E7EB]">{backtest.direction}</strong></span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span>Commission Rate: <strong className="text-[#E5E7EB]">{(backtest.commission * 100).toFixed(2)}%</strong></span>
          <span>Slippage Rate: <strong className="text-[#E5E7EB]">{(backtest.slippage * 100).toFixed(2)}%</strong></span>
        </div>
      </div>
    </div>
  );
};
