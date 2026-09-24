import { useQuery } from '@tanstack/react-query';
import { fetchSignals, fetchSignalById } from '../services/signalService';
import { SignalFilterParams, SignalListResponse, SignalEvent } from '../types/signal';

export function useSignals(params: SignalFilterParams) {
  return useQuery<SignalListResponse, Error>({
    queryKey: ['signals', params],
    queryFn: () => fetchSignals(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSignalDetail(signalId?: string) {
  return useQuery<SignalEvent, Error>({
    queryKey: ['signal-detail', signalId],
    queryFn: () => fetchSignalById(signalId!),
    enabled: Boolean(signalId),
    staleTime: 5 * 60 * 1000,
  });
}
