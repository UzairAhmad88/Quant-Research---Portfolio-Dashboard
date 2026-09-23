/**
 * API Client foundation for Quant Research Dashboard.
 * Interacts with FastAPI backend at /api/v1
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error: string | null;
  metadata?: Record<string, unknown>;
}

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  dbConnected: boolean;
  timestamp: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export async function fetchHealth(): Promise<ApiResponse<HealthResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return {
      success: false,
      data: {
        status: 'STANDBY',
        version: '0.1.0',
        environment: 'development',
        dbConnected: false,
        timestamp: new Date().toISOString(),
      },
      error: error instanceof Error ? error.message : 'Unknown connection error',
    };
  }
}
