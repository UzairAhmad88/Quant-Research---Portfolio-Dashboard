import React from 'react';

export const TopInstrumentsTable: React.FC = () => {
  const instruments = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: '228.90',
      day: '+0.81%',
      month: '+5.24%',
      ytd: '+28.4%',
      volume: '48.2M',
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      price: '415.22',
      day: '+0.63%',
      month: '+4.18%',
      ytd: '+24.1%',
      volume: '22.1M',
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: '178.34',
      day: '+1.12%',
      month: '+6.37%',
      ytd: '+32.8%',
      volume: '28.4M',
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      price: '162.18',
      day: '+0.48%',
      month: '+3.92%',
      ytd: '+18.6%',
      volume: '31.7M',
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      price: '452.31',
      day: '+1.24%',
      month: '+8.11%',
      ytd: '+46.3%',
      volume: '42.9M',
    },
  ];

  return (
    <div className="bg-[#0D1525] border border-[#17253D] rounded-lg p-4 shadow-md flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#17253D]">
        <h3 className="text-sm font-bold text-white tracking-tight">Top Instruments</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] text-[#94A3B8] border-b border-[#17253D]/80">
              <th className="pb-2 font-medium">Symbol</th>
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium text-right">Price</th>
              <th className="pb-2 font-medium text-right">1D %</th>
              <th className="pb-2 font-medium text-right">1M %</th>
              <th className="pb-2 font-medium text-right">YTD %</th>
              <th className="pb-2 font-medium text-right">Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#17253D]/40 text-xs font-mono-num">
            {instruments.map((item) => (
              <tr key={item.symbol} className="hover:bg-[#152136]/40 transition-colors">
                <td className="py-2 font-bold text-white tracking-tight">{item.symbol}</td>
                <td className="py-2 text-[#94A3B8] font-sans truncate max-w-[110px]">{item.name}</td>
                <td className="py-2 text-right text-[#E2E8F0] font-medium">{item.price}</td>
                <td className="py-2 text-right text-[#22C55E] font-medium">{item.day}</td>
                <td className="py-2 text-right text-[#22C55E] font-medium">{item.month}</td>
                <td className="py-2 text-right text-[#22C55E] font-medium">{item.ytd}</td>
                <td className="py-2 text-right text-[#94A3B8]">{item.volume}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
