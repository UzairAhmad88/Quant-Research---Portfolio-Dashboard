export interface DashboardSummary {
  tracked_instruments_count: number;
  portfolios_count: number;
  strategy_configurations_count: number;
  completed_backtests_count: number;
}

export interface DashboardSystemStatus {
  data_status: 'Good' | 'Good with Warnings' | 'No Data' | string;
  backend_status: string;
  database_connected: boolean;
  last_updated: string;
}

export interface MarketDataInstrumentItem {
  id: string;
  symbol: string;
  name: string;
  asset_type: string;
  exchange: string;
  provider?: string | null;
  frequency?: string | null;
  latest_observation_date?: string | null;
  latest_price?: number | null;
  observation_count: number;
  data_quality: 'Good' | 'Good with Warnings' | 'No Data' | string;
  freshness_label: string;
  freshness_state?: string;
}


export interface DashboardPortfolioItem {
  id: string;
  name: string;
  initial_capital: number;
  positions_count: number;
  created_at: string;
}

export interface DashboardPortfolioSnapshot {
  active_portfolios_count: number;
  total_portfolio_value: number;
  total_portfolio_return_pct: number;
  total_cash: number;
  total_positions_count: number;
  portfolios: DashboardPortfolioItem[];
}

export interface DashboardSignalItem {
  id: string;
  symbol: string;
  strategy_type: string;
  signal_type: 'BUY' | 'SELL' | string;
  signal_state: 'BULLISH' | 'BEARISH' | string;
  price: number;
  timestamp: string;
}

export interface DashboardStrategySnapshot {
  strategy_configurations_count: number;
  recent_signals: DashboardSignalItem[];
}

export interface DashboardBacktestItem {
  id: string;
  instrument_symbol: string;
  strategy_name: string;
  period: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'COMPLETED_WITH_WARNINGS' | 'FAILED' | string;
  total_return_pct?: number | null;
  max_drawdown_pct?: number | null;
  trade_count?: number | null;
  completed_at?: string | null;
}

export interface DashboardActivityItem {
  id: string;
  timestamp: string;
  activity_type: string;
  entity_symbol_or_name: string;
  status: string;
}

export interface DashboardOverviewResponse {
  summary: DashboardSummary;
  system_status: DashboardSystemStatus;
  market_data_snapshot: MarketDataInstrumentItem[];
  portfolio_snapshot: DashboardPortfolioSnapshot;
  strategy_snapshot: DashboardStrategySnapshot;
  recent_backtests: DashboardBacktestItem[];
  recent_activity: DashboardActivityItem[];
}
