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

export const PortfolioPage: React.FC = () => {
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<PortfolioAnalyticsResponse | null>(null);
  const [priceSource, setPriceSource] = useState<'adjusted' | 'close'>('adjusted');
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddHoldingModalOpen, setIsAddHoldingModalOpen] = useState(false);

  // Load portfolios on mount
  const loadPortfolios = async () => {
    try {
      setIsLoadingPortfolios(true);
      setErrorMsg(null);
      const list = await fetchPortfolios(true);
      setPortfolios(list);
      if (list.length > 0 && !selectedPortfolioId) {
        setSelectedPortfolioId(list[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load portfolios.');
    } finally {
      setIsLoadingPortfolios(false);
    }
  };

  useEffect(() => {
    loadPortfolios();
  }, []);

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
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-400 border border-blue-500/20">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Portfolio Calculator & Analytics</h1>
            <p className="text-xs text-slate-400">
              Institutional portfolio performance engine & position contribution workspace
            </p>
          </div>
        </div>

        {/* Portfolio Selector & Actions */}
        <div className="flex items-center space-x-3">
          {portfolios.length > 0 && (
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-4 w-4 text-slate-400" />
              <select
                value={selectedPortfolioId || ''}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
                className="rounded border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-blue-500 focus:outline-none"
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
            className="flex items-center space-x-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Portfolio</span>
          </button>

          {selectedPortfolio && (
            <button
              onClick={handleDeletePortfolio}
              title="Deactivate Portfolio"
              className="rounded border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:border-red-900/50 hover:bg-red-950/40 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={loadAnalytics}
            title="Refresh Analytics"
            className="rounded border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingAnalytics ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center space-x-2 rounded-lg border border-red-500/50 bg-red-950/40 p-4 text-sm text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quality Warnings Banner */}
      {analytics && analytics.quality_warnings.length > 0 && (
        <div className="flex items-start space-x-3 rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <strong className="font-semibold text-amber-200">Market Data Coverage Note:</strong>
            <ul className="mt-1 list-disc list-inside space-y-0.5 text-slate-300">
              {analytics.quality_warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* No Portfolio Selected State */}
      {(!selectedPortfolio || portfolios.length === 0) && !isLoadingPortfolios && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 p-12 text-center">
          <Briefcase className="h-12 w-12 text-slate-600 mb-3" />
          <h2 className="text-base font-semibold text-slate-300">No Portfolio Selected</h2>
          <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
            Create a portfolio to organize equity, ETF, index, and crypto holdings into a unified quantitative research model.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 rounded bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
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
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Initial Capital</span>
              <div className="mt-1 font-mono text-base font-bold text-slate-100">
                ${analytics.summary.initial_capital.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Invested Market Value</span>
              <div className="mt-1 font-mono text-base font-bold text-blue-400">
                ${analytics.summary.current_invested_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Uninvested Cash</span>
              <div className="mt-1 font-mono text-base font-bold text-slate-300">
                ${analytics.summary.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Current Total Value</span>
              <div className="mt-1 font-mono text-base font-bold text-slate-100">
                ${analytics.summary.current_portfolio_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Total P&L ($)</span>
              <div
                className={`mt-1 font-mono text-base font-bold ${
                  analytics.summary.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {analytics.summary.total_pnl >= 0 ? '+' : ''}
                ${analytics.summary.total_pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Total Return</span>
              <div
                className={`mt-1 font-mono text-base font-bold ${
                  analytics.summary.total_return >= 0 ? 'text-emerald-400' : 'text-red-400'
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
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4 bg-slate-900">
              <div className="flex items-center space-x-2">
                <Layers className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-200">Position Holdings & Contribution</h3>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-2xs font-mono text-slate-400">
                  {analytics.holdings.length} Active Positions
                </span>
              </div>

              <div className="flex items-center space-x-3">
                {/* Price Source Selector */}
                <div className="flex items-center space-x-1 text-xs">
                  <span className="text-slate-400">Price Source:</span>
                  <button
                    onClick={() => setPriceSource('adjusted')}
                    className={`rounded px-2 py-1 text-2xs font-semibold ${
                      priceSource === 'adjusted' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Adjusted Close
                  </button>
                  <button
                    onClick={() => setPriceSource('close')}
                    className={`rounded px-2 py-1 text-2xs font-semibold ${
                      priceSource === 'close' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Unadjusted Close
                  </button>
                </div>

                <button
                  onClick={() => setIsAddHoldingModalOpen(true)}
                  className="flex items-center space-x-1.5 rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Holding</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-2xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
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
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                  {analytics.holdings.map((h) => (
                    <tr key={h.holding_id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-semibold text-slate-100">
                        <div>{h.symbol}</div>
                        <div className="text-2xs font-sans text-slate-500 font-normal">{h.name}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-2xs uppercase text-slate-300 font-sans">
                          {h.asset_type}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">{h.quantity.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right">${h.entry_price.toFixed(2)}</td>
                      <td className="px-3 py-3 text-right font-bold text-slate-200">${h.current_price.toFixed(2)}</td>
                      <td className="px-3 py-3 text-right font-bold text-blue-400">
                        ${h.current_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-200">
                        {h.total_weight.toFixed(2)}%
                      </td>
                      <td className="px-3 py-3 text-right text-slate-400">
                        {h.target_weight !== null && h.target_weight !== undefined ? `${h.target_weight}%` : '—'}
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-semibold ${
                          h.pnl_amount >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {h.pnl_amount >= 0 ? '+' : ''}${h.pnl_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-semibold ${
                          h.pnl_percent >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {h.pnl_percent >= 0 ? '+' : ''}{h.pnl_percent.toFixed(2)}%
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-semibold ${
                          h.contribution_percent >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {h.contribution_percent >= 0 ? '+' : ''}{h.contribution_percent.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRemoveHolding(h.holding_id, h.symbol)}
                          title="Remove holding"
                          className="rounded p-1 text-slate-500 hover:bg-red-950/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Cash Position Row */}
                  <tr className="bg-slate-950/40 font-mono text-slate-400">
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      <div>CASH</div>
                      <div className="text-2xs font-sans text-slate-500">Uninvested Capital</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded bg-slate-800/80 px-2 py-0.5 text-2xs uppercase text-slate-400 font-sans">
                        CASH
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">—</td>
                    <td className="px-3 py-3 text-right">$1.00</td>
                    <td className="px-3 py-3 text-right">$1.00</td>
                    <td className="px-3 py-3 text-right font-bold text-slate-300">
                      ${analytics.summary.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-300">
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
