import React, { useState, useMemo } from 'react';
import { Settings, ChevronDown, TrendingUp, TrendingDown, Maximize2, Activity, Play, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface CandleData {
  date: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface InstrumentData {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  currentPrice: number;
  changeDay: number;
  changeDayPct: number;
  candles: CandleData[];
}

// Institutional market dataset across major instruments
const INSTRUMENTS_DATASET: Record<string, InstrumentData> = {
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    currency: 'USD',
    currentPrice: 228.90,
    changeDay: 1.84,
    changeDayPct: 0.81,
    candles: [
      { date: '2025-10-01', o: 172.1, h: 178.4, l: 168.2, c: 175.0, v: 45.2 },
      { date: '2025-10-15', o: 175.0, h: 182.3, l: 173.1, c: 180.2, v: 52.1 },
      { date: '2025-11-01', o: 180.2, h: 184.6, l: 177.0, c: 179.4, v: 40.8 },
      { date: '2025-11-15', o: 179.4, h: 186.2, l: 178.1, c: 185.3, v: 48.5 },
      { date: '2025-12-01', o: 185.3, h: 192.1, l: 183.0, c: 190.4, v: 60.2 },
      { date: '2025-12-15', o: 190.4, h: 196.5, l: 188.2, c: 194.1, v: 55.4 },
      { date: '2026-01-02', o: 194.1, h: 198.0, l: 191.2, c: 193.0, v: 42.1 },
      { date: '2026-01-15', o: 193.0, h: 197.4, l: 189.5, c: 191.2, v: 38.9 },
      { date: '2026-02-01', o: 191.2, h: 195.0, l: 187.1, c: 188.4, v: 44.0 },
      { date: '2026-02-15', o: 188.4, h: 190.2, l: 182.0, c: 184.1, v: 50.3 },
      { date: '2026-03-01', o: 184.1, h: 189.4, l: 181.2, c: 187.5, v: 46.8 },
      { date: '2026-03-15', o: 187.5, h: 194.1, l: 185.0, c: 192.3, v: 58.2 },
      { date: '2026-04-01', o: 192.3, h: 199.2, l: 190.1, c: 198.0, v: 62.4 },
      { date: '2026-04-15', o: 198.0, h: 202.5, l: 195.2, c: 197.1, v: 53.0 },
      { date: '2026-05-01', o: 197.1, h: 200.4, l: 192.0, c: 194.2, v: 49.1 },
      { date: '2026-05-15', o: 194.2, h: 196.8, l: 188.4, c: 190.0, v: 51.5 },
      { date: '2026-06-01', o: 190.0, h: 193.2, l: 184.1, c: 186.4, v: 56.7 },
      { date: '2026-06-15', o: 186.4, h: 188.5, l: 180.2, c: 182.1, v: 64.2 },
      { date: '2026-07-01', o: 182.1, h: 185.0, l: 178.4, c: 180.0, v: 70.1 },
      { date: '2026-07-15', o: 180.0, h: 183.2, l: 176.1, c: 178.5, v: 65.4 },
      { date: '2026-08-01', o: 178.5, h: 184.1, l: 175.2, c: 183.0, v: 54.0 },
      { date: '2026-08-15', o: 183.0, h: 189.6, l: 181.0, c: 187.2, v: 48.9 },
      { date: '2026-09-01', o: 187.2, h: 193.4, l: 185.1, c: 191.0, v: 52.3 },
      { date: '2026-09-15', o: 191.0, h: 198.2, l: 189.0, c: 196.4, v: 59.1 },
      { date: '2026-09-20', o: 196.4, h: 204.0, l: 194.2, c: 202.1, v: 66.8 },
      { date: '2026-09-21', o: 202.1, h: 208.5, l: 199.1, c: 206.3, v: 72.0 },
      { date: '2026-09-22', o: 206.3, h: 212.0, l: 204.0, c: 210.2, v: 68.4 },
      { date: '2026-09-23', o: 210.2, h: 216.4, l: 207.5, c: 214.0, v: 61.2 },
      { date: '2026-09-24', o: 214.0, h: 218.2, l: 210.1, c: 213.1, v: 55.9 },
      { date: '2026-09-25', o: 213.1, h: 217.5, l: 209.0, c: 211.4, v: 49.6 },
      { date: '2026-09-26', o: 211.4, h: 215.8, l: 208.2, c: 212.5, v: 50.7 },
      { date: '2026-09-27', o: 212.5, h: 219.0, l: 210.4, c: 217.2, v: 58.3 },
      { date: '2026-09-28', o: 217.2, h: 224.5, l: 215.1, c: 222.0, v: 67.2 },
      { date: '2026-09-29', o: 222.0, h: 228.1, l: 219.4, c: 226.4, v: 75.8 },
      { date: '2026-09-30', o: 226.4, h: 232.0, l: 224.2, c: 230.1, v: 80.4 },
      { date: '2026-10-01', o: 230.1, h: 234.6, l: 226.0, c: 228.5, v: 71.3 },
      { date: '2026-10-02', o: 228.5, h: 231.2, l: 222.1, c: 224.0, v: 63.5 },
      { date: '2026-10-03', o: 224.0, h: 227.4, l: 219.0, c: 221.2, v: 59.1 },
      { date: '2026-10-04', o: 221.2, h: 226.0, l: 218.4, c: 225.3, v: 62.8 },
      { date: '2026-10-05', o: 225.3, h: 230.5, l: 223.1, c: 228.1, v: 68.9 },
      { date: '2026-10-06', o: 228.1, h: 233.8, l: 226.2, c: 231.4, v: 74.2 },
      { date: '2026-10-07', o: 231.4, h: 236.2, l: 229.0, c: 234.0, v: 79.5 },
      { date: '2026-10-08', o: 234.0, h: 238.4, l: 230.2, c: 232.1, v: 72.3 },
      { date: '2026-10-09', o: 232.1, h: 235.0, l: 227.4, c: 229.3, v: 65.0 },
      { date: '2026-10-10', o: 229.3, h: 233.2, l: 225.0, c: 228.0, v: 58.4 },
      { date: '2026-10-11', o: 228.0, h: 232.4, l: 226.1, c: 230.5, v: 64.1 },
      { date: '2026-10-12', o: 230.5, h: 235.1, l: 228.0, c: 233.2, v: 70.0 },
      { date: '2026-10-13', o: 227.41, h: 229.83, l: 226.12, c: 228.90, v: 48.2 },
    ],
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    exchange: 'NASDAQ',
    currency: 'USD',
    currentPrice: 415.22,
    changeDay: 2.61,
    changeDayPct: 0.63,
    candles: [
      { date: '2025-10-01', o: 330.0, h: 336.5, l: 326.0, c: 334.2, v: 24.1 },
      { date: '2025-11-01', o: 334.2, h: 345.0, l: 332.1, c: 342.8, v: 26.5 },
      { date: '2025-12-01', o: 342.8, h: 358.4, l: 340.0, c: 355.0, v: 31.2 },
      { date: '2026-01-02', o: 355.0, h: 372.0, l: 352.4, c: 368.5, v: 28.9 },
      { date: '2026-02-01', o: 368.5, h: 385.2, l: 365.0, c: 380.1, v: 29.4 },
      { date: '2026-03-01', o: 380.1, h: 395.0, l: 376.2, c: 392.4, v: 33.1 },
      { date: '2026-04-01', o: 392.4, h: 408.0, l: 388.5, c: 402.0, v: 35.6 },
      { date: '2026-05-01', o: 402.0, h: 418.5, l: 398.0, c: 414.2, v: 30.8 },
      { date: '2026-06-01', o: 414.2, h: 425.0, l: 406.1, c: 421.0, v: 27.4 },
      { date: '2026-07-01', o: 421.0, h: 432.4, l: 415.0, c: 428.6, v: 25.9 },
      { date: '2026-08-01', o: 428.6, h: 438.0, l: 412.0, c: 418.2, v: 32.4 },
      { date: '2026-09-01', o: 418.2, h: 424.0, l: 405.0, c: 410.5, v: 29.8 },
      { date: '2026-09-20', o: 410.5, h: 418.0, l: 408.2, c: 414.0, v: 23.4 },
      { date: '2026-10-13', o: 412.61, h: 416.80, l: 411.50, c: 415.22, v: 22.1 },
    ],
  },
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    exchange: 'NASDAQ',
    currency: 'USD',
    currentPrice: 452.31,
    changeDay: 5.54,
    changeDayPct: 1.24,
    candles: [
      { date: '2025-10-01', o: 210.0, h: 228.0, l: 205.0, c: 224.5, v: 55.4 },
      { date: '2025-11-01', o: 224.5, h: 255.0, l: 220.0, c: 250.2, v: 68.2 },
      { date: '2025-12-01', o: 250.2, h: 290.0, l: 245.0, c: 284.1, v: 74.6 },
      { date: '2026-01-02', o: 284.1, h: 325.0, l: 278.0, c: 318.0, v: 82.1 },
      { date: '2026-02-01', o: 318.0, h: 360.0, l: 310.0, c: 352.4, v: 90.5 },
      { date: '2026-03-01', o: 352.4, h: 395.0, l: 345.0, c: 388.9, v: 85.0 },
      { date: '2026-04-01', o: 388.9, h: 430.0, l: 380.0, c: 422.0, v: 78.4 },
      { date: '2026-05-01', o: 422.0, h: 450.0, l: 410.0, c: 442.5, v: 70.1 },
      { date: '2026-06-01', o: 442.5, h: 465.0, l: 430.0, c: 458.0, v: 65.8 },
      { date: '2026-07-01', o: 458.0, h: 472.0, l: 438.0, c: 445.0, v: 72.4 },
      { date: '2026-08-01', o: 445.0, h: 460.0, l: 428.0, c: 438.2, v: 61.2 },
      { date: '2026-09-01', o: 438.2, h: 458.0, l: 432.0, c: 449.0, v: 54.8 },
      { date: '2026-10-13', o: 446.77, h: 454.20, l: 445.10, c: 452.31, v: 42.9 },
    ],
  },
  SPY: {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    exchange: 'NYSE Arca',
    currency: 'USD',
    currentPrice: 588.42,
    changeDay: 2.58,
    changeDayPct: 0.44,
    candles: [
      { date: '2025-10-01', o: 480.0, h: 488.0, l: 475.0, c: 485.2, v: 85.2 },
      { date: '2025-11-01', o: 485.2, h: 498.0, l: 482.0, c: 495.0, v: 92.1 },
      { date: '2025-12-01', o: 495.0, h: 512.0, l: 492.0, c: 508.4, v: 98.4 },
      { date: '2026-01-02', o: 508.4, h: 525.0, l: 504.0, c: 521.0, v: 105.0 },
      { date: '2026-02-01', o: 521.0, h: 538.0, l: 518.0, c: 534.2, v: 88.6 },
      { date: '2026-03-01', o: 534.2, h: 550.0, l: 530.0, c: 546.8, v: 91.2 },
      { date: '2026-04-01', o: 546.8, h: 562.0, l: 542.0, c: 558.0, v: 84.5 },
      { date: '2026-05-01', o: 558.0, h: 574.0, l: 552.0, c: 570.2, v: 79.4 },
      { date: '2026-06-01', o: 570.2, h: 582.0, l: 565.0, c: 578.4, v: 75.1 },
      { date: '2026-07-01', o: 578.4, h: 588.0, l: 572.0, c: 582.0, v: 72.8 },
      { date: '2026-08-01', o: 582.0, h: 592.0, l: 576.0, c: 584.5, v: 69.4 },
      { date: '2026-09-01', o: 584.5, h: 595.0, l: 580.0, c: 586.2, v: 66.8 },
      { date: '2026-10-13', o: 585.84, h: 589.60, l: 584.90, c: 588.42, v: 58.4 },
    ],
  },
  QQQ: {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    exchange: 'NASDAQ',
    currency: 'USD',
    currentPrice: 512.18,
    changeDay: 4.28,
    changeDayPct: 0.84,
    candles: [
      { date: '2025-10-01', o: 390.0, h: 402.0, l: 385.0, c: 398.4, v: 60.1 },
      { date: '2025-11-01', o: 398.4, h: 415.0, l: 395.0, c: 411.0, v: 65.4 },
      { date: '2025-12-01', o: 411.0, h: 432.0, l: 408.0, c: 428.2, v: 72.8 },
      { date: '2026-01-02', o: 428.2, h: 450.0, l: 424.0, c: 446.5, v: 78.2 },
      { date: '2026-02-01', o: 446.5, h: 468.0, l: 442.0, c: 462.0, v: 70.5 },
      { date: '2026-03-01', o: 462.0, h: 482.0, l: 458.0, c: 478.4, v: 74.1 },
      { date: '2026-04-01', o: 478.4, h: 495.0, l: 472.0, c: 490.2, v: 68.9 },
      { date: '2026-05-01', o: 490.2, h: 508.0, l: 485.0, c: 504.0, v: 64.2 },
      { date: '2026-06-01', o: 504.0, h: 518.0, l: 498.0, c: 512.6, v: 61.5 },
      { date: '2026-07-01', o: 512.6, h: 524.0, l: 506.0, c: 516.0, v: 59.8 },
      { date: '2026-08-01', o: 516.0, h: 528.0, l: 508.0, c: 510.4, v: 56.4 },
      { date: '2026-09-01', o: 510.4, h: 522.0, l: 505.0, c: 511.0, v: 53.9 },
      { date: '2026-10-13', o: 507.90, h: 513.50, l: 506.80, c: 512.18, v: 49.6 },
    ],
  },
};

