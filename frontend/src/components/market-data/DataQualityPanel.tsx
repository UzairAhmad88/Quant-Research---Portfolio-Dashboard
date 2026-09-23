import React from 'react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { QualityReportItem } from '../../lib/apiClient';
import { ShieldCheck, AlertTriangle, AlertCircle, FileCheck2, Filter } from 'lucide-react';

interface DataQualityPanelProps {
  report: QualityReportItem | null;
  isLoading: boolean;
  onOpenIssuesDrawer: () => void;
}

export const DataQualityPanel: React.FC<DataQualityPanelProps> = ({
  report,
  isLoading,
  onOpenIssuesDrawer,
}) => {
  if (isLoading) {
    return (
      <Card className="p-4 bg-[#151F2E] border-[#263244] animate-pulse">
        <div className="h-5 bg-[#1F293D] rounded w-1/3 mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="h-10 bg-[#1F293D] rounded" />
          <div className="h-10 bg-[#1F293D] rounded" />
          <div className="h-10 bg-[#1F293D] rounded" />
          <div className="h-10 bg-[#1F293D] rounded" />
        </div>
      </Card>
    );
  }

  if (!report) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'GOOD':
        return <Badge variant="success" className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> GOOD</Badge>;
      case 'GOOD_WITH_WARNINGS':
        return <Badge variant="warning" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> GOOD WITH WARNINGS</Badge>;
      case 'INVALID':
        return <Badge variant="danger" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> INVALID</Badge>;

      default:
        return <Badge variant="outline">NO DATA</Badge>;
    }
  };

  const { summary } = report;

  return (
    <Card className="p-4 bg-[#151F2E] border-[#263244] text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-[#263244]">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-sm tracking-wide text-slate-100 uppercase">Data Quality & Storage Integrity</span>
          {getStatusBadge(report.status)}
        </div>

        <button
          onClick={onOpenIssuesDrawer}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[#1E293B] hover:bg-[#28354A] text-slate-200 border border-[#334155] rounded transition-colors"
        >
          <Filter className="w-3 h-3 text-blue-400" />
          Validation Issues ({report.issues.length})
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs font-mono">
        <div className="p-2.5 bg-[#0F172A] rounded border border-[#1E293B]">
          <span className="text-slate-400 block text-[10px] uppercase font-sans">Total Bars</span>
          <span className="text-slate-100 font-semibold text-sm">{summary.total_records.toLocaleString()}</span>
        </div>

        <div className="p-2.5 bg-[#0F172A] rounded border border-[#1E293B]">
          <span className="text-slate-400 block text-[10px] uppercase font-sans">Valid Bars</span>
          <span className="text-emerald-400 font-semibold text-sm">{summary.valid_records.toLocaleString()}</span>
        </div>

        <div className="p-2.5 bg-[#0F172A] rounded border border-[#1E293B]">
          <span className="text-slate-400 block text-[10px] uppercase font-sans">Warnings</span>
          <span className={summary.warning_count > 0 ? "text-amber-400 font-semibold text-sm" : "text-slate-400 text-sm"}>
            {summary.warning_count}
          </span>
        </div>

        <div className="p-2.5 bg-[#0F172A] rounded border border-[#1E293B]">
          <span className="text-slate-400 block text-[10px] uppercase font-sans">Duplicates</span>
          <span className="text-slate-300 font-semibold text-sm">{summary.duplicate_records}</span>
        </div>

        <div className="p-2.5 bg-[#0F172A] rounded border border-[#1E293B]">
          <span className="text-slate-400 block text-[10px] uppercase font-sans">Missing Sessions</span>
          <span className={summary.potential_missing_sessions > 0 ? "text-amber-400 font-semibold text-sm" : "text-slate-400 text-sm"}>
            {summary.potential_missing_sessions}
          </span>
        </div>

        <div className="p-2.5 bg-[#0F172A] rounded border border-[#1E293B]">
          <span className="text-slate-400 block text-[10px] uppercase font-sans">Invalid Records</span>
          <span className={summary.invalid_records > 0 ? "text-red-400 font-semibold text-sm" : "text-slate-400 text-sm"}>
            {summary.invalid_records}
          </span>
        </div>
      </div>
    </Card>
  );
};
