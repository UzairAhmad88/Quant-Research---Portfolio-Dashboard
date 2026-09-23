import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';
import { OverviewPage } from './pages/OverviewPage';
import { MarketDataPage } from './pages/MarketDataPage';
import { ReturnsPage } from './pages/ReturnsPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { CorrelationPage } from './pages/CorrelationPage';
import { VolatilityPage } from './pages/VolatilityPage';
import { StrategiesPage } from './pages/StrategiesPage';
import { BacktestingPage } from './pages/BacktestingPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="market-data" element={<MarketDataPage />} />
            <Route path="returns" element={<ReturnsPage />} />
            <Route path="portfolio" element={<PortfolioPage />} />
            <Route path="correlation" element={<CorrelationPage />} />
            <Route path="volatility" element={<VolatilityPage />} />
            <Route path="strategies" element={<StrategiesPage />} />
            <Route path="backtesting" element={<BacktestingPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
