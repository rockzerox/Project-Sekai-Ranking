
import React, { useState } from 'react';
import { RankEntry, SortOption, UserProfileResponse } from '../types';
import CrownIcon from './icons/CrownIcon';
import TrophyIcon from './icons/TrophyIcon';

interface RankingItemProps {
  entry: RankEntry;
  sortOption: SortOption;
  hideStats?: boolean;
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

const StatDisplay: React.FC<{ entry: RankEntry, sortOption: SortOption }> = ({ entry, sortOption }) => {
    const renderStat = (value: number, label: string) => (
        <>
            <p className="text-base sm:text-lg font-bold text-cyan-600 dark:text-cyan-400">{Math.round(value).toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs text-slate-500">{label}</p>
        </>
    );

    switch(sortOption) {
        case 'lastPlayedAt':
            return <>
                <p className="text-sm sm:text-base font-bold text-cyan-600 dark:text-cyan-400">{formatLastPlayed(entry.lastPlayedAt)}</p>
                <p className="text-[10px] sm:text-xs text-slate-500">最後上線</p>
            </>;
        // 1 Hour Stats
        case 'last1h_count':
            return renderStat(entry.stats.last1h.count, '1H 次數');
        case 'last1h_speed':
            return renderStat(entry.stats.last1h.speed, '1H 時速');
        case 'last1h_average':
            return renderStat(entry.stats.last1h.average, '1H 平均分');
        // 3 Hour Stats
        case 'last3h_count':
            return renderStat(entry.stats.last3h.count, '3H 次數');
        case 'last3h_speed':
            return renderStat(entry.stats.last3h.speed, '3H 時速');
        case 'last3h_average':
            return renderStat(entry.stats.last3h.average, '3H 平均分');
        // 24 Hour Stats
        case 'last24h_count':
            return renderStat(entry.stats.last24h.count, '24H 次數');
        case 'last24h_speed':
            return renderStat(entry.stats.last24h.speed, '24H 時速');
        case 'last24h_average':
            return renderStat(entry.stats.last24h.average, '24H 平均分');
        // Default
        case 'score':
        default:
             return renderStat(entry.score, '總分');
    }
}

const RankingItem: React.FC<RankingItemProps> = ({ entry, sortOption, hideStats = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const { rank, user, stats } = entry;
  const styles = getRankStyles(rank);

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
        {renderStatDetail('時速 (Speed)', Math.round(stat.speed).toLocaleString())}
        {renderStatDetail('平均分 (Avg)', Math.round(stat.average).toLocaleString())}
      </div>
    </div>
  );

  return (
    <div
      className={`border rounded-lg transition-all duration-300 overflow-hidden ${styles.container}`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center p-2 sm:p-3 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
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
        <div className="flex-grow overflow-hidden ml-2 mr-2">
          <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate" title={user.display_name}>
            {user.display_name}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate" title={`@${user.username}`}>@{user.username}</p>
        </div>

        {/* Stats Section */}
        <div className="text-right flex-shrink-0 w-20 sm:w-28">
          <StatDisplay entry={entry} sortOption={sortOption} />
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
      </button>

      <div id={`details-${user.id}`} className={`collapsible-content ${isExpanded ? 'open' : ''}`}>
        <div className="p-3 sm:p-4 pt-2 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-black/20">
          {!hideStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <DetailStatCard title="過去 1 小時" stat={stats.last1h} />
                <DetailStatCard title="過去 3 小時" stat={stats.last3h} />
                <DetailStatCard title="過去 24 小時" stat={stats.last24h} />
            </div>
          )}

          {/* Player Profile Section */}
          <div className={`${hideStats ? '' : 'pt-3 border-t border-slate-200 dark:border-slate-700/50'}`}>
             <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
                <span className="text-slate-500 dark:text-slate-400">Player ID:</span>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleFetchProfile();
                    }}
                    className="font-mono text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 hover:underline decoration-dotted underline-offset-4 transition-colors break-all"
                    title="點擊查看詳細資料"
                    aria-label={`查看玩家 ${user.id} 的詳細資料`}
                >
                    {user.id}
                </button>
                {!profileData && !isLoadingProfile && (
                    <span className="text-xs text-slate-500 hidden sm:inline ml-1">
                        (點擊 ID 載入詳細資料)
                    </span>
                )}
                {isLoadingProfile && (
                    <span className="text-xs text-cyan-600 dark:text-cyan-500 ml-2 animate-pulse">載入中...</span>
                )}
                {profileError && (
                     <span className="text-xs text-red-500 dark:text-red-400 ml-2">{profileError}</span>
                )}
             </div>

             {/* Profile Data Display */}
             {profileData && (
                <div className="space-y-4 animate-fadeIn">
                     <div className="grid grid-cols-2 gap-3 bg-white dark:bg-slate-800/40 rounded-lg p-4 border border-slate-200 dark:border-slate-700/50 shadow-sm">
                         <div className="flex flex-col items-center sm:items-start">
                             <span className="text-xs text-slate-500 uppercase font-bold mb-1">等級 (Rank)</span>
                             <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">{profileData.user.rank}</span>
                         </div>
                         <div className="flex flex-col items-center sm:items-start">
                             <span className="text-xs text-slate-500 uppercase font-bold mb-1">綜合力 (Total Power)</span>
                             <span className="text-xl sm:text-2xl font-bold text-emerald-500 dark:text-emerald-400">
                                {profileData.totalPower.totalPower.toLocaleString()}
                             </span>
                         </div>
                     </div>
                     
                     {profileData.userMusicDifficultyClearCount && profileData.userMusicDifficultyClearCount.length > 0 && (
                       <div>
                         <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-wider">歌曲通關狀態 (Music Clear Status)</h4>
                         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                            {profileData.userMusicDifficultyClearCount.map((stat) => (
                              <div key={stat.musicDifficultyType} className="bg-white dark:bg-slate-800/60 rounded p-2 border border-slate-200 dark:border-slate-700/50 flex flex-col items-center shadow-sm">
                                  <div className={`font-bold uppercase text-xs mb-2 ${difficultyStyles[stat.musicDifficultyType] || 'text-slate-500 dark:text-slate-300'}`}>
                                    {stat.musicDifficultyType}
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 w-full text-center">
                                      <div className="flex flex-col">
                                          <span className="text-[10px] text-slate-500 leading-none mb-1">Clear</span>
                                          <span className="text-xs font-mono font-semibold text-slate-800 dark:text-white">{stat.liveClear}</span>
                                      </div>
                                      <div className="flex flex-col">
                                          <span className="text-[10px] text-slate-500 leading-none mb-1">FC</span>
                                          <span className="text-xs font-mono font-semibold text-pink-500 dark:text-pink-300">{stat.fullCombo}</span>
                                      </div>
                                      <div className="flex flex-col">
                                          <span className="text-[10px] text-slate-500 leading-none mb-1">AP</span>
                                          <span className="text-xs font-mono font-semibold text-yellow-600 dark:text-yellow-300">{stat.allPerfect}</span>
                                      </div>
                                  </div>
                              </div>
                            ))}
                         </div>
                       </div>
                     )}
                 </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingItem;
