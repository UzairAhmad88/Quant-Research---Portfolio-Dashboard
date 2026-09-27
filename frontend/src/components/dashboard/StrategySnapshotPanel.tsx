import React from 'react';
import { NavLink } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Cpu, ExternalLink } from 'lucide-react';
import { DashboardStrategySnapshot } from '../../types/dashboard';

interface StrategySnapshotPanelProps {
  snapshot?: DashboardStrategySnapshot;
  isLoading?: boolean;
}

export const StrategySnapshotPanel: React.FC<StrategySnapshotPanelProps> = ({
  snapshot,
  isLoading,
}) => {
  return (
    <Card
      title="Strategy & Signal Activity"
      subtitle="Calibrated quantitative engines, active configurations, and research signal events."
      action={
        <NavLink to="/strategies">
          <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
            Strategy Workspace
          </Button>
        </NavLink>
      }
    >
      {isLoading ? (
        <div className="py-6 text-center text-xs font-mono text-[#94A3B8] animate-pulse">
          Loading strategy activity...
        </div>
      ) : !snapshot || snapshot.recent_signals.length === 0 ? (
        <div className="py-8 text-center bg-[#111827] rounded border border-[#263244] p-6">
          <Cpu className="h-8 w-8 text-[#94A3B8] mx-auto mb-2 opacity-60" />
          <p className="text-xs text-[#94A3B8] mb-3">No strategy research signals generated yet.</p>
          <NavLink to="/strategies">
            <Button variant="primary" size="sm" icon={<Cpu className="w-3.5 h-3.5" />}>
              Calibrate Strategy Engine
            </Button>
          </NavLink>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8] pb-1 border-b border-[#263244]">
            <span>Active Configurations: <strong className="text-[#E5E7EB]">{snapshot.strategy_configurations_count}</strong></span>
            <span>Recent Signals: <strong className="text-[#E5E7EB]">{snapshot.recent_signals.length}</strong></span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-[#0F172A] text-[#94A3B8] uppercase text-[10px]">
                  <th className="py-1.5 px-2">Ticker</th>
                  <th className="py-1.5 px-2">Strategy</th>
                  <th className="py-1.5 px-2">Signal</th>
                  <th className="py-1.5 px-2 text-right">Price</th>
                  <th className="py-1.5 px-2 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B] text-[#E5E7EB]">
                {snapshot.recent_signals.slice(0, 5).map((sig) => (
                  <tr key={sig.id} className="hover:bg-[#1E293B]/40">
                    <td className="py-2 px-2 font-bold text-[#3B82F6]">{sig.symbol}</td>
                    <td className="py-2 px-2 text-[#94A3B8]">{sig.strategy_type}</td>
                    <td className="py-2 px-2">
                      <Badge variant={sig.signal_type === 'BUY' ? 'success' : 'danger'} className="text-[10px] py-0">
                        {sig.signal_type} ({sig.signal_state})
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-right">${sig.price.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-[#94A3B8] text-[11px]">
                      {sig.timestamp.split('T')[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
};
