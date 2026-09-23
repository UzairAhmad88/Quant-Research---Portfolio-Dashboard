import React, { useState } from 'react';
import { QualityReportItem, ValidationIssueItem } from '../../lib/apiClient';
import { X, AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface QualityIssuesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  report: QualityReportItem | null;
}

export const QualityIssuesDrawer: React.FC<QualityIssuesDrawerProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  if (!isOpen || !report) return null;

  const filteredIssues = report.issues.filter((issue) => {
    if (filterSeverity === 'ALL') return true;
    return issue.severity === filterSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'INFO':
        return <Badge variant="outline" className="text-blue-400 border-blue-800 bg-blue-950/40 flex items-center gap-1"><Info className="w-3 h-3" /> INFO</Badge>;
      case 'WARNING':
        return <Badge variant="warning" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> WARNING</Badge>;
      case 'ERROR':
        return <Badge variant="danger" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> ERROR</Badge>;
      case 'CRITICAL':
        return <Badge variant="danger" className="bg-red-950 text-red-300 border-red-700 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> CRITICAL</Badge>;

      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0F172A] border-l border-[#263244] h-full flex flex-col shadow-2xl text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-[#263244] flex items-center justify-between bg-[#151F2E]">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              Data Quality Audit Log
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {report.symbol} ({report.provider}) &bull; {report.summary.total_records} Total Observations
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#263244] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-[#263244] bg-[#0F172A] flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium mr-1">Filter Severity:</span>
          {['ALL', 'WARNING', 'ERROR', 'CRITICAL', 'INFO'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filterSeverity === sev
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1E293B] text-slate-300 hover:bg-[#28354A]'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredIssues.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No validation issues found for the selected filter.
            </div>
          ) : (
            filteredIssues.map((issue: ValidationIssueItem, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded bg-[#151F2E] border border-[#263244] text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(issue.severity)}
                    <span className="font-mono font-semibold text-slate-200 text-xs">{issue.code}</span>
                  </div>
                  {issue.timestamp && (
                    <span className="font-mono text-slate-400 text-[11px]">
                      {new Date(issue.timestamp).toISOString().split('T')[0]}
                    </span>
                  )}
                </div>

                <p className="text-slate-300 leading-relaxed">{issue.message}</p>

                {(issue.field || issue.record_reference) && (
                  <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400 pt-1 border-t border-[#1E293B]">
                    {issue.field && <span>Field: <span className="text-blue-400">{issue.field}</span></span>}
                    {issue.record_reference && <span>Ref: <span className="text-slate-300">{issue.record_reference}</span></span>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#263244] bg-[#151F2E] text-xs text-slate-400 flex justify-between items-center">
          <span>Report Generated: {new Date(report.generated_at).toLocaleString()}</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#1E293B] hover:bg-[#28354A] text-slate-200 rounded border border-[#334155]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
