import React from 'react';
import { Database, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface InsufficientDataStateProps {
  title?: string;
  metricName?: string;
  requiredObservations?: number;
  availableObservations?: number;
  dateRange?: string;
  onExpandRange?: () => void;
  className?: string;
}

export const InsufficientDataState: React.FC<InsufficientDataStateProps> = ({
  title = 'Insufficient Historical Data',
  metricName = 'calculation',
  requiredObservations = 30,
  availableObservations = 0,
  dateRange,
  onExpandRange,
  className = '',
}) => {
  return (
    <div
      role="status"
      className={`p-6 rounded-md border border-[#F59E0B]/30 bg-[#151F2E] flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="p-2.5 rounded-full bg-[#F59E0B]/10 text-[#FBBF24] mb-2.5">
        <Database className="w-5 h-5" />
      </div>

      <h4 className="text-sm font-semibold text-[#E5E7EB] tracking-tight mb-1">
        {title}
      </h4>

      <p className="text-xs text-[#94A3B8] max-w-md mb-3 leading-relaxed">
        {metricName.charAt(0).toUpperCase() + metricName.slice(1)} requires at least{' '}
        <strong className="text-[#E5E7EB] font-mono">{requiredObservations}</strong> valid observations to produce statistically valid metrics.
        The selected query contains only{' '}
        <strong className="text-[#FBBF24] font-mono">{availableObservations}</strong> observation(s).
      </p>

      {dateRange && (
        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mb-4">
          <Calendar className="w-3.5 h-3.5" />
          <span>Active Window: {dateRange}</span>
        </div>
      )}

      {onExpandRange && (
        <Button
          variant="outline"
          size="sm"
          onClick={onExpandRange}
          icon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Expand Date Range (1Y / 5Y)
        </Button>
      )}
    </div>
  );
};
