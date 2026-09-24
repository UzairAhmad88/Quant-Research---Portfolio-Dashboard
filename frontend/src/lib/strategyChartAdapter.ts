import { StrategyObservation, CrossoverEvent } from './apiClient';

export interface ChartBounds {
  minVal: number;
  maxVal: number;
}

export function calculateChartBounds(series: StrategyObservation[]): ChartBounds {
  let min = Infinity;
  let max = -Infinity;

  series.forEach((pt) => {
    if (pt.price !== null && !isNaN(pt.price)) {
      min = Math.min(min, pt.price);
      max = Math.max(max, pt.price);
    }
    if (pt.fast_ma !== null && !isNaN(pt.fast_ma)) {
      min = Math.min(min, pt.fast_ma);
      max = Math.max(max, pt.fast_ma);
    }
    if (pt.slow_ma !== null && !isNaN(pt.slow_ma)) {
      min = Math.min(min, pt.slow_ma);
      max = Math.max(max, pt.slow_ma);
    }
  });

  if (min === Infinity) return { minVal: 0, maxVal: 100 };
  const pad = (max - min) * 0.08;
  return { minVal: Math.max(0, min - pad), maxVal: max + pad };
}

export function formatDateLabel(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return isoStr;
  }
}

export function formatCurrency(val: number | null): string {
  if (val === null || isNaN(val)) return 'N/A';
  return `$${val.toFixed(2)}`;
}

export function filterCrossoverEvents(
  crossovers: CrossoverEvent[],
  filterMode: 'all' | 'buy' | 'sell'
): CrossoverEvent[] {
  if (filterMode === 'buy') {
    return crossovers.filter((c) => c.signal.toUpperCase() === 'BUY' || c.event_type.toUpperCase() === 'BULLISH');
  }
  if (filterMode === 'sell') {
    return crossovers.filter((c) => c.signal.toUpperCase() === 'SELL' || c.event_type.toUpperCase() === 'BEARISH');
  }
  return crossovers;
}

export function sortCrossoverEvents(
  crossovers: CrossoverEvent[],
  sortOrder: 'desc' | 'asc' = 'desc'
): CrossoverEvent[] {
  return [...crossovers].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });
}
