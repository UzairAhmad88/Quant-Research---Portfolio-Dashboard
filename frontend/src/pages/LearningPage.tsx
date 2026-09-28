import React, { useState } from 'react';
import { BookOpen, Search, AlertTriangle } from 'lucide-react';

export const LearningPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTermKey, setSelectedTermKey] = useState<string>('sharpe_ratio');

  const terms = [
    {
      key: 'sharpe_ratio',
      term: 'Sharpe Ratio',
      category: 'Risk-Adjusted Return',
      formula: 'Sharpe = (R_p - R_f) / σ_p',
      definition: 'Measures the excess return of an investment per unit of total risk (standard deviation).',
      variables: [
        { symbol: 'R_p', name: 'Annualized Portfolio Return', unit: '%' },
        { symbol: 'R_f', name: 'Risk-Free Rate (e.g. 10Y US Treasury)', unit: '%' },
        { symbol: 'σ_p', name: 'Annualized Volatility', unit: '%' },
      ],
      example: 'Portfolio return = 14%, Risk-free = 4%, Volatility = 16% → Sharpe = (14 - 4) / 16 = 0.625.',
      interpretation: '> 1.0 is good, > 2.0 is exceptional. Compares strategies with different volatility profiles.',
      limitations: 'Penalizes upside volatility equally with downside losses; assumes normal distribution.',
    },
    {
      key: 'sortino_ratio',
      term: 'Sortino Ratio',
      category: 'Downside Risk-Adjusted Return',
      formula: 'Sortino = (R_p - R_f) / σ_downside',
      definition: 'A modification of the Sharpe ratio that penalizes only harmful downside volatility.',
      variables: [
        { symbol: 'R_p', name: 'Annualized Portfolio Return', unit: '%' },
        { symbol: 'R_f', name: 'Target or Risk-Free Rate', unit: '%' },
        { symbol: 'σ_downside', name: 'Annualized Downside Semi-Deviation', unit: '%' },
      ],
      example: 'Portfolio return = 18%, Risk-free = 4%, Downside dev = 7% → Sortino = (18 - 4) / 7 = 2.0.',
      interpretation: 'Focuses strictly on downside capital destruction rather than overall variability.',
      limitations: 'Requires sufficient negative return observations to be statistically reliable.',
    },
    {
      key: 'value_at_risk',
      term: 'Value at Risk (VaR)',
      category: 'Tail Risk',
      formula: 'Historical: VaR_α = -Percentile(Returns, 1 - α)',
      definition: 'Estimates maximum expected percentage or dollar loss over a horizon (e.g., 1 day) at a confidence level (e.g., 95%).',
      variables: [
        { symbol: 'α', name: 'Confidence Level (0.95 or 0.99)', unit: 'scalar' },
        { symbol: 'σ_daily', name: 'Daily Return Volatility', unit: '%' },
      ],
      example: 'For a $1,000,000 portfolio with 95% 1-day VaR of 1.84%, maximum expected daily loss is $18,400.',
      interpretation: 'Standard institutional measure for setting capital requirements and position limits.',
      limitations: 'Does NOT describe the magnitude of losses beyond the VaR cutoff (see Expected Shortfall).',
    },
    {
      key: 'expected_shortfall',
      term: 'Expected Shortfall (CVaR)',
      category: 'Tail Risk',
      formula: 'ES_α = -E[ R | R <= -VaR_α ]',
      definition: 'The expected loss given that the loss exceeds the Value at Risk threshold (average of worst tail returns).',
      variables: [
        { symbol: 'α', name: 'Confidence Level', unit: 'scalar' },
        { symbol: 'VaR_α', name: 'Value at Risk threshold', unit: '%' },
      ],
      example: 'If 95% VaR is 1.84% and average loss in the worst 5% tail is 2.76%, Expected Shortfall is 2.76% ($27,600 on $1M).',
      interpretation: 'A coherent risk measure that accounts for heavy tails and black swan events.',
      limitations: 'Sensitive to extreme outlier samples in small historical datasets.',
    },
    {
      key: 'beta',
      term: 'Beta (Market Sensitivity)',
      category: 'Factor Exposure',
      formula: 'Beta = Cov(R_p, R_m) / Var(R_m)',
      definition: 'Measures systematic sensitivity of an asset or portfolio relative to a market benchmark (e.g., SPY).',
      variables: [
        { symbol: 'Cov(R_p, R_m)', name: 'Covariance between Asset and Market', unit: 'scalar' },
        { symbol: 'Var(R_m)', name: 'Variance of Market Returns', unit: 'scalar' },
      ],
      example: 'Beta = 1.25 means the portfolio tends to amplify market moves by 25%. Beta = 0.70 is defensive.',
      interpretation: 'Indicates non-diversifiable systematic market risk.',
      limitations: 'Assumes linear relationship; beta is unstable and shifts during market stress.',
    },
    {
      key: 'max_drawdown',
      term: 'Maximum Drawdown (MDD)',
      category: 'Capital Preservation',
      formula: 'Drawdown_t = (Equity_t - Peak_t) / Peak_t; MDD = Min(Drawdown_t)',
      definition: 'The largest peak-to-trough drop in equity before a new peak is reached.',
      variables: [
        { symbol: 'Equity_t', name: 'Portfolio Equity at time t', unit: '$' },
        { symbol: 'Peak_t', name: 'Running Maximum Equity', unit: '$' },
      ],
      example: 'If equity rises to $1.2M and drops to $960k, MDD = ($960k - $1.2M) / $1.2M = -20.0%.',
      interpretation: 'Critical for survival. -50% loss requires +100% gain to recover.',
      limitations: 'Path-dependent; historical worst drawdown could be exceeded in future regimes.',
    },
  ];

  const filteredTerms = terms.filter(
    (t) =>
      t.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selected = terms.find((t) => t.key === selectedTermKey) || terms[0];

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-1">
        <div>
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#38BDF8]" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Quant Glossary & Formula Inspector</h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Institutional mathematical formulations, variable breakdowns, interpretation guidelines, and risk limitations.
          </p>
        </div>
      </div>

      {/* Search & Selection Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Sidebar: Term List (4 cols) */}
        <div className="lg:col-span-4 bg-[#0D1525] border border-[#17253D] rounded-lg p-3.5 shadow-md flex flex-col justify-between">
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search quant terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-[#070D18] border border-[#17253D] focus:border-[#3B82F6] rounded text-xs text-white placeholder-[#64748B] outline-none"
            />
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-[500px]">
            {filteredTerms.map((item) => (
              <button
                key={item.key}
                onClick={() => setSelectedTermKey(item.key)}
                className={`w-full text-left p-2.5 rounded-md transition-all ${
                  selectedTermKey === item.key
                    ? 'bg-[#1D4ED8] text-white font-semibold'
                    : 'bg-[#070D18] hover:bg-[#152136] text-[#94A3B8]'
                }`}
              >
                <div className="text-xs font-semibold">{item.term}</div>
                <div className="text-[10px] opacity-75">{item.category}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Detail Pane: Formula Inspector (8 cols) */}
        <div className="lg:col-span-8 bg-[#0D1525] border border-[#17253D] rounded-lg p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#17253D]">
            <div>
              <span className="text-[10px] font-bold text-[#60A5FA] uppercase tracking-wider">{selected.category}</span>
              <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">{selected.term}</h2>
            </div>
          </div>

          {/* Definition */}
          <div className="p-3.5 bg-[#070D18] border border-[#17253D] rounded-lg text-xs text-[#E2E8F0] leading-relaxed">
            {selected.definition}
          </div>

          {/* Formula Display */}
          <div className="p-4 bg-[#0A101D] border border-[#1E3A8A]/60 rounded-lg">
            <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Mathematical Formulation</div>
            <pre className="font-mono-num text-sm text-[#86EFAC] font-bold bg-[#070D18] p-3 rounded border border-[#17253D] overflow-x-auto">
              {selected.formula}
            </pre>
          </div>

          {/* Variables Table */}
          <div>
            <h4 className="text-xs font-bold text-white mb-2">Variable Definitions</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono-num">
                <thead>
                  <tr className="text-[10px] text-[#64748B] border-b border-[#17253D]">
                    <th className="pb-1">Variable</th>
                    <th className="pb-1">Description</th>
                    <th className="pb-1">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#17253D]/40">
                  {selected.variables.map((v, i) => (
                    <tr key={i}>
                      <td className="py-2 text-[#38BDF8] font-bold">{v.symbol}</td>
                      <td className="py-2 text-[#E2E8F0] font-sans">{v.name}</td>
                      <td className="py-2 text-[#94A3B8]">{v.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Practical Example & Interpretation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-[#070D18] border border-[#17253D] rounded-lg space-y-1">
              <div className="font-bold text-[#60A5FA]">Numerical Example</div>
              <div className="text-[#94A3B8] text-[11px] leading-relaxed">{selected.example}</div>
            </div>

            <div className="p-3.5 bg-[#070D18] border border-[#17253D] rounded-lg space-y-1">
              <div className="font-bold text-[#22C55E]">Institutional Interpretation</div>
              <div className="text-[#94A3B8] text-[11px] leading-relaxed">{selected.interpretation}</div>
            </div>
          </div>

          {/* Limitations & Risks */}
          <div className="p-3.5 bg-[#7F1D1D]/15 border border-[#EF4444]/30 rounded-lg text-xs space-y-1">
            <div className="font-bold text-[#FCA5A5] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Assumptions & Risk Limitations</span>
            </div>
            <div className="text-[#FCA5A5]/80 text-[11px] leading-relaxed">
              {selected.limitations}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPage;
