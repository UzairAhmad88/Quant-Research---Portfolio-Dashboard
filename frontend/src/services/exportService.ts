/**
 * Client Data Delivery & Export Service
 * Handles browser blob downloads, Content-Disposition filename extraction,
 * and endpoint URL generation for research data exports.
 */

const API_BASE = '/api/v1';

export async function triggerDownload(url: string, fallbackFilename: string = 'export'): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    let errorDetail = 'Export generation failed.';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // Non-JSON error
    }
    throw new Error(errorDetail);
  }

  // Extract filename from Content-Disposition header if available
  let filename = fallbackFilename;
  const disposition = response.headers.get('content-disposition');
  if (disposition && disposition.includes('filename=')) {
    const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '').trim();
    }
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

// 1. Market Data
export function getMarketDataExportUrl(params: {
  instrumentId: string;
  format: 'csv' | 'json';
  startDate?: string;
  endDate?: string;
  frequency?: string;
  dataType?: string;
}): string {
  const query = new URLSearchParams();
  query.append('instrument_id', params.instrumentId);
  query.append('format', params.format);
  if (params.dataType) query.append('data_type', params.dataType);
  if (params.startDate) query.append('start_date', params.startDate);
  if (params.endDate) query.append('end_date', params.endDate);
  if (params.frequency) query.append('frequency', params.frequency);
  return `${API_BASE}/market-data/export?${query.toString()}`;
}

// 2. Returns
export function getReturnsExportUrl(params: {
  instrumentId: string;
  format: 'csv' | 'json';
  startDate?: string;
  endDate?: string;
  priceSource?: string;
  returnType?: string;
  frequency?: string;
}): string {
  const query = new URLSearchParams();
  query.append('instrument_id', params.instrumentId);
  query.append('format', params.format);
  if (params.startDate) query.append('start_date', params.startDate);
  if (params.endDate) query.append('end_date', params.endDate);
  if (params.priceSource) query.append('price_source', params.priceSource);
  if (params.returnType) query.append('return_type', params.returnType);
  if (params.frequency) query.append('frequency', params.frequency);
  return `${API_BASE}/returns/export?${query.toString()}`;
}

// 3. Portfolios
export function getPortfolioExportUrl(params: {
  portfolioId: string;
  dataType?: 'holdings' | 'summary' | 'performance';
  format: 'csv' | 'json';
  startDate?: string;
  endDate?: string;
  priceSource?: string;
}): string {
  const query = new URLSearchParams();
  if (params.dataType) query.append('data_type', params.dataType);
  query.append('format', params.format);
  if (params.startDate) query.append('start_date', params.startDate);
  if (params.endDate) query.append('end_date', params.endDate);
  if (params.priceSource) query.append('price_source', params.priceSource);
  return `${API_BASE}/portfolios/${params.portfolioId}/export?${query.toString()}`;
}

// 4. Correlation
export function getCorrelationExportUrl(params: {
  format: 'csv' | 'json';
  dataType?: 'matrix' | 'pairwise' | 'rolling';
  instrumentIds?: string[];
  instrumentA?: string;
  instrumentB?: string;
  window?: number;
  startDate?: string;
  endDate?: string;
  returnType?: string;
  priceSource?: string;
}): string {
  const query = new URLSearchParams();
  query.append('format', params.format);
  if (params.dataType) query.append('data_type', params.dataType);
  if (params.instrumentIds) {
    params.instrumentIds.forEach((id) => query.append('instrument_ids', id));
  }
  if (params.instrumentA) query.append('instrument_a', params.instrumentA);
  if (params.instrumentB) query.append('instrument_b', params.instrumentB);
  if (params.window) query.append('window', params.window.toString());
  if (params.startDate) query.append('start_date', params.startDate);
  if (params.endDate) query.append('end_date', params.endDate);
  if (params.returnType) query.append('return_type', params.returnType);
  if (params.priceSource) query.append('price_source', params.priceSource);
  return `${API_BASE}/correlation/export?${query.toString()}`;
}

// 5. Volatility
export function getVolatilityExportUrl(params: {
  instrumentId: string;
  format: 'csv' | 'json';
  dataType?: 'rolling' | 'summary';
  rollingWindow?: number;
  annualized?: boolean;
  startDate?: string;
  endDate?: string;
  priceSource?: string;
  returnType?: string;
}): string {
  const query = new URLSearchParams();
  query.append('instrument_id', params.instrumentId);
  query.append('format', params.format);
  if (params.dataType) query.append('data_type', params.dataType);
  if (params.rollingWindow) query.append('rolling_window', params.rollingWindow.toString());
  if (params.annualized !== undefined) query.append('annualized', params.annualized.toString());
  if (params.startDate) query.append('start_date', params.startDate);
  if (params.endDate) query.append('end_date', params.endDate);
  if (params.priceSource) query.append('price_source', params.priceSource);
  if (params.returnType) query.append('return_type', params.returnType);
  return `${API_BASE}/volatility/export?${query.toString()}`;
}

// 6. Strategies
export function getStrategyExportUrl(params: {
  instrumentId: string;
  format: 'csv' | 'json';
  fastWindow?: number;
  slowWindow?: number;
  maType?: string;
  priceSource?: string;
  startDate?: string;
  endDate?: string;
}): string {
  const query = new URLSearchParams();
  query.append('instrument_id', params.instrumentId);
  query.append('format', params.format);
  if (params.fastWindow) query.append('fast_window', params.fastWindow.toString());
  if (params.slowWindow) query.append('slow_window', params.slowWindow.toString());
  if (params.maType) query.append('ma_type', params.maType);
  if (params.priceSource) query.append('price_source', params.priceSource);
  if (params.startDate) query.append('start_date', params.startDate);
  if (params.endDate) query.append('end_date', params.endDate);
  return `${API_BASE}/strategies/moving-average/export?${query.toString()}`;
}

// 7. Signals
export function getSignalsExportUrl(params: {
  format: 'csv' | 'json';
  instrumentId?: string;
  strategyType?: string;
  signalType?: string;
  startDate?: string;
  endDate?: string;
}): string {
  const query = new URLSearchParams();
  query.append('format', params.format);
  if (params.instrumentId) query.append('instrument_id', params.instrumentId);
  if (params.strategyType) query.append('strategy_type', params.strategyType);
  if (params.signalType) query.append('signal_type', params.signalType);
  if (params.startDate) query.append('start_date', params.startDate);
  if (params.endDate) query.append('end_date', params.endDate);
  return `${API_BASE}/signals/export?${query.toString()}`;
}

// 8. Backtest
export function getBacktestExportUrl(params: {
  backtestId: string;
  dataType?: 'report' | 'trades' | 'equity' | 'drawdown' | 'states';
  format: 'pdf' | 'csv' | 'json';
}): string {
  const query = new URLSearchParams();
  if (params.dataType) query.append('data_type', params.dataType);
  query.append('format', params.format);
  return `${API_BASE}/backtests/${params.backtestId}/export?${query.toString()}`;
}
