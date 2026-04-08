import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "./utils";

/* ─────────────────────────────────────────────
   usePagination — generic hook for any list
───────────────────────────────────────────── */
export function usePagination<T>(data: T[], defaultPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paginated = data.slice(start, start + pageSize);

  const changePage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const changePageSize = (s: number) => { setPageSize(s); setPage(1); };
  const reset = () => setPage(1);

  return { page: safePage, totalPages, paginated, total, pageSize, changePage, changePageSize, reset };
}

/* ─────────────────────────────────────────────
   Pagination UI Component
───────────────────────────────────────────── */
interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
  if (page >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "...", page - 1, page, page + 1, "...", totalPages];
}

export function Pagination({
  page, totalPages, total, pageSize,
  onPageChange, onPageSizeChange, className,
}: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = getPageNumbers(page, totalPages);

  if (total === 0) return null;

  return (
    <div className={cn("flex items-center justify-between px-4 py-2.5 border-t bg-white flex-wrap gap-2", className)}>
      {/* Info text */}
      <span className="text-xs text-gray-500 whitespace-nowrap">
        عرض <span className="font-medium text-gray-700">{start}</span> – <span className="font-medium text-gray-700">{end}</span> من <span className="font-medium text-gray-700">{total}</span> سجل
      </span>

      {/* Page numbers — LTR to keep order logical */}
      <div className="flex items-center gap-0.5" dir="ltr">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 transition-colors"
          title="الصفحة الأولى"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 transition-colors"
          title="السابق"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="w-7 text-center text-gray-400 text-xs select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(Number(p))}
              className={cn(
                "w-7 h-7 rounded-md text-xs font-medium transition-colors",
                page === p
                  ? "bg-[#155dfc] text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 transition-colors"
          title="التالي"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 transition-colors"
          title="الصفحة الأخيرة"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Per-page selector */}
      {onPageSizeChange && (
        <div className="flex items-center gap-1.5" dir="rtl">
          <span className="text-xs text-gray-500">في الصفحة:</span>
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-600 cursor-pointer hover:border-gray-300 transition-colors"
          >
            {[5, 10, 25, 50].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
