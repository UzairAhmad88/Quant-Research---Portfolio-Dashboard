import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { MetricCard } from '../components/data-display/MetricCard';
import { ChartContainer } from '../components/data-display/ChartContainer';
import { EmptyState } from '../components/feedback/EmptyState';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { TrendingUp } from 'lucide-react';

export const ReturnsPage: React.FC = () => {
  return (
    <PageContainer
      eyebrow="Quantitative Performance Analytics"
      title="Return Calculator"
      description="Compute logarithmic and simple return series, cumulative performance curves, annualized CAGR, and return distributions."
      action={<Badge variant="info">Scaffolded Module</Badge>}
    >
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Cumulative Return" value="—" isUnavailable subtitle="Awaiting market price series" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Annualized CAGR" value="—" isUnavailable subtitle="Logarithmic compounding engine" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Return Skewness" value="—" isUnavailable subtitle="Distribution asymmetry metric" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Excess Alpha" value="—" isUnavailable subtitle="Benchmark relative return" />
      </div>

      <div className="col-span-12 lg:col-span-8">
        <ChartContainer
          title="Cumulative Return & Wealth Index Curve"
          subtitle="Performance accumulation graph canvas ready for return calculations."
        />
      </div>

      <div className="col-span-12 lg:col-span-4">
        <Card title="Return Engine Specifications">
          <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
            Calculations performed in Python NumPy/Pandas layer with zero client-side extrapolation.
          </p>
          <div className="space-y-2 text-xs font-mono-num text-[#94A3B8]">
            <div className="flex justify-between p-2 rounded bg-[#111827] border border-[#263244]">
              <span>Simple Return</span>
              <span className="text-[#3B82F6]">R_t = (P_t - P_t-1)/P_t-1</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-[#111827] border border-[#263244]">
              <span>Log Return</span>
              <span className="text-[#3B82F6]">r_t = ln(P_t / P_t-1)</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="col-span-12">
        <Card title="Daily Return Records Table">
          <EmptyState
            title="No Return Computations Available"
            description="Return series will calculate dynamically once price history is ingested during the dedicated Return Calculator module phase."
            icon={TrendingUp}
          />
        </Card>
      </div>
    </PageContainer>
  );
};
