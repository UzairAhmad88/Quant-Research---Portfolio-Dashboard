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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-5 text-text-primary">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-forest-700" />
            <h3 className="text-sm font-semibold text-text-primary font-sans">Ingestion Audit Log Details</h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Audit Details */}
        <div className="mt-4 space-y-3 text-xs font-mono-num">
          <div className="flex items-center justify-between p-2 bg-forest-50/50 rounded-lg border border-forest-100">
            <span className="text-text-secondary">Run ID</span>
            <span className="text-text-primary font-semibold">{log.id.slice(0, 13)}...</span>
          </div>

          <div className="flex items-center justify-between p-2 bg-forest-50/50 rounded-lg border border-forest-100">
            <span className="text-text-secondary">Status</span>
            <Badge variant={isCompleted ? 'success' : 'warning'}>{log.status}</Badge>
          </div>

          <div className="flex items-center justify-between p-2 bg-forest-50/50 rounded-lg border border-forest-100">
            <span className="text-text-secondary">Provider / Freq</span>
            <span className="text-text-primary font-medium">{log.provider} ({log.frequency})</span>
          </div>

          <div className="flex items-center justify-between p-2 bg-forest-50/50 rounded-lg border border-forest-100">
            <span className="text-text-secondary">Requested Window</span>
            <span className="text-text-primary font-medium">
              {new Date(log.requested_start).toLocaleDateString()} $\rightarrow$ {new Date(log.requested_end).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 bg-forest-50/50 rounded-lg border border-forest-100">
              <span className="text-[10px] text-text-muted block">Received Bars</span>
              <span className="font-semibold text-text-primary">{log.rows_received.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-forest-50/50 rounded-lg border border-forest-100">
              <span className="text-[10px] text-text-muted block">Inserted Bars</span>
              <span className="font-semibold text-forest-700">{log.rows_inserted.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-forest-50/50 rounded-lg border border-forest-100">
              <span className="text-[10px] text-text-muted block">Skipped (Cached)</span>
              <span className="font-semibold text-blue-700">{log.rows_skipped.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-forest-50/50 rounded-lg border border-forest-100">
              <span className="text-[10px] text-text-muted block">Invalid Filtered</span>
              <span className="font-semibold text-rose-600">{log.rows_invalid.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-text-secondary pt-2">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-forest-600" /> Execution Duration:
            </span>
            <span className="font-semibold text-text-primary">{log.duration_ms} ms</span>
          </div>

          {log.error_message && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-900 mt-2">
              <span className="font-semibold block text-rose-700 mb-0.5">Error Message:</span>
              {log.error_message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-forest-50 text-text-primary text-xs font-medium rounded-lg border border-border transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
