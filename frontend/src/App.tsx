import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GlobalErrorBoundary, ModuleErrorBoundary } from './components/feedback/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import { OverviewPage } from './pages/OverviewPage';

// Route-level code splitting for independent major analytical modules
const MarketDataPage = React.lazy(() =>
  import('./pages/MarketDataPage').then((m) => ({ default: m.MarketDataPage }))
);
const ReturnsPage = React.lazy(() =>
  import('./pages/ReturnsPage').then((m) => ({ default: m.ReturnsPage }))
);
const PortfolioPage = React.lazy(() =>
  import('./pages/PortfolioPage').then((m) => ({ default: m.PortfolioPage }))
);
const CorrelationPage = React.lazy(() =>
  import('./pages/CorrelationPage').then((m) => ({ default: m.CorrelationPage }))
);
const VolatilityPage = React.lazy(() =>
  import('./pages/VolatilityPage').then((m) => ({ default: m.VolatilityPage }))
);
const StrategiesPage = React.lazy(() =>
  import('./pages/StrategiesPage').then((m) => ({ default: m.StrategiesPage }))
);
const BacktestingPage = React.lazy(() =>
  import('./pages/BacktestingPage').then((m) => ({ default: m.BacktestingPage }))
);
const SettingsPage = React.lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const NotFoundPage = React.lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

const RouteLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px] text-xs font-mono text-[#64748B]">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
      <span>Loading Module...</span>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Controlled retry policy: Never retry client-side 4xx errors (validation, not found, insufficient data)
        const status = error?.status || error?.response?.status;
        if (status && status >= 400 && status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes default freshness
      gcTime: 30 * 60 * 1000,    // 30 minutes garbage collection lifecycle
    },
  },
});

export const App: React.FC = () => {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
            <Route path="/" element={<AppShell />}>
              <Route
                index
                element={
                  <ModuleErrorBoundary moduleName="Unified Dashboard">
                    <OverviewPage />
                  </ModuleErrorBoundary>
                }
              />
              <Route
                path="market-data"
                element={
                  <ModuleErrorBoundary moduleName="Market Data">
                    <MarketDataPage />
                  </ModuleErrorBoundary>
                }
              />
              <Route
                path="returns"
                element={
                  <ModuleErrorBoundary moduleName="Returns Analytics">
                    <ReturnsPage />
                  </ModuleErrorBoundary>
                }
              />
              <Route
                path="portfolio"
                element={
                  <ModuleErrorBoundary moduleName="Portfolio Analytics">
                    <PortfolioPage />
                  </ModuleErrorBoundary>
                }
              />
              <Route
                path="correlation"
                element={
                  <ModuleErrorBoundary moduleName="Correlation Analytics">
                    <CorrelationPage />
                  </ModuleErrorBoundary>
                }
              />
              <Route
                path="volatility"
                element={
                  <ModuleErrorBoundary moduleName="Volatility Analytics">
                    <VolatilityPage />
                  </ModuleErrorBoundary>
                }
              />
              <Route
                path="strategies"
                element={
                  <ModuleErrorBoundary moduleName="Strategy Analytics">
                    <StrategiesPage />
                  </ModuleErrorBoundary>
                }
              />
              <Route
                path="backtesting"
                element={
                  <ModuleErrorBoundary moduleName="Backtesting Engine">
                    <BacktestingPage />
                  </ModuleErrorBoundary>
                }
              />
              <Route
                path="settings"
                element={
                  <ModuleErrorBoundary moduleName="System Settings">
                    <SettingsPage />
                  </ModuleErrorBoundary>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};

export default App;
