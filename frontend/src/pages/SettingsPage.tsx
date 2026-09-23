import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Server, Database, Key, ShieldCheck, Cpu } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card
        title="System & Environment Configuration"
        subtitle="Global platform settings, API key boundaries, data provider credentials, and database connection parameters."
        action={<Badge variant="info">Step 01 Config</Badge>}
      >
        <p className="text-xs text-[#94A3B8] leading-relaxed">
          Configure external market data credentials and database parameters. Secrets are managed securely via environment variables (`.env`) and never exposed in client bundles.
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Data Provider Config */}
        <Card title="Market Data Provider Credentials" subtitle="Provider credentials used in Step 02 data ingestion.">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono-num text-[#94A3B8] mb-1">Active Provider Strategy</label>
              <Input value="Provider Abstract Boundary (Decoupled)" disabled />
            </div>
            <div>
              <label className="block text-xs font-mono-num text-[#94A3B8] mb-1">Market Data API Key</label>
              <Input type="password" placeholder="••••••••••••••••" disabled icon={<Key className="w-3.5 h-3.5" />} />
            </div>
            <div>
              <label className="block text-xs font-mono-num text-[#94A3B8] mb-1">Base API URL</label>
              <Input value="https://api.marketdata.provider.com/v1" disabled />
            </div>
            <div className="pt-2">
              <Button variant="secondary" size="sm" disabled>
                Test Provider Connection (Step 02)
              </Button>
            </div>
          </div>
        </Card>

        {/* Database & System Parameters */}
        <Card title="Database & Backend Connection" subtitle="SQLAlchemy & PostgreSQL connection pool parameters.">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono-num text-[#94A3B8] mb-1">PostgreSQL Host</label>
              <Input value="localhost:5432 / postgres_db" disabled icon={<Database className="w-3.5 h-3.5" />} />
            </div>
            <div>
              <label className="block text-xs font-mono-num text-[#94A3B8] mb-1">FastAPI Backend Endpoint</label>
              <Input value="http://localhost:8000/api/v1" disabled icon={<Server className="w-3.5 h-3.5" />} />
            </div>
            <div>
              <label className="block text-xs font-mono-num text-[#94A3B8] mb-1">Authentication Layer</label>
              <div className="flex items-center gap-2 p-2 rounded bg-[#111827] border border-[#263244] text-xs text-[#94A3B8]">
                <ShieldCheck className="w-4 h-4 text-[#3B82F6]" />
                <span>Architecture-Ready (Disabled by default for local quant research)</span>
              </div>
            </div>
            <div className="pt-2">
              <Button variant="secondary" size="sm" disabled icon={<Cpu className="w-3.5 h-3.5" />}>
                Run Migration Checks
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
