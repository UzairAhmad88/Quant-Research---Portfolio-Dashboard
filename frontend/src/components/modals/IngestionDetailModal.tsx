import React from 'react';
import { IngestionLogItem } from '../../lib/apiClient';
import { X, Activity, Clock } from 'lucide-react';

import { Badge } from '../ui/Badge';

interface IngestionDetailModalProps {
  log: IngestionLogItem | null;
  onClose: () => void;
}

export const IngestionDetailModal: React.FC<IngestionDetailModalProps> = ({ log, onClose }) => {
  if (!log) return null;

  const isCompleted = log.status === 'COMPLETED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#111827] border border-[#263244] rounded-lg shadow-2xl p-5 text-[#F8FAFC]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#3B82F6]" />
            <h3 className="text-sm font-semibold text-[#F8FAFC]">Ingestion Audit Log Details</h3>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#F8FAFC]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Audit Details */}
        <div className="mt-4 space-y-3 text-xs font-mono-num">
          <div className="flex items-center justify-between p-2 bg-[#0B0F17] rounded border border-[#1E293B]">
            <span className="text-[#94A3B8]">Run ID</span>
            <span className="text-[#F8FAFC]">{log.id.slice(0, 13)}...</span>
          </div>

          <div className="flex items-center justify-between p-2 bg-[#0B0F17] rounded border border-[#1E293B]">
            <span className="text-[#94A3B8]">Status</span>
            <Badge variant={isCompleted ? 'success' : 'warning'}>{log.status}</Badge>
          </div>

          <div className="flex items-center justify-between p-2 bg-[#0B0F17] rounded border border-[#1E293B]">
            <span className="text-[#94A3B8]">Provider / Freq</span>
            <span className="text-[#F8FAFC]">{log.provider} ({log.frequency})</span>
          </div>

          <div className="flex items-center justify-between p-2 bg-[#0B0F17] rounded border border-[#1E293B]">
            <span className="text-[#94A3B8]">Requested Window</span>
            <span className="text-[#F8FAFC]">
              {new Date(log.requested_start).toLocaleDateString()} $\rightarrow$ {new Date(log.requested_end).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2 bg-[#0B0F17] rounded border border-[#1E293B]">
              <span className="text-[10px] text-[#64748B] block">Received Bars</span>
              <span className="font-semibold text-[#F8FAFC]">{log.rows_received.toLocaleString()}</span>
            </div>
            <div className="p-2 bg-[#0B0F17] rounded border border-[#1E293B]">
              <span className="text-[10px] text-[#64748B] block">Inserted Bars</span>
              <span className="font-semibold text-[#10B981]">{log.rows_inserted.toLocaleString()}</span>
            </div>
            <div className="p-2 bg-[#0B0F17] rounded border border-[#1E293B]">
              <span className="text-[10px] text-[#64748B] block">Skipped (Cached)</span>
              <span className="font-semibold text-[#3B82F6]">{log.rows_skipped.toLocaleString()}</span>
            </div>
            <div className="p-2 bg-[#0B0F17] rounded border border-[#1E293B]">
              <span className="text-[10px] text-[#64748B] block">Invalid Filtered</span>
              <span className="font-semibold text-[#EF4444]">{log.rows_invalid.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[#64748B] pt-2">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Execution Duration:
            </span>
            <span className="font-semibold text-[#F8FAFC]">{log.duration_ms} ms</span>
          </div>

          {log.error_message && (
            <div className="p-2.5 bg-[#7F1D1D]/30 border border-[#EF4444]/40 rounded text-[11px] text-[#FCA5A5] mt-2">
              <span className="font-semibold block text-[#EF4444] mb-0.5">Error Message:</span>
              {log.error_message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-[#1E293B] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1E293B] hover:bg-[#263244] text-[#94A3B8] text-xs font-medium rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
