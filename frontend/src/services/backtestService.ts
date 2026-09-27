import { api } from './api';
import {
  Backtest,
  BacktestCreatePayload,
  BacktestListResponse,
  TradeEvent,
  PortfolioState,
  CompletedTrade,
  BacktestPerformanceMetrics,
  BacktestEquityData,
  BacktestDrawdownSeries,
  BacktestDrawdownPeriods,
  BacktestReport
} from '../types/backtest';

export async function createBacktest(payload: BacktestCreatePayload): Promise<Backtest> {
  return api.post<Backtest>('/backtests', payload);
}

export async function fetchBacktests(instrumentId?: string, limit: number = 50): Promise<BacktestListResponse> {
  const query = new URLSearchParams();
  if (instrumentId) query.append('instrument_id', instrumentId);
  query.append('limit', limit.toString());
  return api.get<BacktestListResponse>(`/backtests?${query.toString()}`);
}

export async function fetchBacktestById(backtestId: string): Promise<Backtest> {
  return api.get<Backtest>(`/backtests/${backtestId}`);
}

export async function fetchBacktestTrades(backtestId: string, limit: number = 500): Promise<TradeEvent[]> {
  return api.get<TradeEvent[]>(`/backtests/${backtestId}/trades?limit=${limit}`);
}

export async function fetchBacktestPortfolioStates(backtestId: string, limit: number = 5000): Promise<PortfolioState[]> {
  return api.get<PortfolioState[]>(`/backtests/${backtestId}/states?limit=${limit}`);
}

export async function fetchBacktestCompletedTrades(backtestId: string, limit: number = 500): Promise<CompletedTrade[]> {
  return api.get<CompletedTrade[]>(`/backtests/${backtestId}/completed-trades?limit=${limit}`);
}

export async function fetchBacktestPerformance(backtestId: string, riskFreeRate: number = 0.0): Promise<BacktestPerformanceMetrics> {
  return api.get<BacktestPerformanceMetrics>(`/backtests/${backtestId}/performance?risk_free_rate=${riskFreeRate}`);
}

export async function fetchBacktestEquity(backtestId: string): Promise<BacktestEquityData> {
  return api.get<BacktestEquityData>(`/backtests/${backtestId}/equity`);
}

export async function fetchBacktestDrawdownSeries(backtestId: string): Promise<BacktestDrawdownSeries> {
  return api.get<BacktestDrawdownSeries>(`/backtests/${backtestId}/drawdown`);
}

export async function fetchBacktestDrawdownPeriods(backtestId: string): Promise<BacktestDrawdownPeriods> {
  return api.get<BacktestDrawdownPeriods>(`/backtests/${backtestId}/drawdown-periods`);
}

export async function fetchBacktestReport(backtestId: string): Promise<BacktestReport> {
  return api.get<BacktestReport>(`/backtests/${backtestId}/report`);
}

export function getBacktestReportExportUrl(backtestId: string, format: 'json' | 'csv' | 'pdf'): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  return `${apiBase}/backtests/${backtestId}/report/export?format=${format}`;
}


