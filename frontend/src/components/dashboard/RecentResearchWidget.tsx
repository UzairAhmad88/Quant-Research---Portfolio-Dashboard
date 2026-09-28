import React from 'react';
import { ArrowRight, FileText, LineChart, Network, Scale, FlaskConical, Play } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const RecentResearchWidget: React.FC = () => {
  const navigate = useNavigate();

  const researchItems = [
    {
      id: 1,
      title: 'AAPL Moving Average Strategy',
      subtitle: 'SMA (20/50) Fast Crossover Signals',
      time: 'Today 14:12',
      icon: FileText,
      iconColor: 'text-[#60A5FA]',
      iconBg: 'bg-[#1E3A8A]/40',
      status: 'Ready',
      route: '/strategies?strategy=SMA_CROSSOVER&symbol=AAPL',
    },
    {
      id: 2,
      title: 'AAPL Volatility Analysis',
      subtitle: 'Annualized σ: 18.17% (20D Rolling)',
      time: 'Today 13:47',
      icon: LineChart,
      iconColor: 'text-[#C084FC]',
      iconBg: 'bg-[#581C87]/40',
      status: 'Ready',
      route: '/volatility?symbol=AAPL',
    },
    {
      id: 3,
      title: 'Multi-Asset Correlation Matrix',
      subtitle: 'AAPL, MSFT, NVDA, SPY, QQQ',
      time: 'Today 11:23',
      icon: Network,
      iconColor: 'text-[#FBBF24]',
      iconBg: 'bg-[#78350F]/40',
      status: 'Ready',
      route: '/correlation',
    },
    {
      id: 4,
      title: 'Return Analysis vs SPY',
      subtitle: 'CAGR: +49.95% | Alpha: +28.4%',
      time: 'Today 10:18',
      icon: Scale,
      iconColor: 'text-[#38BDF8]',
      iconBg: 'bg-[#0369A1]/40',
      status: 'Ready',
      route: '/returns?symbol=AAPL',
    },
    {
      id: 5,
      title: 'SMA Backtest Simulation',
      subtitle: 'Sharpe: 0.4388 | Return: +13.08%',
      time: 'Yesterday 16:42',
      icon: FlaskConical,
      iconColor: 'text-[#A78BFA]',
      iconBg: 'bg-[#4C1D95]/40',
      status: 'Ready',
      route: '/backtesting?symbol=AAPL',
    },
  ];

  return (
    <div className="bg-[#0D1525] border border-[#17253D] rounded-lg p-3.5 shadow-md flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#17253D]">
        <h3 className="text-sm font-bold text-white tracking-tight">Recent Research</h3>
        <Link

          to="/backtesting"
          className="text-xs text-[#3B82F6] hover:text-[#60A5FA] flex items-center gap-1 font-medium group transition-colors"
        >
          All Models <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Interactive List */}
      <div className="space-y-1.5 pt-2">
        {researchItems.map((item) => {
          const IconComp = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => navigate(item.route)}
              role="button"
              tabIndex={0}
              className="flex items-center justify-between p-2 rounded-md hover:bg-[#152136] border border-transparent hover:border-[#1E3A8A]/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1.5 rounded ${item.iconBg} ${item.iconColor} shrink-0 group-hover:scale-105 transition-transform`}>
                  <IconComp className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#E2E8F0] group-hover:text-white truncate">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-[#94A3B8] truncate">{item.subtitle}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-[#64748B] font-mono-num hidden sm:inline">{item.time}</span>
                <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-[#60A5FA] bg-[#1E3A8A]/40 border border-[#3B82F6]/30 rounded group-hover:bg-[#1D4ED8] group-hover:text-white transition-all">
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Launch</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
