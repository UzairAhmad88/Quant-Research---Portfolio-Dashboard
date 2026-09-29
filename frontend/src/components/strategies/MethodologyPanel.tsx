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
    <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-semibold text-text-primary border-b border-border pb-2">
        <Info className="w-4 h-4 text-brand-primary" />
        <span>Strategy Methodology &amp; Look-Ahead Bias Prevention</span>
      </div>

      <div className="text-xs text-text-secondary space-y-2 font-mono leading-relaxed">
        <p>
          • <strong className="text-text-primary">Rule Definition:</strong> Computes a Fast {maType} ({fastWindow} observations) and Slow {maType} ({slowWindow} observations) over the validated {priceSource} price series.
        </p>
        <p>
          • <strong className="text-text-primary">Bullish Crossover (BUY):</strong> Triggered when Fast MA crosses above Slow MA (Fast<sub>t-1</sub> &le; Slow<sub>t-1</sub> and Fast<sub>t</sub> &gt; Slow<sub>t</sub>).
        </p>
        <p>
          • <strong className="text-text-primary">Bearish Crossover (SELL):</strong> Triggered when Fast MA crosses below Slow MA (Fast<sub>t-1</sub> &ge; Slow<sub>t-1</sub> and Fast<sub>t</sub> &lt; Slow<sub>t</sub>).
        </p>
        <div className="flex items-center gap-2 text-text-secondary bg-surface p-2.5 rounded-lg border border-border text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            <strong className="text-emerald-700">Strict Look-Ahead Bias Prevention:</strong> Signal evaluation at time <em>t</em> uses exclusively historical prices up to observation <em>t</em>. Future prices (<em>t+1</em>) are strictly inaccessible.
          </span>
        </div>
        <div className="flex items-center gap-2 text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-[11px]">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Research Notice:</strong> Generated signals are historical analytical outputs for research evaluation. They do not represent executed orders or trading recommendations.
          </span>
        </div>
      </div>
    </div>
  );
};
