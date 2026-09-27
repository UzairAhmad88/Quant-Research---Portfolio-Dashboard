export type ExecutionTiming = 'NEXT_OPEN';
export type PositionSizingType = 'FULL_CAPITAL';
export type BacktestDirection = 'LONG_ONLY';
export type BacktestStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'COMPLETED_WITH_WARNINGS' | 'FAILED';
export type ExecutionReason = 'SIGNAL' | 'FORCED_END';

export interface BacktestCreatePayload {
  instrument_id: string;
  strategy_configuration_id: string;
  start_date?: string;
  end_date?: string;
  initial_capital?: number;
  execution_timing?: ExecutionTiming;
  position_sizing?: PositionSizingType;
  commission?: number;
  slippage?: number;
  direction?: BacktestDirection;
}

export interface Backtest {
  id: string;
  strategy_configuration_id: string;
  instrument_id: string;
  symbol?: string;
  name?: string;
  start_date?: string | null;
  end_date?: string | null;
  initial_capital: number;
  execution_timing: ExecutionTiming;
  position_sizing: PositionSizingType;
  commission: number;
  slippage: number;
  direction: BacktestDirection;
  status: BacktestStatus;
  final_cash: number;
  final_position: number;
  final_portfolio_value: number;
  trade_count: number;
  portfolio_state_count: number;
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface TradeEvent {
  id: string;
  backtest_id: string;
  signal_id?: string | null;
  instrument_id: string;
  side: 'BUY' | 'SELL';
  signal_timestamp: string;
  execution_timestamp: string;
  execution_reason: ExecutionReason;
  execution_price: number;
  quantity: number;
  notional_value: number;
  commission: number;
  slippage: number;
  cash_after: number;
  created_at: string;
}

export interface PortfolioState {
  id: string;
  backtest_id: string;
  timestamp: string;
  cash: number;
  position_quantity: number;
  market_price: number;
  position_value: number;
  portfolio_value: number;
  unrealized_pnl: number;
  created_at: string;
}

export interface CompletedTrade {
  id: string;
  backtest_id: string;
  instrument_id: string;
  entry_signal_id?: string | null;
  exit_signal_id?: string | null;
  entry_timestamp: string;
  exit_timestamp: string;
  entry_price: number;
  exit_price: number;
  quantity: number;
  entry_notional: number;
  exit_notional: number;
  entry_commission: number;
  exit_commission: number;
  entry_slippage: number;
  exit_slippage: number;
  total_cost: number;
  gross_pnl: number;
  net_pnl: number;
  trade_return: number;
  duration_days: number;
  exit_reason: ExecutionReason;
  created_at: string;
}

export interface BacktestListResponse {
  items: Backtest[];
  total: number;
  limit: number;
  offset: number;
}

export interface ReturnMetrics {
  total_return: number;
  annualized_return: number | null;
  observation_count: number;
  elapsed_days: number;
}

export interface RiskMetrics {
  volatility: number | null;
  annualized_volatility: number | null;
  sharpe_ratio: number | null;
  sortino_ratio: number | null;
  risk_free_rate: number;
  annualization_factor: number;
}

export interface DrawdownMetrics {
  max_drawdown: number | null;
  max_drawdown_duration_days: number | null;
  calmar_ratio: number | null;
}

export interface TradeSummaryInfo {
  trade_id: string;
  net_pnl: number;
  trade_return: number;
  entry_timestamp?: string | null;
  exit_timestamp?: string | null;
}

export interface TradeMetrics {
  trade_count: number;
  win_rate: number | null;
  average_win: number | null;
  average_loss: number | null;
  profit_factor: number | null;
  average_trade_return: number | null;
  best_trade: TradeSummaryInfo | null;
  worst_trade: TradeSummaryInfo | null;
}

export interface CostAndExposureMetrics {
  exposure: number;
  turnover: number;
  total_commission: number;
  total_slippage_cost: number;
  total_transaction_costs: number;
}

export interface BacktestPerformanceMetrics {
  backtest_id: string;
  symbol?: string | null;
  initial_capital: number;
  final_portfolio_value: number;
  returns: ReturnMetrics;
  risk: RiskMetrics;
  drawdown: DrawdownMetrics;
  trading: TradeMetrics;
  costs_and_exposure: CostAndExposureMetrics;
}

export interface EquityPoint {
  timestamp: string;
  portfolio_value: number;
  cumulative_return: number;
  running_peak: number;
  drawdown: number;
  drawdown_amount?: number;
  drawdown_percentage?: number;
  cash: number;
  position_value: number;
  position_quantity: number;
}

export interface BacktestEquityData {
  backtest_id: string;
  initial_capital: number;
  equity_series: EquityPoint[];
}

export interface DrawdownPoint {
  timestamp: string;
  portfolio_value: number;
  running_peak: number;
  drawdown_amount: number;
  drawdown_percentage: number;
}

export interface BacktestDrawdownSeries {
  backtest_id: string;
  symbol?: string | null;
  initial_capital: number;
  drawdown_series: DrawdownPoint[];
}

export type DrawdownPeriodStatus = 'RECOVERED' | 'ACTIVE';

export interface DrawdownPeriod {
  peak_timestamp: string;
  trough_timestamp: string;
  recovery_timestamp?: string | null;
  peak_equity: number;
  trough_equity: number;
  drawdown_amount: number;
  drawdown_percentage: number;
  duration_days: number;
  recovery_duration_days?: number | null;
  status: DrawdownPeriodStatus;
}

export interface BacktestDrawdownPeriods {
  backtest_id: string;
  symbol?: string | null;
  total_periods: number;
  periods: DrawdownPeriod[];
}

export interface ReportExecutiveSummary {
  symbol?: string | null;
  instrument_name?: string | null;
  strategy_name: string;
  start_date?: string | null;
  end_date?: string | null;
  initial_capital: number;
  final_portfolio_value: number;
  total_return: number;
  annualized_return?: number | null;
  annualized_volatility?: number | null;
  sharpe_ratio?: number | null;
  sortino_ratio?: number | null;
  max_drawdown?: number | null;
  trade_count: number;
  win_rate?: number | null;
}

export interface ReportConfigurationSnapshot {
  backtest_id: string;
  created_at: string;
  completed_at?: string | null;
  status: BacktestStatus;
  instrument_id: string;
  symbol?: string | null;
  asset_type?: string | null;
  currency?: string | null;
  initial_capital: number;
  start_date?: string | null;
  end_date?: string | null;
  data_frequency: string;
  price_source: string;
}

export interface ReportStrategyConfiguration {
  strategy_configuration_id: string;
  strategy_type: string;
  ma_type?: string | null;
  fast_window?: number | null;
  slow_window?: number | null;
  price_source: string;
  direction: string;
}

export interface ReportSignalsSummary {
  total_signals: number;
  buy_signals: number;
  sell_signals: number;
  first_signal_timestamp?: string | null;
  last_signal_timestamp?: string | null;
}

export interface ReportMarketDataProvenance {
  instrument_id: string;
  symbol?: string | null;
  provider: string;
  provider_symbol?: string | null;
  frequency: string;
  price_source: string;
  requested_start?: string | null;
  requested_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  observation_count: number;
  latest_observation_timestamp?: string | null;
  data_quality_status: string;
}

export interface ReportExecutionAssumptions {
  execution_model: string;
  position_direction: string;
  position_sizing: string;
  fractional_quantity_allowed: boolean;
  initial_capital: number;
  forced_close_at_end: boolean;
  forced_close_price_source: string;
}

export interface ReportCostAssumptions {
  commission_rate: number;
  slippage_rate: number;
  commission_type: string;
  slippage_type: string;
}

export interface ReportEquitySummary {
  initial_capital: number;
  final_portfolio_value: number;
  total_return: number;
  running_peak: number;
  cumulative_return: number;
  observation_count: number;
}

export interface ReportDrawdownSummary {
  max_drawdown_percentage: number;
  current_drawdown_percentage: number;
  current_drawdown_amount: number;
  running_peak: number;
  current_status: string;
  period_count: number;
  active_period_count: number;
  longest_duration_days: number;
  periods: DrawdownPeriod[];
}

export interface ReportAccountingSummary {
  initial_cash: number;
  final_cash: number;
  final_position_quantity: number;
  final_position_value: number;
  final_portfolio_value: number;
  realized_pnl: number;
  unrealized_pnl: number;
  total_commission: number;
  total_slippage: number;
  total_transaction_costs: number;
}

export interface ReportDataQuality {
  overall_status: string;
  validation_status: string;
  warnings: string[];
  coverage_ratio: number;
  observation_count: number;
}

export interface ReportReproducibility {
  backtest_id: string;
  strategy_configuration_id: string;
  instrument_id: string;
  symbol?: string | null;
  provider: string;
  data_frequency: string;
  price_source: string;
  start_date?: string | null;
  end_date?: string | null;
  execution_timing: string;
  position_sizing: string;
  commission: number;
  slippage: number;
  initial_capital: number;
  created_at: string;
  completed_at?: string | null;
  configuration_hash: string;
}

export interface BacktestReport {
  report_version: string;
  generated_at: string;
  backtest_id: string;
  configuration_hash: string;
  status: BacktestStatus;
  warnings: string[];
  executive_summary: ReportExecutiveSummary;
  configuration: ReportConfigurationSnapshot;
  strategy: ReportStrategyConfiguration;
  signals_summary: ReportSignalsSummary;
  market_data: ReportMarketDataProvenance;
  execution_assumptions: ReportExecutionAssumptions;
  cost_assumptions: ReportCostAssumptions;
  performance: BacktestPerformanceMetrics;
  equity_summary: ReportEquitySummary;
  drawdown_summary: ReportDrawdownSummary;
  accounting: ReportAccountingSummary;
  data_quality: ReportDataQuality;
  methodology: string[];
  limitations: string[];
  reproducibility: ReportReproducibility;
}


