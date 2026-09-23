import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { MetricCard } from '../components/data-display/MetricCard';
import { ChartContainer } from '../components/data-display/ChartContainer';
import { EmptyState } from '../components/feedback/EmptyState';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Sliders } from 'lucide-react';

export const StrategiesPage: React.FC = () => {
  return (
    <PageContainer
      eyebrow="Strategy Engineering & Signals"
      title="Quantitative Strategies"
      description="Define quantitative trading rules, technical signal generators (SMA, EMA, RSI, Bollinger Bands), parameter sweeps, and entry/exit signal matrices."
      action={<Badge variant="info">Scaffolded Module</Badge>}
    >
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Active Strategy" value="SMA Crossover" isDemo subtitle="Fast / Slow Moving Average" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Fast Period" value="20 Days" isDemo subtitle="Short-term moving average" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Slow Period" value="50 Days" isDemo subtitle="Long-term moving average" />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <MetricCard label="Signal Generator" value="Idle" isDemo subtitle="Awaiting market feed" />
      </div>

      <div className="col-span-12 lg:col-span-8">
        <ChartContainer
          title="Technical Overlay & Entry/Exit Signal Graph"
          subtitle="Strategy signal overlay canvas ready for signal generation."
        />
      </div>

      <div className="col-span-12 lg:col-span-4">
        <Card title="Signal Generation Pipeline">
          <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
            Generates discrete signals: +1 (Long), 0 (Cash), -1 (Short) based on rule evaluation.
          </p>
        </Card>
      </div>

      <div className="col-span-12">
        <Card title="Generated Signal Records Table">
          <EmptyState
            title="No Signals Generated"
            description="Trading strategy signals will generate in Step 07 during Moving Average Strategy development."
            icon={Sliders}
          />
        </Card>
      </div>
    </PageContainer>
  );
};
