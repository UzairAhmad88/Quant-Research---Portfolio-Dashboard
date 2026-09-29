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
      <div className="bg-card border border-border rounded-xl p-6 font-mono text-xs text-text-secondary animate-pulse flex items-center justify-center min-h-[220px] shadow-xs">
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
    <div className="bg-card border border-border rounded-xl p-5 space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-border pb-3 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider font-mono flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-primary" />
            Quantitative Performance Analytics
          </h3>
          <p className="text-xs text-text-secondary font-mono mt-0.5">
            Standardized evaluation derived from simulated portfolio state trajectory &amp; completed round-trip trades.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border hover:bg-surface-hover text-text-primary font-mono text-xs rounded-lg transition-colors font-medium shadow-xs"
        >
          <BookOpen className="w-3.5 h-3.5 text-brand-primary" />
          Methodology
        </button>
      </div>

      {/* Metrics Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 font-mono text-xs">
        {/* 1. Returns */}
        <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2.5 shadow-xs">
          <div className="text-[11px] font-semibold text-brand-primary uppercase tracking-wider flex items-center justify-between">
            <span>Returns</span>
            <TrendingUp className="w-3.5 h-3.5 opacity-70" />
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between text-[10px] text-text-secondary">
                <span>Total Return</span>
              </div>
              <div className={`text-sm font-bold ${returns.total_return >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatPct(returns.total_return)}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] text-text-secondary">
                <span>Annualized Return (CAGR)</span>
                <MetricInfoTooltip metricKey="annualized_return" />
              </div>
              <div className={`text-sm font-semibold ${returns.annualized_return && returns.annualized_return >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatPct(returns.annualized_return)}
              </div>
            </div>
            <div className="text-[10px] text-text-muted pt-1 border-t border-border">
              Horizon: {returns.elapsed_days.toFixed(1)} days ({returns.observation_count} bars)
            </div>
          </div>
        </div>

        {/* 2. Risk Metrics */}
        <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2.5 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
            <span>Risk Ratios</span>
            <Activity className="w-3.5 h-3.5 opacity-70" />
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between text-[10px] text-text-secondary">
                  <span>Vol (Ann.)</span>
                  <MetricInfoTooltip metricKey="annualized_volatility" />
                </div>
                <div className="text-sm font-semibold text-text-primary">
                  {formatPct(risk.annualized_volatility)}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[10px] text-text-secondary">
                  <span>Sharpe</span>
                  <MetricInfoTooltip metricKey="sharpe_ratio" />
                </div>
                <div className="text-sm font-semibold text-text-primary">
                  {formatNum(risk.sharpe_ratio)}
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] text-text-secondary">
                <span>Sortino Ratio</span>
                <MetricInfoTooltip metricKey="sortino_ratio" />
              </div>
              <div className="text-sm font-semibold text-text-primary">
                {formatNum(risk.sortino_ratio)}
              </div>
            </div>
            <div className="text-[10px] text-text-muted pt-1 border-t border-border">
              Risk-Free Rate: {(risk.risk_free_rate * 100).toFixed(1)}% | Factor: {risk.annualization_factor}
            </div>
          </div>
        </div>

        {/* 3. Drawdown Metrics */}
        <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2.5 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider flex items-center justify-between">
            <span>Drawdown</span>
            <ShieldAlert className="w-3.5 h-3.5 opacity-70" />
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between text-[10px] text-text-secondary">
                <span>Max Drawdown</span>
                <MetricInfoTooltip metricKey="max_drawdown" />
              </div>
              <div className="text-sm font-bold text-rose-700">
                {formatPct(drawdown.max_drawdown)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] text-text-secondary">Max Duration</div>
                <div className="text-xs font-semibold text-text-primary">
                  {formatNum(drawdown.max_drawdown_duration_days, 1)} days
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[10px] text-text-secondary">
                  <span>Calmar</span>
                  <MetricInfoTooltip metricKey="calmar_ratio" />
                </div>
                <div className="text-xs font-semibold text-text-primary">
                  {formatNum(drawdown.calmar_ratio)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Trading Metrics */}
        <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2.5 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center justify-between">
            <span>Trade Statistics</span>
            <Percent className="w-3.5 h-3.5 opacity-70" />
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary flex items-center gap-1">
                Win Rate: <MetricInfoTooltip metricKey="win_rate" />
              </span>
              <span className="text-text-primary font-semibold">{formatPct(trading.win_rate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary flex items-center gap-1">
                Profit Factor: <MetricInfoTooltip metricKey="profit_factor" />
              </span>
              <span className="text-text-primary font-semibold">{formatNum(trading.profit_factor)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Avg Win:</span>
              <span className="text-emerald-700 font-semibold">{formatCurrency(trading.average_win)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Avg Loss:</span>
              <span className="text-rose-700 font-semibold">{formatCurrency(trading.average_loss)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Avg Trade Return:</span>
              <span className="text-text-primary font-semibold">{formatPct(trading.average_trade_return)}</span>
            </div>
          </div>
        </div>

        {/* 5. Costs & Exposure */}
        <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2.5 shadow-xs">
          <div className="text-[11px] font-semibold text-text-primary uppercase tracking-wider flex items-center justify-between">
            <span>Exposure &amp; Costs</span>
            <DollarSign className="w-3.5 h-3.5 opacity-70" />
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-text-secondary">Market Exposure:</span>
              <span className="text-text-primary font-semibold">{formatPct(costs_and_exposure.exposure)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary flex items-center gap-1">
                Turnover: <MetricInfoTooltip metricKey="turnover_ratio" />
              </span>
              <span className="text-text-primary font-semibold">{formatNum(costs_and_exposure.turnover)}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Commission:</span>
              <span className="text-amber-800 font-semibold">{formatCurrency(costs_and_exposure.total_commission)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Slippage Cost:</span>
              <span className="text-amber-800 font-semibold">{formatCurrency(costs_and_exposure.total_slippage_cost)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border">
              <span className="text-text-secondary font-semibold">Total Costs:</span>
              <span className="text-amber-800 font-bold">{formatCurrency(costs_and_exposure.total_transaction_costs)}</span>
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
