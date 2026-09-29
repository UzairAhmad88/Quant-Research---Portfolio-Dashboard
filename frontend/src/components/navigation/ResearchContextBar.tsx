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
      className={`flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-[#E5E7EB] rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-xs font-mono ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-[#64748B]">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#14532D]" />
          <span className="font-semibold uppercase tracking-wider text-[11px]">Research Context:</span>
        </div>

        {/* Single Instrument Selector */}
        {showInstrumentSelect && (
          <div className="flex items-center gap-1.5 bg-[#F8FAF9] border border-[#CBD5E1] rounded-md px-2 py-1">
            <Search className="w-3 h-3 text-[#14532D]" />
            {availableInstruments.length > 0 ? (
              <select
                value={currentSymbol}
                onChange={handleInstrumentChange}
                className="bg-transparent text-[#17211B] font-bold focus:outline-none cursor-pointer"
              >
                {availableInstruments.map((inst) => (
                  <option key={inst.id || inst.symbol} value={inst.symbol} className="bg-white text-[#17211B]">
                    {inst.symbol} — {inst.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-[#17211B]">{currentSymbol}</span>
            )}
          </div>
        )}

        {/* Multi-Instrument Badge (if Correlation) */}
        {context.symbols && context.symbols.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[#64748B]">Multi-Asset:</span>
            <div className="flex items-center gap-1">
              {context.symbols.map((sym) => (
                <Badge key={sym} variant="success" className="text-[10px] py-0 px-1.5">
                  {sym}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Date Range Presets */}
        {showRangeSelect && (
          <div className="flex items-center gap-1 bg-[#F8FAF9] p-0.5 rounded-md border border-[#CBD5E1]">
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => handleRangeChange(preset)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  currentRange === preset
                    ? 'bg-[#14532D] text-white font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#17211B] hover:bg-[#F0FDF4]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        )}

        {/* Price Source Selection */}
        {showPriceSourceSelect && (
          <div className="flex items-center gap-1 bg-[#F8FAF9] p-0.5 rounded-md border border-[#CBD5E1]">
            <button
              onClick={() => handlePriceSourceChange('adjusted')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                currentPriceSource === 'adjusted'
                  ? 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] font-bold'
                  : 'text-[#64748B] hover:text-[#17211B]'
              }`}
            >
              Adjusted
            </button>
            <button
              onClick={() => handlePriceSourceChange('close')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                currentPriceSource === 'close'
                  ? 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] font-bold'
                  : 'text-[#64748B] hover:text-[#17211B]'
              }`}
            >
              Close
            </button>
          </div>
        )}

        {/* Frequency */}
        <Badge variant="outline" className="text-[10px] text-[#64748B] border-[#CBD5E1]">
          Daily
        </Badge>
      </div>

      {/* Clear Context Action */}
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={clearContext}
          className="text-[11px] h-6 px-2 py-0 border-[#CBD5E1]"
          icon={<RotateCcw className="w-3 h-3 text-[#64748B]" />}
        >
          Reset Context
        </Button>
      </div>
    </div>
  );
};
