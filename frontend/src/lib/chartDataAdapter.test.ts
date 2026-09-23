import { describe, it, expect } from 'vitest';
import { validateAndFormatBar, processChartData } from './chartDataAdapter';
import { OHLCVItem } from './apiClient';

describe('chartDataAdapter', () => {
  const mockBar: OHLCVItem = {
    id: 'bar-1',
    instrument_id: 'inst-1',
    timestamp: '2026-09-23T00:00:00Z',
    frequency: 'DAILY',
    open: 150.0,
    high: 155.0,
    low: 149.0,
    close: 154.0,
    adjusted_close: 154.0,
    volume: 1000000,
    provider: 'yahoo_finance',
    retrieved_at: '2026-09-23T22:00:00Z',
  };

  it('validates and formats a valid bar', () => {
    const { candle, line, volume } = validateAndFormatBar(mockBar);
    expect(candle).not.toBeNull();
    expect(candle?.time).toBe('2026-09-23');
    expect(candle?.open).toBe(150.0);
    expect(candle?.high).toBe(155.0);
    expect(candle?.low).toBe(149.0);
    expect(candle?.close).toBe(154.0);
    expect(line?.value).toBe(154.0);
    expect(volume?.value).toBe(1000000);
  });

  it('rejects invalid OHLC bars (high < low)', () => {
    const invalidBar = { ...mockBar, high: 140.0, low: 150.0 };
    const { candle } = validateAndFormatBar(invalidBar);
    expect(candle).toBeNull();
  });

  it('processes and sorts raw bar arrays chronologically', () => {
    const bar2: OHLCVItem = {
      ...mockBar,
      id: 'bar-2',
      timestamp: '2026-09-22T00:00:00Z',
      low: 145.0,
      close: 148.0,
    };


    const result = processChartData([mockBar, bar2]);
    expect(result.validCount).toBe(2);
    expect(result.invalidCount).toBe(0);
    expect(result.candlestickData[0].time).toBe('2026-09-22');
    expect(result.candlestickData[1].time).toBe('2026-09-23');
  });

  it('deduplicates identical timestamps', () => {
    const duplicateBar: OHLCVItem = { ...mockBar, id: 'bar-dup' };
    const result = processChartData([mockBar, duplicateBar]);
    expect(result.candlestickData.length).toBe(1);
  });
});
