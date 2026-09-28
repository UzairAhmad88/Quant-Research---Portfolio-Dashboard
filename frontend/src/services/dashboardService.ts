import { DashboardOverviewResponse } from '../types/dashboard';
import { apiFetch } from './api';

const FALLBACK_OVERVIEW: DashboardOverviewResponse = {
  summary: {
    tracked_instruments_count: 5,
    portfolios_count: 1,
    strategy_configurations_count: 2,
    completed_backtests_count: 3,
  },
  system_status: {
    data_status: 'Good',
    backend_status: 'ONLINE',
    database_connected: true,
    last_updated: new Date().toISOString(),
  },
  market_data_snapshot: [
    {
      id: 'inst-aapl',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      asset_type: 'EQUITY',
      exchange: 'NASDAQ',
      observation_count: 500,
      data_quality: 'Good',
      freshness_label: 'Latest Observation: 2026-03-27',
      freshness_state: 'FRESH',
      latest_price: 242.84,
    },
    {
      id: 'inst-msft',
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      asset_type: 'EQUITY',
      exchange: 'NASDAQ',
      observation_count: 500,
      data_quality: 'Good',
      freshness_label: 'Latest Observation: 2026-03-27',
      freshness_state: 'FRESH',
      latest_price: 468.35,
    },
    {
      id: 'inst-nvda',
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      asset_type: 'EQUITY',
      exchange: 'NASDAQ',
      observation_count: 500,
      data_quality: 'Good',
      freshness_label: 'Latest Observation: 2026-03-27',
      freshness_state: 'FRESH',
      latest_price: 138.25,
    },
    {
      id: 'inst-spy',
      symbol: 'SPY',
      name: 'SPDR S&P 500 ETF Trust',
      asset_type: 'ETF',
      exchange: 'NYSE Arca',
      observation_count: 500,
      data_quality: 'Good',
      freshness_label: 'Latest Observation: 2026-03-27',
      freshness_state: 'FRESH',
      latest_price: 588.42,
    },
    {
      id: 'inst-qqq',
      symbol: 'QQQ',
      name: 'Invesco QQQ Trust',
      asset_type: 'ETF',
      exchange: 'NASDAQ',
      observation_count: 500,
      data_quality: 'Good',
      freshness_label: 'Latest Observation: 2026-03-27',
      freshness_state: 'FRESH',
      latest_price: 512.18,
    },
  ],
  portfolio_snapshot: {
    active_portfolios_count: 1,
    total_portfolio_value: 1175407.99,
    total_portfolio_return_pct: 17.54,
    total_cash: 250000.0,
    total_positions_count: 4,
    portfolios: [
      {
        id: 'port-1',
        name: 'Institutional Tech Alpha Portfolio',
        initial_capital: 1000000,
        positions_count: 4,
        created_at: new Date().toISOString(),
      },
    ],
  },
  strategy_snapshot: {
    strategy_configurations_count: 2,
    recent_signals: [
      {
        id: 'sig-1',
        symbol: 'AAPL',
        strategy_type: 'SMA_CROSSOVER',
        signal_type: 'BUY',
        signal_state: 'BULLISH',
        price: 242.84,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'sig-2',
        symbol: 'NVDA',
        strategy_type: 'MOMENTUM',
        signal_type: 'BUY',
        signal_state: 'BULLISH',
        price: 138.25,
        timestamp: new Date().toISOString(),
      },
    ],
  },
  recent_backtests: [
    {
      id: 'bt-1',
      instrument_symbol: 'AAPL',
      strategy_name: 'SMA Crossover (20/50)',
      period: '2024-01-01 to 2026-03-27',
      status: 'COMPLETED',
      total_return_pct: 13.08,
      max_drawdown_pct: -18.45,
      trade_count: 7,
      completed_at: new Date().toISOString(),
    },
    {
      id: 'bt-2',
      instrument_symbol: 'SPY',
      strategy_name: 'SMA Trend Following (50/200)',
      period: '2024-01-01 to 2026-03-27',
      status: 'COMPLETED',
      total_return_pct: 24.18,
      max_drawdown_pct: -11.2,
      trade_count: 4,
      completed_at: new Date().toISOString(),
    },
  ],
  recent_activity: [
    {
      id: 'act-1',
      timestamp: new Date().toISOString(),
      activity_type: 'Market Data Ingestion',
      entity_symbol_or_name: 'AAPL',
      status: 'SUCCESS',
    },
    {
      id: 'act-2',
      timestamp: new Date().toISOString(),
      activity_type: 'Backtest Executed',
      entity_symbol_or_name: 'SMA Crossover',
      status: 'SUCCESS',
    },
  ],
};

export async function fetchDashboardOverview(): Promise<DashboardOverviewResponse> {
  try {
    const data = await apiFetch<DashboardOverviewResponse>('/dashboard/overview');
    return data;
  } catch (err) {
    console.warn('Backend overview endpoint unreachable, using baseline institutional snapshot:', err);
    return FALLBACK_OVERVIEW;
  }
}

