import React from 'react';
import { NavLink } from 'react-router-dom';
import { MonogramLogo } from '../common/MonogramLogo';
import { useAppStore } from '../../store/appStore';
import { Tooltip } from '../ui/Tooltip';
import {
  LayoutDashboard,
  Database,
  TrendingUp,
  PieChart,
  GitMerge,
  Activity,
  Sliders,
  PlayCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  section: 'RESEARCH' | 'ANALYSIS' | 'STRATEGIES' | 'SYSTEM';
}

const navItems: NavItem[] = [
  { name: 'Overview', path: '/', icon: LayoutDashboard, section: 'RESEARCH' },
  { name: 'Market Data', path: '/market-data', icon: Database, section: 'RESEARCH' },
  { name: 'Returns', path: '/returns', icon: TrendingUp, section: 'RESEARCH' },
  { name: 'Portfolio', path: '/portfolio', icon: PieChart, section: 'RESEARCH' },

  { name: 'Correlation', path: '/correlation', icon: GitMerge, section: 'ANALYSIS' },
  { name: 'Volatility', path: '/volatility', icon: Activity, section: 'ANALYSIS' },

  { name: 'Strategies', path: '/strategies', icon: Sliders, section: 'STRATEGIES' },
  { name: 'Backtesting', path: '/backtesting', icon: PlayCircle, section: 'STRATEGIES' },

  { name: 'Settings', path: '/settings', icon: Settings, section: 'SYSTEM' },
];

export const Sidebar: React.FC = () => {
  const {
    isSidebarCollapsed,
    toggleSidebar,
    isMobileDrawerOpen,
    setMobileDrawerOpen,
  } = useAppStore();

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      {/* Sidebar Top Branding */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-[#263244]">
        <MonogramLogo collapsed={isSidebarCollapsed} />
        {isMobileDrawerOpen && (
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="md:hidden p-1 rounded text-[#94A3B8] hover:text-[#E5E7EB]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Items grouped into RESEARCH, ANALYSIS, STRATEGIES, SYSTEM */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const showSectionHeader =
            !isSidebarCollapsed &&
            (idx === 0 || navItems[idx - 1]?.section !== item.section);

          const navLinkContent = (
            <NavLink
              to={item.path}
              onClick={() => setMobileDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded text-xs transition-colors group ${
                  isActive
                    ? 'bg-[#151F2E] text-[#E5E7EB] font-semibold border-l-2 border-[#3B82F6]'
                    : 'text-[#94A3B8] hover:bg-[#151F2E]/60 hover:text-[#E5E7EB]'
                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`
              }
            >
              <Icon className="w-4 h-4 text-[#94A3B8] group-hover:text-[#3B82F6] transition-colors flex-shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );

          return (
            <React.Fragment key={item.path}>
              {showSectionHeader && (
                <div className="px-3 pt-3 pb-1 text-[10px] font-mono-num font-semibold text-[#64748B] tracking-wider uppercase">
                  {item.section}
                </div>
              )}
              {isSidebarCollapsed ? (
                <Tooltip content={item.name} position="right">
                  {navLinkContent}
                </Tooltip>
              ) : (
                navLinkContent
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Collapse Footer Toggle */}
      <div className="p-2 border-t border-[#263244] hidden md:flex items-center justify-between">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded text-xs text-[#94A3B8] hover:bg-[#151F2E] hover:text-[#E5E7EB] transition-colors"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-mono-num">Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:flex fixed top-0 left-0 bottom-0 z-[100] bg-[#111827] border-r border-[#263244] transition-all duration-200 ease-in-out flex-col ${
          isSidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Navigation */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-[200] flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative w-64 bg-[#111827] border-r border-[#263244] h-full shadow-2xl z-10">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
