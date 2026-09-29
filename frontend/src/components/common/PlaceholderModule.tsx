import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Layers, Database, ShieldAlert, Cpu } from 'lucide-react';

interface PlaceholderModuleProps {
  title: string;
  step: string;
  purpose: string;
  status?: 'COMPLETED' | 'IN_DEVELOPMENT' | 'SCAFFOLDED' | 'PLANNED';
  supportedAssets?: string[];
  upcomingFeatures?: string[];
}

export const PlaceholderModule: React.FC<PlaceholderModuleProps> = ({
  title,
  step,
  purpose,
  status = 'SCAFFOLDED',
  supportedAssets = ['EQUITY', 'ETF', 'INDEX', 'CRYPTO'],
  upcomingFeatures = [],
}) => {
  const getBadgeVariant = (st: string) => {
    switch (st) {
      case 'COMPLETED':
        return 'success';
      case 'IN_DEVELOPMENT':
        return 'warning';
      case 'SCAFFOLDED':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Overview Header Card */}
      <Card
        title={title}
        subtitle={step}
        action={
          <Badge variant={getBadgeVariant(status)}>
            {status}
          </Badge>
        }
      >
        <p className="text-xs text-text-secondary leading-relaxed max-w-3xl">
          {purpose}
        </p>

        {/* Generic Instrument Architectural Target */}
        <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-text-secondary uppercase tracking-wider">
            Target Asset Classes:
          </span>
          {supportedAssets.map((asset) => (
            <span
              key={asset}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface text-text-primary border border-border"
            >
              {asset}
            </span>
          ))}
        </div>
      </Card>

      {/* Module Architecture Panel & Empty State */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-brand-primary mb-2">
              <Database className="w-4 h-4" />
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Data Provider</h4>
            </div>
            <p className="text-xs text-text-secondary">
              Decoupled abstraction ready for market data ingestion. Provider interface contract established.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-[11px] font-mono text-text-secondary">
            <span>Provider Interface</span>
            <span className="text-brand-primary font-semibold">Abstract Base</span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 mb-2">
              <Cpu className="w-4 h-4" />
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Quant Engine</h4>
            </div>
            <p className="text-xs text-text-secondary">
              Python NumPy / Pandas analytics engine integration architecture prepared in backend service boundary.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-[11px] font-mono text-text-secondary">
            <span>Analytics Service</span>
            <span className="text-emerald-700 font-semibold">FastAPI Layer</span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-700 mb-2">
              <ShieldAlert className="w-4 h-4" />
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">State &amp; Storage</h4>
            </div>
            <p className="text-xs text-text-secondary">
              TanStack Query server state hydration + PostgreSQL model structure prepared for high-frequency queries.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-[11px] font-mono text-text-secondary">
            <span>Database Schema</span>
            <span className="text-amber-700 font-semibold">PostgreSQL</span>
          </div>
        </Card>
      </div>

      {/* Module Roadmap & Scope Panel */}
      {upcomingFeatures.length > 0 && (
        <Card title="Module Implementation Plan" subtitle="Core quantitative capabilities scheduled for implementation in dedicated steps.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upcomingFeatures.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-surface border border-border text-xs text-text-secondary"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Professional Empty State Card (No Fabricated Data) */}
      <div className="p-8 rounded-xl border border-dashed border-border bg-surface/50 flex flex-col items-center justify-center text-center">
        <div className="p-3.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-1">
          No Market Data Available
        </h4>
        <p className="text-xs text-text-secondary max-w-md">
          {title} calculation engine will activate when market data feeds are configured in Step 02. No financial metrics are simulated or fabricated.
        </p>
      </div>
    </div>
  );
};
