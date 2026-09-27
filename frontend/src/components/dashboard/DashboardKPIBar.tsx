import React from 'react';

interface MetricSparklineProps {
  data: number[];
  color: string;
  gradientId: string;
}

const Sparkline: React.FC<MetricSparklineProps> = ({ data, color, gradientId }) => {
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
    <div className="w-full h-9 overflow-hidden">
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
      </svg>
    </div>
  );
};

export const DashboardKPIBar: React.FC = () => {
  const kpis = [
    {
      label: 'S&P 500 (SPY)',
      value: '5,487.32',
      change: '+24.18 (+0.44%)',
      isPositive: true,
      sparkColor: '#22C55E',
      sparkData: [40, 42, 41, 45, 48, 47, 52, 50, 55, 58, 62],
      gradientId: 'spark-spy',
    },
    {
      label: 'NASDAQ (QQQ)',
      value: '472.18',
      change: '+3.92 (+0.84%)',
      isPositive: true,
      sparkColor: '#22C55E',
      sparkData: [30, 32, 35, 33, 38, 42, 40, 45, 48, 52, 56],
      gradientId: 'spark-qqq',
    },
    {
      label: 'Portfolio Value',
      value: '$124,840.32',
      change: '+8.42% (YTD)',
      isPositive: true,
      sparkColor: '#3B82F6',
      sparkData: [20, 22, 25, 28, 26, 32, 36, 34, 40, 44, 48],
      gradientId: 'spark-port',
    },
    {
      label: 'Annualized Return',
      value: '12.46%',
      change: '+2.18% vs Benchmark',
      isPositive: true,
      sparkColor: '#10B981',
      sparkData: [15, 18, 16, 22, 26, 24, 30, 35, 38, 42, 46],
      gradientId: 'spark-ret',
    },
    {
      label: 'Volatility (Annualized)',
      value: '18.32%',
      change: '−1.24% vs Benchmark',
      isPositive: false,
      sparkColor: '#EF4444',
      sparkData: [45, 42, 38, 40, 35, 30, 34, 28, 26, 22, 20],
      gradientId: 'spark-vol',
    },
    {
      label: 'Sharpe Ratio',
      value: '0.68',
      change: '+0.11 vs Benchmark',
      isPositive: true,
      sparkColor: '#38BDF8',
      sparkData: [10, 12, 14, 13, 18, 20, 22, 25, 28, 32, 35],
      gradientId: 'spark-sharpe',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi, idx) => (
        <div
          key={idx}
          className="bg-[#0D1525] border border-[#17253D] rounded-lg p-3.5 flex flex-col justify-between hover:border-[#1E3A8A]/60 transition-all group shadow-sm"
        >
          <div>
            <div className="text-[11px] font-medium text-[#94A3B8] tracking-tight">{kpi.label}</div>
            <div className="text-lg font-bold font-mono-num text-white mt-1 tracking-tight">{kpi.value}</div>
            <div
              className={`text-[10px] font-mono-num font-medium mt-0.5 ${
                kpi.isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]'
              }`}
            >
              {kpi.change}
            </div>
          </div>
          <div className="mt-2 pt-1 border-t border-[#17253D]/50">
            <Sparkline data={kpi.sparkData} color={kpi.sparkColor} gradientId={kpi.gradientId} />
          </div>
        </div>
      ))}
    </div>
  );
};
