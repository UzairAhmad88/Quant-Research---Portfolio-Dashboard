import { describe, it, expect } from 'vitest';
import {
  getSignalStateLabel,
  formatSignalBadgeStyle,
  filterSignalsByType,
  sortSignalsByTimestamp,
} from './signalAdapter';
import { SignalEvent } from '../types/signal';

describe('Signal Adapter Utilities', () => {
  it('correctly derives research signal state label', () => {
    expect(getSignalStateLabel('BUY')).toBe('BULLISH');
    expect(getSignalStateLabel('SELL')).toBe('BEARISH');
  });

  it('provides institutional badge styling classes', () => {
    const buyStyle = formatSignalBadgeStyle('BUY');
    expect(buyStyle.color).toContain('emerald');

    const sellStyle = formatSignalBadgeStyle('SELL');
    expect(sellStyle.color).toContain('rose');
  });

  it('filters signals by type', () => {
    const mockSignals: SignalEvent[] = [
      {
        id: '1',
        strategy_configuration_id: 'cfg-1',
        instrument_id: 'inst-1',
        strategy_type: 'MOVING_AVERAGE',
        timestamp: '2026-01-01T00:00:00Z',
        signal_type: 'BUY',
        signal_state: 'BULLISH',
        price: 150,
        source: 'STRATEGY_ENGINE',
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: '2',
        strategy_configuration_id: 'cfg-1',
        instrument_id: 'inst-1',
        strategy_type: 'MOVING_AVERAGE',
        timestamp: '2026-02-01T00:00:00Z',
        signal_type: 'SELL',
        signal_state: 'BEARISH',
        price: 145,
        source: 'STRATEGY_ENGINE',
        created_at: '2026-02-01T00:00:00Z',
      },
    ];

    expect(filterSignalsByType(mockSignals, 'all')).toHaveLength(2);
    expect(filterSignalsByType(mockSignals, 'BUY')).toHaveLength(1);
    expect(filterSignalsByType(mockSignals, 'BUY')[0].id).toBe('1');
    expect(filterSignalsByType(mockSignals, 'SELL')).toHaveLength(1);
    expect(filterSignalsByType(mockSignals, 'SELL')[0].id).toBe('2');
  });

  it('sorts signals by timestamp descending and ascending', () => {
    const mockSignals: SignalEvent[] = [
      {
        id: '1',
        strategy_configuration_id: 'cfg-1',
        instrument_id: 'inst-1',
        strategy_type: 'MOVING_AVERAGE',
        timestamp: '2026-01-01T00:00:00Z',
        signal_type: 'BUY',
        signal_state: 'BULLISH',
        price: 150,
        source: 'STRATEGY_ENGINE',
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: '2',
        strategy_configuration_id: 'cfg-1',
        instrument_id: 'inst-1',
        strategy_type: 'MOVING_AVERAGE',
        timestamp: '2026-02-01T00:00:00Z',
        signal_type: 'SELL',
        signal_state: 'BEARISH',
        price: 145,
        source: 'STRATEGY_ENGINE',
        created_at: '2026-02-01T00:00:00Z',
      },
    ];

    const desc = sortSignalsByTimestamp(mockSignals, 'desc');
    expect(desc[0].id).toBe('2');

    const asc = sortSignalsByTimestamp(mockSignals, 'asc');
    expect(asc[0].id).toBe('1');
  });
});
