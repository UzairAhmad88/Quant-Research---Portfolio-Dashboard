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

export async function fetchInstruments<T = unknown>(params?: {
  asset_type?: string;
  symbol?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
}): Promise<PaginatedApiItems<T>> {
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

export async function fetchLatestMarketData(instrumentId: string, frequency: string = 'DAILY'): Promise<OHLCVItem> {
  const query = new URLSearchParams({ frequency });
  const response = await fetch(`${API_BASE_URL}/market-data/${instrumentId}/latest?${query.toString()}`);
  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json().catch(() => ({
      error: { code: 'HTTP_ERROR', message: `Failed to fetch latest bar: ${response.status}` },
    }));
    throw new Error(errorBody.error.message);
  }
  return await response.json();
}
