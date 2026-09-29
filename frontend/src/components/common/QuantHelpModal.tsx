import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { METRIC_DEFINITIONS } from '../../lib/metricDefinitions';
import { Command, Calculator, Cpu, ShieldCheck } from 'lucide-react';

interface QuantHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuantHelpModal: React.FC<QuantHelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Quantitative Research Workstation Guide & Formulas" maxWidth="xl">
      <div className="space-y-6 text-xs font-sans text-text-primary max-h-[75vh] overflow-y-auto pr-2">
        {/* Top Overview */}
        <div className="p-4 bg-surface border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <Cpu className="w-4 h-4 text-brand-primary" />
            <h4 className="text-sm font-semibold text-text-primary font-mono">Platform Assumptions &amp; Conventions</h4>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed font-sans">
            The Quant Research Dashboard operates under rigorous institutional financial conventions.
            All annualizations assume <strong>252 trading days</strong> per calendar year. Compound returns use standard geometric compounding.
            Trade executions operate deterministically under next-bar open prices (<code>NEXT_OPEN</code>) to strictly prevent lookahead bias.
          </p>
        </div>

        {/* Keyboard Shortcuts Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Command className="w-4 h-4 text-brand-primary" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">
              Keyboard Shortcuts &amp; Navigation (HCI Ergonomics)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 font-mono">
            <div className="flex items-center justify-between p-2.5 bg-surface border border-border rounded-lg">
              <span className="text-text-secondary">Command Palette</span>
              <kbd className="px-2 py-0.5 rounded bg-card border border-border text-[10px] text-brand-primary font-bold shadow-xs">
                Ctrl + K
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-surface border border-border rounded-lg">
              <span className="text-text-secondary">Help &amp; Guide</span>
              <kbd className="px-2 py-0.5 rounded bg-card border border-border text-[10px] text-brand-primary font-bold shadow-xs">
                ? / Shift + /
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-surface border border-border rounded-lg">
              <span className="text-text-secondary">Close Dialogs</span>
              <kbd className="px-2 py-0.5 rounded bg-card border border-border text-[10px] text-brand-primary font-bold shadow-xs">
                Esc
              </kbd>
            </div>
          </div>
        </div>

        {/* Core Mathematical Formulations Table */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-4 h-4 text-emerald-700" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">
              Core Quantitative Metric Formulations
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(METRIC_DEFINITIONS).map(([key, def]) => (
              <div key={key} className="p-3.5 bg-surface border border-border rounded-xl space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary font-mono text-xs">{def.name}</span>
                  {def.symbol && (
                    <Badge variant="info" className="text-[10px] py-0 px-1 font-mono">
                      {def.symbol}
                    </Badge>
                  )}
                </div>
                <div className="p-2 bg-card rounded-lg border border-border font-mono text-[11px] text-brand-primary font-semibold">
                  {def.formula}
                </div>
                <p className="text-[11px] text-text-secondary leading-tight font-sans">{def.description}</p>
                <div className="text-[10px] text-amber-800 font-mono pt-1.5 border-t border-border">
                  Target: {def.benchmark}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accounting Invariants & Risk Controls */}
        <div className="p-4 bg-surface border border-border rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <h4 className="text-xs font-semibold text-text-primary font-mono uppercase tracking-wider">
              Mathematical Accounting Invariants
            </h4>
          </div>
          <ul className="list-disc list-inside text-xs text-text-secondary space-y-1 leading-relaxed font-sans">
            <li><strong>Total Equity Invariant:</strong> <code>Equity_t = Cash_t + Quantity_t × Price_t</code> holds strictly for every timestamp $t$.</li>
            <li><strong>No Negative Cash:</strong> Simulation will reject or resize orders that would cause cash balance to drop below zero.</li>
            <li><strong>Friction Drag:</strong> Commissions and slippage costs are deducted instantaneously from cash at execution.</li>
            <li><strong>Lookahead Immunity:</strong> Signal generated at close $t$ executes strictly at open $t+1$.</li>
          </ul>
        </div>
      </div>
    </Dialog>
  );
};
