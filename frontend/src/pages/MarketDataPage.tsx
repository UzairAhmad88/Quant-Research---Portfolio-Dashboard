import React from 'react';
import { PlaceholderModule } from '../components/common/PlaceholderModule';

export const MarketDataPage: React.FC = () => {
  return (
    <PlaceholderModule
      title="Market Data Ingestion Module"
      step="Step 02 — Data Architecture & Providers"
      purpose="Responsible for downloading historical price series (OHLCV), managing instrument metadata across Equities, ETFs, Indices, and Crypto, and storing sanitized time-series data in PostgreSQL."
      status="SCAFFOLDED"
      supportedAssets={['EQUITY', 'ETF', 'INDEX', 'CRYPTO']}
      upcomingFeatures={[
        'Market Data Provider Integration (Yahoo Finance / Polygon / Alpaca)',
        'Historical Bar Ingestion & Resampling (1m, 1h, 1d, 1w)',
        'Instrument Master Registry & Symbol Lookup',
        'Data Quality Checks (Missing Bars, Outliers, Splits Adjustments)',
        'Local PostgreSQL Caching & Fast Retrieval Engine',
      ]}
    />
  );
};
