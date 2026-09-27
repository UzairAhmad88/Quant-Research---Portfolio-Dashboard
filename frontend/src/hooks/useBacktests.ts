import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createBacktest,
  fetchBacktests,
  fetchBacktestById,
  fetchBacktestTrades,
  fetchBacktestPortfolioStates,
  fetchBacktestCompletedTrades,
  fetchBacktestPerformance,
  fetchBacktestEquity,
  fetchBacktestDrawdownSeries,
  fetchBacktestDrawdownPeriods,
  fetchBacktestReport
} from '../services/backtestService';
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

export function useRunBacktest() {
  const queryClient = useQueryClient();
  return useMutation<Backtest, Error, BacktestCreatePayload>({
    mutationFn: (payload) => createBacktest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backtests'] });
    },
  });
}

export function useBacktests(instrumentId?: string) {
  return useQuery<BacktestListResponse, Error>({
    queryKey: ['backtests', instrumentId],
    queryFn: () => fetchBacktests(instrumentId),
    staleTime: 60 * 1000,
  });
}

export function useBacktestDetail(backtestId?: string) {
  return useQuery<Backtest, Error>({
    queryKey: ['backtest-detail', backtestId],
    queryFn: () => fetchBacktestById(backtestId!),
    enabled: Boolean(backtestId),
  });
}

export function useBacktestTrades(backtestId?: string) {
  return useQuery<TradeEvent[], Error>({
    queryKey: ['backtest-trades', backtestId],
    queryFn: () => fetchBacktestTrades(backtestId!),
    enabled: Boolean(backtestId),
  });
}

export function useBacktestPortfolioStates(backtestId?: string) {
  return useQuery<PortfolioState[], Error>({
    queryKey: ['backtest-states', backtestId],
    queryFn: () => fetchBacktestPortfolioStates(backtestId!),
    enabled: Boolean(backtestId),
  });
}

export function useBacktestCompletedTrades(backtestId?: string) {
  return useQuery<CompletedTrade[], Error>({
    queryKey: ['backtest-completed-trades', backtestId],
    queryFn: () => fetchBacktestCompletedTrades(backtestId!),
    enabled: Boolean(backtestId),
  });
}

export function useBacktestPerformance(backtestId?: string, riskFreeRate: number = 0.0) {
  return useQuery<BacktestPerformanceMetrics, Error>({
    queryKey: ['backtest-performance', backtestId, riskFreeRate],
    queryFn: () => fetchBacktestPerformance(backtestId!, riskFreeRate),
    enabled: Boolean(backtestId),
  });
}

export function useBacktestEquity(backtestId?: string) {
  return useQuery<BacktestEquityData, Error>({
    queryKey: ['backtest-equity', backtestId],
    queryFn: () => fetchBacktestEquity(backtestId!),
    enabled: Boolean(backtestId),
  });
}

export function useBacktestDrawdownSeries(backtestId?: string) {
  return useQuery<BacktestDrawdownSeries, Error>({
    queryKey: ['backtest-drawdown-series', backtestId],
    queryFn: () => fetchBacktestDrawdownSeries(backtestId!),
    enabled: Boolean(backtestId),
  });
}

export function useBacktestDrawdownPeriods(backtestId?: string) {
  return useQuery<BacktestDrawdownPeriods, Error>({
    queryKey: ['backtest-drawdown-periods', backtestId],
    queryFn: () => fetchBacktestDrawdownPeriods(backtestId!),
    enabled: Boolean(backtestId),
  });
}

export function useBacktestReport(backtestId?: string) {
  return useQuery<BacktestReport, Error>({
    queryKey: ['backtest-report', backtestId],
    queryFn: () => fetchBacktestReport(backtestId!),
    enabled: Boolean(backtestId),
  });
}


