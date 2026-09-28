import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';


interface MetricSparklineProps {
  data: number[];
  color: string;
  gradientId: string;
  hoverIndex: number | null;
}

const Sparkline: React.FC<MetricSparklineProps> = ({ data, color, gradientId, hoverIndex }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 140;
  const height = 36;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <div className="w-full h-9 overflow-hidden relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill={`url(#${gradientId})`} />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {hoverIndex !== null && data[hoverIndex] !== undefined && (
          <circle
            cx={(hoverIndex / (data.length - 1)) * width}
            cy={height - ((data[hoverIndex] - min) / range) * (height - 6) - 3}
            r="3"
            fill="#FFFFFF"
            stroke={color}
            strokeWidth="2"
          />
        )}
      </svg>
    </div>
  );
};

export interface DashboardKPIBarProps {
  onSelectInstrument?: (symbol: string) => void;
}

export const DashboardKPIBar: React.FC<DashboardKPIBarProps> = ({ onSelectInstrument }) => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const kpis = [
    {
      id: 'spy',
      label: 'S&P 500 (SPY)',
      value: '588.42',
      change: '+2.58 (+0.44%)',
      isPositive: true,
      sparkColor: '#22C55E',
      sparkData: [540, 545, 552, 548, 560, 568, 574, 572, 580, 584, 588],
      gradientId: 'spark-spy',
      route: '/market-data?symbol=SPY',
      symbol: 'SPY',
    },
    {
      id: 'qqq',
      label: 'NASDAQ (QQQ)',
      value: '512.18',
      change: '+4.28 (+0.84%)',
      isPositive: true,
      sparkColor: '#22C55E',
      sparkData: [460, 468, 475, 470, 485, 492, 498, 495, 502, 508, 512],
      gradientId: 'spark-qqq',
      route: '/market-data?symbol=QQQ',
      symbol: 'QQQ',
    },
    {
      id: 'portfolio',
      label: 'Portfolio Value',
      value: '$1,175,407.99',
      change: '+17.54% Mark-to-Market',
      isPositive: true,
      sparkColor: '#3B82F6',
      sparkData: [1000, 1020, 1045, 1030, 1070, 1095, 1120, 1110, 1140, 1162, 1175],
      gradientId: 'spark-port',
      route: '/portfolios',
    },
    {
      id: 'returns',
      label: 'Annualized Return',
      value: '+49.95%',
      change: 'Alpha: +28.4% vs Benchmark',
      isPositive: true,
      sparkColor: '#10B981',
      sparkData: [15, 18, 22, 20, 26, 30, 35, 38, 42, 46, 50],
      gradientId: 'spark-ret',
      route: '/returns',
    },

    {
      id: 'volatility',
      label: 'Annualized Volatility',
      value: '18.17%',
      change: 'Daily σ: 1.14% (Low Risk)',
      isPositive: true,
      sparkColor: '#F59E0B',
      sparkData: [24, 22, 20, 21, 19, 18, 19, 18.5, 18.2, 18.1, 18.17],
      gradientId: 'spark-vol',
      route: '/volatility',
    },
    {
      id: 'sharpe',
      label: 'Sharpe Ratio',
      value: '1.42',
      change: 'Sortino: 2.18 | Max DD: -18.45%',
      isPositive: true,
      sparkColor: '#38BDF8',
      sparkData: [0.8, 0.9, 1.0, 0.95, 1.1, 1.2, 1.25, 1.3, 1.35, 1.4, 1.42],
      gradientId: 'spark-sharpe',
      route: '/backtesting',
    },
  ];

  const handleCardClick = (kpi: (typeof kpis)[0]) => {
    if (kpi.symbol && onSelectInstrument) {
      onSelectInstrument(kpi.symbol);
    }
    navigate(kpi.route);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi, idx) => (
        <div
          key={kpi.id}
          onClick={() => handleCardClick(kpi)}
          onMouseEnter={() => setHoveredCard(idx)}
          onMouseLeave={() => setHoveredCard(null)}
          role="button"
          tabIndex={0}
          className="bg-[#0D1525] border border-[#17253D] hover:border-[#3B82F6]/70 rounded-lg p-3.5 flex flex-col justify-between transition-all duration-200 group shadow-sm hover:shadow-lg hover:shadow-blue-950/30 cursor-pointer transform hover:-translate-y-0.5"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#94A3B8] group-hover:text-[#93C5FD] transition-colors tracking-tight truncate">
                {kpi.label}
              </span>
              <ArrowUpRight className="w-3 h-3 text-[#64748B] group-hover:text-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-lg font-bold font-mono-num text-white mt-1 tracking-tight truncate">
              {kpi.value}
            </div>
            <div
              className={`text-[10px] font-mono-num font-medium mt-0.5 truncate ${
                kpi.isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]'
              }`}
            >
              {kpi.change}
            </div>
          </div>
          <div className="mt-2 pt-1 border-t border-[#17253D]/50">
            <Sparkline
              data={kpi.sparkData}
              color={kpi.sparkColor}
              gradientId={kpi.gradientId}
              hoverIndex={hoveredCard === idx ? kpi.sparkData.length - 1 : null}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
