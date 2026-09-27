import React from 'react';
import { BacktestReport } from '../../../types/backtest';
import { Badge } from '../../ui/Badge';
import { FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { ExportMenu, ExportOption } from '../../common/ExportMenu';
import { getBacktestExportUrl } from '../../../services/exportService';

interface ReportHeaderProps {
  report: BacktestReport;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ report }) => {
  const symbol = report.executive_summary.symbol || 'INSTRUMENT';
  const strategyName = report.executive_summary.strategy_name;

  const exportOptions: ExportOption[] = [
    {
      label: 'Backtest Research Report (PDF)',
      format: 'PDF',
      description: 'Institutional printable PDF with summary, metrics, and methodology',
      url: getBacktestExportUrl({ backtestId: report.backtest_id, dataType: 'report', format: 'pdf' }),
    },
    {
      label: 'Backtest Report (JSON)',
      format: 'JSON',
      description: 'Complete structured BacktestReport schema with metadata',
      url: getBacktestExportUrl({ backtestId: report.backtest_id, dataType: 'report', format: 'json' }),
    },
    {
      label: 'Backtest Report (CSV)',
      format: 'CSV',
      description: 'Tabular report summary and core metrics',
      url: getBacktestExportUrl({ backtestId: report.backtest_id, dataType: 'report', format: 'csv' }),
    },
    {
      label: 'Executed Trades (CSV)',
      format: 'CSV',
      description: 'Chronological trade records with execution prices, quantities, and fees',
      url: getBacktestExportUrl({ backtestId: report.backtest_id, dataType: 'trades', format: 'csv' }),
    },
    {
      label: 'Equity Trajectory (CSV)',
      format: 'CSV',
      description: 'Daily cash, positions valuation, total equity, and period returns',
      url: getBacktestExportUrl({ backtestId: report.backtest_id, dataType: 'equity', format: 'csv' }),
    },
    {
      label: 'Drawdown Series (CSV)',
      format: 'CSV',
      description: 'Daily peak equity, drawdown dollar value, and drawdown percentage',
      url: getBacktestExportUrl({ backtestId: report.backtest_id, dataType: 'drawdown', format: 'csv' }),
    },
  ];

  return (
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-6 font-mono mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#263244] pb-4 mb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-[#3B82F6] font-semibold flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Quant Research Report
            </span>
            <span className="text-[10px] bg-[#111827] text-[#94A3B8] border border-[#263244] px-2 py-0.5 rounded">
              v{report.report_version}
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#E5E7EB] mt-1">
            {symbol} — {strategyName}
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1">
            Backtest ID: <span className="text-[#E5E7EB]">{report.backtest_id}</span> | Generated UTC:{' '}
            <span className="text-[#E5E7EB]">{new Date(report.generated_at).toUTCString()}</span>
          </p>
        </div>

        {/* Action Export Menu */}
        <div className="flex items-center">
          <ExportMenu options={exportOptions} label="Export Research Report" />
        </div>
      </div>

      {/* Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#94A3B8]">
        <div className="flex items-center gap-4">
          <div>
            Status:{' '}
            {report.status === 'COMPLETED' ? (
              <Badge variant="success" className="ml-1">
                <CheckCircle className="h-3 w-3 inline mr-1" /> COMPLETED
              </Badge>
            ) : report.status === 'COMPLETED_WITH_WARNINGS' ? (
              <Badge variant="warning" className="ml-1">
                <AlertTriangle className="h-3 w-3 inline mr-1" /> COMPLETED WITH WARNINGS
              </Badge>
            ) : (
              <Badge variant="default" className="ml-1">{report.status}</Badge>
            )}
          </div>
          <div>
            Data Quality:{' '}
            <span className="text-[#E5E7EB] font-bold">{report.data_quality.overall_status}</span>
          </div>
        </div>

        <div className="text-[11px] text-[#64748B] flex items-center gap-1">
          Fingerprint Hash:{' '}
          <code className="bg-[#111827] text-[#3B82F6] px-1.5 py-0.5 rounded text-[10px]">
            {report.configuration_hash.slice(0, 16)}...
          </code>
        </div>
      </div>
    </div>
  );
};
