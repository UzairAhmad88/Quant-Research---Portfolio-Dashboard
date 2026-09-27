import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  Database,
  AlertTriangle,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { LatestMarketDataResponse } from '../../lib/apiClient';

interface LatestMarketDataPanelProps {
  data?: LatestMarketDataResponse;
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

export const LatestMarketDataPanel: React.FC<LatestMarketDataPanelProps> = ({
  data,
  isLoading,
  isRefreshing,
  error,
  onRefresh,
}) => {
  const getFreshnessBadge = (freshness: string) => {
    switch (freshness) {
      case 'CURRENT':
        return <Badge variant="success">CURRENT</Badge>;
      case 'RECENT':
        return <Badge variant="info">RECENT</Badge>;
      case 'STALE':
        return <Badge variant="warning">STALE</Badge>;
      case 'UNKNOWN':
        return <Badge variant="outline">UNKNOWN</Badge>;
      case 'UNAVAILABLE':
      default:
        return <Badge variant="danger">UNAVAILABLE</Badge>;
    }
  };

  const formatNumber = (val?: number | null, decimals = 2) => {
    if (val === undefined || val === null || isNaN(val)) return '—';
    return val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatVolume = (vol?: number | null) => {
    if (vol === undefined || vol === null || isNaN(vol)) return '—';
    if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)}K`;
    return vol.toLocaleString();
  };

  return (
    <Card
      title="Latest Available Market Observation"
      subtitle="Most recent validated daily price and session state. Not exchange-level real-time."
      action={
        <div className="flex items-center gap-2">
          {data && (
            <span className="text-[11px] font-mono text-[#94A3B8] hidden sm:inline-flex items-center gap-1">
              <Radio className="w-3 h-3 text-[#3B82F6]" />
              Delayed / End-of-Day
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading || isRefreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#3B82F6]' : ''}`} />}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Latest'}
          </Button>
        </div>
      }
    >
      {error && !data ? (
        <div className="p-4 bg-[#7F1D1D]/20 border border-[#EF4444]/30 rounded-lg text-xs text-[#FCA5A5] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Observation Unavailable:</span>
            {error.message || 'No validated market observation available for this instrument.'}
          </div>
        </div>
      ) : isLoading && !data ? (
        <div className="py-8 text-center text-xs font-mono text-[#94A3B8] animate-pulse">
          Retrieving latest validated observation...
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Warning banner (e.g. rate limit fallback to cache) */}
          {data.warning && (
            <div className="p-2.5 bg-[#B45309]/15 border border-[#F59E0B]/30 rounded-md text-xs text-[#FCD34D] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <span>{data.warning}</span>
            </div>
          )}

          {/* Primary Price Header Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-3 border-b border-[#1E293B]">
            {/* Price & Change */}
            <div className="md:col-span-2 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-[#F8FAFC]">
                  ${formatNumber(data.price, 2)}
                </span>
                <span className="text-xs font-mono text-[#94A3B8]">
                  {data.currency}
                </span>

                {data.change !== undefined && data.change !== null && (
                  <div
                    className={`flex items-center gap-1 text-xs font-mono font-semibold ml-2 ${
                      data.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {data.change >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {data.change >= 0 ? '+' : ''}
                      {formatNumber(data.change, 2)} (
                      {data.change_pct !== undefined && data.change_pct !== null
                        ? `${data.change_pct >= 0 ? '+' : ''}${(data.change_pct * 100).toFixed(2)}%`
                        : '—'}
                      )
                    </span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-[#94A3B8] flex items-center gap-2">
                <span>Prev Close: ${formatNumber(data.previous_close, 2)}</span>
                <span>•</span>
                <span>Frequency: {data.frequency}</span>
                {data.is_cached && (
                  <>
                    <span>•</span>
                    <span className="text-[#38BDF8] flex items-center gap-1">
                      <Database className="w-3 h-3" /> Cached
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Freshness & Quality */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-[#64748B] font-mono">
                Data Freshness
              </div>
              <div className="flex items-center gap-2">
                {getFreshnessBadge(data.freshness)}
                <Badge variant={data.quality === 'GOOD' ? 'success' : 'warning'}>
                  <ShieldCheck className="w-3 h-3 mr-1 inline" />
                  {data.quality}
                </Badge>
              </div>
              <div className="text-[10px] text-[#64748B]">
                Calendar-aware status
              </div>
            </div>

            {/* Provider & Source */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-[#64748B] font-mono">
                Provider Provenance
              </div>
              <div className="text-xs font-mono text-[#E2E8F0]">
                {data.provider.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-[10px] text-[#64748B]">
                Symbol: {data.provider_symbol || data.symbol}
              </div>
            </div>
          </div>

          {/* OHLCV Statistics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            <div className="p-2 bg-[#0F172A] border border-[#1E293B] rounded">
              <div className="text-[10px] text-[#94A3B8] font-mono uppercase">Open</div>
              <div className="text-xs font-mono font-semibold text-[#F8FAFC]">
                ${formatNumber(data.open, 2)}
              </div>
            </div>

            <div className="p-2 bg-[#0F172A] border border-[#1E293B] rounded">
              <div className="text-[10px] text-[#94A3B8] font-mono uppercase">Day High</div>
              <div className="text-xs font-mono font-semibold text-emerald-400">
                ${formatNumber(data.high, 2)}
              </div>
            </div>

            <div className="p-2 bg-[#0F172A] border border-[#1E293B] rounded">
              <div className="text-[10px] text-[#94A3B8] font-mono uppercase">Day Low</div>
              <div className="text-xs font-mono font-semibold text-rose-400">
                ${formatNumber(data.low, 2)}
              </div>
            </div>

            <div className="p-2 bg-[#0F172A] border border-[#1E293B] rounded">
              <div className="text-[10px] text-[#94A3B8] font-mono uppercase">Close / Adj</div>
              <div className="text-xs font-mono font-semibold text-[#F8FAFC]">
                ${formatNumber(data.close, 2)} / ${formatNumber(data.adjusted_close, 2)}
              </div>
            </div>

            <div className="p-2 bg-[#0F172A] border border-[#1E293B] rounded col-span-2 sm:col-span-1">
              <div className="text-[10px] text-[#94A3B8] font-mono uppercase">Volume</div>
              <div className="text-xs font-mono font-semibold text-[#F8FAFC]">
                {formatVolume(data.volume)}
              </div>
            </div>
          </div>

          {/* Timestamps Provenance Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-[#64748B] pt-2 border-t border-[#1E293B]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>
                Market Timestamp:{' '}
                <span className="text-[#94A3B8]">
                  {new Date(data.market_timestamp).toISOString().replace('T', ' ').substring(0, 19)} UTC
                </span>
              </span>
            </div>

            <div>
              Retrieved At:{' '}
              <span className="text-[#94A3B8]">
                {new Date(data.received_at).toISOString().replace('T', ' ').substring(0, 19)} UTC
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-[#94A3B8] font-mono">
          No observation data available.
        </div>
      )}
    </Card>
  );
};
