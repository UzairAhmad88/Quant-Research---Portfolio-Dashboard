import React from 'react';
import { MetricCard } from '../data-display/MetricCard';
import { DashboardSummary } from '../../types/dashboard';

interface ResearchSnapshotCardsProps {
  summary?: DashboardSummary;
  isLoading?: boolean;
}

export const ResearchSnapshotCards: React.FC<ResearchSnapshotCardsProps> = ({
  summary,
  isLoading,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Tracked Instruments"
        value={isLoading ? '...' : (summary?.tracked_instruments_count ?? 0)}
        subtitle="Active tickers in registry"
      />
      <MetricCard
        label="Active Portfolios"
        value={isLoading ? '...' : (summary?.portfolios_count ?? 0)}
        subtitle="Constructed multi-asset portfolios"
      />
      <MetricCard
        label="Strategy Configurations"
        value={isLoading ? '...' : (summary?.strategy_configurations_count ?? 0)}
        subtitle="Calibrated research engines"
      />
      <MetricCard
        label="Completed Backtests"
        value={isLoading ? '...' : (summary?.completed_backtests_count ?? 0)}
        subtitle="Historical quantitative simulations"
      />
    </div>
  );
};
