import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, DownloadCloud, Sparkles } from 'lucide-react';
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
          <h1 className="text-2xl font-bold text-[#17211B] tracking-tight">Research Dashboard</h1>
          <span className="px-2.5 py-0.5 text-[10px] font-bold text-[#166534] bg-[#DCFCE7] border border-[#86EFAC] rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#14532D]" />
            LIVE MARKET FEED
          </span>
        </div>

        <p className="text-xs text-[#64748B] mt-1">
          Institutional-grade quantitative research, live factor calculations, and multi-asset backtesting engine.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Live Clock HUD */}
        <div className="text-right font-mono-num hidden sm:block">
          <div className="text-[11px] text-[#64748B]">{dateString || 'Monday, October 13, 2026'}</div>
          <div className="text-xs font-semibold text-[#17211B] tracking-wide">{timeString || '14:32:18 (UTC)'}</div>
        </div>

        {/* Timeframe Range Selector */}
        <div className="flex items-center bg-[#F8FAF9] border border-[#CBD5E1] rounded-lg p-0.5 shadow-2xs">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => handleRangeClick(range)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                activeRange === range
                  ? 'bg-[#14532D] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#17211B] hover:bg-[#F0FDF4]'
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
              className="p-2 bg-white hover:bg-[#F0FDF4] border border-[#CBD5E1] hover:border-[#14532D] text-[#64748B] hover:text-[#14532D] rounded-lg transition-all shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 text-[#14532D] ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            onClick={() => navigate('/market-data')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F0FDF4] border border-[#CBD5E1] hover:border-[#14532D] text-xs font-medium text-[#17211B] rounded-lg transition-all shadow-2xs"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-[#14532D]" />
            <span className="hidden sm:inline">Ingest Data</span>
          </button>

          <button
            onClick={() => navigate('/backtesting')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14532D] hover:bg-[#166534] text-xs font-semibold text-white rounded-lg transition-all shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>New Backtest</span>
          </button>
        </div>
      </div>
    </div>
  );
};
