import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Tabs } from '../components/ui/Tabs';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Server, Database, ShieldCheck, Sliders } from 'lucide-react';


const settingsTabs = [
  { id: 'application', label: 'Application' },
  { id: 'providers', label: 'Data Providers' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
  { id: 'system', label: 'System' },
];

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('application');

  return (
    <PageContainer
      eyebrow="System Administration"
      title="System Settings & Configuration"
      description="Configure workstation preferences, market data provider parameters, system notifications, and database connection strings."
      action={<Badge variant="info">Step 02 Workstation Config</Badge>}
    >
      {/* Category Selection Tabs (12 columns) */}
      <div className="col-span-12">
        <Tabs tabs={settingsTabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab 1: Application Settings */}
      {activeTab === 'application' && (
        <>
          <div className="col-span-12 lg:col-span-6">
            <Card title="Workstation Environment" subtitle="Global application identification parameters.">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono-num text-[#94A3B8] mb-1">Platform Name</label>
                  <Input value="Quant Research Dashboard" disabled />
                </div>
                <div>
                  <label className="block text-xs font-mono-num text-[#94A3B8] mb-1">Version</label>
                  <Input value="v0.2.0 (Step 02 — Design System & Shell)" disabled />
                </div>
                <div>
                  <label className="block text-xs font-mono-num text-[#94A3B8] mb-1">Default Asset Class View</label>
                  <Input value="EQUITY (Stocks & ETFs)" disabled />
                </div>
              </div>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <Card title="Timezone & Market Hours" subtitle="Timestamps and market close settings.">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono-num text-[#94A3B8] mb-1">Display Timezone</label>
                  <Input value="UTC / Local Market Time" disabled />
                </div>
                <div>
                  <label className="block text-xs font-mono-num text-[#94A3B8] mb-1">Numeric Precision Format</label>
                  <Input value="Tabular Monospace (2 Decimal Places)" disabled />
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Tab 2: Data Providers */}
      {activeTab === 'providers' && (
        <div className="col-span-12 space-y-6">
          <Card title="Active Market Data Provider" subtitle="Registered providers and capability contracts from ProviderRegistry.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono-num text-[#94A3B8] mb-1">Primary Provider</label>
                  <Input value="Yahoo Finance Adapter (yahoo_finance)" disabled icon={<Sliders className="w-3.5 h-3.5" />} />
                </div>
                <div>
                  <label className="block text-xs font-mono-num text-[#94A3B8] mb-1">Supported Capabilities</label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge variant="success">Historical: Supported</Badge>
                    <Badge variant="success">Latest Available: Supported</Badge>
                    <Badge variant="outline">Intraday: Disabled</Badge>
                    <Badge variant="outline">Streaming: Disabled</Badge>
                    <Badge variant="warning">Mode: Delayed EOD</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono-num text-[#94A3B8] mb-1">Provider Architecture</label>
                  <div className="p-2.5 rounded bg-[#111827] border border-[#263244] text-xs text-[#94A3B8] space-y-1">
                    <div className="text-[#F8FAFC] font-semibold">Database-First Cache Strategy</div>
                    <div>Queries local PostgreSQL observations before issuing external network requests.</div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono-num text-[#94A3B8] mb-1">Connection State</label>
                  <div className="p-2 rounded bg-[#111827] border border-[#22C55E]/40 text-xs text-[#4ADE80] flex items-center justify-between">
                    <span>Operational (yfinance Provider Adapter)</span>
                    <Badge variant="success">ONLINE</Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Market Data Acquisition & Freshness Settings" subtitle="System-wide defaults for frequency, calendar scheduling, and polling.">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-mono-num text-[#94A3B8]">Default Frequency</label>
                <select disabled className="w-full px-3 py-2 bg-[#111827] border border-[#263244] rounded text-xs text-[#F8FAFC] opacity-80">
                  <option value="DAILY">DAILY (1-Day Bars)</option>
                  <option value="HOURLY" disabled>HOURLY (Disabled)</option>
                  <option value="MINUTE" disabled>MINUTE (Disabled)</option>
                </select>
                <p className="text-[10px] text-[#64748B]">Intraday frequencies reserved for future high-granularity feeds.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono-num text-[#94A3B8]">Freshness Policy</label>
                <select disabled className="w-full px-3 py-2 bg-[#111827] border border-[#263244] rounded text-xs text-[#F8FAFC] opacity-80">
                  <option value="CALENDAR_AWARE">Calendar-Aware (Equity & Crypto Calendars)</option>
                </select>
                <p className="text-[10px] text-[#64748B]">Prevents false stale warnings during market weekends and holidays.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono-num text-[#94A3B8]">Auto-Refresh Polling</label>
                <div className="p-2 rounded bg-[#111827] border border-[#263244] text-xs text-[#94A3B8] flex items-center justify-between">
                  <span>Disabled (Manual Refresh)</span>
                  <Badge variant="outline">INACTIVE</Badge>
                </div>
                <p className="text-[10px] text-[#64748B]">Aggressive background polling is disabled to conserve resources and avoid rate limits.</p>
              </div>
            </div>
          </Card>
        </div>
      )}


      {/* Tab 3: Appearance */}
      {activeTab === 'appearance' && (
        <div className="col-span-12">
          <Card title="Theme & Visual Palette" subtitle="Institutional quant workstation dark theme.">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded bg-[#0B1220] border border-[#3B82F6] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#E5E7EB]">Institutional Dark</div>
                  <div className="text-[10px] text-[#94A3B8] font-mono-num mt-0.5">Primary (#0B1220)</div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="p-4 rounded bg-[#111827] border border-[#263244] opacity-50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#E5E7EB]">High Contrast Dark</div>
                  <div className="text-[10px] text-[#94A3B8] font-mono-num mt-0.5">Option</div>
                </div>
                <Badge variant="outline">Disabled</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === 'notifications' && (
        <div className="col-span-12">
          <Card title="Notification Preferences" subtitle="Configure workstation alert channels.">
            <div className="space-y-3 text-xs text-[#94A3B8]">
              <div className="flex items-center justify-between p-3 rounded bg-[#111827] border border-[#263244]">
                <div>
                  <div className="font-semibold text-[#E5E7EB]">System & Health Notifications</div>
                  <div className="text-[11px] text-[#64748B]">API connection changes and health alerts</div>
                </div>
                <Badge variant="success">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded bg-[#111827] border border-[#263244]">
                <div>
                  <div className="font-semibold text-[#E5E7EB]">Market Data Ingestion Alerts</div>
                  <div className="text-[11px] text-[#64748B]">Data provider updates and download progress</div>
                </div>
                <Badge variant="success">Enabled</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: Security */}
      {activeTab === 'security' && (
        <div className="col-span-12">
          <Card title="Authentication & Security Architecture">
            <div className="flex items-center gap-3 p-4 rounded bg-[#111827] border border-[#263244] text-xs text-[#94A3B8]">
              <ShieldCheck className="w-5 h-5 text-[#3B82F6]" />
              <div>
                <strong className="text-[#E5E7EB] font-semibold">Local Quantitative Workflow Mode</strong>
                <p className="mt-0.5">Authentication is architecture-ready but bypassed for local quant research productivity.</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 6: System */}
      {activeTab === 'system' && (
        <div className="col-span-12">
          <Card title="Database & Container Status">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono-num text-[#94A3B8] mb-1">PostgreSQL URI</label>
                <Input value="postgresql+psycopg://postgres:password@localhost:5432/quant_dashboard" disabled icon={<Database className="w-3.5 h-3.5" />} />
              </div>
              <div>
                <label className="block text-xs font-mono-num text-[#94A3B8] mb-1">FastAPI Backend Endpoint</label>
                <Input value="http://localhost:8000/api/v1" disabled icon={<Server className="w-3.5 h-3.5" />} />
              </div>
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
};
