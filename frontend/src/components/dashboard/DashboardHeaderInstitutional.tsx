import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, Play, DownloadCloud, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardHeaderInstitutionalProps {
  onRefresh?: () => void;
  isFetching?: boolean;
  onRangeChange?: (range: string) => void;
}

export const DashboardHeaderInstitutional: React.FC<DashboardHeaderInstitutionalProps> = ({
  onRefresh,
  isFetching = false,
  onRangeChange,
}) => {
  const navigate = useNavigate();
  const [activeRange, setActiveRange] = useState('1Y');
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateOpts: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      };
      const timeOpts: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'UTC',
      };
      setDateString(now.toLocaleDateString('en-US', dateOpts));
      setTimeString(`${now.toLocaleTimeString('en-US', timeOpts)} (UTC)`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const ranges = ['1D', '1W', '1M', '3M', '1Y', '5Y', 'MAX'];

  const handleRangeClick = (range: string) => {
    setActiveRange(range);
    if (onRangeChange) onRangeChange(range);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-1">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold text-white tracking-tight">Research Dashboard</h1>
          <span className="px-2 py-0.5 text-[10px] font-bold text-[#60A5FA] bg-[#1E3A8A]/40 border border-[#3B82F6]/30 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#3B82F6]" />
            LIVE MARKET FEED
          </span>
        </div>

        <p className="text-xs text-[#94A3B8] mt-1">
          Institutional-grade quantitative research, live factor calculations, and multi-asset backtesting engine.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Live Clock HUD */}
        <div className="text-right font-mono-num hidden sm:block">
          <div className="text-[11px] text-[#94A3B8]">{dateString || 'Monday, October 13, 2026'}</div>
          <div className="text-xs font-semibold text-[#E2E8F0] tracking-wide">{timeString || '14:32:18 (UTC)'}</div>
        </div>

        {/* Timeframe Range Selector */}
        <div className="flex items-center bg-[#0D1525] border border-[#17253D] rounded-lg p-0.5 shadow-inner">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => handleRangeClick(range)}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                activeRange === range
                  ? 'bg-[#1D4ED8] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#152136]'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isFetching}
              title="Refresh Market Data & Analytics"
              className="p-2 bg-[#0D1525] hover:bg-[#152136] border border-[#17253D] hover:border-[#3B82F6] text-[#94A3B8] hover:text-white rounded-lg transition-all"
            >
              <RefreshCw className={`w-4 h-4 text-[#3B82F6] ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            onClick={() => navigate('/market-data')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D1525] hover:bg-[#152136] border border-[#17253D] hover:border-[#3B82F6] text-xs font-medium text-white rounded-lg transition-all"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span className="hidden sm:inline">Ingest Data</span>
          </button>

          <button
            onClick={() => navigate('/backtesting')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4ED8] hover:bg-[#2563EB] text-xs font-semibold text-white rounded-lg transition-all shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>New Backtest</span>
          </button>
        </div>
      </div>
    </div>
  );
};
