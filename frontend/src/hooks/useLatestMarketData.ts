import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchLatestMarketData,
  fetchLatestMarketDataBatch,
  fetchProviderCapabilities,
  LatestMarketDataResponse,
  ProviderCapabilities,
} from '../lib/apiClient';

export function useLatestMarketData(
  instrumentId?: string,
  symbol?: string,
  frequency: string = 'DAILY',
  provider: string = 'yahoo_finance'
) {
  return useQuery<LatestMarketDataResponse, Error>({
    queryKey: ['latest-market-data', instrumentId || symbol || '', frequency, provider],
    queryFn: () =>
      fetchLatestMarketData({
        instrument_id: instrumentId,
        symbol: symbol,
        frequency,
        provider,
        force_refresh: false,
      }),
    enabled: Boolean(instrumentId || symbol),
    staleTime: 60 * 1000, // 1 minute stale time (conservative research cache)
    refetchOnWindowFocus: false,
  });
}

export function useLatestMarketDataBatch(
  instrumentIds?: string[],
  symbols?: string[],
  frequency: string = 'DAILY',
  provider: string = 'yahoo_finance'
) {
  const idsKey = (instrumentIds || []).sort().join(',');
  const symbolsKey = (symbols || []).sort().join(',');

  return useQuery<LatestMarketDataResponse[], Error>({
    queryKey: ['latest-market-data-batch', idsKey, symbolsKey, frequency, provider],
    queryFn: () =>
      fetchLatestMarketDataBatch({
        instrument_ids: instrumentIds,
        symbols,
        frequency,
        provider,
        force_refresh: false,
      }),
    enabled: Boolean((instrumentIds && instrumentIds.length > 0) || (symbols && symbols.length > 0)),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useProviderCapabilities(provider?: string) {
  return useQuery<ProviderCapabilities[], Error>({
    queryKey: ['provider-capabilities', provider || 'all'],
    queryFn: () => fetchProviderCapabilities(provider),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRefreshLatestMarketData() {
  const queryClient = useQueryClient();

  return useMutation<
    LatestMarketDataResponse,
    Error,
    { instrumentId?: string; symbol?: string; frequency?: string; provider?: string }
  >({
    mutationFn: (variables) =>
      fetchLatestMarketData({
        instrument_id: variables.instrumentId,
        symbol: variables.symbol,
        frequency: variables.frequency || 'DAILY',
        provider: variables.provider || 'yahoo_finance',
        force_refresh: true,
      }),
    onSuccess: (data, variables) => {
      const keyId = variables.instrumentId || variables.symbol || data.symbol;
      const freq = variables.frequency || 'DAILY';
      const prov = variables.provider || 'yahoo_finance';
      queryClient.setQueryData(['latest-market-data', keyId, freq, prov], data);
      queryClient.invalidateQueries({ queryKey: ['market-data'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
  });
}
