import React from 'react';
import { SortOption } from '../types';

interface SortSelectorProps {
  activeSort: SortOption;
  onSortChange: (sortOption: SortOption) => void;
}

const sortOptions: { id: SortOption; label: string }[] = [
  { id: 'score', label: 'Total Score' },
  { id: 'lastPlayedAt', label: 'Last Online' },
  { id: 'last1h_count', label: '1h Plays' },
  { id: 'last1h_speed', label: '1h Speed' },
  { id: 'last1h_average', label: '1h Avg Score' },
  { id: 'last3h_count', label: '3h Plays' },
  { id: 'last3h_speed', label: '3h Speed' },
  { id: 'last3h_average', label: '3h Avg Score' },
  { id: 'last24h_count', label: '24h Plays' },
  { id: 'last24h_speed', label: '24h Speed' },
  { id: 'last24h_average', label: '24h Avg Score' },
];

const SortSelector: React.FC<SortSelectorProps> = ({ activeSort, onSortChange }) => {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {sortOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => onSortChange(option.id)}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 ${
            activeSort === option.id
              ? 'bg-cyan-500 text-white shadow-md'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default SortSelector;