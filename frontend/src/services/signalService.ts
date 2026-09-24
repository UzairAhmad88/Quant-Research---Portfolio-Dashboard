import { api } from './api';
import { SignalListResponse, SignalEvent, SignalFilterParams } from '../types/signal';

export async function fetchSignals(params: SignalFilterParams): Promise<SignalListResponse> {
  const query = new URLSearchParams();
  if (params.instrument_id) query.append('instrument_id', params.instrument_id);
  if (params.strategy_type) query.append('strategy_type', params.strategy_type);
  if (params.strategy_configuration_id) query.append('strategy_configuration_id', params.strategy_configuration_id);
  if (params.signal_type) query.append('signal_type', params.signal_type);
  if (params.signal_state) query.append('signal_state', params.signal_state);
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  if (params.limit !== undefined) query.append('limit', params.limit.toString());
  if (params.offset !== undefined) query.append('offset', params.offset.toString());

  return api.get<SignalListResponse>(`/signals?${query.toString()}`);
}

export async function fetchSignalById(signalId: string): Promise<SignalEvent> {
  return api.get<SignalEvent>(`/signals/${signalId}`);
}
