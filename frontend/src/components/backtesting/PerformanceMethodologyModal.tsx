import React from 'react';
import { X, BookOpen, Calculator, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface PerformanceMethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PerformanceMethodologyModal: React.FC<PerformanceMethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#151F2E] border border-[#263244] rounded-lg w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#263244] bg-[#0B1220]/50">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-slate-100 font-mono">
              Quantitative Evaluation Engine — Calculation Methodology
            </h3>
            <Badge variant="outline" className="font-mono text-xs">Step 18 Standard</Badge>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto font-mono text-xs text-slate-300">
          {/* Section 1: Returns */}
          <div className="space-y-2 p-4 rounded-lg bg-[#0B1220]/50 border border-[#263244]">
            <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4" /> 1. Return Calculations
            </h4>
            <div className="space-y-1.5 leading-relaxed text-slate-400">
              <p><strong className="text-slate-200">Total Return:</strong> (V_final / V_initial) - 1. Total percentage change in portfolio equity over the full simulation horizon.</p>
              <p><strong className="text-slate-200">Annualized Return (CAGR):</strong> (V_final / V_initial)^(1 / T) - 1, where T = elapsed_days / 365.25. Evaluated using actual calendar time span.</p>
              <p><strong className="text-slate-200">Periodic Return Series:</strong> R_t = (V_t / V_t-1) - 1 for consecutive portfolio close snapshots.</p>
            </div>
          </div>

          {/* Section 2: Risk Metrics */}
          <div className="space-y-2 p-4 rounded-lg bg-[#0B1220]/50 border border-[#263244]">
            <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> 2. Risk Metrics & Ratios
            </h4>
            <div className="space-y-1.5 leading-relaxed text-slate-400">
              <p><strong className="text-slate-200">Annualized Volatility:</strong> Sample standard deviation of periodic portfolio returns (ddof=1) scaled by sqrt(252) (or sqrt(365) for crypto).</p>
              <p><strong className="text-slate-200">Sharpe Ratio:</strong> Mean(R - R_f) / std(R) * sqrt(252), measuring excess return per unit of total risk (R_f = 0 default).</p>
              <p><strong className="text-slate-200">Sortino Ratio:</strong> Mean(R - MAR) / downside_dev * sqrt(252), measuring return per unit of downside risk (MAR = 0).</p>
            </div>
          </div>

          {/* Section 3: Drawdown & Recovery */}
          <div className="space-y-2 p-4 rounded-lg bg-[#0B1220]/50 border border-[#263244]">
            <h4 className="text-sm font-semibold text-rose-400 uppercase tracking-wider">
              3. Drawdown & Capital Protection
            </h4>
            <div className="space-y-1.5 leading-relaxed text-slate-400">
              <p><strong className="text-slate-200">Maximum Drawdown:</strong> min((V_t - Peak_t) / Peak_t). Largest peak-to-trough equity decline.</p>
              <p><strong className="text-slate-200">Drawdown Duration:</strong> Maximum elapsed duration in calendar days from an equity peak to complete recovery back to that peak.</p>
              <p><strong className="text-slate-200">Calmar Ratio:</strong> Annualized Return / abs(Max Drawdown), gauging return relative to peak drawdown risk.</p>
            </div>
          </div>

          {/* Section 4: Trade Analytics & Costs */}
          <div className="space-y-2 p-4 rounded-lg bg-[#0B1220]/50 border border-[#263244]">
            <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
              4. Trading & Transaction Cost Accounting
            </h4>
            <div className="space-y-1.5 leading-relaxed text-slate-400">
              <p><strong className="text-slate-200">Win Rate:</strong> Winning Round-Trips / Total Completed Round-Trips, based strictly on Net Trade P&L.</p>
              <p><strong className="text-slate-200">Profit Factor:</strong> Sum(Gross Profits) / Sum(|Gross Losses|). Returns <code className="text-slate-300">null</code> if no losing trades exist.</p>
              <p><strong className="text-slate-200">Exposure:</strong> Fraction of total simulation bar count where portfolio held an open position (Quantity &gt; 0).</p>
              <p><strong className="text-slate-200">Turnover:</strong> Sum(|Transaction Notional|) / Mean Portfolio Value, measuring portfolio turnover intensity.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-3 border-t border-[#263244] bg-[#0B1220]/50">
          <span className="text-[11px] text-slate-500 font-mono">
            Decoupled calculation layer — interpretations do not alter simulation trade events.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMethodologyModal;
