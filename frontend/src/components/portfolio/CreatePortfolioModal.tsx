import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { createPortfolio, PortfolioItem } from '../../lib/apiClient';

interface CreatePortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPortfolio: PortfolioItem) => void;
}

export const CreatePortfolioModal: React.FC<CreatePortfolioModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [initialCapital, setInitialCapital] = useState<number>(100000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Portfolio name is required.');
      return;
    }

    if (initialCapital <= 0) {
      setErrorMsg('Initial capital must be greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createPortfolio({
        name: name.trim(),
        description: description.trim() || undefined,
        base_currency: baseCurrency,
        initial_capital: initialCapital,
      });
      onSuccess(created);
      onClose();
      // Reset form
      setName('');
      setDescription('');
      setInitialCapital(100000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create portfolio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center space-x-2 text-text-primary">
            <FolderPlus className="h-5 w-5 text-brand-primary" />
            <h2 className="text-base font-semibold">Create New Portfolio</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-text-muted hover:bg-surface hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {errorMsg && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-financial-negative">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-primary">
              Portfolio Name <span className="text-financial-negative">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Quantitative Multi-Asset Fund"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary">
              Description <span className="text-text-muted">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Portfolio strategy objectives and asset notes..."
              rows={3}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary">Base Currency</label>
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary">
                Initial Capital <span className="text-financial-negative">*</span>
              </label>
              <input
                type="number"
                step="1000"
                min="1"
                value={initialCapital}
                onChange={(e) => setInitialCapital(parseFloat(e.target.value) || 0)}
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary font-mono"
                required
              />
            </div>
          </div>

          {/* Footer Actions */}
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
              {isSubmitting ? 'Creating...' : 'Create Portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
