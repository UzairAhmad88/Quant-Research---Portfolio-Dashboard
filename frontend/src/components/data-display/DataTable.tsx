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
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden p-4 space-y-3">
        <Skeleton className="h-8 w-full mb-4" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F0FDF4] border-b border-[#E5E7EB] text-[11px] font-mono-num text-[#334155] uppercase tracking-wider">
              {columns.map((col) => {
                const alignClass =
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';
                return (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && onSort?.(col.key)}
                    className={`px-4 py-3 font-semibold select-none ${alignClass} ${
                      col.sortable ? 'cursor-pointer hover:text-[#14532D]' : ''
                    }`}
                  >
                    <div className={`inline-flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-[#64748B]">
                          {sortColumn === col.key ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3 h-3 text-[#14532D]" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-[#14532D]" />
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
          <tbody className="divide-y divide-[#E5E7EB] text-xs text-[#17211B]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8">
                  <EmptyState title="No Records" description={emptyMessage} />
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={keyExtractor(row, idx)} className="hover:bg-[#F8FAF9] transition-colors">
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
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#F8FAF9] border-t border-[#E5E7EB] text-[11px] font-mono-num text-[#64748B]">
          <span>
            Page {currentPage} of {totalPages} ({totalItems ?? data.length} items)
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="px-2.5 py-1 rounded-md bg-white border border-[#CBD5E1] hover:bg-[#F0FDF4] hover:text-[#14532D] disabled:opacity-40 disabled:cursor-not-allowed text-[#334155] transition-colors"
            >
              Prev
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="px-2.5 py-1 rounded-md bg-white border border-[#CBD5E1] hover:bg-[#F0FDF4] hover:text-[#14532D] disabled:opacity-40 disabled:cursor-not-allowed text-[#334155] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
