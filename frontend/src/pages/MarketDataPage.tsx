import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { MetricCard } from '../components/data-display/MetricCard';
import { ChartContainer } from '../components/data-display/ChartContainer';
import { EmptyState } from '../components/feedback/EmptyState';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Database } from 'lucide-react';

export const MarketDataPage: React.FC = () => {
  return (
    <PageContainer
      eyebrow="Data Architecture & Ingestion"
      title="Market Data Ingestion Engine"
      description="Download OHLCV bar series, resample time-frames, and manage instrument master metadata across Equities, ETFs, Indices, and Crypto."
      action={
        <Badge variant="info" className="text-xs px-2.5 py-1">
          Scaffolded Module
        </Badge>
      }
    >
      {/* Metric Cards (12 columns) */}
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Active Data Provider" value="Abstract Base" subtitle="Unconnected in Step 02" isUnavailable />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Total Ingested Bars" value="0" subtitle="PostgreSQL series empty" isUnavailable />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Supported Timeframes" value="1m / 1h / 1d" subtitle="Resampling pipeline ready" isDemo />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Instrument Master" value="Multi-Asset" subtitle="Equities, ETFs, Crypto" isDemo />
      </div>

      {/* Main Chart Container */}
      <div className="col-span-12 lg:col-span-8">
        <ChartContainer
          title="OHLCV Historical Price Series Chart"
          subtitle="Price history canvas will activate when provider ingestion connects in Market Data step."
        />
      </div>

      {/* Side Module Info Panel */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
        <Card title="Provider Interface Architecture">
          <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
            Market data providers (Yahoo Finance, Polygon, Alpaca, Binance) connect via abstract interface contracts in <code className="text-[#3B82F6] font-mono-num">app/providers/base.py</code>.
          </p>
          <div className="space-y-2 text-xs font-mono-num text-[#94A3B8]">
            <div className="flex items-center justify-between p-2 rounded bg-[#111827] border border-[#263244]">
              <span>get_instrument()</span>
              <span className="text-[#3B82F6]">Abstract Contract</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#111827] border border-[#263244]">
              <span>get_historical_bars()</span>
              <span className="text-[#3B82F6]">Abstract Contract</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#111827] border border-[#263244]">
              <span>check_health()</span>
              <span className="text-[#3B82F6]">Abstract Contract</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Empty State Ingestion Table Placeholder */}
      <div className="col-span-12">
        <Card title="Ingested Bar Records Table">
          <EmptyState
            title="No Historical Bars Ingested"
            description="Market data ingestion pipeline will activate during dedicated market data phase. No financial price bars are simulated or fabricated."
            icon={Database}
          />
        </Card>
      </div>
    </PageContainer>
  );
};
