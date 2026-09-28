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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0A101D] border border-[#1E3A8A] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-[#17253D]">
          <Search className="w-5 h-5 text-[#3B82F6] shrink-0" />
          <input
            type="text"
            placeholder="Type a command, tool, or search workspace (e.g. Backtest, VaR, RSI, Monte Carlo)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent pl-3 pr-2 text-sm text-white placeholder-[#64748B] outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-1.5 py-0.5 text-[10px] font-mono-num bg-[#152136] text-[#94A3B8] rounded border border-[#17253D]">
              ESC
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-[#152136] text-[#94A3B8] hover:text-white rounded"
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
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#152136] text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-[#1E3A8A]/30 text-[#60A5FA] group-hover:text-white group-hover:bg-[#1D4ED8] transition-colors">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#E2E8F0] group-hover:text-white">
                        {cmd.title}
                      </div>
                      <div className="text-[10px] text-[#64748B]">{cmd.category}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#3B82F6] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Open →
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#070D18] border-t border-[#17253D] flex items-center justify-between text-[11px] text-[#64748B]">
          <span>Institutional Quant Workstation</span>
          <div className="flex items-center gap-2">
            <span>Navigate: <kbd className="text-[#94A3B8]">↑↓</kbd></span>
            <span>Select: <kbd className="text-[#94A3B8]">↵</kbd></span>
            <span>Toggle: <kbd className="text-[#94A3B8]">Ctrl+K</kbd></span>
          </div>
        </div>
      </div>
    </div>
  );
};
