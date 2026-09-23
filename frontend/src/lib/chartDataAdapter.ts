import { OHLCVItem } from './apiClient';

export interface ChartCandleData {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ChartLinePoint {
  time: string;
  value: number;
}

export interface ChartVolumePoint {
  time: string;
  value: number;
  color: string;
}

export interface NormalizedChartData {
  candlestickData: ChartCandleData[];
  lineData: ChartLinePoint[];
  volumeData: ChartVolumePoint[];
  validCount: number;
  invalidCount: number;
}

export function validateAndFormatBar(bar: OHLCVItem, priceMode: 'close' | 'adjusted_close' = 'close'): {
  candle: ChartCandleData | null;
  line: ChartLinePoint | null;
  volume: ChartVolumePoint | null;
} {
  const open = Number(bar.open);
  const high = Number(bar.high);
  const low = Number(bar.low);
  const close = Number(bar.close);
  const adjClose = bar.adjusted_close !== undefined && bar.adjusted_close !== null ? Number(bar.adjusted_close) : close;
  const volume = Number(bar.volume || 0);

  // Validation
  const isValid =
    !isNaN(open) &&
    !isNaN(high) &&
    !isNaN(low) &&
    !isNaN(close) &&
    open > 0 &&
    high > 0 &&
    low > 0 &&
    close > 0 &&
    volume >= 0 &&
    high >= Math.max(open, close, low) &&
    low <= Math.min(open, close);

  if (!isValid) {
    return { candle: null, line: null, volume: null };
  }

  // Format date to YYYY-MM-DD
  let dateStr = '';
  try {
    const d = new Date(bar.timestamp);
    dateStr = d.toISOString().split('T')[0];
  } catch {
    return { candle: null, line: null, volume: null };
  }

  const selectedClose = priceMode === 'adjusted_close' ? adjClose : close;

  const candle: ChartCandleData = {
    time: dateStr,
    open: open,
    high: high,
    low: low,
    close: selectedClose,
  };

  const line: ChartLinePoint = {
    time: dateStr,
    value: selectedClose,
  };

  // Muted green (#22C55E) for up days, muted red (#EF4444) for down days
  const isUp = close >= open;
  const volumeColor = isUp ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';

  const volumePoint: ChartVolumePoint = {
    time: dateStr,
    value: volume,
    color: volumeColor,
  };

  return { candle, line, volume: volumePoint };
}

export function processChartData(
  rawBars: OHLCVItem[],
  priceMode: 'close' | 'adjusted_close' = 'close',
  maxPoints: number = 3000
): NormalizedChartData {
  if (!rawBars || rawBars.length === 0) {
    return {
      candlestickData: [],
      lineData: [],
      volumeData: [],
      validCount: 0,
      invalidCount: 0,
    };
  }

  // Sort ascending by timestamp
  const sorted = [...rawBars].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let validCount = 0;
  let invalidCount = 0;

  const rawCandles: ChartCandleData[] = [];
  const rawLines: ChartLinePoint[] = [];
  const rawVolumes: ChartVolumePoint[] = [];
  const seenTimes = new Set<string>();

  for (const bar of sorted) {
    const { candle, line, volume } = validateAndFormatBar(bar, priceMode);
    if (candle && line && volume) {
      if (!seenTimes.has(candle.time)) {
        seenTimes.add(candle.time);
        rawCandles.push(candle);
        rawLines.push(line);
        rawVolumes.push(volume);
        validCount++;
      }
    } else {
      invalidCount++;
    }
  }

  // Downsample for rendering optimization if dataset exceeds maxPoints threshold
  if (rawCandles.length > maxPoints) {
    const factor = Math.ceil(rawCandles.length / maxPoints);
    const downsampledCandles: ChartCandleData[] = [];
    const downsampledLines: ChartLinePoint[] = [];
    const downsampledVolumes: ChartVolumePoint[] = [];

    for (let i = 0; i < rawCandles.length; i += factor) {
      const chunkCandles = rawCandles.slice(i, i + factor);
      const chunkVolumes = rawVolumes.slice(i, i + factor);

      const first = chunkCandles[0];
      const last = chunkCandles[chunkCandles.length - 1];

      const high = Math.max(...chunkCandles.map((c) => c.high));
      const low = Math.min(...chunkCandles.map((c) => c.low));
      const totalVol = chunkVolumes.reduce((sum, v) => sum + v.value, 0);

      const dsCandle: ChartCandleData = {
        time: last.time,
        open: first.open,
        high: high,
        low: low,
        close: last.close,
      };

      downsampledCandles.push(dsCandle);
      downsampledLines.push({ time: last.time, value: last.close });
      downsampledVolumes.push({
        time: last.time,
        value: totalVol,
        color: last.close >= first.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
      });
    }

    return {
      candlestickData: downsampledCandles,
      lineData: downsampledLines,
      volumeData: downsampledVolumes,
      validCount,
      invalidCount,
    };
  }

  return {
    candlestickData: rawCandles,
    lineData: rawLines,
    volumeData: rawVolumes,
    validCount,
    invalidCount,
  };
}
