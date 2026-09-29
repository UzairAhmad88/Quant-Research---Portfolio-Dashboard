import React from 'react';
import { NavLink } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ExternalLink } from 'lucide-react';
import { MarketDataInstrumentItem } from '../../types/dashboard';

interface MarketDataSnapshotPanelProps {
  instruments: MarketDataInstrumentItem[];
  isLoading?: boolean;
}

export const MarketDataSnapshotPanel: React.FC<MarketDataSnapshotPanelProps> = ({
  instruments,
  isLoading,
}) => {
  const getQualityBadge = (quality: string) => {
    if (quality === 'Good') return <Badge variant="success">Good</Badge>;
    if (quality === 'Good with Warnings') return <Badge variant="warning">Good with Warnings</Badge>;
    return <Badge variant="outline">No Data</Badge>;
  };

  const getFreshnessBadge = (state?: string, label?: string) => {
    switch (state) {
      case 'CURRENT':
        return <Badge variant="success">CURRENT</Badge>;
      case 'RECENT':
        return <Badge variant="info">RECENT</Badge>;
      case 'STALE':
        return <Badge variant="warning">STALE</Badge>;
      default:
        return <span className="text-[#94A3B8] text-[11px]">{label || '—'}</span>;
    }
  };

  return (
    <Card
      title="Market Data & Instrument Snapshot"
      subtitle="Tracked multi-asset instruments, data availability, and provider observation status."
      action={
        <NavLink to="/market-data">
          <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
            Market Data Workspace
          </Button>
        </NavLink>
      }
    >
      {isLoading ? (
        <div className="py-8 text-center text-xs font-mono text-text-muted animate-pulse">
          Loading market data snapshot...
        </div>
      ) : instruments.length === 0 ? (
        <div className="py-8 text-center text-xs text-text-muted font-mono">
          No instruments tracked in database registry.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-border bg-forest-50/50 text-text-secondary uppercase text-[10px]">
                <th className="py-2 px-3">Symbol</th>
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Asset Class</th>
                <th className="py-2 px-3">Last Price</th>
                <th className="py-2 px-3">Observations</th>
                <th className="py-2 px-3">Data Quality</th>
                <th className="py-2 px-3 text-right">Freshness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-primary">
              {instruments.map((inst) => (
                <tr key={inst.id} className="hover:bg-forest-50/40 transition-colors">
                  <td className="py-2.5 px-3">
                    <NavLink
                      to={`/returns?symbol=${inst.symbol}`}
                      className="font-bold text-forest-700 hover:underline"
                    >
                      {inst.symbol}
                    </NavLink>
                  </td>
                  <td className="py-2.5 px-3 text-text-secondary">{inst.name}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant="info" className="text-[10px] py-0 px-1 border-forest-200">
                      {inst.asset_type}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-text-primary">
                    {inst.latest_price !== undefined && inst.latest_price !== null
                      ? `$${inst.latest_price.toFixed(2)}`
                      : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-text-secondary">{inst.observation_count.toLocaleString()} bars</td>
                  <td className="py-2.5 px-3">{getQualityBadge(inst.data_quality)}</td>
                  <td className="py-2.5 px-3 text-right">
                    {getFreshnessBadge(inst.freshness_state, inst.freshness_label)}
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
