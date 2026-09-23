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
