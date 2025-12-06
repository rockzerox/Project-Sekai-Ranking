
import React, { useState, useRef, useEffect } from 'react';
import { SortOption } from '../types';

interface SortSelectorProps {
  activeSort: SortOption;
  onSortChange: (sortOption: SortOption) => void;
  limitToScore?: boolean;
}

const sortOptions: { id: SortOption; label: string }[] = [
  { id: 'score', label: '總分 (Total Score)' },
  { id: 'lastPlayedAt', label: '最後上線 (Last Online)' },
  { id: 'last1h_count', label: '1H 次數' },
  { id: 'last1h_score', label: '1H 得分' },
  { id: 'last1h_speed', label: '1H 時速' },
  { id: 'last1h_average', label: '1H 平均分' },
  { id: 'last3h_count', label: '3H 次數' },
  { id: 'last3h_score', label: '3H 得分' },
  { id: 'last3h_speed', label: '3H 時速' },
  { id: 'last3h_average', label: '3H 平均分' },
  { id: 'last24h_count', label: '24H 次數' },
  { id: 'last24h_score', label: '24H 得分' },
  { id: 'last24h_speed', label: '24H 時速' },
  { id: 'last24h_average', label: '24H 平均分' },
];

const SortSelector: React.FC<SortSelectorProps> = ({ activeSort, onSortChange, limitToScore = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const visibleOptions = limitToScore 
    ? sortOptions.filter(option => option.id === 'score') 
    : sortOptions;

  const currentLabel = sortOptions.find(opt => opt.id === activeSort)?.label || '排序方式';

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-64 flex justify-between items-center px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 hover:bg-slate-700 hover:border-cyan-500/50 transition-all duration-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
      >
        <span className="truncate mr-2">{currentLabel}</span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-full sm:w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto custom-scrollbar animate-fadeIn">
          <div className="py-1">
            {visibleOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onSortChange(option.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                  activeSort === option.id
                    ? 'bg-cyan-900/50 text-cyan-400 border-l-4 border-cyan-500'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SortSelector;
