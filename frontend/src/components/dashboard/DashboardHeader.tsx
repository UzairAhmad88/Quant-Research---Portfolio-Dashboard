import React from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RefreshCw, Database, Activity } from 'lucide-react';
import { DashboardSystemStatus } from '../../types/dashboard';

interface DashboardHeaderProps {
  status?: DashboardSystemStatus;
  onRefresh?: () => void;
  isFetching?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  status,
  onRefresh,
  isFetching,
}) => {
  const getQualityBadgeVariant = (dataStatus?: string) => {
    if (dataStatus === 'Good') return 'success';
    if (dataStatus === 'Good with Warnings') return 'warning';
    return 'outline';
  };

  const formattedTime = status?.last_updated
    ? new Date(status.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-card border border-border rounded-xl shadow-xs">
      <div>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand-primary" />
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Quant Research Dashboard</h1>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">
          Unified quantitative workstation overview · Data pipeline &amp; strategy orchestration
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-mono">
          <Database className="h-3.5 w-3.5 text-brand-primary" />
          <span className="text-text-secondary">Data Status:</span>
          <Badge variant={getQualityBadgeVariant(status?.data_status)} className="text-[10px] py-0 px-1.5">
            {status?.data_status || 'Checking...'}
          </Badge>
        </div>

        <div className="text-xs font-mono text-text-secondary hidden md:block">
          Updated: <span className="text-text-primary font-semibold">{formattedTime}</span>
        </div>

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching}
            icon={<RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        )}
      </div>
    </div>
  );
};
