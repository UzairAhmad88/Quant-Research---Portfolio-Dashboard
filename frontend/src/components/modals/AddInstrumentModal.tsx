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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#111827] border border-[#263244] rounded-lg shadow-2xl p-5 text-[#F8FAFC]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#3B82F6]" />
            <h3 className="text-sm font-semibold text-[#F8FAFC]">Add Instrument to Local Master</h3>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#F8FAFC]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mt-4">
          <label className="block text-xs font-medium text-[#94A3B8] mb-1">
            Search Symbol or Company Name
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
              <input
                type="text"
                placeholder="e.g. NVDA, Tesla, SPY, ETH-USD..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#0B0F17] border border-[#263244] rounded text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6]"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSearching ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-3 p-2.5 bg-[#7F1D1D]/30 border border-[#EF4444]/40 rounded text-xs text-[#FCA5A5]">
            {error}
          </div>
        )}

        {/* Search Results */}
        <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-1">
          {results.length === 0 && !isSearching && query.trim() && (
            <div className="py-6 text-center text-xs text-[#64748B]">
              No instruments found matching &quot;{query}&quot;. Try ticker symbols like AAPL, MSFT, BTC-USD.
            </div>
          )}

          {results.map((item) => (
            <div
              key={item.symbol}
              className="p-3 bg-[#0B0F17] border border-[#1E293B] hover:border-[#3B82F6]/50 rounded flex items-center justify-between transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#F8FAFC]">{item.symbol}</span>
                  <Badge variant="default" className="text-[10px]">
                    {item.asset_type}
                  </Badge>
                  <span className="text-[10px] text-[#64748B] font-mono-num">{item.exchange}</span>
                </div>
                <div className="text-xs text-[#94A3B8] mt-0.5">{item.name}</div>
              </div>

              {item.existing_id ? (
                <div className="flex items-center gap-1 text-xs text-[#10B981]">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>In Master</span>
                </div>
              ) : (
                <button
                  onClick={() => handleAdd(item)}
                  disabled={isSubmitting}
                  className="px-3 py-1 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-[#1E293B] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1E293B] hover:bg-[#263244] text-[#94A3B8] text-xs font-medium rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
