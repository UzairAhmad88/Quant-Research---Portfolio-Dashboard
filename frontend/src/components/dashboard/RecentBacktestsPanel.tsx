import React from 'react';
import { NavLink } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PlayCircle, ExternalLink, FileText } from 'lucide-react';
import { DashboardBacktestItem } from '../../types/dashboard';

interface RecentBacktestsPanelProps {
  backtests: DashboardBacktestItem[];
  isLoading?: boolean;
}

export const RecentBacktestsPanel: React.FC<RecentBacktestsPanelProps> = ({
  backtests,
  isLoading,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">COMPLETED</Badge>;
      case 'COMPLETED_WITH_WARNINGS':
        return <Badge variant="warning">WARNINGS</Badge>;
      case 'RUNNING':
        return <Badge variant="info">RUNNING</Badge>;
      case 'FAILED':
        return <Badge variant="danger">FAILED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card
      title="Recent Backtests & Simulation Runs"
      subtitle="Historical strategy simulation runs, quantitative returns, trade counts, and research report links."
      action={
        <NavLink to="/backtesting">
          <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
            Backtest Workstation
          </Button>
        </NavLink>
      }
    >
      {isLoading ? (
        <div className="py-8 text-center text-xs font-mono text-text-muted animate-pulse">
          Loading backtest history...
        </div>
      ) : backtests.length === 0 ? (
        <div className="py-8 text-center bg-forest-50/40 rounded-xl border border-forest-100 p-6 shadow-xs">
          <PlayCircle className="h-8 w-8 text-forest-700/60 mx-auto mb-2" />
          <p className="text-xs text-text-secondary mb-3">No backtests executed yet.</p>
          <NavLink to="/backtesting">
            <Button variant="primary" size="sm" icon={<PlayCircle className="w-3.5 h-3.5" />}>
              Run Historical Backtest
            </Button>
          </NavLink>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-border bg-forest-50/50 text-text-secondary uppercase text-[10px]">
                <th className="py-2.5 px-3">Ticker</th>
                <th className="py-2.5 px-3">Strategy</th>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Total Return</th>
                <th className="py-2.5 px-3 text-right">Trades</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-primary">
              {backtests.map((bt) => (
                <tr key={bt.id} className="hover:bg-forest-50/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-forest-700">{bt.instrument_symbol}</td>
                  <td className="py-2.5 px-3 text-text-secondary">{bt.strategy_name}</td>
                  <td className="py-2.5 px-3 text-text-muted text-[11px]">{bt.period}</td>
                  <td className="py-2.5 px-3">{getStatusBadge(bt.status)}</td>
                  <td className="py-2.5 px-3 text-right font-semibold">
                    {bt.total_return_pct !== null && bt.total_return_pct !== undefined ? (
                      <span className={bt.total_return_pct >= 0 ? 'text-forest-600' : 'text-rose-600'}>
                        {bt.total_return_pct >= 0 ? '+' : ''}{bt.total_return_pct.toFixed(2)}%
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right text-text-secondary">
                    {bt.trade_count !== null && bt.trade_count !== undefined ? bt.trade_count : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <NavLink
                      to={`/backtesting`}
                      className="inline-flex items-center gap-1 text-[11px] text-forest-700 hover:text-forest-900 font-semibold hover:underline"
                    >
                      <FileText className="w-3 h-3" /> View Run
                    </NavLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
