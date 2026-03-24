import React, { useEffect, useMemo } from 'react';
import { useRankings } from '../../hooks/useRankings';
import { useConfig } from '../../contexts/ConfigContext';
import { getAssetUrl } from '../../utils/gameUtils';
import EventHeaderCountdown from '../ui/EventHeaderCountdown';
import CountdownTimer from '../ui/CountdownTimer';
import LoadingSpinner from '../ui/LoadingSpinner';

interface RankCardConfig {
    rank: number;
    label: string;
    badgeClass: string;
    accentColor: string;
}

const RANK_CARDS: RankCardConfig[] = [
    { rank: 1,    label: 'T1',    badgeClass: 'text-blue-500 bg-blue-500/10 border-blue-500/30', accentColor: '#4455DD' },
    { rank: 10,   label: 'T10',   badgeClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', accentColor: '#88DD44' },
    { rank: 100,  label: 'T100',  badgeClass: 'text-rose-500 bg-rose-500/10 border-rose-500/30', accentColor: '#EE1166' },
    { rank: 500,  label: 'T500',  badgeClass: 'text-orange-500 bg-orange-500/10 border-orange-500/30', accentColor: '#FF9900' },
    { rank: 1000, label: 'T1000', badgeClass: 'text-purple-500 bg-purple-500/10 border-purple-500/30', accentColor: '#884499' },
];

const MobileHomeView: React.FC = () => {
    const {
        rankings,
        isLoading,
        eventName,
        liveEventId,
        liveEventTiming,
        lastUpdated,
        fetchRankings,
    } = useRankings();

    const { getEventColor } = useConfig();

    useEffect(() => {
        fetchRankings('live');
    }, [fetchRankings]);

    // Detect "calculating" window: event ended but results not announced yet
    const isCalculating = useMemo(() => {
        if (!liveEventTiming) return false;
        const now = new Date();
        return now >= new Date(liveEventTiming.aggregateAt) && now < new Date(liveEventTiming.rankingAnnounceAt);
    }, [liveEventTiming]);

    // Countdown only visible while event is still ongoing
    const isEventActive = useMemo(() => {
        if (!liveEventTiming) return false;
        return new Date() < new Date(liveEventTiming.aggregateAt);
    }, [liveEventTiming]);

    const getEntry = (rank: number) => rankings.find(r => r.rank === rank);

    const bannerUrl = liveEventId ? getAssetUrl(liveEventId.toString(), 'event') : null;
    const eventColor = liveEventId ? getEventColor(liveEventId) : '#06b6d4';

    // --- Calculating state: mirror LiveEventView's waiting screen (compact mobile version) ---
    if (isCalculating && liveEventTiming) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 animate-fadeIn text-center">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-6 rounded-2xl border border-amber-200 dark:border-amber-700 shadow-lg w-full max-w-sm">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-amber-500/20 rounded-full">
                            <svg className="w-12 h-12 text-amber-500 dark:text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">活動結算中請稍後...</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">正在統計最終排名數據，請耐心等待結果公佈。</p>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">距離結果公佈</p>
                        <CountdownTimer targetDate={liveEventTiming.rankingAnnounceAt} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 px-4 py-4 pb-6 animate-fadeIn">

            {/* Event Banner card */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {/* Banner image */}
                {bannerUrl && (
                    <img
                        src={bannerUrl}
                        alt={eventName}
                        className="w-full object-cover"
                        style={{ maxHeight: '140px', objectPosition: 'center' }}
                        onError={e => e.currentTarget.style.display = 'none'}
                    />
                )}

                <div className="px-4 pt-3 pb-4 flex flex-col items-center gap-2 text-center">
                    {/* Event name */}
                    <h2
                        className="font-black text-base leading-snug line-clamp-2"
                        style={{ color: eventColor }}
                    >
                        {isLoading ? '載入中...' : (eventName || '暫無活動')}
                    </h2>

                    {/* Countdown — only show while event is still active */}
                    {liveEventTiming && isEventActive && (
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <EventHeaderCountdown
                                targetDate={liveEventTiming.aggregateAt}
                                className="text-xs px-2 py-0.5 rounded-lg border"
                            />
                        </div>
                    )}

                    {/* Last updated */}
                    {lastUpdated && (
                        <p className="text-[10px] text-slate-400 font-mono">
                            更新: {lastUpdated.toLocaleTimeString()}
                        </p>
                    )}
                </div>
            </div>

            {/* Score cards — hidden during calculating period */}
            {!isCalculating && (
                <div className="flex flex-col gap-2.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">
                        即時榜線分數
                    </p>

                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        RANK_CARDS.map(({ rank, label, badgeClass, accentColor }) => {
                            const entry = getEntry(rank);
                            if (!entry) return null; // hide cards with no data instead of showing "—"
                            return (
                                <div
                                    key={rank}
                                    className="relative bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center px-4 py-3 gap-4 overflow-hidden"
                                >
                                    {/* Left accent */}
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-sm"
                                        style={{ backgroundColor: accentColor }}
                                    />

                                    {/* Rank badge */}
                                    <span className={`flex-shrink-0 text-[11px] font-black px-2 py-0.5 rounded-full border ${badgeClass}`}>
                                        {label}
                                    </span>

                                    {/* Score + player */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-xl font-mono text-slate-900 dark:text-white leading-none tracking-tight">
                                            {entry.score.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                            {entry.user.display_name}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default MobileHomeView;
