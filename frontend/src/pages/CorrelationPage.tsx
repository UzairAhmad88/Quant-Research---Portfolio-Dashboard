import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { MetricCard } from '../components/data-display/MetricCard';
import { ChartContainer } from '../components/data-display/ChartContainer';
import { EmptyState } from '../components/feedback/EmptyState';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { GitMerge } from 'lucide-react';

export const CorrelationPage: React.FC = () => {
  return (
    <PageContainer
      eyebrow="Cross-Asset Risk Analytics"
      title="Correlation Matrix"
      description="Pairwise Pearson correlation matrices, rolling correlation windows, covariance matrices, and distance heatmaps across instruments."
      action={<Badge variant="info">Scaffolded Module</Badge>}
    >
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Average Pairwise Corr" value="—" isUnavailable subtitle="Mean cross-asset correlation" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Max Asset Diversification" value="—" isUnavailable subtitle="Eigenvalue dispersion" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Rolling Window" value="90 Days" isDemo subtitle="Configurable correlation window" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Covariance Matrix" value="Prepared" isDemo subtitle="NumPy matrix computation" />
      </div>

      <div className="col-span-12 lg:col-span-8">
        <ChartContainer
          title="Rolling Pairwise Correlation Canvas"
          subtitle="Time-series correlation graph canvas ready for cross-asset analysis."
        />
      </div>

      <div className="col-span-12 lg:col-span-4">
        <Card title="Correlation Matrix Heatmap Concept">
          <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
            Heatmap distance grid will render color-coded Pearson (-1.0 to +1.0) values upon data selection.
          </p>
        </Card>
      </div>

      <div className="col-span-12">
        <Card title="Pairwise Correlation Matrix Table">
          <EmptyState
            title="No Instrument Pair Selected"
            description="Correlation calculations will execute when instrument pairs are selected in the Analytics phase."
            icon={GitMerge}
          />
        </Card>
      </div>
    </PageContainer>
  );
};
