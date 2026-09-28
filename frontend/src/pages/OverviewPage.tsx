import React, { useState } from 'react';
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

export const OverviewPage: React.FC = () => {
  const { refetch, isFetching } = useDashboardOverview();
  const [activeSymbol, setActiveSymbol] = useState<string>('AAPL');

  const handleSelectSymbol = (symbol: string) => {
    setActiveSymbol(symbol);
  };


  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-6">
      {/* 1. Institutional Header with Title, Live UTC clock, Range Selector, and Quick Actions */}
      <DashboardHeaderInstitutional
        onRefresh={() => refetch()}
        isFetching={isFetching}
      />


      {/* 2. 6-Column Interactive KPI Bar with Real-time readouts & Click-through Navigation */}
      <DashboardKPIBar onSelectInstrument={handleSelectSymbol} />

      {/* 3. Dynamic Main Chart (8 cols) & Real-time Status / Research Widgets (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Interactive Multi-Symbol Candlestick Chart with Moving Averages & Crosshair */}
        <div className="lg:col-span-8">
          <DashboardMainChart
            selectedSymbol={activeSymbol}
            onSelectSymbol={handleSelectSymbol}
          />
        </div>

        {/* Right: Live Market Data Status & One-Click Research Launchers */}
        <div className="lg:col-span-4 flex flex-col gap-4 justify-between">
          <MarketDataStatusWidget
            activeSymbol={activeSymbol}
            onDataSync={() => refetch()}
          />
          <RecentResearchWidget />
        </div>
      </div>

      {/* 4. Portfolio Allocation Donut (6 cols) & Performance vs Benchmark (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6">
          <PortfolioAllocationWidget onSelectInstrument={handleSelectSymbol} />
        </div>

        <div className="lg:col-span-6">
          <PerformanceBenchmarkWidget />
        </div>
      </div>

      {/* 5. Top Tracked Instruments Table (6 cols) & Recent Backtests Engine Table (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6">
          <TopInstrumentsTable
            activeSymbol={activeSymbol}
            onSelectInstrument={handleSelectSymbol}
          />
        </div>

        <div className="lg:col-span-6">
          <RecentBacktestsTable />
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
