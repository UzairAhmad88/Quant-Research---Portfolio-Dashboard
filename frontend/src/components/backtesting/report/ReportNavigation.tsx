import React from 'react';
import { ListFilter } from 'lucide-react';

interface ReportNavigationProps {
  activeSection: string;
  onSelectSection: (sectionId: string) => void;
}

export const REPORT_SECTIONS = [
  { id: 'sec-summary', label: '1. Summary' },
  { id: 'sec-config', label: '2. Config' },
  { id: 'sec-strategy', label: '3. Strategy' },
  { id: 'sec-market', label: '4. Data' },
  { id: 'sec-exec', label: '5. Execution' },
  { id: 'sec-perf', label: '6. Performance' },
  { id: 'sec-equity', label: '7. Equity' },
  { id: 'sec-drawdown', label: '8. Drawdown' },
  { id: 'sec-trades', label: '9. Trades' },
  { id: 'sec-accounting', label: '10. Accounting' },
  { id: 'sec-quality', label: '11. Quality' },
  { id: 'sec-methodology', label: '12. Methodology' },
  { id: 'sec-limitations', label: '13. Limitations' },
  { id: 'sec-repro', label: '14. Reproducibility' },
];

export const ReportNavigation: React.FC<ReportNavigationProps> = ({
  activeSection,
  onSelectSection,
}) => {
  return (
    <div className="bg-card border border-border rounded-xl p-3 font-mono sticky top-4 z-20 mb-6 shadow-xs">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <span className="text-[10px] text-text-secondary uppercase font-bold shrink-0 flex items-center gap-1 pr-2 border-r border-border">
          <ListFilter className="h-3 w-3 text-forest-700" /> Sections
        </span>
        {REPORT_SECTIONS.map((sec) => (
          <button
            key={sec.id}
            onClick={() => onSelectSection(sec.id)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
              activeSection === sec.id
                ? 'bg-forest-700 text-white font-semibold shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-forest-50'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>
    </div>
  );
};
