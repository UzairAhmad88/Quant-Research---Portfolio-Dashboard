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
        return <Badge variant="outline" className="text-brand-primary border-brand-primary/30 bg-brand-primary/5 flex items-center gap-1"><Info className="w-3 h-3" /> INFO</Badge>;
      case 'WARNING':
        return <Badge variant="warning" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> WARNING</Badge>;
      case 'ERROR':
        return <Badge variant="danger" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> ERROR</Badge>;
      case 'CRITICAL':
        return <Badge variant="danger" className="bg-rose-100 text-rose-800 border-rose-300 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> CRITICAL</Badge>;

      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-card border-l border-border h-full flex flex-col shadow-2xl text-text-primary">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-surface">
          <div>
            <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-brand-primary" />
              Data Quality Audit Log
            </h2>
            <p className="text-xs text-text-secondary mt-0.5 font-mono">
              {report.symbol} ({report.provider}) &bull; {report.summary.total_records} Total Observations
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-border bg-surface flex items-center gap-2 text-xs">
          <span className="text-text-secondary font-medium mr-1">Filter Severity:</span>
          {['ALL', 'WARNING', 'ERROR', 'CRITICAL', 'INFO'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterSeverity === sev
                  ? 'bg-brand-primary text-white font-semibold shadow-xs'
                  : 'bg-card text-text-secondary border border-border hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-app">
          {filteredIssues.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-sm">
              No validation issues found for the selected filter.
            </div>
          ) : (
            filteredIssues.map((issue: ValidationIssueItem, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-card border border-border text-xs space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(issue.severity)}
                    <span className="font-mono font-semibold text-text-primary text-xs">{issue.code}</span>
                  </div>
                  {issue.timestamp && (
                    <span className="font-mono text-text-secondary text-[11px]">
                      {new Date(issue.timestamp).toISOString().split('T')[0]}
                    </span>
                  )}
                </div>

                <p className="text-text-primary leading-relaxed font-sans">{issue.message}</p>

                {(issue.field || issue.record_reference) && (
                  <div className="flex items-center gap-3 font-mono text-[11px] text-text-secondary pt-2 border-t border-border">
                    {issue.field && <span>Field: <span className="text-brand-primary font-semibold">{issue.field}</span></span>}
                    {issue.record_reference && <span>Ref: <span className="text-text-primary">{issue.record_reference}</span></span>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface text-xs text-text-secondary flex justify-between items-center">
          <span>Report Generated: {new Date(report.generated_at).toLocaleString()}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-card hover:bg-surface-hover text-text-primary rounded-lg border border-border font-medium shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
