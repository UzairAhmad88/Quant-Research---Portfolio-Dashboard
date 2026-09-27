import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OverviewPage } from '../OverviewPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Unified Quant Research Dashboard Overview Page', () => {
  it('renders dashboard overview header and institutional KPI bar', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <OverviewPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getAllByText(/Research Dashboard/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/S&P 500 \(SPY\)/i)).toBeDefined();
    expect(screen.getByText(/NASDAQ \(QQQ\)/i)).toBeDefined();
    expect(screen.getByText(/Portfolio Value/i)).toBeDefined();
    expect(screen.getByText(/Annualized Return/i)).toBeDefined();
    expect(screen.getByText(/Sharpe Ratio/i)).toBeDefined();
  });

  it('renders main candlestick price chart, status widgets, allocation donut, and tables', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <OverviewPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/AAPL — Price Chart/i)).toBeDefined();
    expect(screen.getByText(/Market Data Status/i)).toBeDefined();
    expect(screen.getByText(/Recent Research/i)).toBeDefined();
    expect(screen.getByText(/Portfolio Allocation/i)).toBeDefined();
    expect(screen.getByText(/Performance vs Benchmark/i)).toBeDefined();
    expect(screen.getByText(/Top Instruments/i)).toBeDefined();
    expect(screen.getByText(/Recent Backtests/i)).toBeDefined();
  });
});
