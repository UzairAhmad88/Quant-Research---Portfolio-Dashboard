import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Search } from 'lucide-react';
import {
  fetchInstruments,
  searchInstruments,
  addPortfolioHolding,
  InstrumentItem,
  InstrumentSearchResult,
  PortfolioHoldingItem,
} from '../../lib/apiClient';

interface AddHoldingModalProps {
  portfolioId: string;
  isOpen: boolean;
  remainingCash: number;
  onClose: () => void;
  onSuccess: (newHolding: PortfolioHoldingItem) => void;
}

export const AddHoldingModal: React.FC<AddHoldingModalProps> = ({
  portfolioId,
  isOpen,
  remainingCash,
  onClose,
  onSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [availableInstruments, setAvailableInstruments] = useState<InstrumentItem[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentItem | null>(null);
  const [searchResults, setSearchResults] = useState<InstrumentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [quantity, setQuantity] = useState<number>(100);
  const [entryPrice, setEntryPrice] = useState<number>(150);
  const [targetWeight, setTargetWeight] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch registered instruments list
      fetchInstruments({ limit: 50, active: true })
        .then((res) => {
          setAvailableInstruments(res.items);
          if (res.items.length > 0 && !selectedInstrument) {
            setSelectedInstrument(res.items[0]);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [isOpen]);

  // Handle Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setIsSearching(true);
      searchInstruments(searchQuery)
        .then((res) => setSearchResults(res))
        .catch((err) => console.error(err))
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const totalHoldingCost = quantity * entryPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedInstrument) {
      setErrorMsg('Please select a valid instrument.');
      return;
    }

    if (quantity <= 0) {
      setErrorMsg('Quantity must be greater than zero.');
      return;
    }

    if (entryPrice <= 0) {
      setErrorMsg('Entry price must be greater than zero.');
      return;
    }

    if (totalHoldingCost > remainingCash) {
      setErrorMsg(
        `Holding cost ($${totalHoldingCost.toLocaleString()}) exceeds available uninvested cash ($${remainingCash.toLocaleString()}).`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await addPortfolioHolding(portfolioId, {
        instrument_id: selectedInstrument.id,
        quantity,
        entry_price: entryPrice,
        target_weight: targetWeight || undefined,
      });
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add holding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center space-x-2 text-text-primary">
            <PlusCircle className="h-5 w-5 text-brand-primary" />
            <h2 className="text-base font-semibold">Add Position Holding</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-text-muted hover:bg-surface hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {errorMsg && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-financial-negative">
              {errorMsg}
            </div>
          )}

          {/* Instrument Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Select Instrument <span className="text-financial-negative">*</span>
            </label>

            {/* Quick Dropdown or Search */}
            <div className="space-y-2">
              <select
                value={selectedInstrument?.id || ''}
                onChange={(e) => {
                  const found = availableInstruments.find((i) => i.id === e.target.value);
                  if (found) setSelectedInstrument(found);
                }}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                {availableInstruments.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.symbol} — {inst.name} ({inst.asset_type})
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Or search for new ticker symbol..."
                  className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-8 text-xs text-text-primary placeholder-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
                {isSearching && (
                  <div className="absolute right-3 top-2.5">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
                  </div>
                )}
              </div>

              {/* Search Results list */}
              {searchResults.length > 0 && (
                <div className="max-h-36 overflow-y-auto rounded-md border border-border bg-surface p-1 text-xs shadow-dropdown">
                  {searchResults.map((res, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        if (res.existing_id) {
                          const existing = availableInstruments.find((x) => x.id === res.existing_id);
                          if (existing) setSelectedInstrument(existing);
                        }
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="flex cursor-pointer items-center justify-between rounded p-2 hover:bg-surface-elevated text-text-primary"
                    >
                      <span className="font-semibold text-text-primary">{res.symbol}</span>
                      <span className="text-text-muted">{res.name}</span>
                      <span className="text-text-muted">{res.asset_type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Instrument Preview */}
          {selectedInstrument && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-emerald-900">{selectedInstrument.symbol}</span>
                <span className="text-emerald-700 ml-2">{selectedInstrument.name}</span>
              </div>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-800 font-mono text-2xs border border-emerald-200 font-semibold">
                {selectedInstrument.asset_type}
              </span>
            </div>
          )}

          {/* Quantity & Entry Price Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary">
                Quantity <span className="text-financial-negative">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.00000001"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary font-mono focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary">
                Entry Price ($) <span className="text-financial-negative">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary font-mono focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary">
              Target Weight (%) <span className="text-text-muted">(Optional planning target)</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={targetWeight}
              onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary font-mono focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          {/* Investment Summary Bar */}
          <div className="rounded-md border border-border bg-surface p-3 text-xs space-y-1">
            <div className="flex justify-between text-text-muted">
              <span>Position Cost Value:</span>
              <span className="font-mono font-semibold text-text-primary">
                ${totalHoldingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Available Cash:</span>
              <span className="font-mono text-financial-positive font-semibold">
                ${remainingCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-xs font-semibold text-text-muted hover:bg-surface hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-brand-primary px-4 py-2 text-xs font-semibold text-white shadow-button hover:bg-brand-deep disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Add Holding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
