import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Search, Bell, Activity, Server, Clock, UserCheck } from 'lucide-react';
import { fetchHealth } from '../../lib/apiClient';

const routeTitles: Record<string, string> = {
  '/': 'Platform Overview',
  '/market-data': 'Market Data Ingestion',
  '/returns': 'Return Calculator',
  '/portfolio': 'Portfolio Analytics',
  '/correlation': 'Correlation Matrix',
  '/volatility': 'Volatility & Risk Analytics',
  '/strategies': 'Quantitative Strategies',
  '/backtesting': 'Backtesting Engine',
  '/settings': 'System Settings',
};

export const TopBar: React.FC = () => {
  const location = useLocation();
  const { searchQuery, setSearchQuery, isSidebarCollapsed } = useAppStore();
  const [backendStatus, setBackendStatus] = useState<'ONLINE' | 'STANDBY'>('STANDBY');
  const [dbStatus, setDbStatus] = useState<boolean>(false);

  const currentTitle = routeTitles[location.pathname] || 'Quant Research Dashboard';

  useEffect(() => {
    fetchHealth().then((res) => {
      if (res.success) {
        setBackendStatus('ONLINE');
        setDbStatus(res.data.dbConnected);
      }
    });
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-14 bg-[#111827] border-b border-[#263244] transition-all duration-200 ease-in-out flex items-center justify-between px-6 ${
        isSidebarCollapsed ? 'left-16' : 'left-60'
      }`}
    >
      {/* Title & Eyebrow */}
      <div className="flex items-center gap-4">
        <div>
          <div className="text-[10px] font-mono-num font-semibold text-[#64748B] tracking-wider uppercase">
            Institutional Research Shell
          </div>
          <h1 className="text-sm font-semibold text-[#E5E7EB] tracking-tight">{currentTitle}</h1>
        </div>
      </div>

      {/* Global Search Placeholder */}
      <div className="hidden md:flex items-center w-72">
        <Input
          type="text"
          placeholder="Search ticker, instrument, or module..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="w-3.5 h-3.5" />}
        />
      </div>

      {/* Status Bar Indicators */}
      <div className="flex items-center gap-4">
        {/* Backend API Health Status */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-[#94A3B8] border-r border-[#263244] pr-4">
          <Server className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span className="font-mono-num text-[11px]">API:</span>
          <Badge variant={backendStatus === 'ONLINE' ? 'success' : 'warning'}>
            {backendStatus}
          </Badge>
        </div>

        {/* Database Status Placeholder */}
        <div className="hidden xl:flex items-center gap-2 text-xs text-[#94A3B8] border-r border-[#263244] pr-4">
          <Activity className="w-3.5 h-3.5 text-[#22C55E]" />
          <span className="font-mono-num text-[11px]">DB:</span>
          <Badge variant={dbStatus ? 'success' : 'outline'}>
            {dbStatus ? 'PostgreSQL' : 'Standby'}
          </Badge>
        </div>

        {/* Provider Status Placeholder */}
        <div className="hidden 2xl:flex items-center gap-2 text-xs text-[#94A3B8] border-r border-[#263244] pr-4">
          <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className="font-mono-num text-[11px]">Provider:</span>
          <span className="font-mono-num text-[11px] text-[#64748B]">Unconnected</span>
        </div>

        {/* Notifications & Profile Area Placeholders */}
        <div className="flex items-center gap-3">
          <button
            className="p-1.5 rounded text-[#94A3B8] hover:text-[#E5E7EB] hover:bg-[#151F2E] transition-colors relative"
            title="Notifications (Placeholder)"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#3B82F6] rounded-full" />
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-[#263244]">
            <div className="w-7 h-7 rounded bg-[#151F2E] border border-[#263244] flex items-center justify-center text-[#3B82F6]">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-medium text-[#E5E7EB] leading-none">Quant Analyst</span>
              <span className="text-[10px] font-mono-num text-[#64748B] leading-none mt-0.5">Auth Disabled</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
