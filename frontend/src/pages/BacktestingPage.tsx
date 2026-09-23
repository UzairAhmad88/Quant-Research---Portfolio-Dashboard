import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { MetricCard } from '../components/data-display/MetricCard';
import { ChartContainer } from '../components/data-display/ChartContainer';
import { EmptyState } from '../components/feedback/EmptyState';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PlayCircle } from 'lucide-react';

export const BacktestingPage: React.FC = () => {
  return (
    <PageContainer
      eyebrow="Historical Simulation Engine"
      title="Backtesting Engine"
      description="Simulate historical trade execution of quantitative strategies, accounting for transaction costs, bid-ask spread, slippage, trade logs, and equity curve generation."
      action={<Badge variant="info">Scaffolded Module</Badge>}
    >
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Simulated Total Return" value="—" isUnavailable subtitle="Equity curve total gain" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Win Rate" value="—" isUnavailable subtitle="Profitable trades percentage" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Profit Factor" value="—" isUnavailable subtitle="Gross profit / Gross loss" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Slippage Model" value="5 bps" isDemo subtitle="Configurable market impact" />
      </div>

      <div className="col-span-12 lg:col-span-8">
        <ChartContainer
          title="Backtest Strategy Equity Curve vs Benchmark"
          subtitle="Strategy simulation graph canvas ready for backtesting run."
        />
      </div>

      <div className="col-span-12 lg:col-span-4">
        <Card title="Execution Simulator Architecture">
          <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
            Supports event-driven execution simulation with realistic commission structures and bid-ask spread modeling.
          </p>
        </Card>
      </div>

      <div className="col-span-12">
        <Card title="Executed Trade Log Records">
          <EmptyState
            title="No Backtest Simulations Executed"
            description="Backtesting trade logs and equity curves will run in Step 08 during Backtesting Engine implementation."
            icon={PlayCircle}
          />
        </Card>
      </div>
    </PageContainer>
  );
};
