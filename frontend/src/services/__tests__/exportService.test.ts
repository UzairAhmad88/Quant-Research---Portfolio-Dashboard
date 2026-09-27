import { describe, it, expect } from 'vitest';
import {
  getMarketDataExportUrl,
  getReturnsExportUrl,
  getPortfolioExportUrl,
  getCorrelationExportUrl,
  getVolatilityExportUrl,
  getStrategyExportUrl,
  getSignalsExportUrl,
  getBacktestExportUrl,
} from '../exportService';

describe('exportService URL builders', () => {
  it('builds market data export URL correctly', () => {
    const url = getMarketDataExportUrl({
      instrumentId: 'inst-123',
      format: 'csv',
      startDate: '2023-01-01',
      endDate: '2024-01-01',
      dataType: 'market_data',
    });
    expect(url).toContain('/api/v1/market-data/export?');
    expect(url).toContain('instrument_id=inst-123');
    expect(url).toContain('format=csv');
    expect(url).toContain('data_type=market_data');
    expect(url).toContain('start_date=2023-01-01');
    expect(url).toContain('end_date=2024-01-01');
  });

  it('builds returns export URL correctly', () => {
    const url = getReturnsExportUrl({
      instrumentId: 'inst-456',
      format: 'json',
      returnType: 'log',
      priceSource: 'adjusted',
    });
    expect(url).toContain('/api/v1/returns/export?');
    expect(url).toContain('instrument_id=inst-456');
    expect(url).toContain('format=json');
    expect(url).toContain('return_type=log');
    expect(url).toContain('price_source=adjusted');
  });

  it('builds portfolio export URL correctly', () => {
    const url = getPortfolioExportUrl({
      portfolioId: 'port-789',
      dataType: 'holdings',
      format: 'csv',
    });
    expect(url).toContain('/api/v1/portfolios/port-789/export?');
    expect(url).toContain('data_type=holdings');
    expect(url).toContain('format=csv');
  });

  it('builds correlation export URL with multi-instrument IDs', () => {
    const url = getCorrelationExportUrl({
      format: 'csv',
      dataType: 'matrix',
      instrumentIds: ['inst-1', 'inst-2', 'inst-3'],
      priceSource: 'adjusted',
    });
    expect(url).toContain('/api/v1/correlation/export?');
    expect(url).toContain('format=csv');
    expect(url).toContain('data_type=matrix');
    expect(url).toContain('instrument_ids=inst-1');
    expect(url).toContain('instrument_ids=inst-2');
    expect(url).toContain('instrument_ids=inst-3');
  });

  it('builds volatility export URL correctly', () => {
    const url = getVolatilityExportUrl({
      instrumentId: 'inst-101',
      format: 'csv',
      dataType: 'rolling',
      rollingWindow: 30,
      annualized: true,
    });
    expect(url).toContain('/api/v1/volatility/export?');
    expect(url).toContain('instrument_id=inst-101');
    expect(url).toContain('format=csv');
    expect(url).toContain('rolling_window=30');
    expect(url).toContain('annualized=true');
  });

  it('builds strategy and signals export URLs', () => {
    const stratUrl = getStrategyExportUrl({
      instrumentId: 'inst-ma',
      format: 'csv',
      fastWindow: 10,
      slowWindow: 50,
      maType: 'ema',
    });
    expect(stratUrl).toContain('/api/v1/strategies/moving-average/export?');
    expect(stratUrl).toContain('fast_window=10');
    expect(stratUrl).toContain('slow_window=50');
    expect(stratUrl).toContain('ma_type=ema');

    const sigUrl = getSignalsExportUrl({
      instrumentId: 'inst-sig',
      format: 'json',
      strategyType: 'MOVING_AVERAGE',
    });
    expect(sigUrl).toContain('/api/v1/signals/export?');
    expect(sigUrl).toContain('strategy_type=MOVING_AVERAGE');
  });

  it('builds backtest export URLs for all supported data types', () => {
    const pdfReportUrl = getBacktestExportUrl({
      backtestId: 'bt-999',
      dataType: 'report',
      format: 'pdf',
    });
    expect(pdfReportUrl).toBe('/api/v1/backtests/bt-999/export?data_type=report&format=pdf');

    const tradesCsvUrl = getBacktestExportUrl({
      backtestId: 'bt-999',
      dataType: 'trades',
      format: 'csv',
    });
    expect(tradesCsvUrl).toBe('/api/v1/backtests/bt-999/export?data_type=trades&format=csv');

    const equityCsvUrl = getBacktestExportUrl({
      backtestId: 'bt-999',
      dataType: 'equity',
      format: 'csv',
    });
    expect(equityCsvUrl).toBe('/api/v1/backtests/bt-999/export?data_type=equity&format=csv');
  });
});
