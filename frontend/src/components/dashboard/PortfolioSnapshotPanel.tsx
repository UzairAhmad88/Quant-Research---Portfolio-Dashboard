import React from 'react';
import { NavLink } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Briefcase, Plus, ExternalLink } from 'lucide-react';
import { DashboardPortfolioSnapshot } from '../../types/dashboard';

interface PortfolioSnapshotPanelProps {
  snapshot?: DashboardPortfolioSnapshot;
  isLoading?: boolean;
}

export const PortfolioSnapshotPanel: React.FC<PortfolioSnapshotPanelProps> = ({
  snapshot,
  isLoading,
}) => {
  const formatCurrency = (val?: number) =>
    val !== undefined ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';

  const formatPct = (val?: number) => {
    if (val === undefined) return '0.00%';
    const str = `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
    return str;
  };

  return (
    <Card
      title="Portfolio Snapshot"
      subtitle="Multi-asset portfolio allocations, total capital valuation, and performance."
      action={
        <NavLink to="/portfolio">
          <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
            Portfolios Module
          </Button>
        </NavLink>
      }
    >
      {isLoading ? (
        <div className="py-6 text-center text-xs font-mono text-[#94A3B8] animate-pulse">
          Loading portfolio snapshot...
        </div>
      ) : !snapshot || snapshot.active_portfolios_count === 0 ? (
        <div className="py-8 text-center bg-[#111827] rounded border border-[#263244] p-6">
          <Briefcase className="h-8 w-8 text-[#94A3B8] mx-auto mb-2 opacity-60" />
          <p className="text-xs text-[#94A3B8] mb-3">No portfolios created yet.</p>
          <NavLink to="/portfolio">
            <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
              Create Portfolio
            </Button>
          </NavLink>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#111827] rounded border border-[#263244]">
            <div>
              <div className="text-[10px] text-[#94A3B8] uppercase font-mono">Total Capital Value</div>
              <div className="text-lg font-bold text-[#E5E7EB] font-mono">
                {formatCurrency(snapshot.total_portfolio_value)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#94A3B8] uppercase font-mono">Combined Return</div>
              <div
                className={`text-lg font-bold font-mono ${
                  snapshot.total_portfolio_return_pct >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                }`}
              >
                {formatPct(snapshot.total_portfolio_return_pct)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {snapshot.portfolios.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 bg-[#0F172A] rounded border border-[#263244] text-xs font-mono"
              >
                <div>
                  <div className="font-semibold text-[#E5E7EB]">{p.name}</div>
                  <div className="text-[11px] text-[#94A3B8]">
                    {p.positions_count} active position{p.positions_count === 1 ? '' : 's'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-[#3B82F6]">{formatCurrency(p.initial_capital)}</div>
                  <Badge variant="outline" className="text-[10px] py-0">
                    Active
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
