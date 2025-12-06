
import React, { useState } from 'react';
import { RankEntry, SortOption, UserProfileResponse } from '../types';
import CrownIcon from './icons/CrownIcon';
import TrophyIcon from './icons/TrophyIcon';

interface RankingItemProps {
  entry: RankEntry;
  sortOption: SortOption;
  hideStats?: boolean;
  aggregateAt?: string;
}

const getRankStyles = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        container: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 shadow-lg shadow-yellow-500/10',
        rankText: 'text-yellow-600 dark:text-yellow-300',
        icon: <CrownIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 dark:text-yellow-400" />,
      };
    case 2:
      return {
        container: 'border-slate-300 dark:border-slate-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 shadow-lg shadow-slate-400/10',
        rankText: 'text-slate-600 dark:text-slate-300',
        icon: <TrophyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 dark:text-slate-400" />,
      };
    case 3:
      return {
        container: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 shadow-lg shadow-orange-500/10',
        rankText: 'text-orange-600 dark:text-orange-400',
        icon: <TrophyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-500" />,
      };
    default:
      return {
        container: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60',
        rankText: 'text-slate-500 dark:text-slate-400',
        icon: null,
      };
  }
};

const difficultyStyles: Record<string, string> = {
  easy: 'text-lime-600 dark:text-lime-400',    
  normal: 'text-blue-600 dark:text-blue-400',  
  hard: 'text-amber-600 dark:text-amber-400',   
  expert: 'text-rose-600 dark:text-rose-500',  
  master: 'text-purple-600 dark:text-purple-400',
  append: 'text-fuchsia-600 dark:text-fuchsia-400'
};

