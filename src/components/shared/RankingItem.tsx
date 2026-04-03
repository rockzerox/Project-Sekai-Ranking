
import React, { useState } from 'react';
import { RankEntry, SortOption, CardsMap } from '../../types';
import { formatScoreToChinese } from '../../utils/mathUtils';
import { getAssetUrl } from '../../utils/gameUtils';

interface RankingItemProps {
  entry: RankEntry;
  sortOption: SortOption;
  hideStats?: boolean;
  aggregateAt?: string;
  eventDuration?: number;
  cardsMap?: CardsMap;
  isLiveEvent?: boolean;
  now?: number;
}

const getRankStyles = (rank: number) => {
  if (rank === 1) {
    return {
      container: 'border-yellow-400 dark:border-yellow-500/50 bg-yellow-50/80 dark:bg-yellow-500/10 hover:bg-yellow-100 dark:hover:bg-yellow-500/20',
      rankText: 'text-yellow-600 dark:text-yellow-400',
    };
  }
  if (rank === 2) {
    return {
      container: 'border-slate-300 dark:border-slate-400/50 bg-slate-100/80 dark:bg-slate-400/10 hover:bg-slate-200 dark:hover:bg-slate-400/20',
      rankText: 'text-slate-600 dark:text-slate-300',
    };
  }
  if (rank === 3) {
    return {
      container: 'border-amber-600 dark:border-amber-600/50 bg-amber-50/80 dark:bg-amber-600/10 hover:bg-amber-100 dark:hover:bg-amber-600/20',
      rankText: 'text-amber-700 dark:text-amber-500',
    };
  }
  return {
    container: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60',
    rankText: 'text-slate-500 dark:text-slate-400', 
  };
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

const StatDisplay: React.FC<{ entry: RankEntry, sortOption: SortOption, hideStats: boolean, aggregateAt?: string, eventDuration?: number, now?: number }> = ({ entry, sortOption, hideStats, aggregateAt, eventDuration = 1, now }) => {
    const renderStat = (value: number, label: string) => (
        <>
            <p className="text-base sm:text-lg font-bold text-cyan-600 dark:text-cyan-400">{Math.round(value).toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs text-slate-500">{label}</p>
        </>
    );

    let giveUpLine: number | null = null;
    let safeLine: number | null = null;

    // 只有在排序為「總分」且有結算時間時才顯示安全線與死心線
    if (hideStats && aggregateAt && sortOption === 'score' && now) {
        const currentTime = now;
        const end = new Date(aggregateAt).getTime();
        const remainingSeconds = (end - currentTime) / 1000;
        
        if (remainingSeconds > 0) {
            const maxGain = (remainingSeconds / 100) * 68000;
            const thresholdGiveUp = entry.score - maxGain;
            const thresholdSafe = entry.score + maxGain;
            
            giveUpLine = Math.max(0, Math.floor(thresholdGiveUp));
            safeLine = Math.floor(thresholdSafe);
        }
    }

    switch(sortOption) {
        case 'lastPlayedAt':
            return <>
                <p className="text-sm sm:text-base font-bold text-cyan-600 dark:text-cyan-400">{formatLastPlayed(entry.lastPlayedAt)}</p>
                <p className="text-[10px] sm:text-xs text-slate-500">最後上線</p>
            </>;
        case 'dailyAvg': {
            const daily = Math.ceil(entry.score / eventDuration);
            return <>
                <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatScoreToChinese(daily)}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500">日均分</p>
            </>;
        }
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
                     {giveUpLine !== null && safeLine !== null ? (
                         <div className="flex items-center gap-2">
                             <div className="text-right">
                                 <p className="text-base font-bold text-cyan-600 dark:text-cyan-400 leading-none">
                                     {Math.round(entry.score).toLocaleString()}
                                 </p>
                                 <p className="text-[10px] text-slate-500">總分</p>
                             </div>
                             
                             <div className="flex flex-col gap-0.5 text-[9px] font-mono leading-tight bg-slate-100 dark:bg-slate-800 p-1 rounded border border-slate-200 dark:border-slate-700">
                                 <span className="text-emerald-600 dark:text-emerald-400 font-bold" title="安全線: 超過此分數理論上必定能守住名次">
                                     安: {safeLine.toLocaleString()}
                                 </span>
                                 <span className="text-rose-500 dark:text-rose-400 font-bold" title="死心線: 低於此分數理論上已無法追上此排名">
                                     死: {giveUpLine.toLocaleString()}
                                 </span>
                             </div>
                         </div>
                     ) : (
                         <>
                             <p className="text-base sm:text-lg font-bold text-cyan-600 dark:text-cyan-400">
                                 {Math.round(entry.score).toLocaleString()}
                             </p>
                             <p className="text-[10px] sm:text-xs text-slate-500">總分</p>
                         </>
                     )}
                 </div>
             );
    }
}

