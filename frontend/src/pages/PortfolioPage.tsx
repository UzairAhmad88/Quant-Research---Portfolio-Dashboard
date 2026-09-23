import React from 'react';
import { PlaceholderModule } from '../components/common/PlaceholderModule';

export const PortfolioPage: React.FC = () => {
  return (
    <PlaceholderModule
      title="Portfolio Analytics & Allocation Module"
      step="Step 04 — Quantitative Portfolio Management"
      purpose="Calculates multi-asset portfolio returns, risk-adjusted metrics (Sharpe ratio, Sortino ratio), drawdown curves, asset allocation weights, and portfolio rebalancing triggers."
      status="SCAFFOLDED"
      supportedAssets={['EQUITY', 'ETF', 'INDEX', 'CRYPTO']}
      upcomingFeatures={[
        'Custom Multi-Asset Weight Configuration & Rebalancing',
        'Sharpe Ratio, Sortino Ratio, & Calmar Ratio Computations',
        'Maximum Drawdown & Underwater Peak-to-Trough Analysis',
        'Efficient Frontier & Minimum Variance Portfolio Optimization',
        'Risk Contribution & Sector Exposure Decomposition',
      ]}
    />
  );
};
