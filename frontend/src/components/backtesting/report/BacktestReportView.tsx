import React, { useState } from 'react';
import { BacktestReport } from '../../../types/backtest';
import { ReportHeader } from './ReportHeader';
import { ReportNavigation } from './ReportNavigation';
import { ReportWarningBanner } from './ReportWarningBanner';
import { EquityAnalyticsWorkspace } from '../EquityAnalyticsWorkspace';
import {
  FileText,
  Sliders,
  Database,
  ShieldAlert,
  BarChart2,
  PieChart,
  Layers,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';

interface BacktestReportViewProps {
  report: BacktestReport;
  isLoading?: boolean;
}

export const BacktestReportView: React.FC<BacktestReportViewProps> = ({ report, isLoading = false }) => {
  const [activeSection, setActiveSection] = useState<string>('sec-summary');
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(report.configuration_hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    return dateStr.split('T')[0];
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center text-sm font-mono text-text-secondary shadow-xs">
        Assembling quantitative backtest research report...
      </div>
    );
  }

  const { executive_summary: exec, configuration: cfg, strategy: strat, market_data: md, performance: perf } = report;

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <ReportHeader report={report} />

      {/* Warning Banner */}
      <ReportWarningBanner warnings={report.warnings} status={report.status} />

      {/* Navigation Bar */}
      <ReportNavigation activeSection={activeSection} onSelectSection={scrollToSection} />

      {/* SECTION 1: Executive Summary */}
      <section id="sec-summary" className="bg-card border border-border rounded-xl p-6 font-mono space-y-4 shadow-xs">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border pb-3">
          <FileText className="h-4 w-4 text-forest-600" />
          1. Executive Summary
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed font-sans">
          Factual summary of historical simulation for instrument <strong className="text-text-primary">{exec.symbol}</strong> using <strong className="text-text-primary">{exec.strategy_name}</strong> from {formatDate(exec.start_date)} to {formatDate(exec.end_date)}.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="bg-forest-50/50 border border-forest-100 rounded-lg p-3">
            <span className="text-[10px] text-text-muted uppercase block font-semibold">Initial Capital</span>
            <span className="text-base font-bold text-text-primary mt-1 block">{formatCurrency(exec.initial_capital)}</span>
          </div>

          <div className="bg-forest-50/50 border border-forest-100 rounded-lg p-3">
            <span className="text-[10px] text-text-muted uppercase block font-semibold">Final Equity</span>
            <span className="text-base font-bold text-text-primary mt-1 block">{formatCurrency(exec.final_portfolio_value)}</span>
          </div>

          <div className="bg-forest-50/50 border border-forest-100 rounded-lg p-3">
            <span className="text-[10px] text-text-muted uppercase block font-semibold">Total Return</span>
            <span className={`text-base font-bold mt-1 block ${exec.total_return >= 0 ? 'text-forest-600' : 'text-rose-600'}`}>
              {(exec.total_return * 100).toFixed(2)}%
            </span>
          </div>

          <div className="bg-forest-50/50 border border-forest-100 rounded-lg p-3">
            <span className="text-[10px] text-text-muted uppercase block font-semibold">Max Drawdown</span>
            <span className="text-base font-bold text-rose-600 mt-1 block">
              {exec.max_drawdown !== null && exec.max_drawdown !== undefined ? `${(exec.max_drawdown * 100).toFixed(2)}%` : 'N/A'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1">
          <div>
            <span className="text-text-muted">Sharpe Ratio (Rf=0):</span>{' '}
            <span className="text-text-primary font-bold">{exec.sharpe_ratio !== null && exec.sharpe_ratio !== undefined ? exec.sharpe_ratio.toFixed(2) : 'N/A'}</span>
          </div>
          <div>
            <span className="text-text-muted">Annualized Volatility:</span>{' '}
            <span className="text-text-primary font-bold">{exec.annualized_volatility !== null && exec.annualized_volatility !== undefined ? `${(exec.annualized_volatility * 100).toFixed(2)}%` : 'N/A'}</span>
          </div>
          <div>
            <span className="text-text-muted">Total Trades:</span>{' '}
            <span className="text-text-primary font-bold">{exec.trade_count}</span>
          </div>
          <div>
            <span className="text-text-muted">Win Rate:</span>{' '}
            <span className="text-text-primary font-bold">{exec.win_rate !== null && exec.win_rate !== undefined ? `${(exec.win_rate * 100).toFixed(1)}%` : 'N/A'}</span>
          </div>
        </div>
      </section>

      {/* SECTION 2 & 3: Configuration & Strategy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
        {/* Section 2 */}
        <section id="sec-config" className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
            <Sliders className="h-4 w-4 text-forest-600" />
            2. Backtest Configuration
          </h3>
          <div className="text-xs space-y-2 text-text-secondary">
            <div className="flex justify-between py-1 border-b border-border/60">
              <span>Backtest ID:</span>
              <span className="text-text-primary font-medium">{cfg.backtest_id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span>Created UTC:</span>
              <span className="text-text-primary font-medium">{new Date(cfg.created_at).toUTCString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span>Instrument Symbol:</span>
              <span className="text-forest-700 font-bold">{cfg.symbol}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span>Asset Type / Currency:</span>
              <span className="text-text-primary font-medium">{cfg.asset_type} ({cfg.currency})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span>Simulation Range:</span>
              <span className="text-text-primary font-medium">{formatDate(cfg.start_date)} → {formatDate(cfg.end_date)}</span>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section id="sec-strategy" className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
            <BarChart2 className="h-4 w-4 text-forest-600" />
            3. Strategy Configuration
          </h3>
          <div className="text-xs space-y-2 text-text-secondary">
            <div className="flex justify-between py-1 border-b border-border/60">
              <span>Strategy Type:</span>
              <span className="text-forest-700 font-bold">{strat.strategy_type}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span>MA Type / Windows:</span>
              <span className="text-text-primary font-bold">{strat.ma_type} ({strat.fast_window} / {strat.slow_window})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span>Price Source:</span>
              <span className="text-text-primary font-medium">{strat.price_source}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span>Position Direction:</span>
              <span className="text-text-primary font-medium">{strat.direction}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span>Signals Persisted:</span>
              <span className="text-text-primary font-medium">{report.signals_summary.total_signals} ({report.signals_summary.buy_signals} BUY, {report.signals_summary.sell_signals} SELL)</span>
            </div>
          </div>
        </section>
      </div>

      {/* SECTION 4 & 5: Market Data & Execution/Costs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
        {/* Section 4 */}
        <section id="sec-market" className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
            <Database className="h-4 w-4 text-forest-600" />
            4. Market Data Provenance
          </h3>
          <div className="text-xs space-y-2 text-text-secondary">
            <div className="flex justify-between py-1 border-b border-border/60">
              <span>Data Provider:</span>
              <span className="text-forest-700 font-bold">{md.provider} ({md.provider_symbol})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span>Frequency / Price Source:</span>
              <span className="text-text-primary font-medium">{md.frequency} ({md.price_source})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span>Actual Data Horizon:</span>
              <span className="text-text-primary font-medium">{formatDate(md.actual_start)} → {formatDate(md.actual_end)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span>Bar Observations Count:</span>
              <span className="text-text-primary font-bold">{md.observation_count} bars</span>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section id="sec-exec" className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
            <ShieldAlert className="h-4 w-4 text-forest-600" />
            5. Execution & Transaction Cost Assumptions
          </h3>
          <div className="text-xs space-y-2 text-text-secondary">
            <div className="flex justify-between py-1 border-b border-border/60">
              <span>Execution Model:</span>
              <span className="text-text-primary font-bold">{report.execution_assumptions.execution_model}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span>Position Sizing Model:</span>
              <span className="text-text-primary font-medium">{report.execution_assumptions.position_sizing}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span>Commission Rate:</span>
              <span className="text-text-primary font-medium">{(report.cost_assumptions.commission_rate * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span>Execution Slippage Rate:</span>
              <span className="text-text-primary font-medium">{(report.cost_assumptions.slippage_rate * 100).toFixed(2)}%</span>
            </div>
          </div>
        </section>
      </div>

      {/* SECTION 6: Performance Summary */}
      <section id="sec-perf" className="bg-card border border-border rounded-xl p-6 font-mono space-y-4 shadow-xs">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border pb-3">
          <BarChart2 className="h-4 w-4 text-forest-600" />
          6. Quantitative Performance Evaluation Metrics
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
          <div className="bg-forest-50/50 border border-forest-100 p-3 rounded-lg">
            <span className="text-[10px] text-text-muted block font-semibold uppercase">Total Return</span>
            <span className="text-base font-bold text-forest-600 mt-1 block">{(perf.returns.total_return * 100).toFixed(2)}%</span>
          </div>

          <div className="bg-forest-50/50 border border-forest-100 p-3 rounded-lg">
            <span className="text-[10px] text-text-muted block font-semibold uppercase">CAGR Return</span>
            <span className="text-base font-bold text-forest-600 mt-1 block">
              {perf.returns.annualized_return !== null ? `${(perf.returns.annualized_return * 100).toFixed(2)}%` : 'N/A'}
            </span>
          </div>

          <div className="bg-forest-50/50 border border-forest-100 p-3 rounded-lg">
            <span className="text-[10px] text-text-muted block font-semibold uppercase">Annualized Volatility</span>
            <span className="text-base font-bold text-text-primary mt-1 block">
              {perf.risk.annualized_volatility !== null ? `${(perf.risk.annualized_volatility * 100).toFixed(2)}%` : 'N/A'}
            </span>
          </div>

          <div className="bg-forest-50/50 border border-forest-100 p-3 rounded-lg">
            <span className="text-[10px] text-text-muted block font-semibold uppercase">Sharpe Ratio</span>
            <span className="text-base font-bold text-forest-700 mt-1 block">
              {perf.risk.sharpe_ratio !== null ? perf.risk.sharpe_ratio.toFixed(2) : 'N/A'}
            </span>
          </div>

          <div className="bg-forest-50/50 border border-forest-100 p-3 rounded-lg">
            <span className="text-[10px] text-text-muted block font-semibold uppercase">Sortino Ratio</span>
            <span className="text-base font-bold text-forest-700 mt-1 block">
              {perf.risk.sortino_ratio !== null ? perf.risk.sortino_ratio.toFixed(2) : 'N/A'}
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 7, 8, 9: Integrated Equity & Drawdown Workspace */}
      <div id="sec-equity"></div>
      <div id="sec-drawdown"></div>
      <section id="sec-trades" className="space-y-6 font-mono">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2 bg-card border border-border p-4 rounded-xl shadow-xs">
          <Layers className="h-4 w-4 text-forest-600" />
          7, 8 & 9. Equity, Drawdown & Trade Execution Trajectory
        </h3>

        <EquityAnalyticsWorkspace
          equityPoints={[]} // Managed internally or derived via endpoints
          drawdownPoints={report.drawdown_summary.periods ? report.drawdown_summary.periods.map(p => ({
            timestamp: p.trough_timestamp,
            portfolio_value: p.trough_equity,
            running_peak: p.peak_equity,
            drawdown_amount: p.drawdown_amount,
            drawdown_percentage: p.drawdown_percentage
          })) : []}
          periods={report.drawdown_summary.periods}
          initialCapital={report.executive_summary.initial_capital}
        />
      </section>

      {/* SECTION 10: Portfolio Accounting Summary */}
      <section id="sec-accounting" className="bg-card border border-border rounded-xl p-5 font-mono space-y-3 shadow-xs">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
          <PieChart className="h-4 w-4 text-forest-600" />
          10. Portfolio Accounting & Cash Flow Summary
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1">
          <div>
            <span className="text-text-muted block text-[10px]">Initial Cash:</span>
            <span className="text-text-primary font-bold">{formatCurrency(report.accounting.initial_cash)}</span>
          </div>
          <div>
            <span className="text-text-muted block text-[10px]">Final Cash:</span>
            <span className="text-text-primary font-bold">{formatCurrency(report.accounting.final_cash)}</span>
          </div>
          <div>
            <span className="text-text-muted block text-[10px]">Final Position Value:</span>
            <span className="text-text-primary font-bold">{formatCurrency(report.accounting.final_position_value)}</span>
          </div>
          <div>
            <span className="text-text-muted block text-[10px]">Realized P&L:</span>
            <span className={`font-bold ${report.accounting.realized_pnl >= 0 ? 'text-forest-600' : 'text-rose-600'}`}>
              {formatCurrency(report.accounting.realized_pnl)}
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 11: Data Quality */}
      <section id="sec-quality" className="bg-card border border-border rounded-xl p-5 font-mono space-y-3 shadow-xs">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
          <CheckCircle2 className="h-4 w-4 text-forest-600" />
          11. Market Data Quality & Validation Audit
        </h3>

        <div className="text-xs space-y-2 text-text-secondary">
          <div className="flex justify-between py-1 border-b border-border/60">
            <span>Overall Status:</span>
            <span className="text-forest-700 font-bold">{report.data_quality.overall_status}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/60">
            <span>Validation Pipeline Status:</span>
            <span className="text-text-primary font-medium">{report.data_quality.validation_status}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/60">
            <span>Total Inspected Bars:</span>
            <span className="text-text-primary font-bold">{report.data_quality.observation_count} bars</span>
          </div>
        </div>
      </section>

      {/* SECTION 12 & 13: Methodology & Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
        <section id="sec-methodology" className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider border-b border-border pb-2">
            12. Research Methodology
          </h3>
          <ul className="text-xs text-text-secondary space-y-2 list-disc list-inside leading-relaxed font-sans">
            {report.methodology.map((m, idx) => (
              <li key={idx}>{m}</li>
            ))}
          </ul>
        </section>

        <section id="sec-limitations" className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider border-b border-border pb-2">
            13. Limitations & Disclaimers
          </h3>
          <ul className="text-xs text-text-secondary space-y-2 list-disc list-inside leading-relaxed font-sans">
            {report.limitations.map((l, idx) => (
              <li key={idx}>{l}</li>
            ))}
          </ul>
        </section>
      </div>

      {/* SECTION 14: Reproducibility & Fingerprint */}
      <section id="sec-repro" className="bg-card border border-border rounded-xl p-6 font-mono space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2">
            14. Experiment Reproducibility Specification
          </h3>
          <button
            onClick={handleCopyHash}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-forest-50 border border-forest-200 text-forest-700 hover:bg-forest-100 hover:text-forest-900 transition-colors font-medium shadow-xs"
          >
            {copiedHash ? <Check className="h-3.5 w-3.5 text-forest-700" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedHash ? 'Copied Hash' : 'Copy SHA-256 Hash'}
          </button>
        </div>

        <div className="bg-forest-50/40 border border-forest-100 p-4 rounded-xl text-xs space-y-2 text-text-secondary">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-text-muted font-semibold">Deterministic Configuration Hash:</span>
            <code className="text-forest-800 font-bold text-[11px] break-all bg-white px-2 py-0.5 rounded border border-forest-100">
              {report.reproducibility.configuration_hash}
            </code>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-forest-100 text-xs">
            <div>
              Backtest ID: <span className="text-text-primary font-medium">{report.reproducibility.backtest_id}</span>
            </div>
            <div>
              Strategy Config ID: <span className="text-text-primary font-medium">{report.reproducibility.strategy_configuration_id}</span>
            </div>
            <div>
              Instrument ID: <span className="text-text-primary font-medium">{report.reproducibility.instrument_id}</span>
            </div>
            <div>
              Provider & Frequency: <span className="text-text-primary font-medium">{report.reproducibility.provider} ({report.reproducibility.data_frequency})</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
