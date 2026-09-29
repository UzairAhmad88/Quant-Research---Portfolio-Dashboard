import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LineChart,
  PieChart,
  Scale,
  Network,
  Activity,
  Zap,
  Play,
  FlaskConical,
  BookOpen,
  FileText,
  Sliders,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const commands: CommandItem[] = [
    { id: 'dash', title: 'Research Dashboard Overview', category: 'Navigation', icon: Sparkles, route: '/' },
    { id: 'live', title: 'Live Market Monitor & Watchlists', category: 'Market Data', icon: Activity, route: '/live-market' },
    { id: 'mkt', title: 'Market Data & Historical Ingestion', category: 'Market Data', icon: LineChart, route: '/market-data' },
    { id: 'ret', title: 'Return Calculator & CAGR Analytics', category: 'Analytics', icon: Scale, route: '/returns' },
    { id: 'vol', title: 'Volatility Analyzer & Rolling Variance', category: 'Analytics', icon: Activity, route: '/volatility' },
    { id: 'corr', title: 'Correlation Matrix & Asset Networks', category: 'Analytics', icon: Network, route: '/correlation' },
    { id: 'feat', title: 'Feature Engineering & Factor Explorer', category: 'Quant Lab', icon: Zap, route: '/features' },
    { id: 'risk', title: 'Advanced Risk Engine (VaR, ES, Beta)', category: 'Risk', icon: ShieldAlert, route: '/risk' },
    { id: 'regime', title: 'Market Regime Lab (Bull/Bear/Turbulence)', category: 'Quant Lab', icon: Activity, route: '/regimes' },
    { id: 'strat', title: 'Strategy Lab & Signal Engine', category: 'Strategies', icon: Sliders, route: '/strategies' },
    { id: 'sweep', title: 'Parameter Sweep & Walk-Forward Lab', category: 'Strategies', icon: Sliders, route: '/strategy-lab' },
    { id: 'bt', title: 'Backtesting Engine & Simulation', category: 'Backtesting', icon: Play, route: '/backtesting' },
    { id: 'mc', title: 'Monte Carlo Stress-Testing Lab', category: 'Backtesting', icon: FlaskConical, route: '/monte-carlo' },
    { id: 'notes', title: 'Research Notebook & Experiment Tracker', category: 'Research', icon: FileText, route: '/research' },
    { id: 'glossary', title: 'Quant Glossary & Formula Inspector', category: 'Education', icon: BookOpen, route: '/learning' },
    { id: 'port', title: 'Portfolio Management & Position Analytics', category: 'Portfolios', icon: PieChart, route: '/portfolios' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredCommands = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (route: string) => {
    navigate(route);
    setIsOpen(false);
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-[#E5E7EB]">
          <Search className="w-5 h-5 text-[#14532D] shrink-0" />
          <input
            type="text"
            placeholder="Type a command, tool, or search workspace (e.g. Backtest, VaR, RSI, Monte Carlo)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent pl-3 pr-2 text-sm text-[#17211B] placeholder-[#94A3B8] outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-1.5 py-0.5 text-[10px] font-mono-num bg-[#F1F5F9] text-[#64748B] rounded border border-[#E2E8F0]">
              ESC
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-[#F0FDF4] text-[#64748B] hover:text-[#17211B] rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#64748B]">
              No matching quant modules or tools found.
            </div>
          ) : (
            filteredCommands.map((cmd) => {
              const IconComp = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd.route)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#F0FDF4] text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-[#DCFCE7] text-[#166534] group-hover:text-white group-hover:bg-[#14532D] transition-colors">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#17211B] group-hover:text-[#14532D]">
                        {cmd.title}
                      </div>
                      <div className="text-[10px] text-[#64748B]">{cmd.category}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#14532D] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Open →
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#F8FAF9] border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#64748B]">
          <span>Institutional Quant Workstation</span>
          <div className="flex items-center gap-2">
            <span>Navigate: <kbd className="text-[#17211B]">↑↓</kbd></span>
            <span>Select: <kbd className="text-[#17211B]">↵</kbd></span>
            <span>Toggle: <kbd className="text-[#17211B]">Ctrl+K</kbd></span>
          </div>
        </div>
      </div>
    </div>
  );
};
