import React from 'react';
import { useResearchContext } from '../../hooks/useResearchContext';
import { RangePreset, PriceSource } from '../../lib/researchContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Search, RotateCcw, SlidersHorizontal } from 'lucide-react';

interface ResearchContextBarProps {
  availableInstruments?: Array<{ symbol: string; name: string; id: string }>;
  showInstrumentSelect?: boolean;
  showRangeSelect?: boolean;
  showPriceSourceSelect?: boolean;
  className?: string;
}

const RANGE_PRESETS: RangePreset[] = ['1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'];

export const ResearchContextBar: React.FC<ResearchContextBarProps> = ({
  availableInstruments = [],
  showInstrumentSelect = true,
  showRangeSelect = true,
  showPriceSourceSelect = true,
  className = '',
}) => {
  const { context, updateContext, clearContext } = useResearchContext();

  const currentSymbol = context.symbol || (availableInstruments[0]?.symbol ?? 'AAPL');
  const currentRange = context.rangePreset || '5Y';
  const currentPriceSource = context.priceSource || 'adjusted';

  const handleInstrumentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const found = availableInstruments.find((i) => i.symbol === val || i.id === val);
    if (found) {
      updateContext({ symbol: found.symbol, instrumentId: found.id });
    } else {
      updateContext({ symbol: val });
    }
  };

  const handleRangeChange = (preset: RangePreset) => {
    updateContext({ rangePreset: preset, startDate: undefined, endDate: undefined });
  };

  const handlePriceSourceChange = (ps: PriceSource) => {
    updateContext({ priceSource: ps });
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 p-3 bg-[#151F2E] border border-[#263244] rounded-lg text-xs font-mono ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-[#94A3B8]">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span className="font-semibold uppercase tracking-wider text-[11px]">Research Context:</span>
        </div>

        {/* Single Instrument Selector */}
        {showInstrumentSelect && (
          <div className="flex items-center gap-1.5 bg-[#0F172A] border border-[#263244] rounded px-2 py-1">
            <Search className="w-3 h-3 text-[#3B82F6]" />
            {availableInstruments.length > 0 ? (
              <select
                value={currentSymbol}
                onChange={handleInstrumentChange}
                className="bg-transparent text-[#E5E7EB] font-bold focus:outline-none cursor-pointer"
              >
                {availableInstruments.map((inst) => (
                  <option key={inst.id || inst.symbol} value={inst.symbol} className="bg-[#0F172A] text-[#E5E7EB]">
                    {inst.symbol} — {inst.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-[#E5E7EB]">{currentSymbol}</span>
            )}
          </div>
        )}

        {/* Multi-Instrument Badge (if Correlation) */}
        {context.symbols && context.symbols.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[#94A3B8]">Multi-Asset:</span>
            <div className="flex items-center gap-1">
              {context.symbols.map((sym) => (
                <Badge key={sym} variant="info" className="text-[10px] py-0 px-1 border-[#3B82F6]/40">
                  {sym}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Date Range Presets */}
        {showRangeSelect && (
          <div className="flex items-center gap-1 bg-[#0F172A] p-0.5 rounded border border-[#263244]">
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => handleRangeChange(preset)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  currentRange === preset
                    ? 'bg-[#3B82F6] text-white font-bold'
                    : 'text-[#94A3B8] hover:text-[#E5E7EB] hover:bg-[#1E293B]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        )}

        {/* Price Source Selection */}
        {showPriceSourceSelect && (
          <div className="flex items-center gap-1 bg-[#0F172A] p-0.5 rounded border border-[#263244]">
            <button
              onClick={() => handlePriceSourceChange('adjusted')}
              className={`px-2 py-0.5 rounded transition-colors ${
                currentPriceSource === 'adjusted'
                  ? 'bg-[#1E293B] text-[#3B82F6] border border-[#3B82F6]/50 font-bold'
                  : 'text-[#94A3B8] hover:text-[#E5E7EB]'
              }`}
            >
              Adjusted
            </button>
            <button
              onClick={() => handlePriceSourceChange('close')}
              className={`px-2 py-0.5 rounded transition-colors ${
                currentPriceSource === 'close'
                  ? 'bg-[#1E293B] text-[#3B82F6] border border-[#3B82F6]/50 font-bold'
                  : 'text-[#94A3B8] hover:text-[#E5E7EB]'
              }`}
            >
              Close
            </button>
          </div>
        )}

        {/* Frequency */}
        <Badge variant="outline" className="text-[10px] text-[#94A3B8] border-[#263244]">
          Daily
        </Badge>
      </div>

      {/* Clear Context Action */}
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={clearContext}
          className="text-[11px] h-6 px-2 py-0 border-[#263244]"
          icon={<RotateCcw className="w-3 h-3 text-[#94A3B8]" />}
        >
          Reset Context
        </Button>
      </div>
    </div>
  );
};