const DetailStatCard: React.FC<{ title: string, stat: { count: number, score: number, speed: number, average: number } }> = ({ title, stat }) => {
  const renderStatDetail = (label: string, value: string | number) => (
    <div className="flex justify-between items-baseline text-sm py-1.5 border-b border-slate-200 dark:border-slate-700/50 last:border-b-0">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-semibold text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  );

  return (
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
};

const RankingItem: React.FC<RankingItemProps> = ({ entry, sortOption, hideStats = false, aggregateAt, eventDuration, cardsMap, isLiveEvent, now }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { rank, user, stats } = entry;
  const styles = getRankStyles(rank);

  // If in highlights mode (hideStats is true), item is not clickable
  const isClickable = !hideStats;

  const handleToggle = () => {
      if (isClickable) setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          setIsExpanded(!isExpanded);
      }
  };

  // ── 玩家活躍狀態計算（僅限現時活動）──────────────────────────────────────
  const offlineMinutes = (isLiveEvent && entry.lastPlayedAt && now)
      ? (now - new Date(entry.lastPlayedAt).getTime()) / 60000
      : -1;
  const isOnline = offlineMinutes >= 0 && offlineMinutes <= 2;
  const showRestBar = isLiveEvent && !isOnline && offlineMinutes > 2;
  const fillPercent = showRestBar ? Math.min(100, (offlineMinutes / (24 * 60)) * 100) : 0;
  const offlineLabel = offlineMinutes > 24 * 60
      ? '24h+'
      : offlineMinutes >= 60
          ? `${Math.floor(offlineMinutes / 60)}h`
          : `${Math.floor(offlineMinutes)}m`;
  
  // Determine avatar URL
  // Logic: Try to get cardId from last_player_info. If available, look up in cardsMap to get characterId.
  let avatarUrl: string | undefined;
  if (cardsMap && entry.last_player_info?.card?.id) {
      const cardId = entry.last_player_info.card.id.toString();
      const cardData = cardsMap[cardId];
      if (cardData?.characterId) {
          // Use gameUtils to get asset URL. 
          // Assuming getAssetUrl handles the logic. 
          // Note: If special_training_status is 'done', we might want the 'after_training' image, 
          // but getAssetUrl usually just takes characterId for icon. 
          // If we want card icon, we might need a different function or parameter.
          // For now, sticking to existing logic which seems to use characterId.
          avatarUrl = getAssetUrl(cardData.characterId.toString(), 'character');
      }
  }

  return (
    <div
      className={`border rounded-lg transition-all duration-300 overflow-hidden ${styles.container}`}
    >
      <div
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : -1}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center p-1.5 sm:p-3 text-left transition-colors outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500/50 ${isClickable ? 'hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer' : ''}`}
        aria-expanded={isExpanded}
        aria-controls={`details-${user.id}`}
      >
        {/* Rank Section */}
        <div className="flex items-center justify-center w-8 sm:w-16 flex-shrink-0">
          <span className={`text-sm sm:text-xl font-bold ${styles.rankText}`}>
            {rank}
          </span>
        </div>

        {/* Avatar Section — relative 容器以容納綠點 */}
        <div className="relative flex-shrink-0 mx-1 sm:mx-3">
            {avatarUrl ? (
                <img 
                    src={avatarUrl} 
                    alt="Leader" 
                    className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border border-slate-200 dark:border-slate-600 object-cover bg-slate-100 dark:bg-slate-700"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                />
            ) : (
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <span className="text-[10px] text-slate-400">No Img</span>
                </div>
            )}
            {/* 🟢 Online Dot */}
            {isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-400 rounded-full border-[1.5px] border-white dark:border-slate-800 animate-pulse" />
            )}
        </div>

        {/* Name Section */}
        <div className="flex-grow overflow-hidden mr-2 flex flex-col justify-center">
            <p className="text-xs sm:text-lg font-semibold text-slate-900 dark:text-white truncate" title={user.display_name}>
              {user.display_name}
            </p>
            {/* 🌙 Rest Bar — 離線 > 2 分鐘且為現時活動時顯示 */}
            {showRestBar && (
                <div className="flex items-center gap-1 mt-0.5">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <div className="w-14 sm:w-20 h-1 sm:h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
                        <div
                            className="h-full rounded-full bg-cyan-500/70 transition-all"
                            style={{ width: `${fillPercent}%` }}
                        />
                    </div>
                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono leading-none">
                        {offlineLabel}
                    </span>
                </div>
            )}
        </div>

        {/* Stats Section */}
        <div className="text-right flex-shrink-0 w-auto min-w-[4rem] sm:min-w-[7rem] px-2">
          <StatDisplay entry={entry} sortOption={sortOption} hideStats={hideStats} aggregateAt={aggregateAt} eventDuration={eventDuration} now={now} />
        </div>

        {/* Expand Icon - 整個容器只在 clickable 時渲染，避免 highlights 模式右側死區 */}
        {isClickable && (
          <div className="ml-2 sm:ml-4 flex-shrink-0 w-5">
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
        )}
      </div>

      {isClickable && (
          <div id={`details-${user.id}`} className={`collapsible-content ${isExpanded ? 'open' : ''}`}>
            <div className="p-3 sm:p-4 pt-2 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-black/20">
              {!hideStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <DetailStatCard title="過去 1 小時" stat={stats.last1h} />
                    <DetailStatCard title="過去 3 小時" stat={stats.last3h} />
                    <DetailStatCard title="過去 24 小時" stat={stats.last24h} />
                </div>
              )}
            </div>
          </div>
      )}
    </div>
  );
};

export default React.memo(RankingItem);
