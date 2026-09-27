import React from 'react';
import { ArrowRight, FileText, LineChart, Network, Scale, FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RecentResearchWidget: React.FC = () => {
  const researchItems = [
    {
      id: 1,
      title: 'AAPL Moving Average Strategy',
      time: 'Sep 8, 2026 14:12',
      icon: FileText,
      iconColor: 'text-[#60A5FA]',
      iconBg: 'bg-[#1E3A8A]/40',
      status: 'Completed',
    },
    {
      id: 2,
      title: 'QQQ Volatility Analysis',
      time: 'Sep 8, 2026 13:47',
      icon: LineChart,
      iconColor: 'text-[#C084FC]',
      iconBg: 'bg-[#581C87]/40',
      status: 'Completed',
    },
    {
      id: 3,
      title: 'Tech Portfolio Correlation',
      time: 'Sep 8, 2026 11:23',
      icon: Network,
      iconColor: 'text-[#FBBF24]',
      iconBg: 'bg-[#78350F]/40',
      status: 'Completed',
    },
    {
      id: 4,
      title: 'SPY vs QQQ Performance',
      time: 'Sep 8, 2026 10:18',
      icon: Scale,
      iconColor: 'text-[#38BDF8]',
      iconBg: 'bg-[#0369A1]/40',
      status: 'Completed',
    },
    {
      id: 5,
      title: 'Sector Rotation Backtest',
      time: 'Sep 7, 2026 16:42',
      icon: FlaskConical,
      iconColor: 'text-[#A78BFA]',
      iconBg: 'bg-[#4C1D95]/40',
      status: 'Completed',
    },
  ];

  return (
    <div className="bg-[#0D1525] border border-[#17253D] rounded-lg p-3.5 shadow-md flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#17253D]">
        <h3 className="text-sm font-bold text-white tracking-tight">Recent Research</h3>
        <Link
          to="/reports"
          className="text-xs text-[#3B82F6] hover:text-[#60A5FA] flex items-center gap-1 font-medium group transition-colors"
        >
          View All <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* List */}
      <div className="space-y-2 pt-2">
        {researchItems.map((item) => {
          const IconComp = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-1.5 rounded-md hover:bg-[#152136]/50 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1.5 rounded ${item.iconBg} ${item.iconColor} shrink-0`}>
                  <IconComp className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#E2E8F0] truncate">{item.title}</div>
                  <div className="text-[10px] text-[#94A3B8] font-mono-num">{item.time}</div>
                </div>
              </div>

              <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold text-[#22C55E] bg-[#14532D]/40 border border-[#22C55E]/30 rounded">
                {item.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
