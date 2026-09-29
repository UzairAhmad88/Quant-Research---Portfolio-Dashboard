import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Search, Bell, Moon, Menu, HelpCircle } from 'lucide-react';
import { fetchHealth } from '../../lib/apiClient';
import { QuantHelpModal } from '../common/QuantHelpModal';

export const TopBar: React.FC = () => {
  const {
    isSidebarCollapsed,
    toggleMobileDrawer,
    toggleCommandPalette,
    toggleNotificationCenter,
  } = useAppStore();

  const [, setBackendStatus] = useState<'ONLINE' | 'STANDBY'>('STANDBY');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    fetchHealth().then((res) => {
      if (res.status === 'ok') {
        setBackendStatus('ONLINE');
      }
    });
  }, []);

  // Global key listener for '?' to open help modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '?' || (e.shiftKey && e.key === '/')) &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setIsHelpOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 right-0 z-[50] h-14 bg-white border-b border-[#E5E7EB] transition-all duration-200 ease-in-out flex items-center justify-between px-4 sm:px-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${
          isSidebarCollapsed ? 'left-0 md:left-16' : 'left-0 md:left-56'
        }`}
      >
        {/* Left Search Bar (or Mobile Hamburger) */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileDrawer}
            className="md:hidden p-1.5 rounded text-[#64748B] hover:text-[#17211B] hover:bg-[#F0FDF4]"
            aria-label="Open mobile navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Trigger (Command Palette Ctrl + K) */}
          <button
            onClick={toggleCommandPalette}
            className="flex items-center justify-between w-64 sm:w-80 md:w-96 px-3 py-1.5 rounded-lg bg-[#F8FAF9] border border-[#E5E7EB] text-xs text-[#64748B] hover:border-[#14532D]/60 hover:text-[#17211B] hover:bg-white transition-all shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="truncate">Search instruments (e.g. AAPL, MSFT, SPY) ...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#CBD5E1] text-[10px] font-mono-num text-[#64748B] ml-2 flex-shrink-0">
              Ctrl + K
            </kbd>
          </button>
        </div>

        {/* Right Status Bar & Controls */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Live Market Data Status */}
          <div className="hidden sm:flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-[#F0FDF4] border border-[#DCFCE7]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] shadow-[0_0_6px_rgba(22,163,74,0.5)] animate-pulse" />
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="font-semibold text-[#14532D] text-[11px]">Market Data</span>
              <span className="text-[10px] text-[#64748B] font-mono">• Live</span>
            </div>
          </div>

          {/* Notification Bell with Badge */}
          <button
            onClick={toggleNotificationCenter}
            className="p-1.5 rounded-full text-[#64748B] hover:text-[#14532D] hover:bg-[#F0FDF4] transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-0.5 right-0.5 flex items-center justify-center w-3.5 h-3.5 bg-[#DC2626] text-white rounded-full text-[8px] font-bold font-mono">
              3
            </span>
          </button>

          {/* Theme Mode Toggle & Help */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-1.5 rounded-full text-[#64748B] hover:text-[#14532D] hover:bg-[#F0FDF4] transition-colors"
            title="Guide & Math (?)"
          >
            <HelpCircle className="w-4 h-4 text-[#14532D]" />
          </button>

          <button
            className="p-1.5 rounded-full text-[#64748B] hover:text-[#14532D] hover:bg-[#F0FDF4] transition-colors"
            title="Theme Mode"
          >
            <Moon className="w-4 h-4" />
          </button>

          {/* User Profile / Researcher Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#E5E7EB]">
            <div className="w-7 h-7 rounded-full bg-[#14532D] text-white flex items-center justify-center text-xs font-bold font-sans shadow-xs">
              R
            </div>
            <span className="hidden md:inline text-xs font-semibold text-[#17211B]">Researcher</span>
          </div>
        </div>
      </header>

      {/* Global Quant Help Modal */}
      <QuantHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
};
