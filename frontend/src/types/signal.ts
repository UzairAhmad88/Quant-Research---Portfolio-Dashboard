export type SignalType = 'BUY' | 'SELL';
export type SignalState = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type SignalSource = 'STRATEGY_ENGINE' | 'MANUAL' | 'EXTERNAL' | 'MODEL';
export type StrategyType = 'MOVING_AVERAGE';

export interface StrategyConfiguration {
  id: string;
  strategy_type: string;
  instrument_id: string;
  configuration_hash: string;
  ma_type?: string;
  fast_window?: number;
  slow_window?: number;
  price_source?: string;
  configuration_json: Record<string, any>;
  active: boolean;
  created_at: string;
}

export interface SignalEvent {
  id: string;
  strategy_configuration_id: string;
  instrument_id: string;
  strategy_type: string;
  timestamp: string;
  signal_type: SignalType;
  signal_state: SignalState;
  price: number;
  source: SignalSource | string;
  metadata?: Record<string, any>;
  created_at: string;
  configuration?: StrategyConfiguration;
}

export interface SignalListResponse {
  items: SignalEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface SignalFilterParams {
  instrument_id?: string;
  strategy_type?: string;
  strategy_configuration_id?: string;
  signal_type?: SignalType;
  signal_state?: SignalState;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}
