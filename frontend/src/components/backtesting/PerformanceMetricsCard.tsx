import React, { useState } from 'react';
import { BacktestPerformanceMetrics } from '../../types/backtest';
import { BookOpen, TrendingUp, ShieldAlert, BarChart3, Percent, DollarSign, Activity } from 'lucide-react';
import { PerformanceMethodologyModal } from './PerformanceMethodologyModal';
import { MetricInfoTooltip } from '../common/MetricInfoTooltip';

interface PerformanceMetricsCardProps {
  metrics: BacktestPerformanceMetrics | undefined;
  isLoading?: boolean;
}

export const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = ({ metrics, isLoading }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-6 font-mono text-xs text-slate-400 animate-pulse flex items-center justify-center min-h-[220px]">
        Calculating quantitative performance metrics...
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const { returns, risk, drawdown, trading, costs_and_exposure } = metrics;

  const formatPct = (val: number | null | undefined) =>
    val === null || val === undefined ? 'N/A' : `${(val * 100).toFixed(2)}%`;

  const formatNum = (val: number | null | undefined, decimals = 2) =>
    val === null || val === undefined ? 'N/A' : val.toFixed(decimals);

  const formatCurrency = (val: number | null | undefined) =>
    val === null || val === undefined ? 'N/A' : `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#263244] pb-3 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Quantitative Performance Analytics
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Standardized evaluation derived from simulated portfolio state trajectory & completed round-trip trades.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B1220] border border-[#263244] hover:bg-[#1E293B] text-slate-300 font-mono text-xs rounded transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          Methodology
        </button>
      </div>

      {/* Metrics Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 font-mono text-xs">
        {/* 1. Returns */}
        <div className="p-3.5 rounded-lg bg-[#0B1220]/60 border border-[#263244] space-y-2.5">
          <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center justify-between">
            <span>Returns</span>
            <TrendingUp className="w-3.5 h-3.5 opacity-70" />
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Total Return</span>
              </div>
              <div className={`text-sm font-bold ${returns.total_return >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatPct(returns.total_return)}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Annualized Return (CAGR)</span>
                <MetricInfoTooltip metricKey="annualized_return" />
              </div>
              <div className={`text-sm font-semibold ${returns.annualized_return && returns.annualized_return >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatPct(returns.annualized_return)}
              </div>
            </div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-[#263244]/50">
              Horizon: {returns.elapsed_days.toFixed(1)} days ({returns.observation_count} bars)
            </div>
          </div>
        </div>

        {/* 2. Risk Metrics */}
        <div className="p-3.5 rounded-lg bg-[#0B1220]/60 border border-[#263244] space-y-2.5">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>Risk Ratios</span>
            <Activity className="w-3.5 h-3.5 opacity-70" />
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Vol (Ann.)</span>
                  <MetricInfoTooltip metricKey="annualized_volatility" />
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  {formatPct(risk.annualized_volatility)}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Sharpe</span>
                  <MetricInfoTooltip metricKey="sharpe_ratio" />
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  {formatNum(risk.sharpe_ratio)}
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Sortino Ratio</span>
                <MetricInfoTooltip metricKey="sortino_ratio" />
              </div>
              <div className="text-sm font-semibold text-slate-200">
                {formatNum(risk.sortino_ratio)}
              </div>
            </div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-[#263244]/50">
              Risk-Free Rate: {(risk.risk_free_rate * 100).toFixed(1)}% | Factor: {risk.annualization_factor}
            </div>
          </div>
        </div>

        {/* 3. Drawdown Metrics */}
        <div className="p-3.5 rounded-lg bg-[#0B1220]/60 border border-[#263244] space-y-2.5">
          <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center justify-between">
            <span>Drawdown</span>
            <ShieldAlert className="w-3.5 h-3.5 opacity-70" />
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Max Drawdown</span>
                <MetricInfoTooltip metricKey="max_drawdown" />
              </div>
              <div className="text-sm font-bold text-rose-400">
                {formatPct(drawdown.max_drawdown)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] text-slate-400">Max Duration</div>
                <div className="text-xs font-semibold text-slate-300">
                  {formatNum(drawdown.max_drawdown_duration_days, 1)} days
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Calmar</span>
                  <MetricInfoTooltip metricKey="calmar_ratio" />
                </div>
                <div className="text-xs font-semibold text-slate-300">
                  {formatNum(drawdown.calmar_ratio)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Trading Metrics */}
        <div className="p-3.5 rounded-lg bg-[#0B1220]/60 border border-[#263244] space-y-2.5">
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>Trade Statistics</span>
            <Percent className="w-3.5 h-3.5 opacity-70" />
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1">
                Win Rate: <MetricInfoTooltip metricKey="win_rate" />
              </span>
              <span className="text-slate-200 font-semibold">{formatPct(trading.win_rate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1">
                Profit Factor: <MetricInfoTooltip metricKey="profit_factor" />
              </span>
              <span className="text-slate-200 font-semibold">{formatNum(trading.profit_factor)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Avg Win:</span>
              <span className="text-emerald-400 font-semibold">{formatCurrency(trading.average_win)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Avg Loss:</span>
              <span className="text-rose-400 font-semibold">{formatCurrency(trading.average_loss)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Avg Trade Return:</span>
              <span className="text-slate-300 font-semibold">{formatPct(trading.average_trade_return)}</span>
            </div>
          </div>
        </div>

        {/* 5. Costs & Exposure */}
        <div className="p-3.5 rounded-lg bg-[#0B1220]/60 border border-[#263244] space-y-2.5">
          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Exposure & Costs</span>
            <DollarSign className="w-3.5 h-3.5 opacity-70" />
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Market Exposure:</span>
              <span className="text-slate-200 font-semibold">{formatPct(costs_and_exposure.exposure)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1">
                Turnover: <MetricInfoTooltip metricKey="turnover_ratio" />
              </span>
              <span className="text-slate-200 font-semibold">{formatNum(costs_and_exposure.turnover)}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Commission:</span>
              <span className="text-amber-400 font-semibold">{formatCurrency(costs_and_exposure.total_commission)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Slippage Cost:</span>
              <span className="text-amber-400 font-semibold">{formatCurrency(costs_and_exposure.total_slippage_cost)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#263244]/50">
              <span className="text-slate-400 font-semibold">Total Costs:</span>
              <span className="text-amber-400 font-bold">{formatCurrency(costs_and_exposure.total_transaction_costs)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Methodology Modal */}
      <PerformanceMethodologyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default PerformanceMetricsCard;
