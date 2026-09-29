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
          className="text-text-muted hover:text-forest-700 transition-colors p-0.5 focus:outline-none focus:ring-1 focus:ring-forest-600 rounded"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      )}

      {isOpen && (
        <div
          role="tooltip"
          className={`absolute z-[500] w-72 sm:w-80 p-3 bg-white border border-border rounded-xl shadow-xl text-left pointer-events-none transition-all duration-150 ${positionClasses[position]}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-forest-700" />
              <span className="text-xs font-bold text-text-primary font-sans">{displayTitle}</span>
            </div>
            {def?.symbol && (
              <span className="text-[10px] font-mono-num font-bold text-forest-800 bg-forest-50 px-1.5 py-0.5 rounded border border-forest-100">
                {def.symbol}
              </span>
            )}
          </div>

          {/* Description */}
          {displayDesc && (
            <p className="text-[11px] text-text-secondary font-sans leading-relaxed mb-2.5">{displayDesc}</p>
          )}

          {/* Formula Box */}
          {displayFormula && (
            <div className="mb-2.5 p-2 bg-forest-50/50 border border-forest-100 rounded-lg">
              <div className="text-[9px] uppercase tracking-wider text-forest-800 font-mono mb-1 flex items-center gap-1 font-semibold">
                <Calculator className="w-3 h-3 text-forest-700" /> Formula
              </div>
              <div className="text-[11px] font-mono-num text-forest-900 font-semibold overflow-x-auto">
                {displayFormula}
              </div>
            </div>
          )}

          {/* Interpretation / Benchmark */}
          {displayInterpretation && (
            <div className="text-[10px] text-text-primary font-sans mb-1.5">
              <strong className="text-text-secondary font-medium">Interpretation: </strong>
              {displayInterpretation}
            </div>
          )}

          {displayBenchmark && (
            <div className="flex items-start gap-1.5 text-[10px] text-amber-800 font-mono mt-1.5 pt-1.5 border-t border-border">
              <Award className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>Target: {displayBenchmark}</span>
            </div>
          )}

          {displayAssumptions && (
            <div className="text-[9px] text-text-muted font-mono mt-1.5">
              Convention: {displayAssumptions}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
