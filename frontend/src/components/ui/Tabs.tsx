import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex items-center gap-1 border-b border-[#263244] ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px select-none ${
              isActive
                ? 'border-[#3B82F6] text-[#E5E7EB] font-semibold'
                : 'border-transparent text-[#94A3B8] hover:text-[#E5E7EB] hover:border-[#263244]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono-num ${
                  isActive ? 'bg-[#3B82F6]/20 text-[#60A5FA]' : 'bg-[#111827] text-[#64748B]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
