export type Asset = {
  symbol: string;
  name?: string;
  assetType?: string;
};

export type OHLCV = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
