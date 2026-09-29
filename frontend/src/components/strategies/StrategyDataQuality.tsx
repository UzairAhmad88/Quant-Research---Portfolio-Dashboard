import React from 'react';
import { Database, CheckCircle2, AlertTriangle } from 'lucide-react';

interface StrategyDataQualityProps {
  qualityStatus: string;
  qualityWarning?: string | null;
  observationCount: number;
  priceSource: string;
}

export const StrategyDataQuality: React.FC<StrategyDataQualityProps> = ({
  qualityStatus,
  qualityWarning,
  observationCount,
  priceSource,
}) => {
  const isGood = qualityStatus === 'GOOD';

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
      <div className="flex items-center justify-between border-b border-border pb-2 text-xs">
        <div className="flex items-center gap-2 font-semibold text-text-primary">
          <Database className="w-4 h-4 text-brand-primary" />
          <span>Market Data Provenance &amp; Integrity</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border flex items-center gap-1 ${
            isGood
              ? 'text-emerald-800 bg-emerald-50 border-emerald-300'
              : 'text-amber-800 bg-amber-50 border-amber-300'
          }`}
        >
          {isGood ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          {qualityStatus}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="bg-surface p-2.5 rounded-lg border border-border">
          <div className="text-[10px] text-text-muted">OBSERVATIONS</div>
          <div className="text-text-primary font-semibold">{observationCount} Bars</div>
        </div>
        <div className="bg-surface p-2.5 rounded-lg border border-border">
          <div className="text-[10px] text-text-muted">PRICE SOURCE</div>
          <div className="text-text-primary font-semibold uppercase">{priceSource}</div>
        </div>
      </div>

      {qualityWarning && (
        <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-mono">
          Warning: {qualityWarning}
        </div>
      )}
    </div>
  );
};
