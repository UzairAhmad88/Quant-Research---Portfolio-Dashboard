import React from 'react';
import { Skeleton } from '../feedback/Skeleton';
import { EmptyState } from '../feedback/EmptyState';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  isMonospace?: boolean;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  pageSize?: number;
  currentPage?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No quantitative data records found',
  sortColumn,
  sortDirection,
  onSort,
  pageSize = 10,
  currentPage = 1,
  totalItems,
  onPageChange,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-[#151F2E] border border-[#263244] rounded-md overflow-hidden p-4 space-y-3">
        <Skeleton className="h-8 w-full mb-4" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;

  return (
    <div className="bg-[#151F2E] border border-[#263244] rounded-md overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#111827] border-b border-[#263244] text-[11px] font-mono-num text-[#64748B] uppercase tracking-wider">
              {columns.map((col) => {
                const alignClass =
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';
                return (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && onSort?.(col.key)}
                    className={`px-4 py-3 font-semibold select-none ${alignClass} ${
                      col.sortable ? 'cursor-pointer hover:text-[#E5E7EB]' : ''
                    }`}
                  >
                    <div className={`inline-flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-[#64748B]">
                          {sortColumn === col.key ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3 h-3 text-[#3B82F6]" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-[#3B82F6]" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#263244]/60 text-xs text-[#E5E7EB]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8">
                  <EmptyState title="No Records" description={emptyMessage} />
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={keyExtractor(row, idx)} className="hover:bg-[#1C2A3E]/50 transition-colors">
                  {columns.map((col) => {
                    const alignClass =
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left';
                    const monoClass = col.isMonospace ? 'font-mono-num' : '';

                    return (
                      <td key={col.key} className={`px-4 py-2.5 ${alignClass} ${monoClass}`}>
                        {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#111827] border-t border-[#263244] text-[11px] font-mono-num text-[#64748B]">
          <span>
            Page {currentPage} of {totalPages} ({totalItems ?? data.length} items)
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="px-2 py-1 rounded bg-[#151F2E] border border-[#263244] hover:bg-[#1C2A3E] disabled:opacity-40 disabled:cursor-not-allowed text-[#E5E7EB]"
            >
              Prev
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="px-2 py-1 rounded bg-[#151F2E] border border-[#263244] hover:bg-[#1C2A3E] disabled:opacity-40 disabled:cursor-not-allowed text-[#E5E7EB]"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
