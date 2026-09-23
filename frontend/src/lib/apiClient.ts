/**
 * Centralized API Client for Quant Research Dashboard.
 * Interacts with FastAPI backend at /api/v1
 */

export interface PaginatedApiItems<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  database?: string;
  timestamp: string;
}

export interface InstrumentItem {
  id: string;
  symbol: string;
  name: string;
  asset_type: string;
  exchange: string;
  currency: string;
  country?: string;
  provider_symbol?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstrumentSearchResult {
  symbol: string;
  name: string;
  asset_type: string;
  exchange: string;
  currency: string;
  provider_symbol: string;
  existing_id?: string;
}

export interface MarketDataFetchPayload {
  instrument_id?: string;
  symbol?: string;
  start_date?: string;
  end_date?: string;
  frequency?: string;
  provider?: string;
  force_refresh?: boolean;
}

export interface IngestionSummary {
  ingestion_id: string;
  instrument_id: string;
  symbol: string;
  provider: string;
  frequency: string;
  requested_start: string;
  requested_end: string;
  actual_start?: string;
  actual_end?: string;
  rows_received: number;
  rows_inserted: number;
  rows_skipped: number;
  rows_invalid: number;
  duration_ms: number;
  status: string;
  warnings: string[];
}

export interface MarketDataFetchResponse {
  message: string;
  summary: IngestionSummary;
}

export interface OHLCVItem {
  id: string;
  instrument_id: string;
  timestamp: string;
  frequency: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close?: number;
  volume: number;
  provider: string;
  retrieved_at: string;
}

export interface CoverageInfo {
  instrument_id: string;
  symbol: string;
  total_bars: number;
  min_timestamp?: string;
  max_timestamp?: string;
  requested_start?: string;
  requested_end?: string;
  missing_start?: string;
  missing_end?: string;
  has_missing_range: boolean;
}

export interface IngestionLogItem {
  id: string;
  instrument_id?: string;
  provider: string;
  requested_start: string;
  requested_end: string;
  actual_start?: string;
  actual_end?: string;
  frequency: string;
  rows_received: number;
  rows_inserted: number;
  rows_skipped: number;
  rows_invalid: number;
  duration_ms: number;
  status: string;
  error_message?: string;
  created_at: string;
}

export interface ValidationIssueItem {
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  code: string;
  message: string;
  timestamp?: string;
  field?: string;
  record_reference?: string;
}

export interface ValidationSummaryItem {
  total_records: number;
  valid_records: number;
  invalid_records: number;
  warning_count: number;
  error_count: number;
  critical_count: number;
  duplicate_records: number;
  potential_missing_sessions: number;
}

export interface QualityReportItem {
  status: 'GOOD' | 'GOOD_WITH_WARNINGS' | 'INVALID' | 'NO_DATA';
  summary: ValidationSummaryItem;
  issues: ValidationIssueItem[];
  instrument_id?: string;
  symbol?: string;
  asset_type?: string;
  provider?: string;
  start_date?: string;
  end_date?: string;
  generated_at: string;
}

export interface IngestionDetailItem extends IngestionLogItem {
  quality_report?: QualityReportItem;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch {
    return {
      status: 'standby',
      service: 'quant-research-backend',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function fetchReadiness(): Promise<HealthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/health/ready`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch {
    return {
      status: 'unavailable',
      service: 'quant-research-backend',
      version: '0.1.0',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function fetchInstruments(params?: {
  asset_type?: string;
  symbol?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
}): Promise<PaginatedApiItems<InstrumentItem>> {
  const query = new URLSearchParams();
  if (params?.asset_type) query.append('asset_type', params.asset_type);
  if (params?.symbol) query.append('symbol', params.symbol);
  if (params?.active !== undefined) query.append('active', String(params.active));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.offset) query.append('offset', String(params.offset));

  const response = await fetch(`${API_BASE_URL}/instruments?${query.toString()}`);
  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json().catch(() => ({
      error: { code: 'HTTP_ERROR', message: `Request failed with status ${response.status}` },
    }));
    throw new Error(errorBody.error.message);
  }
  return await response.json();
}

export async function createInstrument(data: {
  symbol: string;
  name: string;
  asset_type: string;
  exchange: string;
  currency?: string;
  provider_symbol?: string;
}): Promise<InstrumentItem> {
  const response = await fetch(`${API_BASE_URL}/instruments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json().catch(() => ({
      error: { code: 'HTTP_ERROR', message: `Failed to create instrument: ${response.status}` },
    }));
    throw new Error(errorBody.error.message);
  }
  return await response.json();
}

export async function updateInstrument(
  instrumentId: string,
  data: { active?: boolean; name?: string; exchange?: string; provider_symbol?: string }
): Promise<InstrumentItem> {
  const response = await fetch(`${API_BASE_URL}/instruments/${instrumentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json().catch(() => ({
      error: { code: 'HTTP_ERROR', message: `Failed to update instrument: ${response.status}` },
    }));
    throw new Error(errorBody.error.message);
  }
  return await response.json();
}

export async function searchInstruments(queryStr: string, provider: string = 'yahoo_finance'): Promise<InstrumentSearchResult[]> {
  if (!queryStr.trim()) return [];
  const query = new URLSearchParams({ q: queryStr, provider });
  const response = await fetch(`${API_BASE_URL}/instruments/search?${query.toString()}`);
  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json().catch(() => ({
      error: { code: 'HTTP_ERROR', message: `Search failed with status ${response.status}` },
    }));
    throw new Error(errorBody.error.message);
  }
  return await response.json();
}

export async function fetchMarketData(payload: MarketDataFetchPayload): Promise<MarketDataFetchResponse> {
  const response = await fetch(`${API_BASE_URL}/market-data/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json().catch(() => ({
      error: { code: 'HTTP_ERROR', message: `Market data fetch failed with status ${response.status}` },
    }));
    throw new Error(errorBody.error.message);
  }
  return await response.json();
}

export async function queryMarketData(params: {
  instrument_id?: string;
  frequency?: string;
  start_date?: string;
  end_date?: string;
  provider?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedApiItems<OHLCVItem>> {
  const query = new URLSearchParams();
  if (params.instrument_id) query.append('instrument_id', params.instrument_id);
  if (params.frequency) query.append('frequency', params.frequency);
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  if (params.provider) query.append('provider', params.provider);
  if (params.limit) query.append('limit', String(params.limit));
  if (params.offset) query.append('offset', String(params.offset));

  const response = await fetch(`${API_BASE_URL}/market-data?${query.toString()}`);
  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json().catch(() => ({
      error: { code: 'HTTP_ERROR', message: `Failed to query market data: ${response.status}` },
    }));
    throw new Error(errorBody.error.message);
  }
  return await response.json();
}

export async function fetchCoverage(instrumentId: string, startDate?: string, endDate?: string): Promise<CoverageInfo> {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);
  const response = await fetch(`${API_BASE_URL}/market-data/${instrumentId}/coverage?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch coverage: ${response.status}`);
  }
  return await response.json();
}

export async function fetchIngestionLogs(instrumentId: string, limit: number = 20): Promise<IngestionLogItem[]> {
  const query = new URLSearchParams({ limit: String(limit) });
  const response = await fetch(`${API_BASE_URL}/market-data/${instrumentId}/ingestions?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ingestion logs: ${response.status}`);
  }
  return await response.json();
}

