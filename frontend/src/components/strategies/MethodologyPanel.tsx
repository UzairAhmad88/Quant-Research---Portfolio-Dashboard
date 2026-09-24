import React from 'react';
import { Info, ShieldCheck, AlertCircle } from 'lucide-react';

interface MethodologyPanelProps {
  maType: string;
  fastWindow: number;
  slowWindow: number;
  priceSource: string;
}

export const MethodologyPanel: React.FC<MethodologyPanelProps> = ({
  maType,
  fastWindow,
  slowWindow,
  priceSource,
}) => {
  return (
    <div className="bg-[#151F2E] border border-[#263244] rounded-lg p-5 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 border-b border-[#263244] pb-2">
        <Info className="w-4 h-4 text-blue-400" />
        <span>Strategy Methodology &amp; Look-Ahead Bias Prevention</span>
      </div>

      <div className="text-xs text-slate-400 space-y-2 font-mono leading-relaxed">
        <p>
          • <strong className="text-slate-300">Rule Definition:</strong> Computes a Fast {maType} ({fastWindow} observations) and Slow {maType} ({slowWindow} observations) over the validated {priceSource} price series.
        </p>
        <p>
          • <strong className="text-slate-300">Bullish Crossover (BUY):</strong> Triggered when Fast MA crosses above Slow MA (Fast<sub>t-1</sub> &le; Slow<sub>t-1</sub> and Fast<sub>t</sub> &gt; Slow<sub>t</sub>).
        </p>
        <p>
          • <strong className="text-slate-300">Bearish Crossover (SELL):</strong> Triggered when Fast MA crosses below Slow MA (Fast<sub>t-1</sub> &ge; Slow<sub>t-1</sub> and Fast<sub>t</sub> &lt; Slow<sub>t</sub>).
        </p>
        <div className="flex items-center gap-2 text-slate-400 bg-[#0B1220] p-2.5 rounded border border-[#263244] text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong className="text-emerald-400">Strict Look-Ahead Bias Prevention:</strong> Signal evaluation at time <em>t</em> uses exclusively historical prices up to observation <em>t</em>. Future prices (<em>t+1</em>) are strictly inaccessible.
          </span>
        </div>
        <div className="flex items-center gap-2 text-amber-300/90 bg-amber-950/30 p-2.5 rounded border border-amber-900/40 text-[11px]">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong>Research Notice:</strong> Generated signals are historical analytical outputs for research evaluation. They do not represent executed orders or trading recommendations.
          </span>
        </div>
      </div>
    </div>
  );
};
