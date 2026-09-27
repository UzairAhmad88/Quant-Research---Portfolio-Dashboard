import React from 'react';
import { DashboardHeaderInstitutional } from '../components/dashboard/DashboardHeaderInstitutional';
import { DashboardKPIBar } from '../components/dashboard/DashboardKPIBar';
import { DashboardMainChart } from '../components/dashboard/DashboardMainChart';
import { MarketDataStatusWidget } from '../components/dashboard/MarketDataStatusWidget';
import { RecentResearchWidget } from '../components/dashboard/RecentResearchWidget';
import { PortfolioAllocationWidget } from '../components/dashboard/PortfolioAllocationWidget';
import { PerformanceBenchmarkWidget } from '../components/dashboard/PerformanceBenchmarkWidget';
import { TopInstrumentsTable } from '../components/dashboard/TopInstrumentsTable';
import { RecentBacktestsTable } from '../components/dashboard/RecentBacktestsTable';
import { useDashboardOverview } from '../hooks/useDashboard';
import { AlertCircle } from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const { isError, error, refetch, isFetching } = useDashboardOverview();

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-6">
      {/* 1. Header with Title, Live UTC clock, and 1D-MAX Range Selectors */}
      <DashboardHeaderInstitutional onRefresh={() => refetch()} isFetching={isFetching} />

      {/* API Error Notification (if any) */}
      {isError && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-red-300 text-xs flex items-center gap-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <div>
            <div className="font-semibold">Live Backend Notice</div>
            <div className="text-[11px] text-red-300/80 mt-0.5">
              {(error as Error)?.message || 'Using cached and baseline quant research snapshots.'}
            </div>
          </div>
        </div>
      )}

      {/* 2. 6-Column KPI Metric Cards Bar with Glowing Area Sparklines */}
      <DashboardKPIBar />

      {/* 3. Main Chart (8 cols) & Right Status Panels (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: AAPL Candlestick Price Chart with SMA 50/200 and Volume */}
        <div className="lg:col-span-8">
          <DashboardMainChart />
        </div>

        {/* Right: Market Data Status & Recent Research Cards */}
        <div className="lg:col-span-4 flex flex-col gap-4 justify-between">
          <MarketDataStatusWidget />
          <RecentResearchWidget />
        </div>
      </div>

      {/* 4. Portfolio Allocation (6 cols) & Performance vs Benchmark (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6">
          <PortfolioAllocationWidget />
        </div>

        <div className="lg:col-span-6">
          <PerformanceBenchmarkWidget />
        </div>
      </div>

      {/* 5. Top Instruments Table (6 cols) & Recent Backtests Table (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6">
          <TopInstrumentsTable />
        </div>

        <div className="lg:col-span-6">
          <RecentBacktestsTable />
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