export async function exportMarketDataCsv(instrumentId: string, startDate?: string, endDate?: string): Promise<string> {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);
  const response = await fetch(`${API_BASE_URL}/market-data/${instrumentId}/export?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`CSV export failed with status: ${response.status}`);
  }
  return await response.text();
}

export async function fetchMarketDataQuality(
  instrumentId: string,
  startDate?: string,
  endDate?: string,
  frequency: string = 'DAILY'
): Promise<QualityReportItem> {
  const query = new URLSearchParams({ frequency });
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const response = await fetch(`${API_BASE_URL}/market-data/${instrumentId}/quality?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch quality report: ${response.status}`);
  }
  return await response.json();
}

export async function fetchIngestionDetail(
  instrumentId: string,
  ingestionId: string
): Promise<IngestionDetailItem> {
  const response = await fetch(`${API_BASE_URL}/market-data/${instrumentId}/ingestions/${ingestionId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ingestion detail: ${response.status}`);
  }
  return await response.json();
}

export interface ReturnObservationItem {
  timestamp: string;
  price: number;
  simple_return?: number;
  log_return?: number;
  cumulative_return: number;
}

export interface ReturnSummaryItem {
  period_return: number;
  annualized_return: number;
  cumulative_return: number;
  positive_periods: number;
  negative_periods: number;
  best_period?: number;
  worst_period?: number;
  annualization_factor: number;
}

export interface ReturnAnalysisResponse {
  instrument_id: string;
  symbol: string;
  asset_type: string;
  price_source: string;
  return_type: string;
  frequency: string;
  quality_status: string;
  quality_warning?: string;
  summary: ReturnSummaryItem;
  series: ReturnObservationItem[];
}

export async function fetchReturns(params: {
  instrument_id: string;
  start_date?: string;
  end_date?: string;
  price_source?: string;
  return_type?: string;
  frequency?: string;
}): Promise<ReturnAnalysisResponse> {
  const query = new URLSearchParams({ instrument_id: params.instrument_id });
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  if (params.price_source) query.append('price_source', params.price_source);
  if (params.return_type) query.append('return_type', params.return_type);
  if (params.frequency) query.append('frequency', params.frequency);

  const response = await fetch(`${API_BASE_URL}/returns?${query.toString()}`);
  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json().catch(() => ({
      error: { code: 'HTTP_ERROR', message: `Return analysis failed with status ${response.status}` },
    }));
    throw new Error(errorBody.error.message);
  }
  return await response.json();
}

// Portfolio API types
export interface PortfolioHoldingItem {
  id: string;
  portfolio_id: string;
  instrument_id: string;
  symbol: string;
  name: string;
  asset_type: string;
  quantity: number;
  entry_price: number;
  entry_date?: string;
  target_weight?: number;
  initial_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItem {
  id: string;
  name: string;
  description?: string;
  base_currency: string;
  initial_capital: number;
  is_active: boolean;
  holdings: PortfolioHoldingItem[];
  invested_value: number;
  cash: number;
  created_at: string;
  updated_at: string;
}

export interface CreateHoldingPayload {
  instrument_id: string;
  quantity: number;
  entry_price: number;
  entry_date?: string;
  target_weight?: number;
}

export interface CreatePortfolioPayload {
  name: string;
  description?: string;
  base_currency?: string;
  initial_capital?: number;
  holdings?: CreateHoldingPayload[];
}

export interface UpdatePortfolioPayload {
  name?: string;
  description?: string;
  initial_capital?: number;
  is_active?: boolean;
}

export interface UpdateHoldingPayload {
  quantity?: number;
  entry_price?: number;
  target_weight?: number;
}

export interface HoldingAnalyticsItem {
  holding_id: string;
  instrument_id: string;
  symbol: string;
  name: string;
  asset_type: string;
  quantity: number;
  entry_price: number;
  current_price: number;
  initial_value: number;
  current_value: number;
  invested_weight: number;
  total_weight: number;
  target_weight?: number;
  pnl_amount: number;
  pnl_percent: number;
  contribution_percent: number;
}

export interface AllocationItem {
  label: string;
  symbol?: string;
  value: number;
  weight: number;
  color?: string;
}

export interface PerformancePoint {
  timestamp: string;
  portfolio_value: number;
  invested_value: number;
  cumulative_return: number;
}

export interface PortfolioSummaryItem {
  initial_capital: number;
  initial_invested_value: number;
  cash: number;
  current_invested_value: number;
  current_portfolio_value: number;
  total_pnl: number;
  total_return: number;
}

export interface PortfolioAnalyticsResponse {
  portfolio_id: string;
  name: string;
  base_currency: string;
  price_source: string;
  quality_status: string;
  quality_warnings: string[];
  summary: PortfolioSummaryItem;
  holdings: HoldingAnalyticsItem[];
  allocation: AllocationItem[];
  performance_series: PerformancePoint[];
}

export async function fetchPortfolios(activeOnly: boolean = true): Promise<PortfolioItem[]> {
  const query = new URLSearchParams({ active_only: String(activeOnly) });
  const response = await fetch(`${API_BASE_URL}/portfolios?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch portfolios: ${response.status}`);
  }
  return await response.json();
}

export async function fetchPortfolio(portfolioId: string): Promise<PortfolioItem> {
  const response = await fetch(`${API_BASE_URL}/portfolios/${portfolioId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio: ${response.status}`);
  }
  return await response.json();
}

export async function createPortfolio(payload: CreatePortfolioPayload): Promise<PortfolioItem> {
  const response = await fetch(`${API_BASE_URL}/portfolios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json().catch(() => ({
      error: { code: 'HTTP_ERROR', message: `Failed to create portfolio: ${response.status}` },
    }));
    throw new Error(errorBody.error.message);
  }
  return await response.json();
}

export async function updatePortfolio(portfolioId: string, payload: UpdatePortfolioPayload): Promise<PortfolioItem> {
  const response = await fetch(`${API_BASE_URL}/portfolios/${portfolioId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json().catch(() => ({
      error: { code: 'HTTP_ERROR', message: `Failed to update portfolio: ${response.status}` },
    }));
    throw new Error(errorBody.error.message);
  }
  return await response.json();
}

export async function deletePortfolio(portfolioId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/portfolios/${portfolioId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to deactivate portfolio: ${response.status}`);
  }
}

