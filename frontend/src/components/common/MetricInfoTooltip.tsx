import React, { useState } from 'react';
import { HelpCircle, Info, Calculator, Award } from 'lucide-react';
import { METRIC_DEFINITIONS, MetricDefinition } from '../../lib/metricDefinitions';

interface MetricInfoTooltipProps {
  metricKey?: string;
  customDef?: MetricDefinition;
  title?: string;
  description?: string;
  formula?: string;
  benchmark?: string;
  children?: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export const MetricInfoTooltip: React.FC<MetricInfoTooltipProps> = ({
  metricKey,
  customDef,
  title,
  description,
  formula,
  benchmark,
  children,
  position = 'top',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const def = (metricKey ? METRIC_DEFINITIONS[metricKey.toLowerCase().replace(/[\s-]/g, '_')] : undefined) || customDef;

  const displayTitle = title || def?.name || metricKey || 'Metric Details';
  const displayFormula = formula || def?.formula;
  const displayDesc = description || def?.description;
  const displayInterpretation = def?.interpretation;
  const displayBenchmark = benchmark || def?.benchmark;
  const displayAssumptions = def?.assumptions;

  if (!displayDesc && !displayFormula && !children) {
    return null;
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children ? (
        children
      ) : (
        <button
          type="button"
          aria-label={`Info for ${displayTitle}`}
          className="text-[#64748B] hover:text-[#3B82F6] transition-colors p-0.5 focus:outline-none focus:ring-1 focus:ring-[#3B82F6] rounded"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      )}

      {isOpen && (
        <div
          role="tooltip"
          className={`absolute z-[500] w-72 sm:w-80 p-3 bg-[#0F172A] border border-[#263244] rounded-lg shadow-2xl text-left pointer-events-none transition-all duration-150 ${positionClasses[position]}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span className="text-xs font-semibold text-[#E5E7EB] font-sans">{displayTitle}</span>
            </div>
            {def?.symbol && (
              <span className="text-[10px] font-mono-num font-bold text-[#38BDF8] bg-[#38BDF8]/10 px-1.5 py-0.2 rounded border border-[#38BDF8]/20">
                {def.symbol}
              </span>
            )}
          </div>

          {/* Description */}
          {displayDesc && (
            <p className="text-[11px] text-[#94A3B8] font-sans leading-relaxed mb-2.5">{displayDesc}</p>
          )}

          {/* Formula Box */}
          {displayFormula && (
            <div className="mb-2.5 p-2 bg-[#080E1A] border border-[#1E293B] rounded">
              <div className="text-[9px] uppercase tracking-wider text-[#64748B] font-mono mb-1 flex items-center gap-1">
                <Calculator className="w-3 h-3 text-[#3B82F6]" /> Formula
              </div>
              <div className="text-[11px] font-mono-num text-[#38BDF8] font-semibold overflow-x-auto">
                {displayFormula}
              </div>
            </div>
          )}

          {/* Interpretation / Benchmark */}
          {displayInterpretation && (
            <div className="text-[10px] text-[#CBD5E1] font-sans mb-1.5">
              <strong className="text-[#94A3B8] font-medium">Interpretation: </strong>
              {displayInterpretation}
            </div>
          )}

          {displayBenchmark && (
            <div className="flex items-start gap-1.5 text-[10px] text-[#F59E0B] font-mono mt-1.5 pt-1.5 border-t border-[#1E293B]/60">
              <Award className="w-3 h-3 text-[#F59E0B] flex-shrink-0 mt-0.5" />
              <span>Target: {displayBenchmark}</span>
            </div>
          )}

          {displayAssumptions && (
            <div className="text-[9px] text-[#64748B] font-mono mt-1.5">
              Convention: {displayAssumptions}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
