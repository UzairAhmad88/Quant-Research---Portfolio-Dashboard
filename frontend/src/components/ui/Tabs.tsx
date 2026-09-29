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
    <div className={`flex items-center gap-1 border-b border-[#E5E7EB] ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px select-none ${
              isActive
                ? 'border-[#14532D] text-[#14532D] font-bold'
                : 'border-transparent text-[#64748B] hover:text-[#17211B] hover:border-[#CBD5E1]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono-num font-semibold ${
                  isActive ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#F1F5F9] text-[#64748B]'
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
