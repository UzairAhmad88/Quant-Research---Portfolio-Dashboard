import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { MetricCard } from '../components/data-display/MetricCard';
import { ChartContainer } from '../components/data-display/ChartContainer';
import { EmptyState } from '../components/feedback/EmptyState';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PieChart } from 'lucide-react';

export const PortfolioPage: React.FC = () => {
  return (
    <PageContainer
      eyebrow="Quantitative Portfolio Management"
      title="Portfolio Analytics"
      description="Multi-asset portfolio weight configuration, risk-adjusted returns (Sharpe, Sortino, Calmar), drawdown analysis, and rebalancing rules."
      action={<Badge variant="info">Scaffolded Module</Badge>}
    >
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Sharpe Ratio" value="—" isUnavailable subtitle="Risk-adjusted return ratio" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Sortino Ratio" value="—" isUnavailable subtitle="Downside risk-adjusted ratio" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Max Drawdown" value="—" isUnavailable subtitle="Peak-to-trough decline" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Rebalancing Trigger" value="—" isUnavailable subtitle="Target weight drift" />
      </div>

      <div className="col-span-12 lg:col-span-8">
        <ChartContainer
          title="Portfolio Drawdown & Underwater Peak-to-Trough Graph"
          subtitle="Underwater drawdown chart canvas ready for portfolio time-series data."
        />
      </div>

      <div className="col-span-12 lg:col-span-4">
        <Card title="Asset Allocation Weights Architecture">
          <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
            Supports custom asset weight vector normalization: sum(w_i) = 1.0 across Stocks, ETFs, Indices, and Crypto.
          </p>
        </Card>
      </div>

      <div className="col-span-12">
        <Card title="Portfolio Asset Holdings & Weights">
          <EmptyState
            title="No Portfolio Configurations Configured"
            description="Portfolio allocation analytics will activate during the dedicated Portfolio Calculator phase."
            icon={PieChart}
          />
        </Card>
      </div>
    </PageContainer>
  );
};
