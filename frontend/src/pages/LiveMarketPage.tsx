import React, { useState } from 'react';
import { Plus, Star, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarketStream } from '../hooks/useMarketStream';

export const LiveMarketPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeWatchlist, setActiveWatchlist] = useState('US Tech Alpha');
  const [customSymbols, setCustomSymbols] = useState(['AAPL', 'MSFT', 'NVDA', 'SPY', 'QQQ', 'GOOGL', 'AMZN', 'TSLA']);
  const [newSymbolInput, setNewSymbolInput] = useState('');

  const { ticks, status, lastUpdate } = useMarketStream(customSymbols);

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = newSymbolInput.trim().toUpperCase();
    if (sym && !customSymbols.includes(sym)) {
      setCustomSymbols([...customSymbols, sym]);
      setNewSymbolInput('');
    }
  };

  // Base fallback prices if websocket is standby
  const basePrices: Record<string, { price: number; name: string; asset: string; change: number; pct: number }> = {
    AAPL: { price: 228.90, name: 'Apple Inc.', asset: 'EQUITY', change: 1.84, pct: 0.81 },
    MSFT: { price: 415.22, name: 'Microsoft Corp.', asset: 'EQUITY', change: 2.61, pct: 0.63 },
    NVDA: { price: 452.31, name: 'NVIDIA Corp.', asset: 'EQUITY', change: 5.54, pct: 1.24 },
    SPY: { price: 588.42, name: 'SPDR S&P 500 ETF', asset: 'ETF', change: 2.58, pct: 0.44 },
    QQQ: { price: 512.18, name: 'Invesco QQQ Trust', asset: 'ETF', change: 4.28, pct: 0.84 },
    GOOGL: { price: 178.34, name: 'Alphabet Inc.', asset: 'EQUITY', change: 1.98, pct: 1.12 },
    AMZN: { price: 162.18, name: 'Amazon.com Inc.', asset: 'EQUITY', change: 0.77, pct: 0.48 },
    TSLA: { price: 248.50, name: 'Tesla Inc.', asset: 'EQUITY', change: -3.20, pct: -1.27 },
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#17211B] tracking-tight">Live Market Monitor</h1>
            <span
              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border flex items-center gap-1.5 ${
                status === 'LIVE'
                  ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                  : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status === 'LIVE' ? 'bg-[#16A34A] animate-pulse' : 'bg-[#D97706]'}`}></span>
              STREAMING: {status}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Real-time WebSocket quote aggregation, bid/ask depth, and institutional watchlists without polling.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono-num">
          <span className="text-[#64748B]">Last Broadcast: <strong className="text-[#17211B]">{lastUpdate}</strong></span>
        </div>
      </div>

      {/* Watchlist Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E5E7EB] rounded-lg p-3 shadow-sm">
        <div className="flex items-center gap-2">
          {['US Tech Alpha', 'Mega-Cap Equities', 'Macro & ETFs'].map((wl) => (
            <button
              key={wl}
              onClick={() => setActiveWatchlist(wl)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeWatchlist === wl
                  ? 'bg-[#14532D] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#17211B] hover:bg-[#F0FDF4]'
              }`}
            >
              {wl}
            </button>
          ))}
        </div>

        {/* Add symbol form */}
        <form onSubmit={handleAddSymbol} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Add Symbol (e.g. AMD, META)..."
            value={newSymbolInput}
            onChange={(e) => setNewSymbolInput(e.target.value)}
            className="px-3 py-1.5 bg-[#F8FAF9] border border-[#CBD5E1] focus:border-[#14532D] focus:ring-1 focus:ring-[#14532D]/20 text-xs text-[#17211B] placeholder-[#64748B] rounded-md outline-none uppercase"
          />
          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-1.5 bg-[#14532D] hover:bg-[#166534] text-xs font-semibold text-white rounded-md transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Live Quotes Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] text-[#64748B] bg-[#F0FDF4] border-b border-[#E5E7EB]">
                <th className="py-2.5 px-2 font-semibold">Instrument</th>
                <th className="py-2.5 px-2 font-semibold">Name</th>
                <th className="py-2.5 px-2 font-semibold text-right">Last Price</th>
                <th className="py-2.5 px-2 font-semibold text-right">Bid</th>
                <th className="py-2.5 px-2 font-semibold text-right">Ask</th>
                <th className="py-2.5 px-2 font-semibold text-right">Spread</th>
                <th className="py-2.5 px-2 font-semibold text-right">1D Change</th>
                <th className="py-2.5 px-2 font-semibold text-right">1D Change %</th>
                <th className="py-2.5 px-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-xs font-mono-num">
              {customSymbols.map((sym) => {
                const liveTick = ticks[sym];
                const base = basePrices[sym] || { price: 100.0, name: `${sym} Asset`, asset: 'EQUITY', change: 0.5, pct: 0.5 };
                const price = liveTick ? liveTick.price : base.price;
                const change = liveTick ? liveTick.change : base.change;
                const changePct = liveTick ? liveTick.changePct : base.pct;
                const bid = liveTick?.bid || price * 0.9998;
                const ask = liveTick?.ask || price * 1.0002;
                const spread = liveTick?.spread || ask - bid;
                const isPositive = changePct >= 0;

                return (
                  <tr
                    key={sym}
                    onClick={() => navigate(`/market-data?symbol=${sym}`)}
                    className="hover:bg-[#F8FAF9] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-2 font-bold text-[#17211B] flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-[#D97706] fill-current" />
                      <span>{sym}</span>
                    </td>
                    <td className="py-3 px-2 text-[#64748B] font-sans truncate max-w-[140px]">{base.name}</td>
                    <td className="py-3 px-2 text-right font-bold text-[#17211B]">${price.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right text-[#64748B]">${bid.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right text-[#64748B]">${ask.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right text-[#64748B]">${spread.toFixed(2)}</td>
                    <td className={`py-3 px-2 text-right font-medium ${isPositive ? 'text-[#15803D]' : 'text-[#DC2626]'}`}>
                      {isPositive ? '+' : ''}{change.toFixed(2)}
                    </td>
                    <td className={`py-3 px-2 text-right font-bold flex items-center justify-end gap-0.5 ${isPositive ? 'text-[#15803D]' : 'text-[#DC2626]'}`}>
                      {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>{isPositive ? '+' : ''}{changePct.toFixed(2)}%</span>
                    </td>
                    <td className="py-3 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/returns?symbol=${sym}`)}
                          className="px-2 py-0.5 bg-white hover:bg-[#F0FDF4] text-[#14532D] border border-[#CBD5E1] hover:border-[#14532D] rounded text-[11px] font-medium transition-colors"
                        >
                          Analyze
                        </button>
                        <button
                          onClick={() => navigate(`/backtesting?symbol=${sym}`)}
                          className="px-2 py-0.5 bg-[#14532D] hover:bg-[#166534] text-white rounded text-[11px] font-medium transition-colors"
                        >
                          Backtest
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
    </div>
  );
};

export default LiveMarketPage;
