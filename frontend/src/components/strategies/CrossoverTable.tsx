import React, { useState, useMemo } from 'react';
import { CrossoverEvent } from '../../lib/apiClient';
import { filterCrossoverEvents, sortCrossoverEvents, formatDateLabel, formatCurrency } from '../../lib/strategyChartAdapter';
import { Filter, ArrowUpDown, Info } from 'lucide-react';
import { SignalDetailModal } from '../signals/SignalDetailModal';
import { SignalEvent } from '../../types/signal';

interface CrossoverTableProps {
  crossovers: CrossoverEvent[];
  symbol: string;
  onViewOnChart?: (timestamp: string) => void;
}

export const CrossoverTable: React.FC<CrossoverTableProps> = ({ crossovers, symbol, onViewOnChart }) => {
  const [filterMode, setFilterMode] = useState<'all' | 'buy' | 'sell'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedSignal, setSelectedSignal] = useState<SignalEvent | null>(null);

  const processedCrossovers = useMemo(() => {
    const filtered = filterCrossoverEvents(crossovers, filterMode);
    return sortCrossoverEvents(filtered, sortOrder);
  }, [crossovers, filterMode, sortOrder]);

  const handleRowClick = (cross: CrossoverEvent) => {
    const sigType = cross.signal as 'BUY' | 'SELL';
    const sigEvent: SignalEvent = {
      id: `sig-${cross.timestamp}-${cross.signal}`,
      strategy_configuration_id: 'config-moving-average',
      instrument_id: symbol,
      strategy_type: 'MOVING_AVERAGE',
      timestamp: cross.timestamp,
      signal_type: sigType,
      signal_state: sigType === 'BUY' ? 'BULLISH' : 'BEARISH',
      price: cross.price,
      source: 'STRATEGY_ENGINE',
      metadata: {
        fast_ma: cross.fast_ma,
        slow_ma: cross.slow_ma,
        event_type: cross.event_type
      },
      created_at: cross.timestamp
    };
    setSelectedSignal(sigEvent);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
      {/* Table Header & Controls */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Signal &amp; Crossover History Log ({symbol})
          </h3>
          <p className="text-xs text-text-muted">
            Standardized signal events generated from validated price observations
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          {/* Signal Filter */}
          <div className="flex items-center gap-1.5 bg-card border border-border px-2 py-1 rounded-md">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as 'all' | 'buy' | 'sell')}
              className="bg-transparent text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="all">All Signals ({crossovers.length})</option>
              <option value="buy">BUY Only</option>
              <option value="sell">SELL Only</option>
            </select>
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 bg-card border border-border px-2.5 py-1 rounded-md text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {processedCrossovers.length === 0 ? (
        <div className="p-8 text-center text-text-muted font-mono text-xs">
          No crossover events match current filter selection ({filterMode.toUpperCase()}).
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-surface text-text-muted border-b border-border">
              <tr>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Signal Event</th>
                <th className="py-3 px-4 font-medium">Research State</th>
                <th className="py-3 px-4 font-medium text-right">Observation Price</th>
                <th className="py-3 px-4 font-medium text-right">Fast MA</th>
                <th className="py-3 px-4 font-medium text-right">Slow MA</th>
                <th className="py-3 px-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-secondary">
              {processedCrossovers.map((cross, idx) => {
                const isBullish = cross.event_type === 'BULLISH';
                return (
                  <tr
                    key={idx}
                    onClick={() => handleRowClick(cross)}
                    className="hover:bg-surface/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 text-text-primary">{formatDateLabel(cross.timestamp)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${
                          isBullish
                            ? 'text-financial-positive bg-emerald-50 border-emerald-200'
                            : 'text-financial-negative bg-red-50 border-red-200'
                        }`}
                      >
                        {cross.signal}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-medium ${isBullish ? 'text-financial-positive' : 'text-financial-negative'}`}>
                        {cross.event_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-text-primary">
                      {formatCurrency(cross.price)}
                    </td>
                    <td className="py-3 px-4 text-right text-brand-primary font-bold">{formatCurrency(cross.fast_ma)}</td>
                    <td className="py-3 px-4 text-right text-amber-600 font-bold">{formatCurrency(cross.slow_ma)}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(cross);
                        }}
                        className="p-1 rounded text-text-muted hover:text-brand-primary hover:bg-surface-elevated transition-colors inline-flex items-center gap-1 text-[11px]"
                        title="Inspect Signal Detail"
                      >
                        <Info className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Signal Detail Inspection Modal */}
      <SignalDetailModal
        signal={selectedSignal}
        isOpen={Boolean(selectedSignal)}
        onClose={() => setSelectedSignal(null)}
        onViewOnChart={onViewOnChart}
      />
    </div>
  );
};

