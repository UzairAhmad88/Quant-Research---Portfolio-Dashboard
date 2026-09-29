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
  Settings,
  Zap,
  ShieldAlert,
  FlaskConical,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  section?: 'RESEARCH' | 'ANALYSIS' | 'STRATEGIES' | 'LABS' | 'SYSTEM';
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Live Market', path: '/live-market', icon: Activity, section: 'RESEARCH' },
  { name: 'Market Data', path: '/market-data', icon: Database, section: 'RESEARCH' },
  { name: 'Returns', path: '/returns', icon: TrendingUp, section: 'RESEARCH' },
  { name: 'Portfolio', path: '/portfolio', icon: PieChart, section: 'RESEARCH' },

  { name: 'Correlation', path: '/correlation', icon: GitMerge, section: 'ANALYSIS' },
  { name: 'Volatility', path: '/volatility', icon: Activity, section: 'ANALYSIS' },
  { name: 'Risk Engine', path: '/risk', icon: ShieldAlert, section: 'ANALYSIS' },
  { name: 'Feature Explorer', path: '/features', icon: Zap, section: 'ANALYSIS' },

  { name: 'Strategies', path: '/strategies', icon: Sliders, section: 'STRATEGIES' },
  { name: 'Parameter Lab', path: '/strategy-lab', icon: SlidersHorizontal, section: 'STRATEGIES' },
  { name: 'Backtesting', path: '/backtesting', icon: SlidersHorizontal, section: 'STRATEGIES' },
  { name: 'Monte Carlo', path: '/monte-carlo', icon: FlaskConical, section: 'STRATEGIES' },

  { name: 'Regime Lab', path: '/regimes', icon: Activity, section: 'LABS' },
  { name: 'Research Notes', path: '/research', icon: FileText, section: 'LABS' },
  { name: 'Quant Glossary', path: '/learning', icon: BookOpen, section: 'LABS' },

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
    <div className="flex flex-col justify-between h-full bg-white select-none">
      {/* Top Branding */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-[#E5E7EB]">
        <MonogramLogo collapsed={isSidebarCollapsed} />
        {isMobileDrawerOpen && (
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="md:hidden p-1 rounded text-[#64748B] hover:text-[#17211B] hover:bg-[#F0FDF4]"
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
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#14532D] text-white shadow-sm font-semibold'
                    : 'text-[#334155] hover:bg-[#F0FDF4] hover:text-[#14532D]'
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
      <div className="p-2 border-t border-[#E5E7EB] hidden md:flex items-center justify-between">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs text-[#64748B] hover:bg-[#F0FDF4] hover:text-[#14532D] transition-colors"
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
        className={`hidden md:flex fixed top-0 left-0 bottom-0 z-[100] bg-white border-r border-[#E5E7EB] transition-all duration-200 ease-in-out flex-col shadow-[1px_0_4px_rgba(0,0,0,0.02)] ${
          isSidebarCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        {sidebarContent}
      </aside>

      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-[200] flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative w-56 bg-white border-r border-[#E5E7EB] h-full shadow-2xl z-10">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
