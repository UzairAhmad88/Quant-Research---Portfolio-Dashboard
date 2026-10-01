import { api } from './api';
import {
  computeRealLifeFeatures,
  computeRealLifeRisk,
  computeRealLifeRegimes,
  computeRealLifeMonteCarlo,
  computeRealLifeParameterSweep,
  QUANT_GLOSSARY,
  getStoredExperiments,
  saveStoredExperiment,
  getRealLifeDataLineage,
} from '../lib/realLifeEngine';

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

const DEFAULT_WATCHLISTS: Watchlist[] = [
  {
    id: 'wl-1',
    name: 'US Tech Alpha',
    description: 'Mega-cap technology leaders & AI momentum',
    is_default: true,
    created_at: new Date().toISOString(),
    items: [
      { id: 'wi-1', symbol: 'AAPL', display_order: 1, notes: 'Core holding', added_at: new Date().toISOString() },
      { id: 'wi-2', symbol: 'MSFT', display_order: 2, notes: 'Cloud infrastructure', added_at: new Date().toISOString() },
      { id: 'wi-3', symbol: 'NVDA', display_order: 3, notes: 'AI compute leadership', added_at: new Date().toISOString() },
      { id: 'wi-4', symbol: 'TSLA', display_order: 4, notes: 'Autonomous mobility', added_at: new Date().toISOString() },
    ],
  },
  {
    id: 'wl-2',
    name: 'Macro & Indices',
    description: 'Benchmark ETF proxies and macro risk trackers',
    is_default: false,
    created_at: new Date().toISOString(),
    items: [
      { id: 'wi-5', symbol: 'SPY', display_order: 1, notes: 'Broad US market proxy', added_at: new Date().toISOString() },
      { id: 'wi-6', symbol: 'QQQ', display_order: 2, notes: 'Tech heavy growth proxy', added_at: new Date().toISOString() },
      { id: 'wi-7', symbol: 'BTC/USD', display_order: 3, notes: 'Digital macro store of value', added_at: new Date().toISOString() },
    ],
  },
];

