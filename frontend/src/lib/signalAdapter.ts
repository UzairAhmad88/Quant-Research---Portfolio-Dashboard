import { SignalEvent, SignalType, SignalState } from '../types/signal';

export function getSignalStateLabel(signalType: SignalType): SignalState {
  return signalType === 'BUY' ? 'BULLISH' : 'BEARISH';
}

export function formatSignalBadgeStyle(signalType: SignalType): { color: string; bg: string; border: string } {
  if (signalType === 'BUY') {
    return {
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
    };
  }
  return {
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  };
}

export function filterSignalsByType(signals: SignalEvent[], filterMode: 'all' | 'BUY' | 'SELL'): SignalEvent[] {
  if (filterMode === 'all') return signals;
  return signals.filter((s) => s.signal_type === filterMode);
}

export function sortSignalsByTimestamp(signals: SignalEvent[], order: 'asc' | 'desc' = 'desc'): SignalEvent[] {
  return [...signals].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return order === 'desc' ? timeB - timeA : timeA - timeB;
  });
}
