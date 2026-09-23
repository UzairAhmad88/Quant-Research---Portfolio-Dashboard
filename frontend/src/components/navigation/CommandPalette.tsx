import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { Input } from '../ui/Input';
import {
  Search,
  LayoutDashboard,
  Database,
  TrendingUp,
  PieChart,
  GitMerge,
  Activity,
  Sliders,
  PlayCircle,
  Settings,
  ArrowRight,
} from 'lucide-react';

interface CommandItem {
  id: string;
  name: string;
  section: string;
  path: string;
  icon: React.ElementType;
}

const commands: CommandItem[] = [
  { id: 'cmd-overview', name: 'Overview & Platform Status', section: 'RESEARCH', path: '/', icon: LayoutDashboard },
  { id: 'cmd-market-data', name: 'Market Data Ingestion', section: 'RESEARCH', path: '/market-data', icon: Database },
  { id: 'cmd-returns', name: 'Return Calculator & Performance', section: 'RESEARCH', path: '/returns', icon: TrendingUp },
  { id: 'cmd-portfolio', name: 'Portfolio Allocation & Risk', section: 'RESEARCH', path: '/portfolio', icon: PieChart },
  { id: 'cmd-correlation', name: 'Correlation Matrix & Covariance', section: 'ANALYSIS', path: '/correlation', icon: GitMerge },
  { id: 'cmd-volatility', name: 'Volatility Engine & VaR', section: 'ANALYSIS', path: '/volatility', icon: Activity },
  { id: 'cmd-strategies', name: 'Quantitative Trading Strategies', section: 'STRATEGIES', path: '/strategies', icon: Sliders },
  { id: 'cmd-backtesting', name: 'Backtesting Simulator Engine', section: 'STRATEGIES', path: '/backtesting', icon: PlayCircle },
  { id: 'cmd-settings', name: 'System Settings & Provider Config', section: 'SYSTEM', path: '/settings', icon: Settings },
];

export const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = commands.filter((cmd) =>
    cmd.name.toLowerCase().includes(query.toLowerCase()) ||
    cmd.section.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const handleSelect = (path: string) => {
    navigate(path);
    setCommandPaletteOpen(false);
    setQuery('');
  };

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredCommands[selectedIndex].path);
    } else if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs"
        onClick={() => setCommandPaletteOpen(false)}
      />

      {/* Command Palette Modal */}
      <div
        className="relative w-full max-w-xl bg-[#151F2E] border border-[#263244] rounded-md shadow-2xl overflow-hidden text-[#E5E7EB] z-10 flex flex-col"
        onKeyDown={handleKeyNavigation}
      >
        <div className="p-3 border-b border-[#263244] bg-[#111827]">
          <Input
            autoFocus
            type="text"
            placeholder="Type a command or search pages (e.g. Portfolio, Risk, Settings)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<Search className="w-4 h-4 text-[#3B82F6]" />}
            className="bg-[#151F2E] text-sm"
          />
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#94A3B8]">
              No matching pages or commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd.path)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#3B82F6] text-white'
                      : 'text-[#94A3B8] hover:bg-[#1C2A3E] hover:text-[#E5E7EB]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#3B82F6]'}`} />
                    <span className="font-medium truncate">{cmd.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono-num px-1.5 py-0.5 rounded border uppercase ${
                        isSelected
                          ? 'bg-white/20 text-white border-transparent'
                          : 'bg-[#111827] text-[#64748B] border-[#263244]'
                      }`}
                    >
                      {cmd.section}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'opacity-40'}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-[#111827] border-t border-[#263244] flex items-center justify-between text-[10px] font-mono-num text-[#64748B]">
          <span>
            Use <kbd className="px-1 py-0.5 rounded bg-[#151F2E] border border-[#263244]">↑</kbd>{' '}
            <kbd className="px-1 py-0.5 rounded bg-[#151F2E] border border-[#263244]">↓</kbd> to navigate
          </span>
          <span>
            Press <kbd className="px-1 py-0.5 rounded bg-[#151F2E] border border-[#263244]">Esc</kbd> to exit
          </span>
        </div>
      </div>
    </div>
  );
};
