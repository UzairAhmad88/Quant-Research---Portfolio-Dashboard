import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowUpDown, ChevronUp, ChevronDown, Play, LineChart } from 'lucide-react';

export interface TopInstrumentsTableProps {
  onSelectInstrument?: (symbol: string) => void;
  activeSymbol?: string;
}

interface InstrumentRow {
  symbol: string;
  name: string;
  price: number;
  day: number;
  month: number;
  ytd: number;
  volume: string;
}

export const TopInstrumentsTable: React.FC<TopInstrumentsTableProps> = ({
  onSelectInstrument,
  activeSymbol = 'AAPL',
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof InstrumentRow>('ytd');
  const [sortAsc, setSortAsc] = useState(false);

  const rawInstruments: InstrumentRow[] = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 228.90, day: 0.81, month: 5.24, ytd: 28.4, volume: '48.2M' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.22, day: 0.63, month: 4.18, ytd: 24.1, volume: '22.1M' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 452.31, day: 1.24, month: 8.11, ytd: 46.3, volume: '42.9M' },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', price: 588.42, day: 0.44, month: 3.12, ytd: 18.2, volume: '58.4M' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', price: 512.18, day: 0.84, month: 4.95, ytd: 22.8, volume: '49.6M' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 178.34, day: 1.12, month: 6.37, ytd: 32.8, volume: '28.4M' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 162.18, day: 0.48, month: 3.92, ytd: 18.6, volume: '31.7M' },
  ];

  const handleSort = (field: keyof InstrumentRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredInstruments = useMemo(() => {
    return rawInstruments
      .filter(
        (inst) =>
          inst.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inst.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [rawInstruments, searchTerm, sortField, sortAsc]);

  const handleRowClick = (symbol: string) => {
    if (onSelectInstrument) {
      onSelectInstrument(symbol);
    }
  };

  return (
    <div className="bg-[#0D1525] border border-[#17253D] rounded-lg p-4 shadow-md flex flex-col justify-between">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#17253D] gap-2">
        <h3 className="text-sm font-bold text-white tracking-tight">Top Instruments</h3>

        <div className="relative w-full sm:w-44">

          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter symbols..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 bg-[#070D18] border border-[#17253D] focus:border-[#3B82F6] rounded text-xs text-white placeholder-[#64748B] outline-none transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] text-[#94A3B8] border-b border-[#17253D]/80">
              <th
                onClick={() => handleSort('symbol')}
                className="pb-2 font-medium cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  Symbol {sortField === 'symbol' && (sortAsc ? <ChevronUp className="w-3 h-3 text-[#3B82F6]" /> : <ChevronDown className="w-3 h-3 text-[#3B82F6]" />)}
                </div>
              </th>
              <th className="pb-2 font-medium">Name</th>
              <th
                onClick={() => handleSort('price')}
                className="pb-2 font-medium text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  Price {sortField === 'price' && (sortAsc ? <ChevronUp className="w-3 h-3 text-[#3B82F6]" /> : <ChevronDown className="w-3 h-3 text-[#3B82F6]" />)}
                </div>
              </th>
              <th
                onClick={() => handleSort('day')}
                className="pb-2 font-medium text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  1D % {sortField === 'day' && (sortAsc ? <ChevronUp className="w-3 h-3 text-[#3B82F6]" /> : <ChevronDown className="w-3 h-3 text-[#3B82F6]" />)}
                </div>
              </th>
              <th
                onClick={() => handleSort('month')}
                className="pb-2 font-medium text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  1M % {sortField === 'month' && (sortAsc ? <ChevronUp className="w-3 h-3 text-[#3B82F6]" /> : <ChevronDown className="w-3 h-3 text-[#3B82F6]" />)}
                </div>
              </th>
              <th
                onClick={() => handleSort('ytd')}
                className="pb-2 font-medium text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  YTD % {sortField === 'ytd' && (sortAsc ? <ChevronUp className="w-3 h-3 text-[#3B82F6]" /> : <ChevronDown className="w-3 h-3 text-[#3B82F6]" />)}
                </div>
              </th>
              <th className="pb-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#17253D]/40 text-xs font-mono-num">
            {filteredInstruments.map((item) => {
              const isSelected = activeSymbol === item.symbol;
              return (
                <tr
                  key={item.symbol}
                  onClick={() => handleRowClick(item.symbol)}
                  className={`hover:bg-[#152136]/60 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#1D4ED8]/15 border-l-2 border-[#3B82F6]' : ''
                  }`}
                >
                  <td className="py-2.5 font-bold text-white tracking-tight flex items-center gap-1.5">
                    {item.symbol}
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse"></span>
                    )}
                  </td>
                  <td className="py-2.5 text-[#94A3B8] font-sans truncate max-w-[110px]">{item.name}</td>
                  <td className="py-2.5 text-right text-[#E2E8F0] font-medium">${item.price.toFixed(2)}</td>
                  <td className={`py-2.5 text-right font-medium ${item.day >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    +{item.day.toFixed(2)}%
                  </td>
                  <td className={`py-2.5 text-right font-medium ${item.month >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    +{item.month.toFixed(2)}%
                  </td>
                  <td className={`py-2.5 text-right font-medium ${item.ytd >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    +{item.ytd.toFixed(1)}%
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/returns?symbol=${item.symbol}`)}
                        title="Analyze Returns & Risk"
                        className="p-1 hover:bg-[#1E3A8A] text-[#94A3B8] hover:text-[#93C5FD] rounded transition-colors"
                      >
                        <LineChart className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => navigate(`/backtesting?symbol=${item.symbol}`)}
                        title="Launch Strategy Backtest"
                        className="p-1 hover:bg-[#1E3A8A] text-[#94A3B8] hover:text-[#22C55E] rounded transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