const formatLastPlayed = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '未知';
    return date.toLocaleString(undefined, {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
}

const StatDisplay: React.FC<{ entry: RankEntry, sortOption: SortOption, hideStats: boolean, aggregateAt?: string }> = ({ entry, sortOption, hideStats, aggregateAt }) => {
    const renderStat = (value: number, label: string) => (
        <>
            <p className="text-base sm:text-lg font-bold text-cyan-600 dark:text-cyan-400">{Math.round(value).toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs text-slate-500">{label}</p>
        </>
    );

    // Calculate Give Up Line if in Highlights mode (hideStats=true) and Live mode (aggregateAt provided)
    let giveUpLine: number | null = null;
    if (hideStats && aggregateAt && sortOption === 'score') {
        const now = Date.now();
        const end = new Date(aggregateAt).getTime();
        const remainingSeconds = (end - now) / 1000;
        
        // Only calculate if event is still active
        if (remainingSeconds > 0) {
            const maxGain = (remainingSeconds / 90) * 70000;
            const threshold = entry.score - maxGain;
            giveUpLine = Math.max(0, Math.floor(threshold));
        }
    }

    switch(sortOption) {
        case 'lastPlayedAt':
            return <>
                <p className="text-sm sm:text-base font-bold text-cyan-600 dark:text-cyan-400">{formatLastPlayed(entry.lastPlayedAt)}</p>
                <p className="text-[10px] sm:text-xs text-slate-500">最後上線</p>
            </>;
        // 1 Hour Stats
        case 'last1h_count':
            return renderStat(entry.stats.last1h.count, '1H 次數');
        case 'last1h_score':
            return renderStat(entry.stats.last1h.score, '1H 得分');
        case 'last1h_speed':
            return renderStat(entry.stats.last1h.speed, '1H 時速');
        case 'last1h_average':
            return renderStat(entry.stats.last1h.average, '1H 平均分');
        // 3 Hour Stats
        case 'last3h_count':
            return renderStat(entry.stats.last3h.count, '3H 次數');
        case 'last3h_score':
            return renderStat(entry.stats.last3h.score, '3H 得分');
        case 'last3h_speed':
            return renderStat(entry.stats.last3h.speed, '3H 時速');
        case 'last3h_average':
            return renderStat(entry.stats.last3h.average, '3H 平均分');
        // 24 Hour Stats
        case 'last24h_count':
            return renderStat(entry.stats.last24h.count, '24H 次數');
        case 'last24h_score':
            return renderStat(entry.stats.last24h.score, '24H 得分');
        case 'last24h_speed':
            return renderStat(entry.stats.last24h.speed, '24H 時速');
        case 'last24h_average':
            return renderStat(entry.stats.last24h.average, '24H 平均分');
        // Default
        case 'score':
        default:
             return (
                 <div className="flex flex-col items-end">
                     <p className="text-base sm:text-lg font-bold text-cyan-600 dark:text-cyan-400">
                         {Math.round(entry.score).toLocaleString()}
                     </p>
                     <div className="flex items-center gap-1">
                         <p className="text-[10px] sm:text-xs text-slate-500">總分</p>
                         {giveUpLine !== null && (
                             <span 
                                className="text-[10px] sm:text-xs font-bold text-rose-500 dark:text-rose-400" 
                                title="死心線: 低於此分數在理論上已無法追上此排名 (假設每90秒獲取7萬分)"
                             >
                                 (死心: {giveUpLine.toLocaleString()})
                             </span>
                         )}
                     </div>
                 </div>
             );
    }
}

const RankingItem: React.FC<RankingItemProps> = ({ entry, sortOption, hideStats = false, aggregateAt }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const { rank, user, stats } = entry;
  const styles = getRankStyles(rank);

  // Function logic preserved but unused
  const handleFetchProfile = async () => {
    if (profileData || isLoadingProfile) return;
    
    setIsLoadingProfile(true);
    setProfileError(null);
    try {
      const response = await fetch(`https://api.hisekai.org/user/${user.id}/profile`);
      if (!response.ok) {
          throw new Error('Failed to fetch profile');
      }
      const textData = await response.text();
      // Robust regex to catch "id", "userId", "cardId" etc that have large integers
      const sanitizedData = textData.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');
      const data: UserProfileResponse = JSON.parse(sanitizedData);
      
      setProfileData(data);
    } catch (err) {
      console.error(err);
      setProfileError('載入失敗');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const renderStatDetail = (label: string, value: string | number) => (
    <div className="flex justify-between items-baseline text-sm py-1.5 border-b border-slate-200 dark:border-slate-700/50 last:border-b-0">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-semibold text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  );
  
  const DetailStatCard: React.FC<{ title: string, stat: typeof stats.last1h }> = ({ title, stat }) => (
    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-transparent">
      <h4 className="font-bold text-cyan-600 dark:text-cyan-400 mb-2 text-center text-sm sm:text-base">{title}</h4>
      <div className="space-y-1">
        {renderStatDetail('次數 (Plays)', stat.count.toLocaleString())}
        {renderStatDetail('得分 (Score)', stat.score.toLocaleString())}
        {renderStatDetail('時速 (Speed)', Math.round(stat.speed).toLocaleString())}
        {renderStatDetail('平均分 (Avg)', Math.round(stat.average).toLocaleString())}
      </div>
    </div>
  );

  return (
    <div
      className={`border rounded-lg transition-all duration-300 overflow-hidden ${styles.container}`}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center p-2 sm:p-3 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
        aria-expanded={isExpanded}
        aria-controls={`details-${user.id}`}
      >
        {/* Rank Section */}
        <div className="flex items-center w-12 sm:w-20 flex-shrink-0">
          <span className={`text-lg sm:text-2xl font-bold w-6 sm:w-10 text-center ${styles.rankText}`}>
            {rank}
          </span>
          <div className="w-4 h-4 sm:w-6 sm:h-6 ml-0.5 sm:ml-1 flex items-center justify-center">
              {styles.icon}
          </div>
        </div>

        {/* Name Section */}
        <div className="flex-grow overflow-hidden ml-2 mr-2 flex flex-col justify-center">
          <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate" title={user.display_name}>
            {user.display_name}
          </p>
          {/* User ID removed for privacy */}
        </div>

        {/* Stats Section */}
        <div className="text-right flex-shrink-0 w-auto min-w-[5rem] sm:min-w-[7rem] px-2">
          <StatDisplay entry={entry} sortOption={sortOption} hideStats={hideStats} aggregateAt={aggregateAt} />
        </div>

        {/* Expand Icon */}
        <div className="ml-2 sm:ml-4 flex-shrink-0">
          <svg
            className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <div id={`details-${user.id}`} className={`collapsible-content ${isExpanded ? 'open' : ''}`}>
        <div className="p-3 sm:p-4 pt-2 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-black/20">
          {!hideStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <DetailStatCard title="過去 1 小時" stat={stats.last1h} />
                <DetailStatCard title="過去 3 小時" stat={stats.last3h} />
                <DetailStatCard title="過去 24 小時" stat={stats.last24h} />
            </div>
          )}
          
          {/* Player Profile Details disabled and hidden */}
        </div>
      </div>
    </div>
  );
};

export default RankingItem;
