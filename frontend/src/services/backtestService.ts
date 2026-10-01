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
import {
  getStoredBacktests,
  runRealLifeBacktest,
  getRealLifeBacktestTrades,
  getRealLifeBacktestPortfolioStates,
  getRealLifeBacktestCompletedTrades,
  getRealLifeBacktestPerformance,
  getRealLifeBacktestEquity,
  getRealLifeBacktestDrawdownSeries,
  getRealLifeBacktestDrawdownPeriods,
  getRealLifeBacktestReport
} from '../lib/realLifeEngine';

export async function createBacktest(payload: BacktestCreatePayload): Promise<Backtest> {
  try {
    return await api.post<Backtest>('/backtests', payload);
  } catch {}
  return runRealLifeBacktest(payload);
}

export async function fetchBacktests(instrumentId?: string, limit: number = 50): Promise<BacktestListResponse> {
  try {
    const query = new URLSearchParams();
    if (instrumentId) query.append('instrument_id', instrumentId);
    query.append('limit', limit.toString());
    const res = await api.get<BacktestListResponse>(`/backtests?${query.toString()}`);
    if (res && Array.isArray(res.items) && res.items.length > 0) return res;
  } catch {}

  const items = getStoredBacktests();
  return {
    items,
    total: items.length,
    limit,
    offset: 0,
  };
}

export async function fetchBacktestById(backtestId: string): Promise<Backtest> {
  try {
    return await api.get<Backtest>(`/backtests/${backtestId}`);
  } catch {}
  const list = getStoredBacktests();
  const found = list.find((b) => b.id === backtestId);
  return found || list[0];
}

export async function fetchBacktestTrades(backtestId: string, limit: number = 500): Promise<TradeEvent[]> {
  try {
    const res = await api.get<TradeEvent[]>(`/backtests/${backtestId}/trades?limit=${limit}`);
    if (Array.isArray(res) && res.length > 0) return res;
  } catch {}
  return getRealLifeBacktestTrades(backtestId);
}

export async function fetchBacktestPortfolioStates(backtestId: string, limit: number = 5000): Promise<PortfolioState[]> {
  try {
    const res = await api.get<PortfolioState[]>(`/backtests/${backtestId}/states?limit=${limit}`);
    if (Array.isArray(res) && res.length > 0) return res;
  } catch {}
  return getRealLifeBacktestPortfolioStates(backtestId);
}

export async function fetchBacktestCompletedTrades(backtestId: string, limit: number = 500): Promise<CompletedTrade[]> {
  try {
    const res = await api.get<CompletedTrade[]>(`/backtests/${backtestId}/completed-trades?limit=${limit}`);
    if (Array.isArray(res) && res.length > 0) return res;
  } catch {}
  return getRealLifeBacktestCompletedTrades(backtestId);
}

export async function fetchBacktestPerformance(backtestId: string, riskFreeRate: number = 0.0): Promise<BacktestPerformanceMetrics> {
  try {
    return await api.get<BacktestPerformanceMetrics>(`/backtests/${backtestId}/performance?risk_free_rate=${riskFreeRate}`);
  } catch {}
  return getRealLifeBacktestPerformance(backtestId);
}

export async function fetchBacktestEquity(backtestId: string): Promise<BacktestEquityData> {
  try {
    return await api.get<BacktestEquityData>(`/backtests/${backtestId}/equity`);
  } catch {}
  return getRealLifeBacktestEquity(backtestId);
}

export async function fetchBacktestDrawdownSeries(backtestId: string): Promise<BacktestDrawdownSeries> {
  try {
    return await api.get<BacktestDrawdownSeries>(`/backtests/${backtestId}/drawdown`);
  } catch {}
  return getRealLifeBacktestDrawdownSeries(backtestId);
}

export async function fetchBacktestDrawdownPeriods(backtestId: string): Promise<BacktestDrawdownPeriods> {
  try {
    return await api.get<BacktestDrawdownPeriods>(`/backtests/${backtestId}/drawdown-periods`);
  } catch {}
  return getRealLifeBacktestDrawdownPeriods(backtestId);
}

export async function fetchBacktestReport(backtestId: string): Promise<BacktestReport> {
  try {
    return await api.get<BacktestReport>(`/backtests/${backtestId}/report`);
  } catch {}
  return getRealLifeBacktestReport(backtestId);
}

export function getBacktestReportExportUrl(backtestId: string, format: 'json' | 'csv' | 'pdf'): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  return `${apiBase}/backtests/${backtestId}/report/export?format=${format}`;
}
