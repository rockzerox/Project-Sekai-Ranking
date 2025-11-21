
import React from 'react';
import { SortOption } from '../types';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number | 'highlights';
  onPageChange: (page: number | 'highlights') => void;
  activeSort?: SortOption;
}

const Pagination: React.FC<PaginationProps> = ({ 
  totalItems, 
  itemsPerPage, 
  currentPage, 
  onPageChange,
  activeSort 
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  // Only show Highlights button if sorting by score (or undefined which defaults to score usually)
  // The parent component controls the exact logic, but we visualize disability here.
  const isHighlightsDisabled = activeSort && activeSort !== 'score';

  // Calculate pages if not in highlights mode, or just show pages normally
  // If we are in highlights mode, totalItems might be different (from border api), 
  // so usually we only render this component when NOT in highlights mode OR 
  // we render it to allow switching BACK.
  // However, the prompt says "位于81-100的後方", implying it's part of the list.
  
  // Note: If currentPage is 'highlights', we might not want to show numeric pages based on the *highlights* count
  // but rather the *original* count. 
  // Since keeping track of "original" total items while in highlights mode is complex in this isolated component,
  // we assume the parent passes the total items of the MAIN list unless we are in highlights mode.
  // Actually, usually 100 items / 20 = 5 pages.
  
  const pageButtons = [];
  // Create standard page buttons
  // If currentPage is 'highlights', we assume the user wants to go back to numeric pages, so we still render them.
  // We will render up to 5 pages (since it's top 100 usually, or dynamic).
  const safeTotalPages = currentPage === 'highlights' ? 5 : totalPages; 

  for (let i = 1; i <= safeTotalPages; i++) {
    const startItem = (i - 1) * itemsPerPage + 1;
    const endItem = i * itemsPerPage; // Simplification for label
    
    pageButtons.push(
      <button
        key={i}
        onClick={() => onPageChange(i)}
        className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 ${
          currentPage === i
            ? 'bg-cyan-500 text-white shadow-md'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
      >
        {`${startItem}-${endItem}`}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 mb-4">
      {pageButtons}
      
      {/* Highlights Button */}
      <button
        onClick={() => !isHighlightsDisabled && onPageChange('highlights')}
        disabled={isHighlightsDisabled}
        className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1 ${
          currentPage === 'highlights'
            ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
            : isHighlightsDisabled
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
              : 'bg-slate-700 text-pink-300 border border-pink-500/30 hover:bg-pink-900/30 hover:border-pink-500'
        }`}
        title={isHighlightsDisabled ? "僅在總分排序時可用" : "查看特定排名分數線"}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        精彩片段
      </button>
    </div>
  );
};

export default Pagination;
