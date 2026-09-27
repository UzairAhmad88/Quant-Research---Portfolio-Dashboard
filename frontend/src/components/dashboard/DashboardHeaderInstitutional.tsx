import React, { useState, useEffect } from 'react';

interface DashboardHeaderInstitutionalProps {
  onRefresh?: () => void;
  isFetching?: boolean;
}

export const DashboardHeaderInstitutional: React.FC<DashboardHeaderInstitutionalProps> = () => {
  const [activeRange, setActiveRange] = useState('1D');
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

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-1">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Research Dashboard</h1>
        <p className="text-xs text-[#94A3B8] mt-1">
          Quantitative research, analysis, and backtesting in one integrated workspace.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Live Clock */}
        <div className="text-right font-mono-num">
          <div className="text-xs text-[#94A3B8]">{dateString || 'Monday, September 8, 2026'}</div>
          <div className="text-xs font-semibold text-[#E2E8F0] tracking-wide">{timeString || '14:32:18 (UTC)'}</div>
        </div>

        {/* Timeframe Range Selector */}
        <div className="flex items-center bg-[#0D1525] border border-[#17253D] rounded-lg p-0.5 shadow-inner">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                activeRange === range
                  ? 'bg-[#1D4ED8] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#152136]'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
