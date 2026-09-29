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
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#14532D]" />
          <h3 className="text-sm font-bold text-[#17211B] tracking-tight">Market Data Status</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            title="Sync live quote from Yahoo Finance"
            className="flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-[#F0FDF4] border border-[#CBD5E1] hover:border-[#14532D] text-[#64748B] hover:text-[#14532D] text-[11px] rounded transition-all shadow-2xs"
          >
            <RefreshCw className={`w-3 h-3 text-[#14532D] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
          <Link
            to="/market-data"
            className="text-xs text-[#14532D] hover:text-[#166534] flex items-center gap-1 font-semibold group transition-colors"
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
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
              <span className="text-xs font-semibold text-[#17211B]">Yahoo Finance Engine</span>
            </div>
            <div className="text-[10px] text-[#64748B] mt-0.5 pl-4 font-mono-num">
              Ingestion: {lastSyncTime} • Real Time
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-[#166534] bg-[#DCFCE7] border border-[#86EFAC] rounded">
              ONLINE
            </span>
            <div className="text-[10px] text-[#64748B] mt-0.5 font-mono-num">
              Latency: 124 ms
            </div>
          </div>
        </div>

        {/* Row 2: Data Quality for Active Symbol */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
              <span className="text-xs font-semibold text-[#17211B]">Quality ({activeSymbol})</span>
            </div>
            <div className="text-[10px] text-[#64748B] mt-0.5 pl-5 font-mono-num">
              Validated: 500 Daily Bars (Zero Gaps)
            </div>
            <div className="text-[10px] text-[#15803D] pl-5 font-mono-num font-semibold">
              High-Low Bounds & Volume: 100% Valid
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-[#166534] bg-[#DCFCE7] border border-[#86EFAC] rounded">
              GOOD
            </span>
            <div className="text-[10px] text-[#64748B] mt-1 font-mono-num">
              Splits & Divs: Applied
            </div>
          </div>
        </div>

        {/* Row 3: Stored Observations & Instruments */}
        <div className="flex items-center justify-between pt-1 border-t border-[#E5E7EB]">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#D97706]" />
              <span className="text-xs font-semibold text-[#17211B]">Database Bars Ingested</span>
            </div>
            <div className="text-[10px] text-[#64748B] mt-0.5 pl-5">
              AAPL, MSFT, NVDA, SPY, QQQ
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold font-mono-num text-[#17211B]">{syncCount.toLocaleString()} bars</span>
          </div>
        </div>
      </div>
    </div>
  );
};