export async function addPortfolioHolding(portfolioId: string, payload: CreateHoldingPayload): Promise<PortfolioHoldingItem> {
  const response = await fetch(`${API_BASE_URL}/portfolios/${portfolioId}/holdings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json().catch(() => ({
      error: { code: 'HTTP_ERROR', message: `Failed to add holding: ${response.status}` },
    }));
    throw new Error(errorBody.error.message);
  }
  return await response.json();
}

export async function updatePortfolioHolding(
  portfolioId: string,
  holdingId: string,
  payload: UpdateHoldingPayload
): Promise<PortfolioHoldingItem> {
  const response = await fetch(`${API_BASE_URL}/portfolios/${portfolioId}/holdings/${holdingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json().catch(() => ({
      error: { code: 'HTTP_ERROR', message: `Failed to update holding: ${response.status}` },
    }));
    throw new Error(errorBody.error.message);
  }
  return await response.json();
}

export async function deletePortfolioHolding(portfolioId: string, holdingId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/portfolios/${portfolioId}/holdings/${holdingId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to remove holding: ${response.status}`);
  }
}

export async function fetchPortfolioAnalytics(params: {
  portfolio_id: string;
  start_date?: string;
  end_date?: string;
  price_source?: string;
}): Promise<PortfolioAnalyticsResponse> {
  const query = new URLSearchParams();
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  if (params.price_source) query.append('price_source', params.price_source);

  const response = await fetch(`${API_BASE_URL}/portfolios/${params.portfolio_id}/analytics?${query.toString()}`);
  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json().catch(() => ({
      error: { code: 'HTTP_ERROR', message: `Portfolio analytics request failed: ${response.status}` },
    }));
    throw new Error(errorBody.error.message);
  }
  return await response.json();
}

// Correlation API types
export interface MatrixCellItem {
  symbol_a: string;
  symbol_b: string;
  correlation?: number;
  observations: number;
  interpretation: string;
}

export interface CorrelationMatrixResponse {
  instruments: string[];
  instrument_ids: string[];
  method: string;
  return_type: string;
  price_source: string;
  alignment: string;
  matrix: (number | null)[][];
  pairwise: MatrixCellItem[];
  quality_status: string;
  quality_warnings: string[];
}

export interface ScatterPointItem {
  timestamp: string;
  return_a: number;
  return_b: number;
}

export interface CorrelationPairwiseResponse {
  instrument_a: string;
  instrument_b: string;
  symbol_a: string;
  symbol_b: string;
  correlation?: number;
  observations: number;
  interpretation: string;
  min_observations_met: boolean;
  return_type: string;
  price_source: string;
  quality_status: string;
  quality_warnings: string[];
  scatter_points: ScatterPointItem[];
}

export interface RollingPointItem {
  timestamp: string;
  correlation?: number;
}

export interface RollingCorrelationResponse {
  instrument_a: string;
  instrument_b: string;
  symbol_a: string;
  symbol_b: string;
  window: number;
  return_type: string;
  price_source: string;
  quality_status: string;
  quality_warnings: string[];
  series: RollingPointItem[];
}

export async function fetchCorrelationMatrix(params: {
  instrument_ids: string[];
  start_date?: string;
  end_date?: string;
  return_type?: string;
  price_source?: string;
  alignment_mode?: string;
}): Promise<CorrelationMatrixResponse> {
  const query = new URLSearchParams();
  params.instrument_ids.forEach((id) => query.append('instrument_ids', id));
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  if (params.return_type) query.append('return_type', params.return_type);
  if (params.price_source) query.append('price_source', params.price_source);
  if (params.alignment_mode) query.append('alignment_mode', params.alignment_mode);

  const response = await fetch(`${API_BASE_URL}/correlation?${query.toString()}`);
  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json().catch(() => ({
      error: { code: 'HTTP_ERROR', message: `Correlation matrix request failed: ${response.status}` },
    }));
    throw new Error(errorBody.error.message);
  }
  return await response.json();
}

export async function fetchPairwiseCorrelation(params: {
  instrument_a: string;
  instrument_b: string;
  start_date?: string;
  end_date?: string;
  return_type?: string;
  price_source?: string;
}): Promise<CorrelationPairwiseResponse> {
  const query = new URLSearchParams({
    instrument_a: params.instrument_a,
    instrument_b: params.instrument_b,
  });
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  if (params.return_type) query.append('return_type', params.return_type);
  if (params.price_source) query.append('price_source', params.price_source);

  const response = await fetch(`${API_BASE_URL}/correlation/pair?${query.toString()}`);
  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json().catch(() => ({
      error: { code: 'HTTP_ERROR', message: `Pairwise correlation request failed: ${response.status}` },
    }));
    throw new Error(errorBody.error.message);
  }
  return await response.json();
}

export async function fetchRollingCorrelation(params: {
  instrument_a: string;
  instrument_b: string;
  window?: number;
  start_date?: string;
  end_date?: string;
  return_type?: string;
  price_source?: string;
}): Promise<RollingCorrelationResponse> {
  const query = new URLSearchParams({
    instrument_a: params.instrument_a,
    instrument_b: params.instrument_b,
  });
  if (params.window) query.append('window', String(params.window));
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  if (params.return_type) query.append('return_type', params.return_type);
  if (params.price_source) query.append('price_source', params.price_source);

  const response = await fetch(`${API_BASE_URL}/correlation/rolling?${query.toString()}`);
  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json().catch(() => ({
      error: { code: 'HTTP_ERROR', message: `Rolling correlation request failed: ${response.status}` },
    }));
    throw new Error(errorBody.error.message);
  }
  return await response.json();
}
