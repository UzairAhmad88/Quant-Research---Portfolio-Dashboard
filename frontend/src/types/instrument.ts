/**
 * Instrument domain types for Quant Research Dashboard.
 * Designed around generic Instrument abstractions supporting Stocks, ETFs, Indices, and Crypto.
 */

export type AssetClass = 'EQUITY' | 'ETF' | 'INDEX' | 'CRYPTO';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'BTC' | 'ETH';

export interface Instrument {
  id: string;
  ticker: string;
  name: string;
  assetClass: AssetClass;
  currency: Currency;
  exchange: string;
  sector?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface InstrumentSummary {
  ticker: string;
  name: string;
  assetClass: AssetClass;
  lastPrice?: number;
  change24h?: number;
  change24hPercent?: number;
  volume24h?: number;
  updatedAt?: string;
}

export interface ModuleStatus {
  id: string;
  name: string;
  path: string;
  step: string;
  status: 'COMPLETED' | 'IN_DEVELOPMENT' | 'SCAFFOLDED' | 'PLANNED';
  description: string;
}
