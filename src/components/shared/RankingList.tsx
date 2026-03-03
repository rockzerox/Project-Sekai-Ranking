
import React from 'react';
import { RankEntry, SortOption, CardsMap } from '../../types';
import RankingItem from '../../components/shared/RankingItem';

interface RankingListProps {
  rankings: RankEntry[];
  sortOption: SortOption;
  hideStats?: boolean;
  aggregateAt?: string;
  eventDuration?: number;
  cardsMap?: CardsMap;
  isLiveEvent?: boolean;
  now?: number;
}

const RankingList: React.FC<RankingListProps> = ({ rankings, sortOption, hideStats = false, aggregateAt, eventDuration, cardsMap, isLiveEvent, now }) => {
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
      {rankings.map((entry, index) => {
        // More robust key generation
        const uniqueKey = entry.user.id && entry.user.id !== 'undefined' 
            ? entry.user.id 
            : `rank-${entry.rank}-${index}`;

        return (
            <RankingItem 
                key={uniqueKey} 
                entry={entry} 
                sortOption={sortOption} 
                hideStats={hideStats}
                aggregateAt={aggregateAt}
                eventDuration={eventDuration}
                cardsMap={cardsMap}
                isLiveEvent={isLiveEvent}
                now={now}
            />
        );
      })}
    </div>
  );
};

export default RankingList;
