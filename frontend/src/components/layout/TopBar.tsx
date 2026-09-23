import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { Badge } from '../ui/Badge';
import { Search, Bell, Server, UserCheck, Menu } from 'lucide-react';
import { fetchHealth } from '../../lib/apiClient';

const routeTitles: Record<string, string> = {
  '/': 'Platform Overview',
  '/market-data': 'Market Data Ingestion',
  '/returns': 'Return Calculator',
  '/portfolio': 'Portfolio Analytics',
  '/correlation': 'Correlation Matrix',
  '/volatility': 'Volatility Analytics',
  '/strategies': 'Quantitative Strategies',
  '/backtesting': 'Backtesting Engine',
  '/settings': 'System Settings',
};

export const TopBar: React.FC = () => {
  const location = useLocation();
  const {
    isSidebarCollapsed,
    toggleMobileDrawer,
    toggleCommandPalette,
    toggleNotificationCenter,
    notifications,
  } = useAppStore();

  const [backendStatus, setBackendStatus] = useState<'ONLINE' | 'STANDBY'>('STANDBY');

  const currentTitle = routeTitles[location.pathname] || 'Quant Research Dashboard';
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    fetchHealth().then((res) => {
      if (res.status === 'ok') {
        setBackendStatus('ONLINE');
      }
    });
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 z-[50] h-14 bg-[#111827] border-b border-[#263244] transition-all duration-200 ease-in-out flex items-center justify-between px-4 sm:px-6 ${
        isSidebarCollapsed ? 'left-0 md:left-16' : 'left-0 md:left-60'
      }`}
    >
      {/* Title & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileDrawer}
          className="md:hidden p-1.5 rounded text-[#94A3B8] hover:text-[#E5E7EB] hover:bg-[#151F2E]"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="text-[10px] font-mono-num font-semibold text-[#64748B] tracking-wider uppercase">
            Institutional Research Workstation
          </div>
          <h1 className="text-sm font-semibold text-[#E5E7EB] tracking-tight">{currentTitle}</h1>
        </div>
      </div>

      {/* Center Search Trigger (Command Palette Ctrl + K) */}
      <button
        onClick={toggleCommandPalette}
        className="hidden sm:flex items-center justify-between w-64 px-3 py-1.5 rounded bg-[#151F2E] border border-[#263244] text-xs text-[#64748B] hover:border-[#3B82F6]/50 hover:text-[#94A3B8] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span>Search or type command...</span>
        </div>
        <kbd className="px-1.5 py-0.5 rounded bg-[#111827] border border-[#263244] text-[10px] font-mono-num text-[#94A3B8]">
          Ctrl K
        </kbd>
      </button>

      {/* Status Bar Indicators & Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Market Status Placeholder Component */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono-num text-[#94A3B8] border-r border-[#263244] pr-3">
          <span className="text-[#64748B]">Market:</span>
          <span className="inline-flex items-center gap-1 text-[#F59E0B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            Closed
          </span>
        </div>

        {/* Data Status Placeholder Component */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono-num text-[#94A3B8] border-r border-[#263244] pr-3">
          <span className="text-[#64748B]">Data:</span>
          <span className="inline-flex items-center gap-1 text-[#22C55E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            Connected
          </span>
        </div>

        {/* Backend API Health Status */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-[#94A3B8] border-r border-[#263244] pr-3">
          <Server className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span className="font-mono-num text-[11px]">API:</span>
          <Badge variant={backendStatus === 'ONLINE' ? 'success' : 'warning'}>
            {backendStatus}
          </Badge>
        </div>

        {/* Notification Bell Trigger */}
        <button
          onClick={toggleNotificationCenter}
          className="p-1.5 rounded text-[#94A3B8] hover:text-[#E5E7EB] hover:bg-[#151F2E] transition-colors relative"
          title="Notification Center"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-[14px] h-[14px] px-1 bg-[#3B82F6] text-white rounded-full text-[9px] font-mono-num font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile / Auth Ready */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#263244]">
          <div className="w-7 h-7 rounded bg-[#151F2E] border border-[#263244] flex items-center justify-center text-[#3B82F6]">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-medium text-[#E5E7EB] leading-none">Quant Analyst</span>
            <span className="text-[10px] font-mono-num text-[#64748B] leading-none mt-0.5">Auth Disabled</span>
          </div>
        </div>
      </div>
    </header>
  );
};
