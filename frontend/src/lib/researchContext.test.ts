import { describe, it, expect } from 'vitest';
import {
  parseResearchContext,
  serializeResearchContext,
  buildResearchUrl,
  validateResearchContext,
  getDatesFromPreset,
  ResearchContext,
} from './researchContext';

describe('Research Context Engine', () => {
  it('parses valid single instrument and date preset search params', () => {
    const params = new URLSearchParams('symbol=aapl&range=5Y&priceSource=adjusted');
    const ctx = parseResearchContext(params);

    expect(ctx.symbol).toBe('AAPL');
    expect(ctx.rangePreset).toBe('5Y');
    expect(ctx.priceSource).toBe('adjusted');
    expect(ctx.startDate).toBeDefined();
    expect(ctx.endDate).toBeDefined();
  });

  it('parses explicit start and end dates with priority over presets', () => {
    const params = new URLSearchParams('symbol=MSFT&start=2024-01-01&end=2025-01-01&range=1Y');
    const ctx = parseResearchContext(params);

    expect(ctx.symbol).toBe('MSFT');
    expect(ctx.startDate).toBe('2024-01-01');
    expect(ctx.endDate).toBe('2025-01-01');
    expect(ctx.rangePreset).toBe('1Y');
  });

  it('parses multi-instrument symbols and removes duplicates', () => {
    const params = new URLSearchParams('symbols=AAPL,MSFT,spy,AAPL,BTC/USD');
    const ctx = parseResearchContext(params);

    expect(ctx.symbols).toEqual(['AAPL', 'MSFT', 'SPY', 'BTC/USD']);
  });

  it('serializes research context cleanly omitting undefined values', () => {
    const ctx: ResearchContext = {
      symbol: 'NVDA',
      rangePreset: '3M',
      priceSource: 'adjusted',
    };

    const serialized = serializeResearchContext(ctx);
    expect(serialized).toEqual({
      symbol: 'NVDA',
      range: '3M',
      priceSource: 'adjusted',
    });
  });

  it('builds full URL strings with serialized query parameters', () => {
    const ctx: ResearchContext = {
      symbol: 'AAPL',
      rangePreset: '1Y',
      priceSource: 'close',
    };

    const url = buildResearchUrl('/returns', ctx);
    expect(url).toBe('/returns?symbol=AAPL&range=1Y&priceSource=close');
  });

  it('validates date order start <= end correctly', () => {
    const validCtx: ResearchContext = {
      startDate: '2024-01-01',
      endDate: '2025-01-01',
    };
    const invalidCtx: ResearchContext = {
      startDate: '2025-01-01',
      endDate: '2024-01-01',
    };

    expect(validateResearchContext(validCtx).isValid).toBe(true);
    expect(validateResearchContext(invalidCtx).isValid).toBe(false);
    expect(validateResearchContext(invalidCtx).errors[0]).toMatch(/Start date cannot be after end date/);
  });

  it('calculates correct start date for range presets', () => {
    const refDate = new Date('2026-09-25T00:00:00Z');
    const dates1Y = getDatesFromPreset('1Y', refDate);
    expect(dates1Y.endDate).toBe('2026-09-25');
    expect(dates1Y.startDate).toBe('2025-09-25');
  });
});
