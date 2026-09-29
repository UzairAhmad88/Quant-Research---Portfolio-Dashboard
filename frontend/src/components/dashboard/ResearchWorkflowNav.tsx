import React from 'react';
import { NavLink } from 'react-router-dom';
import { Card } from '../ui/Card';
import { ChevronRight, Database, TrendingUp, Cpu, Activity, PlayCircle, BarChart3, FileText, Search } from 'lucide-react';

interface Stage {
  step: number;
  label: string;
  route: string;
  icon: React.ReactNode;
}

const stages: Stage[] = [
  { step: 1, label: 'Select Instrument', route: '/market-data', icon: <Search className="w-3.5 h-3.5" /> },
  { step: 2, label: 'Acquire & Validate Data', route: '/market-data', icon: <Database className="w-3.5 h-3.5" /> },
  { step: 3, label: 'Analyze Returns / Risk', route: '/returns', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { step: 4, label: 'Build Strategy', route: '/strategies', icon: <Cpu className="w-3.5 h-3.5" /> },
  { step: 5, label: 'Generate Signals', route: '/strategies', icon: <Activity className="w-3.5 h-3.5" /> },
  { step: 6, label: 'Run Backtest', route: '/backtesting', icon: <PlayCircle className="w-3.5 h-3.5" /> },
  { step: 7, label: 'Review Performance', route: '/backtesting', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { step: 8, label: 'Research Report', route: '/backtesting', icon: <FileText className="w-3.5 h-3.5" /> },
];

export const ResearchWorkflowNav: React.FC = () => {
  return (
    <Card
      title="Quantitative Research Workflow Pipeline"
      subtitle="Sequential 8-stage workstation path. Click any stage to navigate directly with research context."
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
        {stages.map((stage) => (
          <NavLink key={stage.step} to={stage.route} className="group">
            <div className="flex flex-col h-full p-2.5 rounded-xl bg-forest-50/50 border border-forest-100 group-hover:border-forest-400 group-hover:bg-forest-50 transition-all relative shadow-xs">
              <div className="flex items-center justify-between text-[10px] font-mono text-text-muted mb-1.5">
                <span className="font-semibold text-forest-700">0{stage.step}</span>
                <span className="text-forest-600 group-hover:translate-x-0.5 transition-transform">
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary group-hover:text-forest-800 transition-colors mt-auto">
                <span className="text-forest-700 shrink-0">{stage.icon}</span>
                <span className="leading-tight">{stage.label}</span>
              </div>
            </div>
          </NavLink>
        ))}
      </div>
    </Card>
  );
};
