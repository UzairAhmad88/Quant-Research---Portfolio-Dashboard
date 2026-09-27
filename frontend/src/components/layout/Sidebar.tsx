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
  SlidersHorizontal,
  FileText,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  section?: 'RESEARCH' | 'ANALYSIS' | 'STRATEGIES' | 'REPORTS' | 'SYSTEM';
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Market Data', path: '/market-data', icon: Database, section: 'RESEARCH' },
  { name: 'Returns', path: '/returns', icon: TrendingUp, section: 'RESEARCH' },
  { name: 'Portfolio', path: '/portfolio', icon: PieChart, section: 'RESEARCH' },

  { name: 'Correlation', path: '/correlation', icon: GitMerge, section: 'ANALYSIS' },
  { name: 'Volatility', path: '/volatility', icon: Activity, section: 'ANALYSIS' },

  { name: 'Strategies', path: '/strategies', icon: Sliders, section: 'STRATEGIES' },
  { name: 'Backtesting', path: '/backtesting', icon: SlidersHorizontal, section: 'STRATEGIES' },

  { name: 'Reports', path: '/reports', icon: FileText, section: 'REPORTS' },
  { name: 'Exports', path: '/exports', icon: Download, section: 'REPORTS' },

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
    <div className="flex flex-col justify-between h-full bg-[#070D18] select-none">
      {/* Top Branding */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-[#152136]">
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

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const showSectionHeader =
            !isSidebarCollapsed &&
            item.section &&
            (idx === 0 || navItems[idx - 1]?.section !== item.section);

          const navLinkContent = (
            <NavLink
              to={item.path}
              end={item.path === '/'}
              onClick={() => setMobileDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#1D4ED8] text-white shadow-md'
                    : 'text-[#94A3B8] hover:bg-[#111C30] hover:text-[#E2E8F0]'
                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );

          return (
            <React.Fragment key={item.path}>
              {showSectionHeader && (
                <div className="px-3 pt-3.5 pb-1 text-[10px] font-semibold text-[#64748B] tracking-wider uppercase font-sans">
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

      {/* Collapse Toggle Footer */}
      <div className="p-2 border-t border-[#152136] hidden md:flex items-center justify-between">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded text-xs text-[#64748B] hover:bg-[#111C30] hover:text-[#94A3B8] transition-colors"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-sans">Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden md:flex fixed top-0 left-0 bottom-0 z-[100] bg-[#070D18] border-r border-[#152136] transition-all duration-200 ease-in-out flex-col ${
          isSidebarCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        {sidebarContent}
      </aside>

      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-[200] flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative w-56 bg-[#070D18] border-r border-[#152136] h-full shadow-2xl z-10">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
