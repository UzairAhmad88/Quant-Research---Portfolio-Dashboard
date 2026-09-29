import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ReportWarningBannerProps {
  warnings: string[];
  status: string;
}

export const ReportWarningBanner: React.FC<ReportWarningBannerProps> = ({ warnings, status }) => {
  if (status !== 'COMPLETED_WITH_WARNINGS' && (!warnings || warnings.length === 0)) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-xs font-mono flex items-start gap-3 shadow-xs">
      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="space-y-1 text-amber-900">
        <div className="font-semibold text-amber-950 font-sans">
          Simulation Completed with Warnings
        </div>
        <p className="text-amber-800/90 leading-relaxed font-sans text-xs">
          This historical backtest executed successfully, but contains documented market-data or parameter warnings. Please inspect Section 11 Data Quality before evaluating final performance metrics.
        </p>
        {warnings.length > 0 && (
          <ul className="list-disc list-inside space-y-0.5 pt-1 text-amber-900 font-mono text-[11px]">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