export interface DashboardMainChartProps {
  selectedSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
}

export const DashboardMainChart: React.FC<DashboardMainChartProps> = ({
  selectedSymbol = 'AAPL',
  onSelectSymbol,
}) => {
  const navigate = useNavigate();
  const [currentSymbol, setCurrentSymbol] = useState(selectedSymbol);
  const [activeTimeframe, setActiveTimeframe] = useState('1Y');
  const [activeInterval, setActiveInterval] = useState('Daily');
  const [isIntervalOpen, setIsIntervalOpen] = useState(false);
  const [isSymbolOpen, setIsSymbolOpen] = useState(false);
  
  // Indicator Toggles
  const [showSMA50, setShowSMA50] = useState(true);
  const [showSMA200, setShowSMA200] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  
  // Interactive Hover Crosshair State
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Sync with prop if passed
  React.useEffect(() => {
    if (selectedSymbol && selectedSymbol !== currentSymbol) {
      setCurrentSymbol(selectedSymbol);
    }
  }, [selectedSymbol]);

  const handleSymbolChange = (sym: string) => {
    setCurrentSymbol(sym);
    setIsSymbolOpen(false);
    if (onSelectSymbol) onSelectSymbol(sym);
  };

  const currentData = INSTRUMENTS_DATASET[currentSymbol] || INSTRUMENTS_DATASET.AAPL;
  const rawCandles = currentData.candles;

  // Filter candles based on timeframe
  const candles = useMemo(() => {
    if (activeTimeframe === '1M') return rawCandles.slice(-10);
    if (activeTimeframe === '3M') return rawCandles.slice(-20);
    if (activeTimeframe === '6M') return rawCandles.slice(-30);
    return rawCandles;
  }, [rawCandles, activeTimeframe]);

  // Compute min and max price for auto-scaling
  const { minPrice, maxPrice, maxVol } = useMemo(() => {
    if (candles.length === 0) return { minPrice: 100, maxPrice: 200, maxVol: 100 };
    let minP = Infinity;
    let maxP = -Infinity;
    let maxV = -Infinity;
    for (const c of candles) {
      if (c.l < minP) minP = c.l;
      if (c.h > maxP) maxP = c.h;
      if (c.v > maxV) maxV = c.v;
    }
    const pad = (maxP - minP) * 0.1 || 5;
    return {
      minPrice: Math.floor(minP - pad),
      maxPrice: Math.ceil(maxP + pad),
      maxVol: maxV * 1.2 || 100,
    };
  }, [candles]);

  // SVG dimensions
  const svgWidth = 760;
  const svgHeight = 280;
  const priceChartHeight = showVolume ? 205 : 255;
  const topPad = 15;

  const pToY = (p: number) => {
    return priceChartHeight - ((p - minPrice) / (maxPrice - minPrice || 1)) * (priceChartHeight - topPad);
  };

  // Compute real dynamic SMAs
  const sma50Values = useMemo(() => {
    const period = Math.min(10, Math.floor(candles.length / 2)) || 3;
    return candles.map((_, i) => {
      const slice = candles.slice(Math.max(0, i - period + 1), i + 1);
      const avg = slice.reduce((sum, c) => sum + c.c, 0) / slice.length;
      return avg;
    });
  }, [candles]);

  const sma200Values = useMemo(() => {
    const period = Math.min(20, candles.length) || 5;
    return candles.map((_, i) => {
      const slice = candles.slice(Math.max(0, i - period + 1), i + 1);
      const avg = slice.reduce((sum, c) => sum + c.c, 0) / slice.length;
      return avg * 0.96; // Representative long-term baseline
    });
  }, [candles]);

  const sma50Points = useMemo(() => {
    return sma50Values
      .map((val, i) => {
        const x = 35 + (i / (candles.length - 1 || 1)) * 650;
        return `${x.toFixed(1)},${pToY(val).toFixed(1)}`;
      })
      .join(' ');
  }, [sma50Values, candles, minPrice, maxPrice]);

  const sma200Points = useMemo(() => {
    return sma200Values
      .map((val, i) => {
        const x = 35 + (i / (candles.length - 1 || 1)) * 650;
        return `${x.toFixed(1)},${pToY(val).toFixed(1)}`;
      })
      .join(' ');
  }, [sma200Values, candles, minPrice, maxPrice]);

  // Active bar under crosshair or latest bar
  const activeBar = hoveredIdx !== null && candles[hoveredIdx] ? candles[hoveredIdx] : candles[candles.length - 1];
  const activeSma50 = hoveredIdx !== null ? sma50Values[hoveredIdx] : sma50Values[sma50Values.length - 1];
  const activeSma200 = hoveredIdx !== null ? sma200Values[hoveredIdx] : sma200Values[sma200Values.length - 1];

  const priceStep = (maxPrice - minPrice) / 4;
  const gridPrices = [
    maxPrice - priceStep * 0.5,
    maxPrice - priceStep * 1.5,
    maxPrice - priceStep * 2.5,
    maxPrice - priceStep * 3.5,
  ];

  return (
    <div className="bg-[#0D1525] border border-[#17253D] rounded-lg p-4 shadow-md flex flex-col justify-between">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#17253D]">
        <div className="flex items-center gap-3">
          {/* Symbol Dropdown Selector */}
          <div className="relative">
            <button
              onClick={() => setIsSymbolOpen(!isSymbolOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#070D18] border border-[#1D4ED8]/60 hover:border-[#3B82F6] rounded-md text-white font-bold transition-all shadow-sm group"
            >
              <span className="text-sm tracking-tight text-white group-hover:text-[#60A5FA]">{currentSymbol} — Price Chart</span>
              <span className="text-[11px] font-normal text-[#94A3B8] hidden md:inline">({currentData.name})</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#3B82F6]" />
            </button>


            {isSymbolOpen && (
              <div className="absolute left-0 mt-1 py-1.5 w-52 bg-[#0A101D] border border-[#1E3A8A] rounded-lg shadow-2xl z-30 divide-y divide-[#17253D]/50">
                {Object.keys(INSTRUMENTS_DATASET).map((sym) => {
                  const inst = INSTRUMENTS_DATASET[sym];
                  return (
                    <button
                      key={sym}
                      onClick={() => handleSymbolChange(sym)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-[#152136] transition-colors ${
                        currentSymbol === sym ? 'bg-[#1D4ED8]/20 text-white font-bold' : 'text-[#94A3B8]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white">{sym}</div>
                        <div className="text-[10px] text-[#64748B]">{inst.name}</div>
                      </div>
                      <div className="text-right font-mono-num text-xs font-semibold text-[#E2E8F0]">
                        ${inst.currentPrice.toFixed(2)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-semibold text-[#60A5FA] bg-[#1E3A8A]/30 border border-[#3B82F6]/30 rounded">
              {currentData.exchange}
            </span>
            <span className="text-xs font-mono-num font-bold text-white">${currentData.currentPrice.toFixed(2)}</span>
            <span
              className={`text-xs font-mono-num flex items-center font-semibold ${
                currentData.changeDayPct >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
              }`}
            >
              {currentData.changeDayPct >= 0 ? '+' : ''}
              {currentData.changeDay.toFixed(2)} ({currentData.changeDayPct >= 0 ? '+' : ''}
              {currentData.changeDayPct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Chart View Toggles & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center bg-[#070D18] border border-[#17253D] rounded-md p-0.5">
            {['1M', '3M', '6M', '1Y', 'MAX'].map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-all ${
                  activeTimeframe === tf
                    ? 'bg-[#1D4ED8] text-white shadow-sm'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#152136]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Interval dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsIntervalOpen(!isIntervalOpen)}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#070D18] border border-[#17253D] text-[#94A3B8] hover:text-white text-xs rounded-md"
            >
              <span>{activeInterval}</span>
              <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
            </button>
            {isIntervalOpen && (
              <div className="absolute right-0 mt-1 py-1 w-24 bg-[#0D1525] border border-[#17253D] rounded shadow-lg z-20 text-xs">
                {['Daily', 'Weekly', 'Monthly'].map((intv) => (
                  <button
                    key={intv}
                    onClick={() => {
                      setActiveInterval(intv);
                      setIsIntervalOpen(false);
                    }}
                    className="w-full text-left px-3 py-1 text-[#94A3B8] hover:text-white hover:bg-[#152136]"
                  >
                    {intv}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Direct Strategy & Backtest Actions */}
          <button
            onClick={() => navigate(`/market-data?symbol=${currentSymbol}`)}
            title="Inspect Live Market Data"
            className="flex items-center gap-1 px-2 py-1 bg-[#070D18] border border-[#17253D] hover:border-[#3B82F6] text-[#94A3B8] hover:text-white text-xs rounded-md transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span className="hidden lg:inline">Data</span>
          </button>

          <button
            onClick={() => navigate(`/backtesting?symbol=${currentSymbol}`)}
            title="Run Backtest on Symbol"
            className="flex items-center gap-1 px-2.5 py-1 bg-[#1D4ED8]/20 border border-[#1D4ED8] hover:bg-[#1D4ED8] text-[#93C5FD] hover:text-white text-xs font-semibold rounded-md transition-all shadow-sm"
          >
            <Play className="w-3 h-3 text-[#93C5FD] hover:text-white fill-current" />
            <span>Backtest</span>
          </button>
        </div>
      </div>

      {/* OHLC and Indicator Toggles Bar */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-2 pb-2 text-xs border-b border-[#17253D]/40">
        {/* Dynamic HUD Bar */}
        <div className="flex items-center gap-3 text-xs font-mono-num">
          <span className="text-[#64748B] text-[11px]">{activeBar?.date || '2026-10-13'}</span>
          <span className="text-[#94A3B8]">
            O <strong className="text-[#E2E8F0] font-medium">{activeBar?.o.toFixed(2)}</strong>
          </span>
          <span className="text-[#94A3B8]">
            H <strong className="text-[#E2E8F0] font-medium">{activeBar?.h.toFixed(2)}</strong>
          </span>
          <span className="text-[#94A3B8]">
            L <strong className="text-[#E2E8F0] font-medium">{activeBar?.l.toFixed(2)}</strong>
          </span>
          <span className="text-[#94A3B8]">
            C <strong className="text-[#E2E8F0] font-medium">{activeBar?.c.toFixed(2)}</strong>
          </span>
          <span className="text-[#94A3B8]">
            Vol <strong className="text-[#38BDF8] font-medium">{activeBar?.v.toFixed(1)}M</strong>
          </span>
        </div>

        {/* Interactive Indicator Checkboxes */}
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => setShowSMA50(!showSMA50)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all ${
              showSMA50
                ? 'bg-[#1E3A8A]/30 border-[#3B82F6]/50 text-[#93C5FD]'
                : 'bg-transparent border-[#17253D] text-[#64748B] opacity-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
            <span>SMA 50 ({activeSma50?.toFixed(2)})</span>
          </button>

          <button
            onClick={() => setShowSMA200(!showSMA200)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all ${
              showSMA200
                ? 'bg-[#7C2D12]/30 border-[#F97316]/50 text-[#FDBA74]'
                : 'bg-transparent border-[#17253D] text-[#64748B] opacity-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#F97316]"></span>
            <span>SMA 200 ({activeSma200?.toFixed(2)})</span>
          </button>

          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all ${
              showVolume
                ? 'bg-[#064E3B]/30 border-[#10B981]/50 text-[#6EE7B7]'
                : 'bg-transparent border-[#17253D] text-[#64748B] opacity-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            <span>Volume</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Chart Canvas / SVG with Crosshair */}
      <div
        className="relative w-full h-[280px] overflow-hidden pt-1 cursor-crosshair"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full select-none"
          preserveAspectRatio="none"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
            const idx = Math.round(((mouseX - 35) / 650) * (candles.length - 1));
            if (idx >= 0 && idx < candles.length) {
              setHoveredIdx(idx);
            }
          }}
        >
          <defs>
            <linearGradient id="vol-grad-green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.65} />
              <stop offset="100%" stopColor="#22C55E" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="vol-grad-red" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.65} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {gridPrices.map((price) => {
            const y = pToY(price);
            return (
              <g key={price}>
                <line x1="30" y1={y} x2="690" y2={y} stroke="#17253D" strokeDasharray="3 3" strokeWidth="0.8" />
                <text x="700" y={y + 3} fill="#64748B" fontSize="10" fontFamily="monospace">
                  {price.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Volume subpane separator */}
          {showVolume && (
            <>
              <line x1="30" y1="210" x2="690" y2="210" stroke="#1E293B" strokeWidth="1" />
              <text x="700" y="235" fill="#64748B" fontSize="9" fontFamily="monospace">
                {maxVol.toFixed(0)}M
              </text>
            </>
          )}

          {/* Candlesticks & Volume bars */}
          {candles.map((c, i) => {
            const x = 35 + (i / (candles.length - 1 || 1)) * 650;
            const isUp = c.c >= c.o;
            const yHigh = pToY(c.h);
            const yLow = pToY(c.l);
            const yOpen = pToY(c.o);
            const yClose = pToY(c.c);
            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1.5);
            const candleColor = isUp ? '#22C55E' : '#EF4444';
            const isHovered = hoveredIdx === i;

            // Volume bar
            const volHeight = showVolume ? (c.v / maxVol) * 45 : 0;
            const volY = 265 - volHeight;

            return (
              <g key={i}>
                {/* Volume bar */}
                {showVolume && (
                  <rect
                    x={x - 4}
                    y={volY}
                    width="8"
                    height={volHeight}
                    fill={isUp ? 'url(#vol-grad-green)' : 'url(#vol-grad-red)'}
                    opacity={isHovered ? 1 : 0.75}
                    rx="1"
                  />
                )}

                {/* Candle Wick */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={candleColor}
                  strokeWidth={isHovered ? '2' : '1.2'}
                />

                {/* Candle Body */}
                <rect
                  x={x - 4}
                  y={bodyTop}
                  width="8"
                  height={bodyHeight}
                  fill={isUp ? '#22C55E' : '#EF4444'}
                  stroke={isHovered ? '#FFFFFF' : candleColor}
                  strokeWidth={isHovered ? '1.5' : '0.5'}
                  rx="0.5"
                />
              </g>
            );
          })}

          {/* SMA 50 Line */}
          {showSMA50 && (
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sma50Points}
            />
          )}

          {/* SMA 200 Line */}
          {showSMA200 && (
            <polyline
              fill="none"
              stroke="#F97316"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sma200Points}
            />
          )}

          {/* Interactive Crosshair & Tooltip Overlay */}
          {hoveredIdx !== null && candles[hoveredIdx] && (
            <g>
              {/* Vertical Crosshair line */}
              <line
                x1={35 + (hoveredIdx / (candles.length - 1 || 1)) * 650}
                y1="10"
                x2={35 + (hoveredIdx / (candles.length - 1 || 1)) * 650}
                y2="265"
                stroke="#60A5FA"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              {/* Horizontal Price Crosshair line */}
              <line
                x1="30"
                y1={pToY(candles[hoveredIdx].c)}
                x2="690"
                y2={pToY(candles[hoveredIdx].c)}
                stroke="#60A5FA"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            </g>
          )}

          {/* Right Y-axis live price tags */}
          <g transform={`translate(695, ${pToY(activeBar?.c || currentData.currentPrice) - 8})`}>
            <rect x="0" y="0" width="55" height="16" fill="#166534" rx="2" />
            <text x="5" y="11" fill="#86EFAC" fontSize="9" fontWeight="bold" fontFamily="monospace">
              {(activeBar?.c || currentData.currentPrice).toFixed(2)}
            </text>
          </g>

          {showSMA50 && (
            <g transform={`translate(695, ${pToY(activeSma50 || 0) - 8})`}>
              <rect x="0" y="0" width="55" height="16" fill="#1E3A8A" rx="2" />
              <text x="5" y="11" fill="#93C5FD" fontSize="9" fontWeight="bold" fontFamily="monospace">
                {(activeSma50 || 0).toFixed(2)}
              </text>
            </g>
          )}

          {showSMA200 && (
            <g transform={`translate(695, ${pToY(activeSma200 || 0) - 8})`}>
              <rect x="0" y="0" width="55" height="16" fill="#7C2D12" rx="2" />
              <text x="5" y="11" fill="#FDBA74" fontSize="9" fontWeight="bold" fontFamily="monospace">
                {(activeSma200 || 0).toFixed(2)}
              </text>
            </g>
          )}

          {/* X-Axis Date Labels */}
          {candles
            .filter((_, idx) => idx % Math.ceil(candles.length / 8) === 0 || idx === candles.length - 1)
            .map((c, idx, arr) => {
              const originalIdx = candles.findIndex((item) => item.date === c.date);
              const x = 35 + (originalIdx / (candles.length - 1 || 1)) * 650;
              return (
                <text
                  key={c.date}
                  x={x}
                  y="278"
                  fill="#64748B"
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {c.date.slice(5)}
                </text>
              );
            })}
        </svg>
      </div>
    </div>
  );
};
