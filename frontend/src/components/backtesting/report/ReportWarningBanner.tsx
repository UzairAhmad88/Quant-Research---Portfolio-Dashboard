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
    <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-4 mb-6 text-xs font-mono flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-1 text-amber-200">
        <div className="font-semibold text-amber-300">
          Simulation Completed with Warnings
        </div>
        <p className="text-amber-200/80 leading-relaxed">
          This historical backtest executed successfully, but contains documented market-data or parameter warnings. Please inspect Section 11 Data Quality before evaluating final performance metrics.
        </p>
        {warnings.length > 0 && (
          <ul className="list-disc list-inside space-y-0.5 pt-1 text-amber-300">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
