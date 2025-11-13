import React from 'react';
import { RankEntry, SortOption } from '../types';
import CrownIcon from './icons/CrownIcon';
import TrophyIcon from './icons/TrophyIcon';

interface RankingItemProps {
  entry: RankEntry;
  sortOption: SortOption;
}

const getRankStyles = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        container: 'border-yellow-400 bg-yellow-900/20 hover:bg-yellow-900/40 shadow-lg shadow-yellow-500/10',
        rankText: 'text-yellow-300',
        icon: <CrownIcon className="w-6 h-6 text-yellow-400" />,
      };
    case 2:
      return {
        container: 'border-slate-400 bg-slate-800/50 hover:bg-slate-700/50 shadow-lg shadow-slate-400/10',
        rankText: 'text-slate-300',
        icon: <TrophyIcon className="w-5 h-5 text-slate-400" />,
      };
    case 3:
      return {
        container: 'border-orange-500 bg-orange-900/20 hover:bg-orange-900/40 shadow-lg shadow-orange-500/10',
        rankText: 'text-orange-400',
        icon: <TrophyIcon className="w-5 h-5 text-orange-500" />,
      };
    default:
      return {
        container: 'border-slate-800 bg-slate-800/30 hover:bg-slate-800/60',
        rankText: 'text-slate-400',
        icon: null,
      };
  }
};

const formatLastPlayed = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
}

const StatDisplay: React.FC<{ entry: RankEntry, sortOption: SortOption }> = ({ entry, sortOption }) => {
    const renderStat = (value: number, label: string) => (
        <>
            <p className="text-lg font-bold text-cyan-400">{Math.round(value).toLocaleString()}</p>
            <p className="text-xs text-slate-500">{label}</p>
        </>
    );

    switch(sortOption) {
        case 'lastPlayedAt':
            return <>
                <p className="text-base font-bold text-cyan-400">{formatLastPlayed(entry.lastPlayedAt)}</p>
                <p className="text-xs text-slate-500">Last Online</p>
            </>;
        // 1 Hour Stats
        case 'last1h_count':
            return renderStat(entry.stats.last1h.count, '1h Plays');
        case 'last1h_speed':
            return renderStat(entry.stats.last1h.speed, '1h Speed');
        case 'last1h_average':
            return renderStat(entry.stats.last1h.average, '1h Avg Score');
        // 3 Hour Stats
        case 'last3h_count':
            return renderStat(entry.stats.last3h.count, '3h Plays');
        case 'last3h_speed':
            return renderStat(entry.stats.last3h.speed, '3h Speed');
        case 'last3h_average':
            return renderStat(entry.stats.last3h.average, '3h Avg Score');
        // 24 Hour Stats
        case 'last24h_count':
            return renderStat(entry.stats.last24h.count, '24h Plays');
        case 'last24h_speed':
            return renderStat(entry.stats.last24h.speed, '24h Speed');
        case 'last24h_average':
            return renderStat(entry.stats.last24h.average, '24h Avg Score');
        // Default
        case 'score':
        default:
             return renderStat(entry.score, 'Score');
    }
}

const RankingItem: React.FC<RankingItemProps> = ({ entry, sortOption }) => {
  const { rank, user } = entry;
  const styles = getRankStyles(rank);

  return (
    <div
      className={`flex items-center p-3 border rounded-lg transition-all duration-300 ${styles.container}`}
    >
      <div className="flex items-center w-16 sm:w-20 flex-shrink-0">
        <span className={`text-xl sm:text-2xl font-bold w-10 text-center ${styles.rankText}`}>
          {rank}
        </span>
        <div className="w-6 h-6 ml-1 flex items-center justify-center">
            {styles.icon}
        </div>
      </div>

      <img
        src={user.avatar}
        alt={user.display_name}
        className="w-12 h-12 rounded-full mr-4 border-2 border-slate-600"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null; 
          target.src = `https://picsum.photos/seed/${user.id}/48`;
        }}
      />

      <div className="flex-grow overflow-hidden">
        <p className="text-lg font-semibold text-white truncate" title={user.display_name}>
          {user.display_name}
        </p>
        <p className="text-sm text-slate-400 truncate" title={`@${user.username}`}>@{user.username}</p>
      </div>

      <div className="ml-4 text-right flex-shrink-0 w-28">
        <StatDisplay entry={entry} sortOption={sortOption} />
      </div>
    </div>
  );
};

export default RankingItem;