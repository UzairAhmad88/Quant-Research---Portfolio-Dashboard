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
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-[#263244] pb-2 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-200">
          <Database className="w-4 h-4 text-blue-400" />
          <span>Market Data Provenance &amp; Integrity</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border flex items-center gap-1 ${
            isGood
              ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80'
              : 'text-amber-400 bg-amber-950/60 border-amber-800/80'
          }`}
        >
          {isGood ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          {qualityStatus}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-300">
        <div className="bg-[#0B1220] p-2.5 rounded border border-[#263244]">
          <div className="text-[10px] text-slate-500">OBSERVATIONS</div>
          <div className="text-slate-100 font-semibold">{observationCount} Bars</div>
        </div>
        <div className="bg-[#0B1220] p-2.5 rounded border border-[#263244]">
          <div className="text-[10px] text-slate-500">PRICE SOURCE</div>
          <div className="text-slate-100 font-semibold uppercase">{priceSource}</div>
        </div>
      </div>

      {qualityWarning && (
        <div className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-900/60 font-mono">
          Warning: {qualityWarning}
        </div>
      )}
    </div>
  );
};
