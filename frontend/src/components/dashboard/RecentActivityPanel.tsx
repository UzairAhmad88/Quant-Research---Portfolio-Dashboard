import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Clock } from 'lucide-react';
import { DashboardActivityItem } from '../../types/dashboard';

interface RecentActivityPanelProps {
  activities: DashboardActivityItem[];
  isLoading?: boolean;
}

export const RecentActivityPanel: React.FC<RecentActivityPanelProps> = ({
  activities,
  isLoading,
}) => {
  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'MARKET_DATA_INGESTION':
        return <Badge variant="info" className="text-[10px]">INGESTION</Badge>;
      case 'BACKTEST_RUN':
        return <Badge variant="success" className="text-[10px]">BACKTEST</Badge>;
      case 'PORTFOLIO_CREATED':
        return <Badge variant="warning" className="text-[10px]">PORTFOLIO</Badge>;
      case 'STRATEGY_SIGNAL':
        return <Badge variant="outline" className="text-[10px]">SIGNAL</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{type}</Badge>;
    }
  };

  return (
    <Card
      title="Recent Research Activity"
      subtitle="Recorded events across market data acquisition, strategy signals, portfolios, and backtest runs."
    >
      {isLoading ? (
        <div className="py-6 text-center text-xs font-mono text-[#94A3B8] animate-pulse">
          Loading activity timeline...
        </div>
      ) : activities.length === 0 ? (
        <div className="py-6 text-center text-xs font-mono text-[#94A3B8]">
          No research activities recorded yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          {activities.map((act) => (
            <div
              key={act.id}
              className="flex items-center justify-between p-2 rounded bg-[#111827] border border-[#263244] text-xs font-mono"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
                <div>
                  <span className="font-semibold text-[#E5E7EB]">{act.entity_symbol_or_name}</span>
                  <div className="text-[10px] text-[#94A3B8]">
                    {new Date(act.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getActivityBadge(act.activity_type)}
                <span className="text-[10px] text-[#94A3B8] uppercase">{act.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
