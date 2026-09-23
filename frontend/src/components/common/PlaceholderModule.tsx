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
        <p className="text-xs text-[#94A3B8] leading-relaxed max-w-3xl">
          {purpose}
        </p>

        {/* Generic Instrument Architectural Target */}
        <div className="mt-4 pt-4 border-t border-[#263244] flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono-num text-[#64748B] uppercase tracking-wider">
            Target Asset Classes:
          </span>
          {supportedAssets.map((asset) => (
            <span
              key={asset}
              className="text-[10px] font-mono-num px-2 py-0.5 rounded bg-[#111827] text-[#E5E7EB] border border-[#263244]"
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
            <div className="flex items-center gap-2 text-[#3B82F6] mb-2">
              <Database className="w-4 h-4" />
              <h4 className="text-xs font-semibold text-[#E5E7EB] uppercase tracking-wider">Data Provider</h4>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Decoupled abstraction ready for market data ingestion. Provider interface contract established.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#263244]/60 flex justify-between items-center text-[11px] font-mono-num text-[#64748B]">
            <span>Provider Interface</span>
            <span className="text-[#3B82F6]">Abstract Base</span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#22C55E] mb-2">
              <Cpu className="w-4 h-4" />
              <h4 className="text-xs font-semibold text-[#E5E7EB] uppercase tracking-wider">Quant Engine</h4>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Python NumPy / Pandas analytics engine integration architecture prepared in backend service boundary.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#263244]/60 flex justify-between items-center text-[11px] font-mono-num text-[#64748B]">
            <span>Analytics Service</span>
            <span className="text-[#22C55E]">FastAPI Layer</span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#F59E0B] mb-2">
              <ShieldAlert className="w-4 h-4" />
              <h4 className="text-xs font-semibold text-[#E5E7EB] uppercase tracking-wider">State & Storage</h4>
            </div>
            <p className="text-xs text-[#94A3B8]">
              TanStack Query server state hydration + PostgreSQL model structure prepared for high-frequency queries.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#263244]/60 flex justify-between items-center text-[11px] font-mono-num text-[#64748B]">
            <span>Database Schema</span>
            <span className="text-[#F59E0B]">PostgreSQL</span>
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
                className="flex items-center gap-3 p-2.5 rounded bg-[#111827] border border-[#263244] text-xs text-[#94A3B8]"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Professional Empty State Card (No Fabricated Data) */}
      <div className="p-8 rounded-md border border-dashed border-[#263244] bg-[#111827]/40 flex flex-col items-center justify-center text-center">
        <div className="p-3 rounded-full bg-[#151F2E] border border-[#263244] text-[#94A3B8] mb-3">
          <Layers className="w-6 h-6 text-[#3B82F6]" />
        </div>
        <h4 className="text-xs font-semibold text-[#E5E7EB] uppercase tracking-wider mb-1">
          No Market Data Available
        </h4>
        <p className="text-xs text-[#94A3B8] max-w-md">
          {title} calculation engine will activate when market data feeds are configured in Step 02. No financial metrics are simulated or fabricated.
        </p>
      </div>
    </div>
  );
};
