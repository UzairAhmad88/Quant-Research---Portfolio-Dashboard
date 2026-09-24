import { describe, it, expect } from 'vitest';
import {
  calculateChartBounds,
  formatCurrency,
  filterCrossoverEvents,
  sortCrossoverEvents,
} from './strategyChartAdapter';
import { StrategyObservation, CrossoverEvent } from './apiClient';

describe('strategyChartAdapter unit tests', () => {
  it('calculates correct min/max chart bounds with padding', () => {
    const series: StrategyObservation[] = [
      { timestamp: '2025-01-01', price: 100.0, fast_ma: 102.0, slow_ma: 105.0, signal: 'HOLD' },
      { timestamp: '2025-01-02', price: 150.0, fast_ma: 140.0, slow_ma: 135.0, signal: 'BUY' },
    ];

    const bounds = calculateChartBounds(series);
    expect(bounds.minVal).toBeLessThan(100.0);
    expect(bounds.maxVal).toBeGreaterThan(150.0);
  });

  it('formats currency correctly', () => {
    expect(formatCurrency(185.423)).toBe('$185.42');
    expect(formatCurrency(null)).toBe('N/A');
  });

  it('filters crossover events by BUY/SELL/ALL', () => {
    const crossovers: CrossoverEvent[] = [
      { timestamp: '2025-01-02', event_type: 'BULLISH', signal: 'BUY', price: 150, fast_ma: 140, slow_ma: 135 },
      { timestamp: '2025-01-05', event_type: 'BEARISH', signal: 'SELL', price: 140, fast_ma: 142, slow_ma: 145 },
    ];

    const buyEvents = filterCrossoverEvents(crossovers, 'buy');
    expect(buyEvents).toHaveLength(1);
    expect(buyEvents[0].signal).toBe('BUY');

    const sellEvents = filterCrossoverEvents(crossovers, 'sell');
    expect(sellEvents).toHaveLength(1);
    expect(sellEvents[0].signal).toBe('SELL');

    const allEvents = filterCrossoverEvents(crossovers, 'all');
    expect(allEvents).toHaveLength(2);
  });

  it('sorts crossover events chronologically desc/asc', () => {
    const crossovers: CrossoverEvent[] = [
      { timestamp: '2025-01-02', event_type: 'BULLISH', signal: 'BUY', price: 150, fast_ma: 140, slow_ma: 135 },
      { timestamp: '2025-01-05', event_type: 'BEARISH', signal: 'SELL', price: 140, fast_ma: 142, slow_ma: 145 },
    ];

    const sortedDesc = sortCrossoverEvents(crossovers, 'desc');
    expect(sortedDesc[0].timestamp).toBe('2025-01-05');

    const sortedAsc = sortCrossoverEvents(crossovers, 'asc');
    expect(sortedAsc[0].timestamp).toBe('2025-01-02');
  });
});
