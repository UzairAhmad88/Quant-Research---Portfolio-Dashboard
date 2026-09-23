import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { MetricCard } from '../components/data-display/MetricCard';
import { ChartContainer } from '../components/data-display/ChartContainer';
import { DataTable, Column } from '../components/data-display/DataTable';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, ExternalLink } from 'lucide-react';

interface InstrumentDemo {
  symbol: string;
  name: string;
  assetClass: 'EQUITY' | 'ETF' | 'INDEX' | 'CRYPTO';
  exchange: string;
  status: string;
}

const demoInstruments: InstrumentDemo[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'EQUITY', exchange: 'NASDAQ', status: 'Active Master' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', assetClass: 'EQUITY', exchange: 'NASDAQ', status: 'Active Master' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', assetClass: 'ETF', exchange: 'NYSE Arca', status: 'Active Master' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', assetClass: 'ETF', exchange: 'NASDAQ', status: 'Active Master' },
  { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', assetClass: 'CRYPTO', exchange: 'Global Feed', status: 'Active Master' },
];

export const OverviewPage: React.FC = () => {
  const [tablePage, setTablePage] = useState(1);

  const columns: Column<InstrumentDemo>[] = [
    {
      key: 'symbol',
      header: 'Ticker',
      isMonospace: true,
      render: (row) => <span className="font-semibold text-[#3B82F6]">{row.symbol}</span>,
    },
    { key: 'name', header: 'Instrument Name' },
    {
      key: 'assetClass',
      header: 'Asset Class',
      isMonospace: true,
      render: (row) => (
        <Badge variant="info" className="text-[10px] py-0 px-1 border-[#3B82F6]/30">
          {row.assetClass}
        </Badge>
      ),
    },
    { key: 'exchange', header: 'Exchange', isMonospace: true },
    {
      key: 'status',
      header: 'Master Status',
      render: (row) => <Badge variant="success">{row.status}</Badge>,
    },
  ];

  return (
    <PageContainer
      eyebrow="Institutional Quantitative Workstation"
      title="Platform Overview"
      description="Monitor system health, design tokens, multi-asset instrument registry, and quantitative module development status."
      action={
        <Badge variant="success" className="text-xs px-2.5 py-1">
          Step 02 Shell Complete
        </Badge>
      }
    >
      {/* Top System Health Metric Cards (12-column grid spans) */}
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard
          label="Frontend Foundation"
          value="React 19 + TS"
          subtitle="Vite 6 + Tailwind CSS tokens"
          isDemo
        />
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard
          label="Backend Analytics API"
          value="FastAPI / Python"
          subtitle="Versioned API /api/v1 router"
          isDemo
        />
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard
          label="Database Session"
          value="PostgreSQL"
          subtitle="SQLAlchemy + Alembic migrations"
          isDemo
        />
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard
          label="Provider Abstraction"
          value="Decoupled Base"
          subtitle="Abstract MarketDataProvider contract"
          isDemo
        />
      </div>

      {/* Main Chart Container Placeholder (12 columns) */}
      <div className="col-span-12 lg:col-span-8">
        <ChartContainer
          title="Multi-Asset Performance Benchmark Canvas"
          subtitle="Generic chart wrapper prepared for Step 03+ historical return overlays."
        />
      </div>

      {/* Quick Access Roadmap Panel (4 columns) */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
        <Card title="Module Status & Roadmap" subtitle="Step-by-step engineering progression.">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2 rounded bg-[#111827] border border-[#263244] text-xs">
              <span className="font-medium text-[#E5E7EB]">Step 01 — Project Foundation</span>
              <Badge variant="success">Done</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#111827] border border-[#3B82F6]/50 text-xs">
              <span className="font-medium text-[#3B82F6]">Step 02 — Design System & Shell</span>
              <Badge variant="info">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#111827] border border-[#263244] text-xs text-[#94A3B8]">
              <span>Step 03 — Database & Instrument Master</span>
              <Badge variant="outline">Planned</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#111827] border border-[#263244] text-xs text-[#94A3B8]">
              <span>Step 04 — Market Data Downloader</span>
              <Badge variant="outline">Planned</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#111827] border border-[#263244] text-xs text-[#94A3B8]">
              <span>Step 05 — Return Analytics</span>
              <Badge variant="outline">Planned</Badge>
            </div>
          </div>
        </Card>

        <Card title="System Architectural Principles">
          <div className="space-y-2 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Generic Instrument (Stock, ETF, Index, Crypto)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>No fabricated financial data or fake metrics</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>Decoupled provider abstraction layer</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Master Instrument Registry Table (12 columns) */}
      <div className="col-span-12">
        <Card
          title="Instrument Master Architecture Preview"
          subtitle="Multi-asset ticker lookup structure supporting Equities, ETFs, Indices, and Crypto."
          action={
            <NavLink to="/market-data">
              <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                Go to Market Data
              </Button>
            </NavLink>
          }
        >
          <DataTable
            columns={columns}
            data={demoInstruments}
            keyExtractor={(row) => row.symbol}
            pageSize={5}
            currentPage={tablePage}
            totalItems={demoInstruments.length}
            onPageChange={setTablePage}
          />
        </Card>
      </div>
    </PageContainer>
  );
};
