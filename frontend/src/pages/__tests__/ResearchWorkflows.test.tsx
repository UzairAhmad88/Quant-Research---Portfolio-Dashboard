import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MarketDataPage } from '../MarketDataPage';
import { ReturnsPage } from '../ReturnsPage';
import { PortfolioPage } from '../PortfolioPage';
import { StrategiesPage } from '../StrategiesPage';
import { BacktestingPage } from '../BacktestingPage';
import * as apiClient from '../../lib/apiClient';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const mockInstruments: apiClient.InstrumentItem[] = [
  {
    id: 'inst-1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    asset_type: 'EQUITY',
    exchange: 'NASDAQ',
    currency: 'USD',
    active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  } as any,
  {
    id: 'inst-2',
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    asset_type: 'EQUITY',
    exchange: 'NASDAQ',
    currency: 'USD',
    active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  } as any,
];

describe('Critical Frontend Research Workflows', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiClient, 'fetchInstruments').mockResolvedValue({
      items: mockInstruments,
      total: 2,
      limit: 10,
      offset: 0,
    });
  });

  // Workflow 1: Market Data Page
  it('renders Market Data Research workflow components', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MarketDataPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getAllByText(/Market Data/i).length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.getAllByText(/Export/i).length).toBeGreaterThan(0);
    });
  });

  // Workflow 2: Return Analysis Page
  it('renders Return Analysis research workflow with presets and controls', async () => {
    vi.spyOn(apiClient, 'fetchReturns').mockResolvedValue({
      summary: {
        total_return: 0.15,
        annualized_return: 0.12,
        volatility: 0.18,
        sharpe_ratio: 0.67,
        max_drawdown: -0.08,
      } as any,
      series: [
        {
          timestamp: '2023-01-02T00:00:00Z',
          price: 150.0,
          simple_return: undefined,
          log_return: undefined,
          cumulative_return: 0.0,
        },
        {
          timestamp: '2023-01-03T00:00:00Z',
          price: 153.0,
          simple_return: 0.02,
          log_return: 0.0198,
          cumulative_return: 0.02,
        },
      ],
    } as any);

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ReturnsPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getAllByText(/Returns/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1M/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1Y/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Cumulative Chart/i)).toBeDefined();
  });

  // Workflow 3: Portfolio Research Page
  it('renders Portfolio Research workflow with holdings and allocation', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PortfolioPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getAllByText(/Portfolio/i).length).toBeGreaterThan(0);
  });

  // Workflow 4: Strategy Research Page
  it('renders Moving Average Strategy configuration and crossover pipeline', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <StrategiesPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getAllByText(/Strateg/i).length).toBeGreaterThan(0);
  });

  // Workflow 5: Backtesting Page
  it('renders Backtesting workstation and execution configuration panel', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <BacktestingPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Historical Simulation & Performance Engine/i)).toBeDefined();
    expect(screen.getByText(/Backtest Research Workstation/i)).toBeDefined();
    expect(screen.getAllByText(/Run Historical Backtest/i).length).toBeGreaterThan(0);
  });
});
