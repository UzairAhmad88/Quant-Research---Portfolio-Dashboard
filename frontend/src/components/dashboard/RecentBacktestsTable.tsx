import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';

export const RecentBacktestsTable: React.FC = () => {
  const navigate = useNavigate();
  const [filterStrategy, setFilterStrategy] = useState<string>('ALL');

  const backtests = [
    {
      id: 'bt-1',
      strategy: 'SMA Crossover (20/50)',
      instrument: 'AAPL',
      period: '2024–2026',
      totalReturn: '+13.08%',
      sharpe: '0.4388',
      trades: 7,
      maxDD: '-18.45%',
      status: 'Completed',
    },
    {
      id: 'bt-2',
      strategy: 'SMA Trend Following (50/200)',
      instrument: 'SPY',
      period: '2024–2026',
      totalReturn: '+24.18%',
      sharpe: '0.9421',
      trades: 4,
      maxDD: '-11.20%',
      status: 'Completed',
    },
    {
      id: 'bt-3',
      strategy: 'Momentum Breakout',
      instrument: 'NVDA',
      period: '2024–2026',
      totalReturn: '+68.24%',
      sharpe: '1.4820',
      trades: 12,
      maxDD: '-22.10%',
      status: 'Completed',
    },
    {
      id: 'bt-4',
      strategy: 'Mean Reversion Bands',
      instrument: 'QQQ',
      period: '2024–2026',
      totalReturn: '+18.72%',
      sharpe: '0.7812',
      trades: 9,
      maxDD: '-14.30%',
      status: 'Completed',
    },
    {
      id: 'bt-5',
      strategy: 'Dual Moving Average',
      instrument: 'MSFT',
      period: '2024–2026',
      totalReturn: '+16.45%',
      sharpe: '0.6240',
      trades: 6,
      maxDD: '-15.80%',
      status: 'Completed',
    },
  ];

  const filteredBacktests = useMemo(() => {
    if (filterStrategy === 'ALL') return backtests;
    return backtests.filter((b) => b.strategy.toLowerCase().includes(filterStrategy.toLowerCase()));
  }, [backtests, filterStrategy]);

  const handleRowClick = (item: (typeof backtests)[0]) => {
    navigate(`/backtesting?symbol=${item.instrument}&strategy=${encodeURIComponent(item.strategy)}`);
  };

  return (
    <div className="bg-[#0D1525] border border-[#17253D] rounded-lg p-4 shadow-md flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#17253D] gap-2">
        <h3 className="text-sm font-bold text-white tracking-tight">Recent Backtests</h3>

        <div className="flex items-center gap-2">

          {/* Strategy filter selector */}
          <div className="flex items-center bg-[#070D18] border border-[#17253D] rounded-md p-0.5 text-[11px]">
            {['ALL', 'SMA', 'Momentum', 'Reversion'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterStrategy(cat)}
                className={`px-2 py-0.5 rounded transition-all ${
                  filterStrategy === cat
                    ? 'bg-[#1D4ED8] text-white font-semibold'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/backtesting')}
            className="text-xs text-[#3B82F6] hover:text-[#60A5FA] flex items-center gap-1 font-medium group transition-colors"
          >
            New <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] text-[#94A3B8] border-b border-[#17253D]/80">
              <th className="pb-2 font-medium">Strategy Model</th>
              <th className="pb-2 font-medium">Symbol</th>
              <th className="pb-2 font-medium text-center">Period</th>
              <th className="pb-2 font-medium text-right">Return</th>
              <th className="pb-2 font-medium text-right">Sharpe</th>
              <th className="pb-2 font-medium text-right">Max DD</th>
              <th className="pb-2 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#17253D]/40 text-xs font-mono-num">
            {filteredBacktests.map((item) => (
              <tr
                key={item.id}
                onClick={() => handleRowClick(item)}
                className="hover:bg-[#152136]/60 transition-colors cursor-pointer group"
              >
                <td className="py-2.5 text-[#E2E8F0] font-sans font-medium group-hover:text-white flex items-center gap-1.5">
                  <Play className="w-3 h-3 text-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity fill-current" />
                  {item.strategy}
                </td>
                <td className="py-2.5 font-bold text-white">{item.instrument}</td>
                <td className="py-2.5 text-center text-[#94A3B8]">{item.period}</td>
                <td className="py-2.5 text-right text-[#22C55E] font-bold">{item.totalReturn}</td>
                <td className="py-2.5 text-right text-[#E2E8F0] font-medium">{item.sharpe}</td>
                <td className="py-2.5 text-right text-[#EF4444] font-medium">{item.maxDD}</td>
                <td className="py-2.5 text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-[#22C55E] bg-[#14532D]/40 border border-[#22C55E]/30 rounded">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Done</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
