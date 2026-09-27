import React from 'react';

export const RecentBacktestsTable: React.FC = () => {
  const backtests = [
    {
      strategy: 'Moving Average',
      instrument: 'AAPL',
      period: '2021–2024',
      totalReturn: '+42.8%',
      sharpe: '0.84',
      status: 'Completed',
    },
    {
      strategy: 'Moving Average',
      instrument: 'QQQ',
      period: '2021–2024',
      totalReturn: '+38.1%',
      sharpe: '0.72',
      status: 'Completed',
    },
    {
      strategy: 'Mean Reversion',
      instrument: 'SPY',
      period: '2020–2024',
      totalReturn: '+12.4%',
      sharpe: '0.36',
      status: 'Completed',
    },
    {
      strategy: 'Momentum',
      instrument: 'NVDA',
      period: '2021–2024',
      totalReturn: '+68.2%',
      sharpe: '1.12',
      status: 'Completed',
    },
    {
      strategy: 'Dual Moving Average',
      instrument: 'TSLA',
      period: '2021–2024',
      totalReturn: '+21.7%',
      sharpe: '0.51',
      status: 'Completed',
    },
  ];

  return (
    <div className="bg-[#0D1525] border border-[#17253D] rounded-lg p-4 shadow-md flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#17253D]">
        <h3 className="text-sm font-bold text-white tracking-tight">Recent Backtests</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] text-[#94A3B8] border-b border-[#17253D]/80">
              <th className="pb-2 font-medium">Strategy</th>
              <th className="pb-2 font-medium">Instrument</th>
              <th className="pb-2 font-medium text-center">Period</th>
              <th className="pb-2 font-medium text-right">Total Return</th>
              <th className="pb-2 font-medium text-right">Sharpe</th>
              <th className="pb-2 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#17253D]/40 text-xs">
            {backtests.map((item, idx) => (
              <tr key={idx} className="hover:bg-[#152136]/40 transition-colors">
                <td className="py-2 text-[#E2E8F0] font-medium">{item.strategy}</td>
                <td className="py-2 font-bold font-mono-num text-white">{item.instrument}</td>
                <td className="py-2 text-center text-[#94A3B8] font-mono-num">{item.period}</td>
                <td className="py-2 text-right text-[#22C55E] font-bold font-mono-num">{item.totalReturn}</td>
                <td className="py-2 text-right text-[#E2E8F0] font-mono-num">{item.sharpe}</td>
                <td className="py-2 text-right">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-[#22C55E] bg-[#14532D]/40 border border-[#22C55E]/30 rounded">
                    {item.status}
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
