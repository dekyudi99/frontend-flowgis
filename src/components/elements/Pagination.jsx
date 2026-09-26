import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 5,
  onPageChange,
  pageSizeOptions = [5, 10, 20, 50],
  onPageSizeChange,
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(totalItems, safeCurrentPage * pageSize);

  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages && page !== safeCurrentPage) {
      if (onPageChange) onPageChange(page);
    }
  };

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, safeCurrentPage - 1);
      let end = Math.min(totalPages, safeCurrentPage + 1);

      if (safeCurrentPage <= 2) {
        start = 1;
        end = 3;
      } else if (safeCurrentPage >= totalPages - 1) {
        start = totalPages - 2;
        end = totalPages;
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={`p-3 sm:px-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-gray-50/50 select-none ${className}`}>
      {/* Informasi Baris & Selector Ukuran Halaman */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-4 text-gray-500 w-full sm:w-auto">
        <span>
          Menampilkan <strong className="text-gray-800 font-semibold">{startIndex}</strong> - <strong className="text-gray-800 font-semibold">{endIndex}</strong> dari <strong className="text-gray-800 font-semibold">{totalItems}</strong> data
        </span>

        {onPageSizeChange && pageSizeOptions && pageSizeOptions.length > 0 && (
          <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3">
            <span className="text-gray-400 text-[11px]">Per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                if (onPageSizeChange) onPageSizeChange(newSize);
                if (onPageChange) onPageChange(1);
              }}
              className="bg-white border border-gray-200 text-gray-700 text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-2xs"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} baris
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigasi Nomor Halaman */}
      <div className="flex items-center gap-1">
        {/* Tombol Halaman Pertama */}
        <button
          type="button"
          onClick={() => handlePageClick(1)}
          disabled={safeCurrentPage <= 1}
          className={`h-7 w-7 flex items-center justify-center rounded-md border text-gray-600 transition ${
            safeCurrentPage <= 1
              ? 'opacity-30 cursor-not-allowed border-gray-200 bg-gray-50'
              : 'hover:bg-white hover:border-gray-300 bg-white border-gray-200 shadow-2xs'
          }`}
          title="Halaman Pertama"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Tombol Sebelumnya */}
        <button
          type="button"
          onClick={() => handlePageClick(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          className={`h-7 w-7 flex items-center justify-center rounded-md border text-gray-600 transition ${
            safeCurrentPage <= 1
              ? 'opacity-30 cursor-not-allowed border-gray-200 bg-gray-50'
              : 'hover:bg-white hover:border-gray-300 bg-white border-gray-200 shadow-2xs'
          }`}
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Daftar Angka Halaman */}
        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-xs">
                  •••
                </span>
              );
            }

            const isActive = page === safeCurrentPage;
            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => handlePageClick(page)}
                className={`h-7 min-w-[28px] px-2 flex items-center justify-center rounded-md text-xs font-semibold transition shadow-2xs ${
                  isActive
                    ? 'bg-teal-600 text-white border border-teal-600 shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-slate-50 hover:border-gray-300'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Tombol Selanjutnya */}
        <button
          type="button"
          onClick={() => handlePageClick(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= totalPages}
          className={`h-7 w-7 flex items-center justify-center rounded-md border text-gray-600 transition ${
            safeCurrentPage >= totalPages
              ? 'opacity-30 cursor-not-allowed border-gray-200 bg-gray-50'
              : 'hover:bg-white hover:border-gray-300 bg-white border-gray-200 shadow-2xs'
          }`}
          title="Halaman Selanjutnya"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Tombol Halaman Terakhir */}
        <button
          type="button"
          onClick={() => handlePageClick(totalPages)}
          disabled={safeCurrentPage >= totalPages}
          className={`h-7 w-7 flex items-center justify-center rounded-md border text-gray-600 transition ${
            safeCurrentPage >= totalPages
              ? 'opacity-30 cursor-not-allowed border-gray-200 bg-gray-50'
              : 'hover:bg-white hover:border-gray-300 bg-white border-gray-200 shadow-2xs'
          }`}
          title="Halaman Terakhir"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
