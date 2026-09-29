import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  Briefcase,
  Layers,
} from 'lucide-react';
import {
  fetchPortfolios,
  fetchPortfolioAnalytics,
  deletePortfolio,
  deletePortfolioHolding,
  PortfolioItem,
  PortfolioAnalyticsResponse,
} from '../lib/apiClient';
import { PortfolioAllocationChart } from '../components/portfolio/PortfolioAllocationChart';
import { PortfolioPerformanceChart } from '../components/portfolio/PortfolioPerformanceChart';
import { CreatePortfolioModal } from '../components/portfolio/CreatePortfolioModal';
import { AddHoldingModal } from '../components/portfolio/AddHoldingModal';

import { useResearchContext } from '../hooks/useResearchContext';
import { ResearchContextBar } from '../components/navigation/ResearchContextBar';
import { Breadcrumbs } from '../components/navigation/Breadcrumbs';
import { ExportMenu } from '../components/common/ExportMenu';
import { MetricInfoTooltip } from '../components/common/MetricInfoTooltip';
import { getPortfolioExportUrl } from '../services/exportService';

export const PortfolioPage: React.FC = () => {
  const { context } = useResearchContext();

  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(context.portfolioId || null);
  const [analytics, setAnalytics] = useState<PortfolioAnalyticsResponse | null>(null);
  const [priceSource, setPriceSource] = useState<'adjusted' | 'close'>(context.priceSource || 'adjusted');
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddHoldingModalOpen, setIsAddHoldingModalOpen] = useState(false);

  // Load portfolios on mount & sync context
  const loadPortfolios = async () => {
    try {
      setIsLoadingPortfolios(true);
      setErrorMsg(null);
      const list = await fetchPortfolios(true);
      setPortfolios(list);
      if (list.length > 0) {
        const matched = context.portfolioId ? list.find((p) => p.id === context.portfolioId) : undefined;
        setSelectedPortfolioId(matched ? matched.id : list[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load portfolios.');
    } finally {
      setIsLoadingPortfolios(false);
    }
  };

  useEffect(() => {
    loadPortfolios();
  }, [context.portfolioId]);

  // Load analytics when selected portfolio changes
  const loadAnalytics = async () => {
    if (!selectedPortfolioId) {
      setAnalytics(null);
      return;
    }

    try {
      setIsLoadingAnalytics(true);
      setErrorMsg(null);
      const res = await fetchPortfolioAnalytics({
        portfolio_id: selectedPortfolioId,
        price_source: priceSource,
      });
      setAnalytics(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to calculate portfolio analytics.');
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedPortfolioId, priceSource]);

  const selectedPortfolio = portfolios.find((p) => p.id === selectedPortfolioId);

  const handleDeletePortfolio = async () => {
    if (!selectedPortfolioId || !selectedPortfolio) return;
    if (!window.confirm(`Deactivate portfolio "${selectedPortfolio.name}"?`)) return;

    try {
      await deletePortfolio(selectedPortfolioId);
      const remaining = portfolios.filter((p) => p.id !== selectedPortfolioId);
      setPortfolios(remaining);
      setSelectedPortfolioId(remaining.length > 0 ? remaining[0].id : null);
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate portfolio.');
    }
  };

  const handleRemoveHolding = async (holdingId: string, symbol: string) => {
    if (!selectedPortfolioId) return;
    if (!window.confirm(`Remove position "${symbol}" from portfolio?`)) return;

    try {
      await deletePortfolioHolding(selectedPortfolioId, holdingId);
      loadAnalytics();
      loadPortfolios();
    } catch (err: any) {
      alert(err.message || 'Failed to remove holding.');
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Portfolio' }, { label: analytics?.name || 'Analytics' }]} />
      <ResearchContextBar showInstrumentSelect={false} showRangeSelect={false} />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-5 shadow-card">
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-800 border border-emerald-200">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">Portfolio Calculator & Analytics</h1>
            <p className="text-xs text-text-muted">
              Institutional portfolio performance engine & position contribution workspace
            </p>
          </div>
        </div>

        {/* Portfolio Selector & Actions */}
        <div className="flex items-center space-x-3">
          {portfolios.length > 0 && (
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-4 w-4 text-text-muted" />
              <select
                value={selectedPortfolioId || ''}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.base_currency})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-1.5 rounded-md bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white shadow-button hover:bg-brand-deep transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Portfolio</span>
          </button>

          {selectedPortfolio && (
            <ExportMenu
              disabled={!analytics}
              options={[
                {
                  id: 'portfolio-holdings-csv',
                  label: 'Holdings Breakdown CSV',
                  format: 'csv',
                  url: getPortfolioExportUrl({
                    portfolioId: selectedPortfolio.id,
                    dataType: 'holdings',
                    format: 'csv',
                    priceSource,
                  }),
                  description: 'Positions, weights, current values, and P&L',
                },
                {
                  id: 'portfolio-summary-csv',
                  label: 'Portfolio Summary CSV',
                  format: 'csv',
                  url: getPortfolioExportUrl({
                    portfolioId: selectedPortfolio.id,
                    dataType: 'summary',
                    format: 'csv',
                    priceSource,
                  }),
                  description: 'Total value, returns, and risk metrics',
                },
                {
                  id: 'portfolio-performance-csv',
                  label: 'Performance Curve CSV',
                  format: 'csv',
                  url: getPortfolioExportUrl({
                    portfolioId: selectedPortfolio.id,
                    dataType: 'performance',
                    format: 'csv',
                    priceSource,
                  }),
                  description: 'Historical equity time series observations',
                },
                {
                  id: 'portfolio-json',
                  label: 'Full Portfolio JSON',
                  format: 'json',
                  url: getPortfolioExportUrl({
                    portfolioId: selectedPortfolio.id,
                    format: 'json',
                    priceSource,
                  }),
                  description: 'Complete analytics payload with allocations',
                },
              ]}
            />
          )}

          {selectedPortfolio && (
            <button
              onClick={handleDeletePortfolio}
              title="Deactivate Portfolio"
              className="rounded-md border border-border bg-card p-2 text-text-muted hover:border-red-200 hover:bg-red-50 hover:text-financial-negative transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={loadAnalytics}
            title="Refresh Analytics"
            className="rounded-md border border-border bg-card p-2 text-text-muted hover:bg-surface hover:text-text-primary transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingAnalytics ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center space-x-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-financial-negative">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quality Warnings Banner */}
      {analytics && analytics.quality_warnings.length > 0 && (
        <div className="flex items-start space-x-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <strong className="font-semibold text-amber-900">Market Data Coverage Note:</strong>
            <ul className="mt-1 list-disc list-inside space-y-0.5 text-amber-800">
              {analytics.quality_warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* No Portfolio Selected State */}
      {(!selectedPortfolio || portfolios.length === 0) && !isLoadingPortfolios && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center shadow-card">
          <Briefcase className="h-12 w-12 text-text-muted mb-3" />
          <h2 className="text-base font-semibold text-text-primary">No Portfolio Selected</h2>
          <p className="text-xs text-text-muted max-w-md mt-1 mb-4">
            Create a portfolio to organize equity, ETF, index, and crypto holdings into a unified quantitative research model.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 rounded-md bg-brand-primary px-4 py-2 text-xs font-semibold text-white shadow-button hover:bg-brand-deep"
          >
            <Plus className="h-4 w-4" />
            <span>Create Your First Portfolio</span>
          </button>
        </div>
      )}

      {/* Analytics Workspace Content */}
      {analytics && (
        <div className="space-y-6">
          {/* Summary Metric Cards Bar */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
            <div className="rounded-lg border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-text-muted">
                <span>Initial Capital</span>
                <MetricInfoTooltip
                  title="Portfolio Initial Capital"
                  description="Initial cash allocated at portfolio genesis for holding acquisition and reserve maintenance."
                  formula="Capital_0 = Cash_0 + Sum(Qty_i × Price_i,0)"
                />
              </div>
              <div className="mt-1 font-mono text-base font-bold text-text-primary">
                ${analytics.summary.initial_capital.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-text-muted">
                <span>Invested Value</span>
                <MetricInfoTooltip
                  title="Invested Market Value"
                  description="Current aggregated market valuation of all active portfolio asset positions."
                  formula="V_invested = Sum_{i} (Quantity_i × LatestPrice_i)"
                />
              </div>
              <div className="mt-1 font-mono text-base font-bold text-brand-primary">
                ${analytics.summary.current_invested_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-text-muted">
                <span>Uninvested Cash</span>
                <MetricInfoTooltip
                  title="Uninvested Cash Balance"
                  description="Liquid unallocated capital held in portfolio base currency."
                  formula="Cash_t = Capital_0 - InitialCost + RealizedPnL - Fees"
                />
              </div>
              <div className="mt-1 font-mono text-base font-bold text-text-secondary">
                ${analytics.summary.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-text-muted">
                <span>Total Value</span>
                <MetricInfoTooltip
                  title="Current Total Portfolio Value (NAV)"
                  description="Gross portfolio equity invariant (Cash + Invested Market Value)."
                  formula="NAV_t = Cash_t + V_invested,t"
                />
              </div>
              <div className="mt-1 font-mono text-base font-bold text-text-primary">
                ${analytics.summary.current_portfolio_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-text-muted">
                <span>Total P&L ($)</span>
                <MetricInfoTooltip
                  title="Total Dollar Profit & Loss"
                  description="Net monetary gain or loss realized and unrealized relative to initial capital."
                  formula="Total P&L = NAV_t - InitialCapital"
                />
              </div>
              <div
                className={`mt-1 font-mono text-base font-bold ${
                  analytics.summary.total_pnl >= 0 ? 'text-financial-positive' : 'text-financial-negative'
                }`}
              >
                {analytics.summary.total_pnl >= 0 ? '+' : ''}
                ${analytics.summary.total_pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-text-muted">
                <span>Total Return</span>
                <MetricInfoTooltip
                  title="Total Percentage Return"
                  description="Cumulative fractional rate of return across the entire portfolio holding period."
                  formula="R_total = (NAV_t - InitialCapital) / InitialCapital"
                />
              </div>
              <div
                className={`mt-1 font-mono text-base font-bold ${
                  analytics.summary.total_return >= 0 ? 'text-financial-positive' : 'text-financial-negative'
                }`}
              >
                {analytics.summary.total_return >= 0 ? '+' : ''}
                {(analytics.summary.total_return * 100).toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <PortfolioPerformanceChart performanceSeries={analytics.performance_series} height={340} />
            </div>
            <div className="lg:col-span-5">
              <PortfolioAllocationChart items={analytics.allocation} />
            </div>
          </div>

          {/* Holdings & Contribution Table */}
          <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 bg-surface">
              <div className="flex items-center space-x-2">
                <Layers className="h-4 w-4 text-brand-primary" />
                <h3 className="text-sm font-semibold text-text-primary">Position Holdings & Contribution</h3>
                <span className="rounded bg-surface-elevated px-2 py-0.5 text-2xs font-mono text-text-secondary border border-border">
                  {analytics.holdings.length} Active Positions
                </span>
              </div>

              <div className="flex items-center space-x-3">
                {/* Price Source Selector */}
                <div className="flex items-center space-x-1 text-xs">
                  <span className="text-text-muted">Price Source:</span>
                  <button
                    onClick={() => setPriceSource('adjusted')}
                    className={`rounded px-2 py-1 text-2xs font-semibold transition-colors ${
                      priceSource === 'adjusted' ? 'bg-brand-primary text-white shadow-xs' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Adjusted Close
                  </button>
                  <button
                    onClick={() => setPriceSource('close')}
                    className={`rounded px-2 py-1 text-2xs font-semibold transition-colors ${
                      priceSource === 'close' ? 'bg-brand-primary text-white shadow-xs' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Unadjusted Close
                  </button>
                </div>

                <button
                  onClick={() => setIsAddHoldingModalOpen(true)}
                  className="flex items-center space-x-1.5 rounded-md bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white shadow-button hover:bg-brand-deep transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Holding</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface text-2xs uppercase tracking-wider text-text-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Instrument</th>
                    <th className="px-3 py-3">Asset Type</th>
                    <th className="px-3 py-3 text-right">Quantity</th>
                    <th className="px-3 py-3 text-right">Entry Price</th>
                    <th className="px-3 py-3 text-right">Current Price</th>
                    <th className="px-3 py-3 text-right">Current Value</th>
                    <th className="px-3 py-3 text-right">Weight</th>
                    <th className="px-3 py-3 text-right">Target Weight</th>
                    <th className="px-3 py-3 text-right">P&L ($)</th>
                    <th className="px-3 py-3 text-right">P&L (%)</th>
                    <th className="px-3 py-3 text-right">Contribution</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-text-secondary font-mono">
                  {analytics.holdings.map((h) => (
                    <tr key={h.holding_id} className="hover:bg-surface/60 transition-colors">
                      <td className="px-4 py-3 font-semibold text-text-primary">
                        <div>{h.symbol}</div>
                        <div className="text-2xs font-sans text-text-muted font-normal">{h.name}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded bg-surface-elevated px-2 py-0.5 text-2xs uppercase text-text-secondary font-sans border border-border">
                          {h.asset_type}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-text-primary">{h.quantity.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right">${h.entry_price.toFixed(2)}</td>
                      <td className="px-3 py-3 text-right font-bold text-text-primary">${h.current_price.toFixed(2)}</td>
                      <td className="px-3 py-3 text-right font-bold text-brand-primary">
                        ${h.current_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-text-primary">
                        {h.total_weight.toFixed(2)}%
                      </td>
                      <td className="px-3 py-3 text-right text-text-muted">
                        {h.target_weight !== null && h.target_weight !== undefined ? `${h.target_weight}%` : '—'}
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-semibold ${
                          h.pnl_amount >= 0 ? 'text-financial-positive' : 'text-financial-negative'
                        }`}
                      >
                        {h.pnl_amount >= 0 ? '+' : ''}${h.pnl_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-semibold ${
                          h.pnl_percent >= 0 ? 'text-financial-positive' : 'text-financial-negative'
                        }`}
                      >
                        {h.pnl_percent >= 0 ? '+' : ''}{h.pnl_percent.toFixed(2)}%
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-semibold ${
                          h.contribution_percent >= 0 ? 'text-financial-positive' : 'text-financial-negative'
                        }`}
                      >
                        {h.contribution_percent >= 0 ? '+' : ''}{h.contribution_percent.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRemoveHolding(h.holding_id, h.symbol)}
                          title="Remove holding"
                          className="rounded p-1 text-text-muted hover:bg-red-50 hover:text-financial-negative transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Cash Position Row */}
                  <tr className="bg-surface/40 font-mono text-text-muted">
                    <td className="px-4 py-3 font-semibold text-text-primary">
                      <div>CASH</div>
                      <div className="text-2xs font-sans text-text-muted">Uninvested Capital</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded bg-surface-elevated px-2 py-0.5 text-2xs uppercase text-text-secondary font-sans border border-border">
                        CASH
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">—</td>
                    <td className="px-3 py-3 text-right">$1.00</td>
                    <td className="px-3 py-3 text-right">$1.00</td>
                    <td className="px-3 py-3 text-right font-bold text-text-primary">
                      ${analytics.summary.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-text-primary">
                      {((analytics.summary.cash / analytics.summary.current_portfolio_value) * 100).toFixed(2)}%
                    </td>
                    <td className="px-3 py-3 text-right">—</td>
                    <td className="px-3 py-3 text-right">$0.00</td>
                    <td className="px-3 py-3 text-right">0.00%</td>
                    <td className="px-3 py-3 text-right">0.00%</td>
                    <td className="px-4 py-3 text-center">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreatePortfolioModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newPort) => {
          loadPortfolios();
          setSelectedPortfolioId(newPort.id);
        }}
      />

      {selectedPortfolioId && (
        <AddHoldingModal
          portfolioId={selectedPortfolioId}
          isOpen={isAddHoldingModalOpen}
          remainingCash={analytics ? analytics.summary.cash : selectedPortfolio?.initial_capital || 0}
          onClose={() => setIsAddHoldingModalOpen(false)}
          onSuccess={() => {
            loadAnalytics();
            loadPortfolios();
          }}
        />
      )}
    </div>
  );
};
