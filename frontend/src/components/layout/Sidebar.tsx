import React from 'react';
import { NavLink } from 'react-router-dom';
import { MonogramLogo } from '../common/MonogramLogo';
import { useAppStore } from '../../store/appStore';
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
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  section?: string;
}

const navItems: NavItem[] = [
  { name: 'Overview', path: '/', icon: LayoutDashboard, section: 'ANALYTICS' },
  { name: 'Market Data', path: '/market-data', icon: Database, section: 'ANALYTICS' },
  { name: 'Returns', path: '/returns', icon: TrendingUp, section: 'ANALYTICS' },
  { name: 'Portfolio', path: '/portfolio', icon: PieChart, section: 'ANALYTICS' },
  { name: 'Correlation', path: '/correlation', icon: GitMerge, section: 'RISK & STATS' },
  { name: 'Volatility', path: '/volatility', icon: Activity, section: 'RISK & STATS' },
  { name: 'Strategies', path: '/strategies', icon: Sliders, section: 'STRATEGY' },
  { name: 'Backtesting', path: '/backtesting', icon: PlayCircle, section: 'STRATEGY' },
  { name: 'Settings', path: '/settings', icon: Settings, section: 'SYSTEM' },
];

export const Sidebar: React.FC = () => {
  const { isSidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#111827] border-r border-[#263244] transition-all duration-200 ease-in-out flex flex-col justify-between ${
        isSidebarCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Sidebar Header with Monogram Logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-[#263244]">
        <MonogramLogo collapsed={isSidebarCollapsed} />
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const showSectionHeader =
            !isSidebarCollapsed &&
            (idx === 0 || navItems[idx - 1]?.section !== item.section);

          return (
            <React.Fragment key={item.path}>
              {showSectionHeader && item.section && (
                <div className="px-3 pt-3 pb-1 text-[10px] font-mono-num font-semibold text-[#64748B] tracking-wider uppercase">
                  {item.section}
                </div>
              )}
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded text-xs transition-colors group ${
                    isActive
                      ? 'bg-[#151F2E] text-[#E5E7EB] font-medium border-l-2 border-[#3B82F6]'
                      : 'text-[#94A3B8] hover:bg-[#151F2E]/60 hover:text-[#E5E7EB]'
                  } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`
                }
                title={isSidebarCollapsed ? item.name : undefined}
              >
                <Icon className="w-4 h-4 text-[#94A3B8] group-hover:text-[#3B82F6] transition-colors flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            </React.Fragment>
          );
        })}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-2 border-t border-[#263244] flex items-center justify-between">
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
              <span className="text-xs font-mono-num">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
