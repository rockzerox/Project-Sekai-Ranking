
import React from 'react';
import { RankEntry, SortOption } from '../types';
import RankingItem from './RankingItem';

interface RankingListProps {
  rankings: RankEntry[];
  sortOption: SortOption;
  hideStats?: boolean;
}

const RankingList: React.FC<RankingListProps> = ({ rankings, sortOption, hideStats = false }) => {
  if (rankings.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 text-lg">No results found.</p>
        <p className="text-slate-500">Try a different search term.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rankings.map((entry) => (
        <RankingItem 
            key={entry.user.id} 
            entry={entry} 
            sortOption={sortOption} 
            hideStats={hideStats}
        />
      ))}
    </div>
  );
};

export default RankingList;
