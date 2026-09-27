import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileCode, FileText, Loader2, AlertCircle } from 'lucide-react';
import { triggerDownload } from '../../services/exportService';

export interface ExportOption {
  id?: string;
  label: string;
  format: 'csv' | 'json' | 'pdf' | 'CSV' | 'JSON' | 'PDF';
  url: string;
  filenameFallback?: string;
  description?: string;
}

interface ExportMenuProps {
  buttonLabel?: string;
  label?: string;
  options: ExportOption[];
  disabled?: boolean;
  className?: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  buttonLabel,
  label: customLabel,
  options,
  disabled = false,
  className = '',
}) => {
  const displayLabel = customLabel || buttonLabel || 'Export';
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeFormat, setActiveFormat] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (opt: ExportOption) => {
    if (isExporting) return;
    setIsExporting(true);
    setActiveFormat(opt.format.toLowerCase());
    setErrorMessage(null);
    setIsOpen(false);

    try {
      await triggerDownload(opt.url, opt.filenameFallback);
    } catch (err: any) {
      setErrorMessage(err.message || 'Export download failed.');
    } finally {
      setIsExporting(false);
      setActiveFormat(null);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4 text-emerald-400" />;
      case 'json':
        return <FileCode className="h-4 w-4 text-amber-400" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-blue-400" />;
      default:
        return <FileSpreadsheet className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className={`relative inline-block text-left font-mono ${className}`} ref={menuRef}>
      <button
        type="button"
        disabled={disabled || isExporting}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-[#263244] bg-[#151F2E] text-[#E5E7EB] hover:bg-[#1E293B] hover:border-[#3B82F6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#3B82F6]" />
            <span>{activeFormat === 'pdf' ? 'Generating PDF...' : 'Preparing...'}</span>
          </>
        ) : (
          <>
            <Download className="h-3.5 w-3.5 text-[#94A3B8]" />
            <span>{displayLabel}</span>
            <ChevronDown className="h-3 w-3 text-[#94A3B8] transition-transform duration-150" />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-56 rounded-md shadow-2xl bg-[#0F172A] border border-[#263244] py-1 z-50 focus:outline-none animate-in fade-in duration-100">
          <div className="px-3 py-1.5 border-b border-[#1E293B] text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">
            Select Export Format
          </div>

          <div className="py-1">
            {options.map((opt, idx) => (
              <button
                key={opt.id || `${opt.format}-${opt.label}-${idx}`}
                type="button"
                onClick={() => handleSelect(opt)}
                className="w-full text-left px-3 py-2 text-xs text-[#E5E7EB] hover:bg-[#1E293B] flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center gap-2">
                  {getFormatIcon(opt.format)}
                  <div>
                    <div className="font-semibold text-xs text-[#E2E8F0] group-hover:text-white">
                      {opt.label}
                    </div>
                    {opt.description && (
                      <div className="text-[10px] text-[#64748B] group-hover:text-[#94A3B8]">
                        {opt.description}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] px-1 py-0.5 rounded bg-[#1E293B]/60">
                  {opt.format}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="absolute right-0 mt-1 w-64 p-2 bg-red-950/90 border border-red-800 rounded text-[11px] text-red-200 flex items-center gap-1.5 z-50">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
          <span className="truncate">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-xs hover:text-white"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
