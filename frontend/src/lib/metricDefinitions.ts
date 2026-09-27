export interface MetricDefinition {
  name: string;
  symbol?: string;
  category: 'returns' | 'risk' | 'drawdown' | 'trading' | 'portfolio' | 'statistics';
  formula: string;
  description: string;
  interpretation: string;
  benchmark: string;
  assumptions?: string;
}

export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  sharpe_ratio: {
    name: 'Sharpe Ratio',
    symbol: 'S_p',
    category: 'risk',
    formula: 'S_p = (R_p - R_f) / σ_p',
    description: 'Measures excess return per unit of total risk (standard deviation) above the risk-free rate.',
    interpretation: 'Higher is better. > 1.0 is considered good; > 2.0 is institutional quality; > 3.0 is exceptional.',
    benchmark: 'S&P 500 historical Sharpe ~ 0.5 - 0.7',
    assumptions: 'Assumes normal return distribution and uses annualized volatility factor √252.',
  },
  sortino_ratio: {
    name: 'Sortino Ratio',
    symbol: 'S_o',
    category: 'risk',
    formula: 'S_o = (R_p - R_f) / σ_downside',
    description: 'Measures excess return per unit of downside semi-variance, penalizing only negative volatility.',
    interpretation: 'Higher is better. Ideal for asymmetric and trending strategies where upside volatility is favorable.',
    benchmark: '> 1.5 is desirable for active quantitative strategies',
    assumptions: 'Calculates standard deviation strictly over observations below the minimum acceptable return (MAR = R_f).',
  },
  calmar_ratio: {
    name: 'Calmar Ratio',
    symbol: 'CR',
    category: 'drawdown',
    formula: 'CR = CAGR / |Max Drawdown|',
    description: 'Evaluates the ratio of annualized compound growth rate relative to historical maximum drawdown.',
    interpretation: 'Indicates how much return was generated per unit of worst-case capital drawdown risk.',
    benchmark: '> 0.5 acceptable; > 1.0 strong; > 2.0 superior hedge fund quality',
    assumptions: 'Computed over the evaluated backtesting or analytical horizon.',
  },
  max_drawdown: {
    name: 'Maximum Drawdown',
    symbol: 'MDD',
    category: 'drawdown',
    formula: 'MDD = min_{t} [(Equity_t - Peak_t) / Peak_t]',
    description: 'The maximum observed peak-to-trough percentage loss before a new equity peak is achieved.',
    interpretation: 'Measures historical tail risk and capital preservation stress threshold.',
    benchmark: '< 15% conservative; 15-25% moderate; > 30% high risk',
    assumptions: 'Calculated continuously on daily close or simulation state series.',
  },
  annualized_return: {
    name: 'Compound Annual Growth Rate (CAGR)',
    symbol: 'CAGR',
    category: 'returns',
    formula: 'CAGR = (V_end / V_start)^(252 / N) - 1',
    description: 'The geometric mean annual growth rate of an investment over the specified observation period.',
    interpretation: 'Provides the standard benchmark-comparable normalized annual rate of return.',
    benchmark: 'S&P 500 long-term real CAGR ~ 9.5% - 10.5%',
    assumptions: 'Uses standard 252 trading days per year convention with geometric compounding.',
  },
  annualized_volatility: {
    name: 'Annualized Volatility',
    symbol: 'σ_ann',
    category: 'risk',
    formula: 'σ_ann = σ_daily × √252',
    description: 'The annualized sample standard deviation of periodic percentage price returns.',
    interpretation: 'Measures the dispersion and risk volatility of asset returns around their arithmetic mean.',
    benchmark: 'Equities: 15-25%; Bonds: 4-8%; Crypto: 60-90%',
    assumptions: 'Assumes independent and identically distributed (i.i.d.) returns with 252 annual trading periods.',
  },
  var_95: {
    name: 'Value at Risk (95%)',
    symbol: 'VaR_0.95',
    category: 'risk',
    formula: 'VaR_α = -Quantile(R, 1 - α)',
    description: 'The maximum expected loss over a single-day horizon at the 95% confidence level.',
    interpretation: 'Only 5% of trading days are expected to produce losses exceeding this threshold.',
    benchmark: 'Parametric and historical quantile calculation',
    assumptions: '1-day holding period; assumes stable statistical regime.',
  },
  cvar_95: {
    name: 'Conditional Value at Risk (Expected Shortfall)',
    symbol: 'CVaR_0.95',
    category: 'risk',
    formula: 'CVaR_α = -E[R | R ≤ -VaR_α]',
    description: 'The expected average loss on days when losses breach the 95% Value at Risk threshold.',
    interpretation: 'Quantifies extreme tail loss severity and avoids VaR blindness to tail fatness.',
    benchmark: 'Sub-additive coherent risk measure preferred under Basel IV guidelines',
    assumptions: 'Empirical conditional mean of lower tail quantile returns.',
  },
  win_rate: {
    name: 'Win Rate',
    symbol: 'WR',
    category: 'trading',
    formula: 'WR = N_winning_trades / N_total_trades',
    description: 'The percentage of completed round-trip trades that closed with a positive net profit.',
    interpretation: 'Must be evaluated alongside Profit Factor (a 35% win rate can be highly profitable with 4:1 win/loss).',
    benchmark: 'Trend following ~ 40-50%; Mean reversion ~ 55-70%',
    assumptions: 'Computed strictly on realized round-trip closed trades after commissions and slippage.',
  },
  profit_factor: {
    name: 'Profit Factor',
    symbol: 'PF',
    category: 'trading',
    formula: 'PF = Gross Profits / |Gross Losses|',
    description: 'The ratio of total gross trading gains to total gross trading losses across all closed positions.',
    interpretation: 'Values > 1.0 indicate overall profitability. > 1.5 is robust; > 2.0 is excellent.',
    benchmark: '> 1.6 indicates strong algorithmic edge',
    assumptions: 'Requires non-zero losses; undefined/infinite for 100% win rate datasets.',
  },
  turnover_ratio: {
    name: 'Turnover Ratio',
    symbol: 'TO',
    category: 'portfolio',
    formula: 'TO = Total Traded Volume / (2 × Mean Portfolio Equity)',
    description: 'Measures portfolio trading velocity and capital recycling rate.',
    interpretation: 'High turnover increases execution drag, commission fees, and slippage impact.',
    benchmark: 'Low turnover < 2x/yr; Active momentum 5-15x/yr',
    assumptions: 'Annualized based on elapsed backtest duration.',
  },
  beta: {
    name: 'Market Beta',
    symbol: 'β',
    category: 'risk',
    formula: 'β = Cov(R_p, R_b) / Var(R_b)',
    description: 'Sensitivity of asset or portfolio returns relative to benchmark (e.g. SPY) systematic market movements.',
    interpretation: 'β = 1.0 moves in line with market; β > 1.0 higher volatility; β < 1.0 defensive.',
    benchmark: 'SPY Benchmark β = 1.00',
    assumptions: 'Linear CAPM single-factor regression over matched historical dates.',
  },
  alpha: {
    name: "Jensen's Alpha",
    symbol: 'α',
    category: 'returns',
    formula: 'α = R_p - [R_f + β × (R_b - R_f)]',
    description: 'Excess return generated above the expected CAPM theoretical risk-adjusted return.',
    interpretation: 'True idiosyncratic manager/algorithm performance independent of market beta exposure.',
    benchmark: '> 0.0 indicates positive excess value-add',
    assumptions: 'Annualized excess return based on linear CAPM parameters.',
  },
};

export const getMetricDefinition = (key: string): MetricDefinition | undefined => {
  const normalized = key.toLowerCase().replace(/[\s-]/g, '_');
  return METRIC_DEFINITIONS[normalized];
};