export const workstationService = {
  // Watchlists
  getWatchlists: async (): Promise<Watchlist[]> => {
    try {
      const data = await api.get<Watchlist[]>('/workstation/watchlists');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return DEFAULT_WATCHLISTS;
  },

  createWatchlist: async (data: { name: string; description?: string; symbols?: string[] }): Promise<Watchlist> => {
    try {
      return await api.post<Watchlist>('/workstation/watchlists', data);
    } catch {}
    const newWl: Watchlist = {
      id: `wl-${Date.now()}`,
      name: data.name,
      description: data.description,
      is_default: false,
      created_at: new Date().toISOString(),
      items: (data.symbols || []).map((s, idx) => ({
        id: `wi-${Date.now()}-${idx}`,
        symbol: s.toUpperCase(),
        display_order: idx + 1,
        added_at: new Date().toISOString(),
      })),
    };
    return newWl;
  },

  addWatchlistItem: async (watchlistId: string, item: { symbol: string; notes?: string }): Promise<WatchlistItem> => {
    try {
      return await api.post<WatchlistItem>(`/workstation/watchlists/${watchlistId}/items`, item);
    } catch {}
    return {
      id: `wi-${Date.now()}`,
      symbol: item.symbol.toUpperCase(),
      display_order: 99,
      notes: item.notes,
      added_at: new Date().toISOString(),
    };
  },

  // Alerts
  getAlerts: async (): Promise<AlertRule[]> => {
    try {
      return await api.get<AlertRule[]>('/workstation/alerts');
    } catch {}
    return [
      {
        id: 'alt-1',
        symbol: 'NVDA',
        alert_type: 'PRICE_ABOVE',
        threshold: 150.0,
        comparator: '>',
        status: 'ACTIVE',
        message: 'Alert when NVDA breaks 150.0 resistance',
        created_at: new Date().toISOString(),
      },
      {
        id: 'alt-2',
        symbol: 'SPY',
        alert_type: 'RSI_OVERSOLD',
        threshold: 30.0,
        comparator: '<',
        status: 'ACTIVE',
        message: 'SPY Daily RSI-14 oversold trigger',
        created_at: new Date().toISOString(),
      },
    ];
  },

  createAlert: async (data: { symbol: string; alert_type: string; threshold: number; comparator?: string; message?: string }): Promise<AlertRule> => {
    try {
      return await api.post<AlertRule>('/workstation/alerts', data);
    } catch {}
    return {
      id: `alt-${Date.now()}`,
      symbol: data.symbol.toUpperCase(),
      alert_type: data.alert_type,
      threshold: data.threshold,
      comparator: data.comparator || '>',
      status: 'ACTIVE',
      message: data.message,
      created_at: new Date().toISOString(),
    };
  },

  // Feature Explorer
  exploreFeature: async (symbol: string, featureName: string, window: number = 14): Promise<FeatureExplorationResult> => {
    try {
      return await api.post<FeatureExplorationResult>('/workstation/features/explore', {
        symbol,
        feature_name: featureName,
        window,
      });
    } catch {}
    return computeRealLifeFeatures(symbol, featureName, window);
  },

  // Risk
  analyzeRisk: async (
    symbol: string,
    benchmarkSymbol: string = 'SPY',
    confidenceLevel: number = 0.95,
    portfolioValue: number = 1000000
  ): Promise<RiskAnalysisResult> => {
    try {
      return await api.post<RiskAnalysisResult>('/workstation/risk/analyze', {
        symbol,
        benchmark_symbol: benchmarkSymbol,
        confidence_level: confidenceLevel,
        portfolio_value: portfolioValue,
      });
    } catch {}
    return computeRealLifeRisk(symbol, benchmarkSymbol, confidenceLevel, portfolioValue);
  },

  // Regimes
  detectRegimes: async (symbol: string, fastMA: number = 50, slowMA: number = 200, volLookback: number = 20): Promise<RegimeAnalysisResult> => {
    try {
      return await api.post<RegimeAnalysisResult>('/workstation/regimes/detect', {
        symbol,
        sma_fast: fastMA,
        sma_slow: slowMA,
        vol_lookback: volLookback,
      });
    } catch {}
    return computeRealLifeRegimes(symbol, fastMA, slowMA, volLookback);
  },

  // Monte Carlo
  runMonteCarlo: async (symbol: string, count: number = 1000, initialCapital: number = 100000): Promise<MonteCarloResult> => {
    try {
      return await api.post<MonteCarloResult>('/workstation/monte-carlo/simulate', {
        symbol,
        simulations_count: count,
        initial_capital: initialCapital,
      });
    } catch {}
    return computeRealLifeMonteCarlo(symbol, count, initialCapital);
  },

  // Parameter Sweep
  runParameterSweep: async (
    symbol: string,
    fastRange: number[] = [10, 20, 30, 40, 50],
    slowRange: number[] = [50, 100, 150, 200]
  ): Promise<ParameterSweepResult> => {
    try {
      return await api.post<ParameterSweepResult>('/workstation/strategies/parameter-sweep', {
        symbol,
        fast_range: fastRange,
        slow_range: slowRange,
      });
    } catch {}
    return computeRealLifeParameterSweep(symbol, fastRange, slowRange);
  },

  // Glossary & Learning
  getGlossary: async (): Promise<GlossaryTerm[]> => {
    try {
      const res = await api.get<GlossaryTerm[]>('/workstation/learning/glossary');
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {}
    return QUANT_GLOSSARY;
  },

  // Experiments
  getExperiments: async (): Promise<ResearchExperiment[]> => {
    try {
      const res = await api.get<ResearchExperiment[]>('/workstation/research/experiments');
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {}
    return getStoredExperiments();
  },

  saveExperiment: async (exp: Partial<ResearchExperiment>): Promise<ResearchExperiment> => {
    try {
      return await api.post<ResearchExperiment>('/workstation/research/experiments', exp);
    } catch {}
    return saveStoredExperiment(exp);
  },

  // Data Lineage
  getDataLineage: async (symbol: string): Promise<DataLineage> => {
    try {
      return await api.get<DataLineage>(`/workstation/data-lineage/${symbol}`);
    } catch {}
    return getRealLifeDataLineage(symbol);
  },
};
