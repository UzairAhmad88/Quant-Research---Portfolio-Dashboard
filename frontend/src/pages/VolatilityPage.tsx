import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { MetricCard } from '../components/data-display/MetricCard';
import { ChartContainer } from '../components/data-display/ChartContainer';
import { EmptyState } from '../components/feedback/EmptyState';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Activity } from 'lucide-react';

export const VolatilityPage: React.FC = () => {
  return (
    <PageContainer
      eyebrow="Risk & Volatility Engine"
      title="Volatility Analytics"
      description="Historical volatility, rolling standard deviations, Parkinson & Garman-Klass volatility, Value at Risk (VaR), and Conditional VaR (Expected Shortfall)."
      action={<Badge variant="info">Scaffolded Module</Badge>}
    >
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Annualized Volatility" value="—" isUnavailable subtitle="Standard deviation (365d)" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Value at Risk (VaR 95%)" value="—" isUnavailable subtitle="1-Day Historical VaR" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Expected Shortfall (CVaR)" value="—" isUnavailable subtitle="Conditional tail risk" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Parkinson Estimator" value="—" isUnavailable subtitle="High-low range volatility" />
      </div>

      <div className="col-span-12 lg:col-span-8">
        <ChartContainer
          title="Rolling Volatility & Regimes Graph"
          subtitle="Rolling volatility time-series canvas ready for risk computation."
        />
      </div>

      <div className="col-span-12 lg:col-span-4">
        <Card title="Volatility Models Architecture">
          <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
            Supports parametric, historical simulation, and GARCH volatility estimation engines.
          </p>
        </Card>
      </div>

      <div className="col-span-12">
        <Card title="Volatility Breakdown Records">
          <EmptyState
            title="No Volatility Series Calculated"
            description="Volatility metrics will compute dynamically during the Volatility Analyzer step."
            icon={Activity}
          />
        </Card>
      </div>
    </PageContainer>
  );
};
