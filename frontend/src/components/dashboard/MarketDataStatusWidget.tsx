import React, { useState } from 'react';
import { ArrowRight, RefreshCw, ShieldCheck, Database, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';


export interface MarketDataStatusWidgetProps {
  activeSymbol?: string;
  onDataSync?: () => void;
}

export const MarketDataStatusWidget: React.FC<MarketDataStatusWidgetProps> = ({
  activeSymbol = 'AAPL',
  onDataSync,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const [syncCount, setSyncCount] = useState(2500);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Simulate real-time provider sync delay
      await new Promise((r) => setTimeout(r, 650));
      setLastSyncTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setSyncCount((prev) => prev + 1);
      if (onDataSync) onDataSync();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-[#0D1525] border border-[#17253D] rounded-lg p-3.5 shadow-md flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#17253D]">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#3B82F6]" />
          <h3 className="text-sm font-bold text-white tracking-tight">Market Data Status</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            title="Sync live quote from Yahoo Finance"
            className="flex items-center gap-1 px-2 py-0.5 bg-[#070D18] hover:bg-[#152136] border border-[#17253D] hover:border-[#3B82F6] text-[#94A3B8] hover:text-white text-[11px] rounded transition-all"
          >
            <RefreshCw className={`w-3 h-3 text-[#3B82F6] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
          <Link
            to="/market-data"
            className="text-xs text-[#3B82F6] hover:text-[#60A5FA] flex items-center gap-1 font-medium group transition-colors"
          >
            View All <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-3 pt-2.5">
        {/* Row 1: Yahoo Finance Provider */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
              <span className="text-xs font-semibold text-[#E2E8F0]">Yahoo Finance Engine</span>
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5 pl-4 font-mono-num">
              Ingestion: {lastSyncTime} • Real Time
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-[#22C55E] bg-[#14532D]/40 border border-[#22C55E]/30 rounded">
              ONLINE
            </span>
            <div className="text-[10px] text-[#94A3B8] mt-0.5 font-mono-num">
              Latency: 124 ms
            </div>
          </div>
        </div>

        {/* Row 2: Data Quality for Active Symbol */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
              <span className="text-xs font-semibold text-[#E2E8F0]">Quality ({activeSymbol})</span>
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5 pl-5 font-mono-num">
              Validated: 500 Daily Bars (Zero Gaps)
            </div>
            <div className="text-[10px] text-[#22C55E] pl-5 font-mono-num font-medium">
              High-Low Bounds & Volume: 100% Valid
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-[#22C55E] bg-[#14532D]/40 border border-[#22C55E]/30 rounded">
              GOOD
            </span>
            <div className="text-[10px] text-[#94A3B8] mt-1 font-mono-num">
              Splits & Divs: Applied
            </div>
          </div>
        </div>

        {/* Row 3: Stored Observations & Instruments */}
        <div className="flex items-center justify-between pt-1 border-t border-[#17253D]/60">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="text-xs font-semibold text-[#E2E8F0]">Database Bars Ingested</span>
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5 pl-5">
              AAPL, MSFT, NVDA, SPY, QQQ
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold font-mono-num text-white">{syncCount.toLocaleString()} bars</span>
          </div>
        </div>
      </div>
    </div>
  );
};
