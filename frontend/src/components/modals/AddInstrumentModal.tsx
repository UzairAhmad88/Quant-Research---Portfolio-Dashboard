import React, { useState } from 'react';
import { searchInstruments, createInstrument, InstrumentSearchResult, InstrumentItem } from '../../lib/apiClient';
import { Search, Plus, X, RefreshCw, CheckCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface AddInstrumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (instrument: InstrumentItem) => void;
}

export const AddInstrumentModal: React.FC<AddInstrumentModalProps> = ({ isOpen, onClose, onAdded }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<InstrumentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const res = await searchInstruments(query.trim());
      setResults(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async (item: InstrumentSearchResult) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createInstrument({
        symbol: item.symbol,
        name: item.name,
        asset_type: item.asset_type,
        exchange: item.exchange || 'UNKNOWN',
        currency: item.currency || 'USD',
        provider_symbol: item.provider_symbol || item.symbol,
      });
      onAdded(created);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add instrument to database');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-xl p-5 text-text-primary">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-forest-700" />
            <h3 className="text-sm font-semibold text-text-primary font-sans">Add Instrument to Local Master</h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mt-4">
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Search Symbol or Company Name
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="e.g. NVDA, Tesla, SPY, ETH-USD..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-forest-50/50 border border-forest-100 rounded-lg text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-forest-600 focus:bg-white transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
            >
              {isSearching ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
            {error}
          </div>
        )}

        {/* Search Results */}
        <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-1">
          {results.length === 0 && !isSearching && query.trim() && (
            <div className="py-6 text-center text-xs text-text-muted">
              No instruments found matching &quot;{query}&quot;. Try ticker symbols like AAPL, MSFT, BTC-USD.
            </div>
          )}

          {results.map((item) => (
            <div
              key={item.symbol}
              className="p-3 bg-forest-50/40 border border-forest-100 hover:border-forest-300 rounded-lg flex items-center justify-between transition-colors shadow-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-text-primary">{item.symbol}</span>
                  <Badge variant="default" className="text-[10px]">
                    {item.asset_type}
                  </Badge>
                  <span className="text-[10px] text-text-muted font-mono-num">{item.exchange}</span>
                </div>
                <div className="text-xs text-text-secondary mt-0.5">{item.name}</div>
              </div>

              {item.existing_id ? (
                <div className="flex items-center gap-1 text-xs text-forest-700 font-semibold">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>In Master</span>
                </div>
              ) : (
                <button
                  onClick={() => handleAdd(item)}
                  disabled={isSubmitting}
                  className="px-3 py-1 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 shadow-xs"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-forest-50 text-text-primary text-xs font-medium rounded-lg border border-border transition-colors shadow-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
