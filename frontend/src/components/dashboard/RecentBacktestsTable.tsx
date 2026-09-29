import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ArrowRight, CheckCircle2 } from 'lucide-react';


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
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#E5E7EB] gap-2">
        <h3 className="text-sm font-bold text-[#17211B] tracking-tight">Recent Backtests</h3>

        <div className="flex items-center gap-2">
          {/* Strategy filter selector */}
          <div className="flex items-center bg-[#F8FAF9] border border-[#CBD5E1] rounded-md p-0.5 text-[11px]">
            {['ALL', 'SMA', 'Momentum', 'Reversion'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterStrategy(cat)}
                className={`px-2 py-0.5 rounded transition-all ${
                  filterStrategy === cat
                    ? 'bg-[#14532D] text-white font-semibold'
                    : 'text-[#64748B] hover:text-[#17211B]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/backtesting')}
            className="text-xs text-[#14532D] hover:text-[#166534] flex items-center gap-1 font-semibold group transition-colors"
          >
            New <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] text-[#64748B] bg-[#F0FDF4] border-b border-[#E5E7EB]">
              <th className="py-2 px-2 font-semibold">Strategy Model</th>
              <th className="py-2 px-2 font-semibold">Symbol</th>
              <th className="py-2 px-2 font-semibold text-center">Period</th>
              <th className="py-2 px-2 font-semibold text-right">Return</th>
              <th className="py-2 px-2 font-semibold text-right">Sharpe</th>
              <th className="py-2 px-2 font-semibold text-right">Max DD</th>
              <th className="py-2 px-2 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] text-xs font-mono-num">
            {filteredBacktests.map((item) => (
              <tr
                key={item.id}
                onClick={() => handleRowClick(item)}
                className="hover:bg-[#F8FAF9] transition-colors cursor-pointer group"
              >
                <td className="py-2.5 px-2 text-[#17211B] font-sans font-medium group-hover:text-[#14532D] flex items-center gap-1.5">
                  <Play className="w-3 h-3 text-[#14532D] opacity-0 group-hover:opacity-100 transition-opacity fill-current" />
                  {item.strategy}
                </td>
                <td className="py-2.5 px-2 font-bold text-[#17211B]">{item.instrument}</td>
                <td className="py-2.5 px-2 text-center text-[#64748B]">{item.period}</td>
                <td className="py-2.5 px-2 text-right text-[#15803D] font-bold">{item.totalReturn}</td>
                <td className="py-2.5 px-2 text-right text-[#17211B] font-medium">{item.sharpe}</td>
                <td className="py-2.5 px-2 text-right text-[#DC2626] font-medium">{item.maxDD}</td>
                <td className="py-2.5 px-2 text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-[#166534] bg-[#DCFCE7] border border-[#BBF7D0] rounded">
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
