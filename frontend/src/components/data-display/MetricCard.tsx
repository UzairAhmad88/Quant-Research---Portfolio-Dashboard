import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../feedback/Skeleton';
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value?: string | number;
  change?: string | number;
  changePercent?: string | number;
  trend?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  isLoading?: boolean;
  isUnavailable?: boolean;
  isDemo?: boolean;
  action?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  changePercent,
  trend = 'neutral',
  subtitle,
  isLoading = false,
  isUnavailable = false,
  isDemo = false,
  action,
}) => {
  if (isLoading) {
    return (
      <Card className="flex flex-col justify-between h-32">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-32" />
        </div>
        <Skeleton className="h-3 w-20 mt-4" />
      </Card>
    );
  }

  const getTrendStyles = () => {
    switch (trend) {
      case 'positive':
        return {
          color: 'text-[#4ADE80]',
          bg: 'bg-[#22C55E]/10 border-[#22C55E]/20',
          icon: TrendingUp,
        };
      case 'negative':
        return {
          color: 'text-[#F87171]',
          bg: 'bg-[#EF4444]/10 border-[#EF4444]/20',
          icon: TrendingDown,
        };
      default:
        return {
          color: 'text-[#94A3B8]',
          bg: 'bg-[#1E293B] border-[#263244]',
          icon: Minus,
        };
    }
  };

  const trendStyle = getTrendStyles();
  const TrendIcon = trendStyle.icon;

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-xs font-medium text-[#94A3B8] tracking-tight truncate">{label}</span>
          <div className="flex items-center gap-1.5">
            {isDemo && (
              <Badge variant="outline" className="text-[9px] py-0 px-1 border-[#263244] text-[#64748B]">
                Demo
              </Badge>
            )}
            {action}
          </div>
        </div>

        {isUnavailable ? (
          <div className="flex items-center gap-2 py-2 text-xs text-[#64748B] font-mono-num">
            <HelpCircle className="w-4 h-4 text-[#475569]" />
            <span>Data Unavailable</span>
          </div>
        ) : (
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-financial-metric text-[#E5E7EB]">
              {value ?? '—'}
            </span>

            {(change !== undefined || changePercent !== undefined) && (
              <div
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono-num font-medium border ${trendStyle.bg} ${trendStyle.color}`}
              >
                <TrendIcon className="w-3 h-3" />
                <span>
                  {change !== undefined && (typeof change === 'number' && change > 0 ? `+${change}` : change)}
                  {changePercent !== undefined && ` (${typeof changePercent === 'number' && changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`})`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {subtitle && (
        <div className="mt-3 pt-2 border-t border-[#263244]/60 text-[10px] font-mono-num text-[#64748B] truncate">
          {subtitle}
        </div>
      )}
    </Card>
  );
};
