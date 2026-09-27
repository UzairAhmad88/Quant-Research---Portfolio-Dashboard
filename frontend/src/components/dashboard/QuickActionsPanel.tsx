import React from 'react';
import { NavLink } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Database, TrendingUp, Grid, Activity, Briefcase, Cpu, PlayCircle, FileText } from 'lucide-react';

interface QuickAction {
  label: string;
  route: string;
  icon: React.ReactNode;
  description: string;
}

const actions: QuickAction[] = [
  { label: 'Download Market Data', route: '/market-data', icon: <Database className="w-4 h-4 text-[#3B82F6]" />, description: 'Ingest OHLCV historical price data' },
  { label: 'Calculate Returns', route: '/returns', icon: <TrendingUp className="w-4 h-4 text-[#22C55E]" />, description: 'Simple & log return series' },
  { label: 'Analyze Correlation', route: '/correlation', icon: <Grid className="w-4 h-4 text-[#A855F7]" />, description: 'Multi-asset correlation matrix' },
  { label: 'Analyze Volatility', route: '/volatility', icon: <Activity className="w-4 h-4 text-[#F59E0B]" />, description: 'Rolling volatility & VaR risk' },
  { label: 'Create Portfolio', route: '/portfolio', icon: <Briefcase className="w-4 h-4 text-[#EC4899]" />, description: 'Portfolio positions & weights' },
  { label: 'Run Strategy', route: '/strategies', icon: <Cpu className="w-4 h-4 text-[#06B6D4]" />, description: 'Calibrate MA crossover signals' },
  { label: 'Run Backtest', route: '/backtesting', icon: <PlayCircle className="w-4 h-4 text-[#3B82F6]" />, description: 'Historical trade simulation' },
  { label: 'View Reports', route: '/backtesting', icon: <FileText className="w-4 h-4 text-[#10B981]" />, description: 'Reproducible research reports' },
];

export const QuickActionsPanel: React.FC = () => {
  return (
    <Card
      title="Quick Research Actions"
      subtitle="Direct shortcuts to core quantitative research workstation modules."
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-1">
        {actions.map((act) => (
          <NavLink key={act.label} to={act.route} className="group">
            <div className="flex flex-col items-start p-3 rounded bg-[#111827] border border-[#263244] group-hover:border-[#3B82F6] transition-all h-full">
              <div className="p-1.5 rounded bg-[#151F2E] border border-[#263244] mb-2 group-hover:scale-105 transition-transform">
                {act.icon}
              </div>
              <div className="text-xs font-semibold text-[#E5E7EB] group-hover:text-[#3B82F6] transition-colors leading-snug">
                {act.label}
              </div>
              <div className="text-[10px] text-[#94A3B8] mt-1 leading-tight hidden sm:block">
                {act.description}
              </div>
            </div>
          </NavLink>
        ))}
      </div>
    </Card>
  );
};
