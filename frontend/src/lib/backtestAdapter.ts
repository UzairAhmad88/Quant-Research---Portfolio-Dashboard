import { PortfolioState } from '../types/backtest';

export interface BacktestChartPoint {
  timestamp: string;
  portfolioValue: number;
  cash: number;
  positionValue: number;
  marketPrice: number;
}

export function formatPortfolioStatesToChartData(
  states: PortfolioState[],
  maxPoints: number = 2000
): BacktestChartPoint[] {
  if (!states || states.length === 0) return [];
  
  const rawPoints = states.map((s) => ({
    timestamp: s.timestamp.split('T')[0],
    portfolioValue: Number(s.portfolio_value.toFixed(2)),
    cash: Number(s.cash.toFixed(2)),
    positionValue: Number(s.position_value.toFixed(2)),
    marketPrice: Number(s.market_price.toFixed(2)),
  }));

  if (rawPoints.length <= maxPoints) {
    return rawPoints;
  }

  // Downsample to maxPoints for rendering performance while preserving first and last points
  const factor = Math.ceil(rawPoints.length / maxPoints);
  const downsampled: BacktestChartPoint[] = [];
  for (let i = 0; i < rawPoints.length; i += factor) {
    downsampled.push(rawPoints[i]);
  }
  const lastPoint = rawPoints[rawPoints.length - 1];
  if (downsampled[downsampled.length - 1] !== lastPoint) {
    downsampled.push(lastPoint);
  }
  return downsampled;
}

export function formatTradeSideBadge(side: string): { label: string; variant: 'positive' | 'negative' | 'neutral' } {
  const clean = side.toUpperCase().trim();
  if (clean === 'BUY') {
    return { label: 'BUY', variant: 'positive' };
  }
  if (clean === 'SELL') {
    return { label: 'SELL', variant: 'negative' };
  }
  return { label: clean, variant: 'neutral' };
}
