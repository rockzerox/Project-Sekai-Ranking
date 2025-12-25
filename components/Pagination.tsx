
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
  // 現在允許在 'score' 或 'dailyAvg' 時進入精彩片段
  const isHighlightsDisabled = activeSort && activeSort !== 'score' && activeSort !== 'dailyAvg';

  const pageButtons = [];
  const safeTotalPages = currentPage === 'highlights' ? 5 : totalPages; 

  for (let i = 1; i <= safeTotalPages; i++) {
    const startItem = (i - 1) * itemsPerPage + 1;
    const endItem = i * itemsPerPage; 
    
    pageButtons.push(
      <button
        key={i}
        onClick={() => onPageChange(i)}
        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors duration-200 border border-transparent ${
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
    <div className="flex flex-wrap justify-center items-center gap-2">
      <div className="flex items-center gap-2">
        {pageButtons}
      </div>
      
      {/* Highlights Button */}
      <button
        onClick={() => !isHighlightsDisabled && onPageChange('highlights')}
        disabled={isHighlightsDisabled}
        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200 flex items-center gap-1 border ${
          currentPage === 'highlights'
            ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20 border-transparent'
            : isHighlightsDisabled
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed border-slate-700'
              : 'bg-slate-700 text-pink-300 border-pink-500/30 hover:bg-pink-900/30 hover:border-pink-500'
        }`}
        title={isHighlightsDisabled ? "僅在總分或日均排序時可用" : "查看特定排名分數線"}
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
