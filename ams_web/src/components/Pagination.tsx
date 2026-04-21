import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-3 bg-white/40 backdrop-blur-xl border-t border-slate-100">
      <div className="flex items-center gap-6 order-2 sm:order-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 disabled:opacity-20 transition-all active:scale-90"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-2">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
              Page
            </span>
            <span className="text-[11px] font-black text-slate-900 tabular-nums">
              {currentPage}
            </span>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
              of
            </span>
            <span className="text-[11px] font-black text-slate-500 tabular-nums">
              {totalPages}
            </span>
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 disabled:opacity-20 transition-all active:scale-90"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 order-1 sm:order-2">
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
          Displaying
        </span>
        <div className="flex items-center gap-1 text-[11px] font-black text-slate-700 bg-slate-50/50 px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
          <span className="text-[#ff8000] tabular-nums">
            {startItem}-{endItem}
          </span>
          <span className="text-[9px] text-slate-300 uppercase px-1">of</span>
          <span className="tabular-nums">{totalItems}</span>
        </div>
      </div>
    </div>
  );
};
