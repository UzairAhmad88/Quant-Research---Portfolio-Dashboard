import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MarketDataStatusWidget: React.FC = () => {
  return (
    <div className="bg-[#0D1525] border border-[#17253D] rounded-lg p-3.5 shadow-md flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#17253D]">
        <h3 className="text-sm font-bold text-white tracking-tight">Market Data Status</h3>
        <Link
          to="/market-data"
          className="text-xs text-[#3B82F6] hover:text-[#60A5FA] flex items-center gap-1 font-medium group transition-colors"
        >
          View All <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Rows */}
      <div className="space-y-3 pt-2.5">
        {/* Row 1: Yahoo Finance */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
              <span className="text-xs font-semibold text-[#E2E8F0]">Yahoo Finance</span>
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5 pl-4 font-mono-num">
              Last update: 2 minutes ago
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-[#22C55E] bg-[#14532D]/40 border border-[#22C55E]/30 rounded">
              Online
            </span>
            <div className="text-[10px] text-[#94A3B8] mt-0.5 font-mono-num">
              Response: 342 ms
            </div>
          </div>
        </div>

        {/* Row 2: Data Quality */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
              <span className="text-xs font-semibold text-[#E2E8F0]">Data Quality (AAPL)</span>
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5 pl-4 font-mono-num">
              Last refresh: 2026-09-08 14:28:12
            </div>
            <div className="text-[10px] text-[#94A3B8] pl-4 font-mono-num">
              Missing data: 0
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-[#22C55E] bg-[#14532D]/40 border border-[#22C55E]/30 rounded">
              CURRENT
            </span>
            <div className="text-[10px] text-[#94A3B8] mt-1 font-mono-num">
              Adjustments: Applied
            </div>
          </div>
        </div>

        {/* Row 3: Supported Instruments */}
        <div className="flex items-center justify-between pt-1 border-t border-[#17253D]/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
              <span className="text-xs font-semibold text-[#E2E8F0]">Supported Instruments</span>
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5 pl-4">
              Equities, ETFs, Indices, FX
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold font-mono-num text-white">12,483</span>
          </div>
        </div>
      </div>
    </div>
  );
};
