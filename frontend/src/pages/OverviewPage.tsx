import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { NavLink } from 'react-router-dom';
import {
  Database,
  TrendingUp,
  PieChart,
  GitMerge,
  Activity,
  Sliders,
  PlayCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

const modulesList = [
  { name: 'Market Data Ingestion', step: 'Step 02', path: '/market-data', icon: Database, desc: 'OHLCV downloading, price history ingestion, instrument master database' },
  { name: 'Return Calculator', step: 'Step 03', path: '/returns', icon: TrendingUp, desc: 'Logarithmic & simple returns, cumulative performance, compounding analytics' },
  { name: 'Portfolio Analytics', step: 'Step 04', path: '/portfolio', icon: PieChart, desc: 'Weights, Sharpe ratio, Sortino ratio, drawdown analysis, rebalancing' },
  { name: 'Correlation Matrix', step: 'Step 05', path: '/correlation', icon: GitMerge, desc: 'Pairwise correlation, rolling correlation, heatmap distance matrix' },
  { name: 'Volatility Analytics', step: 'Step 06', path: '/volatility', icon: Activity, desc: 'Historical volatility, rolling standard deviation, GARCH & Value at Risk (VaR)' },
  { name: 'Quantitative Strategies', step: 'Step 07', path: '/strategies', icon: Sliders, desc: 'Moving averages, momentum signals, mean reversion, signal generator' },
  { name: 'Backtesting Engine', step: 'Step 08', path: '/backtesting', icon: PlayCircle, desc: 'Historical trade execution simulation, slippage, transaction cost model' },
];

export const OverviewPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Platform Overview Banner */}
      <Card
        title="Quant Research Dashboard — Project Foundation (Step 01)"
        subtitle="Institutional Quantitative Research & Portfolio Analysis Platform"
        action={<Badge variant="success">Step 01 Complete</Badge>}
      >
        <p className="text-xs text-[#94A3B8] leading-relaxed max-w-4xl">
          Welcome to the Quant Research Dashboard. Step 01 establishes the visual design system, dark institutional theme, decoupled application shell, TypeScript interfaces, FastAPI versioned backend router, and PostgreSQL database session management.
        </p>

        {/* Foundation Metrics Grid (System Capabilities) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-[#263244]">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono-num text-[#64748B] uppercase tracking-wider">Frontend Stack</span>
            <span className="text-xs font-mono-num text-[#E5E7EB] font-medium mt-0.5">React + TS + Vite</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono-num text-[#64748B] uppercase tracking-wider">Backend Stack</span>
            <span className="text-xs font-mono-num text-[#E5E7EB] font-medium mt-0.5">FastAPI + Python 3.11</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono-num text-[#64748B] uppercase tracking-wider">Database Engine</span>
            <span className="text-xs font-mono-num text-[#E5E7EB] font-medium mt-0.5">SQLAlchemy + PostgreSQL</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono-num text-[#64748B] uppercase tracking-wider">Theme Palette</span>
            <span className="text-xs font-mono-num text-[#3B82F6] font-medium mt-0.5">Institutional Dark</span>
          </div>
        </div>
      </Card>

      {/* Module Roadmap Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-[#E5E7EB] uppercase tracking-wider">
            Quantitative Research Roadmap
          </h2>
          <span className="text-[11px] font-mono-num text-[#94A3B8]">
            7 Core Modules Scheduled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modulesList.map((m) => {
            const Icon = m.icon;
            return (
              <NavLink
                key={m.path}
                to={m.path}
                className="bg-[#151F2E] border border-[#263244] rounded-md p-4 hover:border-[#3B82F6]/50 transition-colors group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded bg-[#111827] border border-[#263244] text-[#3B82F6]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <Badge variant="info">{m.step}</Badge>
                  </div>
                  <h3 className="text-xs font-semibold text-[#E5E7EB] group-hover:text-[#3B82F6] transition-colors">
                    {m.name}
                  </h3>
                  <p className="text-[11px] text-[#94A3B8] mt-1 line-clamp-2">
                    {m.desc}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-[#263244]/50 flex justify-between items-center text-[10px] font-mono-num text-[#64748B]">
                  <span>Status: Scaffolded</span>
                  <span className="text-[#3B82F6] group-hover:underline">View Spec &rarr;</span>
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Architectural Guarantees Card */}
      <Card title="System Architecture & Data Guarantees">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#94A3B8]">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#22C55E] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#E5E7EB] font-medium">Generic Instrument Model</strong>
              <p className="mt-0.5">Designed to natively support Stocks, ETFs, Indices, and Crypto assets without hardcoding stock-only logic.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#22C55E] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#E5E7EB] font-medium">No Fabricated Metrics</strong>
              <p className="mt-0.5">Zero mock financial metrics or fake charts. Calculations will activate dynamically as dedicated backend modules are built.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#3B82F6] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#E5E7EB] font-medium">Provider Abstraction Layer</strong>
              <p className="mt-0.5">Market data providers are isolated behind abstract base class contracts, preventing vendor lock-in.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#3B82F6] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#E5E7EB] font-medium">Type-Safe Boundary</strong>
              <p className="mt-0.5">Strict TypeScript types on client + Pydantic v2 validation models on FastAPI backend.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
