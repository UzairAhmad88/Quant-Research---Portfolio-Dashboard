import { describe, it, expect } from 'vitest';
import { formatPortfolioStatesToChartData, formatTradeSideBadge } from './backtestAdapter';
import { PortfolioState } from '../types/backtest';

describe('backtestAdapter', () => {
  it('formats portfolio states array into clean chart data points', () => {
    const states: PortfolioState[] = [
      {
        id: '1',
        backtest_id: 'b1',
        timestamp: '2026-01-01T00:00:00Z',
        cash: 100000.0,
        position_quantity: 0.0,
        market_price: 150.0,
        position_value: 0.0,
        portfolio_value: 100000.0,
        unrealized_pnl: 0.0,
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: '2',
        backtest_id: 'b1',
        timestamp: '2026-01-02T00:00:00Z',
        cash: 1000.509,
        position_quantity: 650.0,
        market_price: 155.25,
        position_value: 100912.5,
        portfolio_value: 101913.009,
        unrealized_pnl: 3412.5,
        created_at: '2026-01-02T00:00:00Z',
      },
    ];

    const chartData = formatPortfolioStatesToChartData(states);

    expect(chartData).toHaveLength(2);
    expect(chartData[0]).toEqual({
      timestamp: '2026-01-01',
      portfolioValue: 100000.0,
      cash: 100000.0,
      positionValue: 0.0,
      marketPrice: 150.0,
    });
    expect(chartData[1].portfolioValue).toBe(101913.01);
  });

  it('handles empty states gracefully', () => {
    expect(formatPortfolioStatesToChartData([])).toEqual([]);
  });

  it('formats BUY and SELL side badges accurately', () => {
    expect(formatTradeSideBadge('BUY')).toEqual({ label: 'BUY', variant: 'positive' });
    expect(formatTradeSideBadge('SELL')).toEqual({ label: 'SELL', variant: 'negative' });
    expect(formatTradeSideBadge('FORCED_END')).toEqual({ label: 'FORCED_END', variant: 'neutral' });
  });
});
