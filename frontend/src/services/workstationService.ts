import { api } from './api';

export interface WatchlistItem {
  id: string;
  symbol: string;
  display_order: number;
  notes?: string;
  added_at: string;
}

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  created_at: string;
  items: WatchlistItem[];
}

export interface AlertRule {
  id: string;
  symbol: string;
  alert_type: string;
  threshold: number;
  comparator: string;
  status: string;
  message?: string;
  triggered_at?: string;
  triggered_value?: number;
  created_at: string;
}

export interface FeatureExplorationResult {
  feature: string;
  window: number;
  statistics: {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    skewness: number;
    kurtosis: number;
    forward_return_correlation: number;
    sample_size: number;
  };
  distribution: Array<{
    bin_start: number;
    bin_end: number;
    bin_label: string;
    count: number;
    percentage: number;
  }>;
  time_series: Array<{
    timestamp: string;
    value: number;
  }>;
  description: string;
}

export interface RiskAnalysisResult {
  methodology: {
    confidence_level: number;
    confidence_label: string;
    horizon: string;
    sample_size: number;
    portfolio_value: number;
    risk_free_rate: number;
  };
  var: {
    historical_pct: number;
    historical_dollars: number;
    parametric_pct: number;
    parametric_dollars: number;
  };
  expected_shortfall: {
    historical_es_pct: number;
    historical_es_dollars: number;
  };
  volatility: {
    daily: number;
    annualized: number;
    downside_deviation_daily: number;
    downside_deviation_annualized: number;
  };
  drawdown: {
    maximum_drawdown: number;
    average_drawdown: number;
  };
  ratios: {
    sharpe_ratio: number;
    sortino_ratio: number;
    calmar_ratio: number;
  };
  benchmark_analytics: {
    beta: number;
    alpha_annualized: number;
    correlation: number;
    tracking_error: number;
    information_ratio: number;
  };
}

export interface RegimeAnalysisResult {
  methodology: string;
  parameters: {
    fast_ma: number;
    slow_ma: number;
    volatility_lookback: number;
  };
  regime_summary: Record<string, {
    count: number;
    percentage: number;
    annualized_return: number;
    annualized_volatility: number;
    sharpe_ratio: number;
  }>;
  time_series: Array<{
    timestamp: string;
    price: number;
    regime: string;
    volatility: number;
  }>;
  observations: string;
}

export interface MonteCarloResult {
  simulation_count: number;
  horizon_periods: number;
  initial_capital: number;
  random_seed: number;
  terminal_value: {
    mean: number;
    median: number;
    p5_worst_case: number;
    p95_best_case: number;
  };
  max_drawdown: {
    median: number;
    p5_severe_drawdown: number;
    p95_mild_drawdown: number;
  };
  confidence_curves: Array<{
    step: number;
    p5: number;
    p25: number;
    median_p50: number;
    p75: number;
    p95: number;
  }>;
  terminal_return_distribution: Array<{
    bin_start: number;
    bin_end: number;
    bin_label: string;
    count: number;
    percentage: number;
  }>;
  methodology: string;
}

export interface ParameterSweepResult {
  tested_combinations_count: number;
  fast_range: number[];
  slow_range: number[];
  best_combination: {
    fast_window: number;
    slow_window: number;
    total_return_pct: number;
    annualized_volatility_pct: number;
    sharpe_ratio: number;
    max_drawdown_pct: number;
    trade_count: number;
  };
  matrix: Array<{
    fast_window: number;
    slow_window: number;
    total_return_pct: number;
    annualized_volatility_pct: number;
    sharpe_ratio: number;
    max_drawdown_pct: number;
    trade_count: number;
  }>;
  methodology: string;
}

export interface GlossaryTerm {
  term: string;
  category: string;
  definition: string;
  formula: string;
  variables: Array<{ symbol: string; name: string; unit: string }>;
  example: string;
  interpretation: string;
  limitations: string;
}

export interface ResearchExperiment {
  id: string;
  name: string;
  hypothesis: string;
  dataset_identifier: string;
  strategy_name: string;
  parameters: Record<string, any>;
  metrics: Record<string, any>;
  fingerprint: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface DataLineage {
  instrument: {
    symbol: string;
    name: string;
    exchange: string;
    asset_type: string;
    currency: string;
  };
  lineage: {
    provider: string;
    retrieval_protocol: string;
    observation_count: number;
    date_range: { start: string; end: string };
    data_quality: string;
    adjustments: string;
    last_verified_utc: string;
  };
}

export const workstationService = {
  // Watchlists
  getWatchlists: () => api.get<Watchlist[]>('/workstation/watchlists'),
  createWatchlist: (data: { name: string; description?: string; symbols?: string[] }) =>
    api.post<Watchlist>('/workstation/watchlists', data),
  addWatchlistItem: (watchlistId: string, item: { symbol: string; notes?: string }) =>
    api.post<WatchlistItem>(`/workstation/watchlists/${watchlistId}/items`, item),

  // Alerts
  getAlerts: () => api.get<AlertRule[]>('/workstation/alerts'),
  createAlert: (data: { symbol: string; alert_type: string; threshold: number; comparator?: string; message?: string }) =>
    api.post<AlertRule>('/workstation/alerts', data),

  // Feature Explorer
  exploreFeature: (symbol: string, featureName: string, window: number = 14) =>
    api.post<FeatureExplorationResult>('/workstation/features/explore', {
      symbol,
      feature_name: featureName,
      window,
    }),

  // Risk
  analyzeRisk: (symbol: string, benchmarkSymbol: string = 'SPY', confidenceLevel: number = 0.95, portfolioValue: number = 1000000) =>
    api.post<RiskAnalysisResult>('/workstation/risk/analyze', {
      symbol,
      benchmark_symbol: benchmarkSymbol,
      confidence_level: confidenceLevel,
      portfolio_value: portfolioValue,
    }),

  // Regimes
  detectRegimes: (symbol: string, fastMA: number = 50, slowMA: number = 200, volLookback: number = 20) =>
    api.post<RegimeAnalysisResult>('/workstation/regimes/detect', {
      symbol,
      sma_fast: fastMA,
      sma_slow: slowMA,
      vol_lookback: volLookback,
    }),

  // Monte Carlo
  runMonteCarlo: (symbol: string, count: number = 1000, initialCapital: number = 100000) =>
    api.post<MonteCarloResult>('/workstation/monte-carlo/simulate', {
      symbol,
      simulations_count: count,
      initial_capital: initialCapital,
    }),

  // Parameter Sweep
  runParameterSweep: (symbol: string, fastRange: number[] = [10, 20, 30, 40, 50], slowRange: number[] = [50, 100, 150, 200]) =>
    api.post<ParameterSweepResult>('/workstation/strategies/parameter-sweep', {
      symbol,
      fast_range: fastRange,
      slow_range: slowRange,
    }),

  // Glossary & Learning
  getGlossary: () => api.get<GlossaryTerm[]>('/workstation/learning/glossary'),

  // Experiments
  getExperiments: () => api.get<ResearchExperiment[]>('/workstation/research/experiments'),
  saveExperiment: (exp: Partial<ResearchExperiment>) =>
    api.post<ResearchExperiment>('/workstation/research/experiments', exp),

  // Data Lineage
  getDataLineage: (symbol: string) => api.get<DataLineage>(`/workstation/data-lineage/${symbol}`),
};
