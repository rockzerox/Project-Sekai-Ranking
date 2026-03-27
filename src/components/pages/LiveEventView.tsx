import React, { useState, useEffect, useMemo } from 'react';
import { useRankings } from '../../hooks/useRankings';
import { useConfig } from '../../contexts/ConfigContext';
import { SortOption } from '../../types';
import { getAssetUrl } from '../../utils/gameUtils';
import { calculateCV } from '../../utils/mathUtils';
import { MS_PER_DAY, CHARACTERS } from '../../config/constants';
import { getWlChapterTimings, WlChapterTiming } from '../../utils/timeUtils';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import EventHeaderCountdown from '../ui/EventHeaderCountdown';
import CountdownTimer from '../ui/CountdownTimer';
import StatsDisplay from '../shared/StatsDisplay';
import CollapsibleSection from '../ui/CollapsibleSection';
import ChartAnalysis from '../charts/ChartAnalysis';
import Pagination from '../ui/Pagination';
import SortSelector from '../ui/SortSelector';
import RankingList from '../shared/RankingList';
import { useCardData } from '../../services/cardService';

const ITEMS_PER_PAGE = 20;
const NOW_REFRESH_MS = 2 * 60 * 1000; // 2-minute heartbeat (frontend only)

const LiveEventView: React.FC = () => {
    const {
        rankings, setRankings, worldLinkChapters, isLoading, error, eventName, liveEventId, liveEventTiming, lastUpdated,
        cachedLiveRankings, fetchRankings
    } = useRankings();

    const { getEventColor, isWorldLink, getWlDetail } = useConfig();
    const { cards } = useCardData();

    const [activeChapter, setActiveChapter] = useState<string>('all');
    const [searchTerm] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('score');
    const [isRankingsOpen, setIsRankingsOpen] = useState(true);
    const [isChartsOpen, setIsChartsOpen] = useState(true);
    const [currentPage, setCurrentPage] = useState<number | 'highlights'>(1);

    // ── Heartbeat: update `now` every 2 minutes (pure frontend, no API calls) ──
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), NOW_REFRESH_MS);
        return () => clearInterval(id);
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchRankings('live');
        setTimeout(() => setCurrentPage(1), 0);
    }, [fetchRankings]);

    // Handle World Link chapter changes or cache updates
    useEffect(() => {
        if (activeChapter === 'all') {
            if (cachedLiveRankings.length > 0) setRankings(cachedLiveRankings);
        } else {
            if (worldLinkChapters[activeChapter]) setRankings(worldLinkChapters[activeChapter]);
            else setRankings([]);
        }
    }, [activeChapter, worldLinkChapters, cachedLiveRankings, setRankings]);

    // Reset page on sort change
    useEffect(() => {
        setTimeout(() => setCurrentPage(prev => prev === 'highlights' ? prev : 1), 0);
    }, [searchTerm, sortOption]);

    // ── World Link setup ──────────────────────────────────────────────────────
    const isWl = !!(liveEventId && isWorldLink(liveEventId));

    const chapterTimings: WlChapterTiming[] = useMemo(() => {
        if (!isWl || !liveEventId || !liveEventTiming) return [];
        const wlInfo = getWlDetail(liveEventId);
        if (!wlInfo) return [];
        return getWlChapterTimings(wlInfo, liveEventTiming.startAt, now);
    }, [isWl, liveEventId, liveEventTiming, getWlDetail, now]);

    const activeChapterTiming: WlChapterTiming | null = useMemo(() =>
        chapterTimings.find(c => c.charId === activeChapter) ?? null,
    [chapterTimings, activeChapter]);

    // ── Duration for daily-avg & chart calculations ───────────────────────────
    const currentEventDuration = useMemo(() => {
        if (isWl && activeChapter !== 'all' && activeChapterTiming) {
            const s = new Date(activeChapterTiming.startAt).getTime();
            const e = new Date(activeChapterTiming.aggregateAt).getTime();
            return Math.max(0.01, (Math.min(now, e) - s) / MS_PER_DAY);
        }
        if (liveEventTiming) {
            const start = new Date(liveEventTiming.startAt).getTime();
            const agg   = new Date(liveEventTiming.aggregateAt).getTime();
            return Math.max(0.01, (Math.min(now, agg) - start) / MS_PER_DAY);
        }
        return 1;
    }, [isWl, activeChapter, activeChapterTiming, liveEventTiming, now]);

    // ── Countdown target ──────────────────────────────────────────────────────
    const countdownTarget = useMemo(() => {
        if (isWl && activeChapter !== 'all' && activeChapterTiming) {
            // Only show countdown while chapter is actively running
            if (activeChapterTiming.status === 'active') return activeChapterTiming.aggregateAt;
            return null;
        }
        return liveEventTiming?.aggregateAt ?? null;
    }, [isWl, activeChapter, activeChapterTiming, liveEventTiming]);

    // ── Page change — does NOT reset activeChapter ────────────────────────────
    const handlePageChange = (page: number | 'highlights') => {
        setCurrentPage(page);
        if (page !== 'highlights' && cachedLiveRankings.length > 0 && activeChapter === 'all') {
            setRankings(cachedLiveRankings);
        }
    };

    // ── Sorting & filtering ───────────────────────────────────────────────────
    const sortedAndFilteredRankings = useMemo(() => {
        const filtered = rankings.filter(entry => entry.user.display_name.toLowerCase().includes(searchTerm.toLowerCase()));
        const viewList = currentPage === 'highlights'
            ? filtered.filter(entry => entry.rank >= 100)
            : filtered;

        const sorted = [...viewList].sort((a, b) => {
            if (sortOption === 'score') return b.score - a.score;
            if (sortOption === 'dailyAvg') {
                return (b.score / currentEventDuration) - (a.score / currentEventDuration);
            }
            if (sortOption === 'lastPlayedAt') {
                if (!a.lastPlayedAt) return 1; if (!b.lastPlayedAt) return -1;
                return new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime();
            }
            const [period, metric] = sortOption.split('_') as [string, string];
            if (a.stats[period as keyof typeof a.stats] && b.stats[period as keyof typeof b.stats]) {
                return (b.stats[period as keyof typeof b.stats][metric as 'count' | 'score' | 'speed' | 'average'] || 0) -
                       (a.stats[period as keyof typeof a.stats][metric as 'count' | 'score' | 'speed' | 'average'] || 0);
            }
            return 0;
        });
        if (currentPage === 'highlights') return sorted;
        return sorted.map((entry, index) => ({ ...entry, rank: index + 1 }));
    }, [searchTerm, rankings, sortOption, currentPage, currentEventDuration]);

    const paginatedRankings = useMemo(() => {
        if (currentPage === 'highlights') return sortedAndFilteredRankings;
        const pageNum = typeof currentPage === 'number' ? currentPage : 1;
        return sortedAndFilteredRankings.slice((pageNum - 1) * ITEMS_PER_PAGE, pageNum * ITEMS_PER_PAGE);
    }, [sortedAndFilteredRankings, currentPage]);

    // ── Full-event calculating (all chapters ended) ───────────────────────────
    const isCalculating = useMemo(() => {
        if (!liveEventTiming) return false;
        const n = new Date();
        return n >= new Date(liveEventTiming.aggregateAt) && n < new Date(liveEventTiming.rankingAnnounceAt);
    }, [liveEventTiming]);

    // ── Chapter-level calculating guard ──────────────────────────────────────
    const isChapterCalculating = isWl && activeChapter !== 'all' && activeChapterTiming?.status === 'calculating';

    // ── Competitive stats ─────────────────────────────────────────────────────
    const competitiveStats = useMemo(() => {
        const isHighlights = currentPage === 'highlights';
        const getS = (rank: number) => rankings.find(r => r.rank === rank)?.score || 0;

        if (!isHighlights) {
            if (rankings.length < 100) return null;
            const s1 = getS(1); const s10 = getS(10); const s50 = getS(50); const s100 = getS(100);
            const range50_100 = rankings.filter(r => r.rank >= 50 && r.rank <= 100).map(r => r.score);
            return {
                type: 'top100' as const,
                stats: [
                    { label: 'T1/T10',   diff: s1  - s10,  ratio: s10  > 0 ? (s1  / s10 ).toFixed(1) : '0', color: 'text-yellow-500' },
                    { label: 'T10/T50',  diff: s10 - s50,  ratio: s50  > 0 ? (s10 / s50 ).toFixed(1) : '0', color: 'text-purple-400' },
                    { label: 'T50/T100', diff: s50 - s100, ratio: s100 > 0 ? (s50 / s100).toFixed(1) : '0', color: 'text-cyan-400' },
                    { label: 'T50-100 CV', cv: calculateCV(range50_100), color: 'text-emerald-400' }
                ]
            };
        } else {
            const s100 = getS(100); const s200 = getS(200); const s300 = getS(300);
            const s400 = getS(400); const s500 = getS(500); const s1000 = getS(1000);
            const calcStat = (label: string, high: number, low: number, color: string) => ({
                label, diff: high - low,
                ratio: low > 0 ? (high / low).toFixed(1) : '—',
                color: (high > 0 && low > 0) ? color : 'text-slate-600'
            });
            return {
                type: 'highlights' as const,
                stats: [
                    calcStat('T100/T200', s100, s200, 'text-yellow-500'),
                    calcStat('T200/T300', s200, s300, 'text-purple-400'),
                    calcStat('T300/T400', s300, s400, 'text-cyan-400'),
                    calcStat('T400/T500', s400, s500, 'text-emerald-400'),
                    calcStat('T500/T1000', s500, s1000, 'text-pink-400')
                ]
            };
        }
    }, [currentPage, rankings]);

    // ── Full-event calculating screen ─────────────────────────────────────────
    if (isCalculating && liveEventTiming) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-fadeIn text-center">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-8 rounded-2xl border border-amber-200 dark:border-amber-700 shadow-lg max-w-lg w-full mx-4">
                    <div className="mb-6 flex justify-center">
                        <div className="p-4 bg-amber-500/20 rounded-full">
                            <svg className="w-16 h-16 text-amber-500 dark:text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">活動結算中請稍後...</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">正在統計最終排名數據，請耐心等待結果公佈。</p>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">距離結果公佈 (Results in)</p>
                        <CountdownTimer targetDate={liveEventTiming.rankingAnnounceAt} />
                    </div>
                </div>
            </div>
        );
    }

    const isHighlights = currentPage === 'highlights';
    const shouldHideStats = isHighlights;

    // ── World Link Tabs ───────────────────────────────────────────────────────
    let WorldLinkTabs: React.ReactNode = null;

    if (isWl && liveEventId) {
        WorldLinkTabs = (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {/* 總榜 tab */}
                <button
                    onClick={(e) => { e.stopPropagation(); setActiveChapter('all'); }}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all whitespace-nowrap border ${
                        activeChapter === 'all'
                            ? 'bg-slate-700 text-white border-transparent shadow-md'
                            : 'bg-transparent text-slate-50 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                    總榜 (Total)
                </button>

                {chapterTimings.map((ct) => {
                    const isActive    = activeChapter === ct.charId;
                    const char        = CHARACTERS[ct.charId];
                    const isDisabled  = ct.status === 'not_started' || ct.status === 'warming';
                    const canClick    = !isDisabled;

                    let tooltip = '';
                    if (ct.status === 'not_started') {
                        tooltip = `${new Date(ct.startAt).toLocaleString('zh-TW', {
                            month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })} 開始`;
                    } else if (ct.status === 'warming') {
                        tooltip = '資料尚未就緒，請稍後';
                    }

                    return (
                        <div key={ct.charId} className="relative group/tab">
                            <button
                                disabled={!canClick}
                                onClick={(e) => { e.stopPropagation(); if (canClick) setActiveChapter(ct.charId); }}
                                className={`flex items-center gap-1.5 px-2 py-1 text-xs font-bold rounded-full transition-all whitespace-nowrap border ${
                                    isDisabled
                                        ? 'opacity-30 grayscale cursor-not-allowed bg-transparent text-slate-400 border-slate-600'
                                        : isActive
                                            ? 'text-white border-transparent shadow-md'
                                            : 'bg-transparent text-slate-50 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:opacity-80'
                                }`}
                                style={{ backgroundColor: (isActive && canClick) ? char?.color : 'transparent' }}
                            >
                                {getAssetUrl(ct.charId, 'character') && (
                                    <img
                                        src={getAssetUrl(ct.charId, 'character')}
                                        alt=""
                                        className="w-4 h-4 rounded-full border border-white/30"
                                    />
                                )}
                                <span className="hidden sm:inline">{char?.name || ct.charId}</span>
                            </button>

                            {tooltip && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
                                    bg-slate-900/95 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap
                                    pointer-events-none opacity-0 group-hover/tab:opacity-100 transition-opacity z-50">
                                    {tooltip}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    // ── Rankings title (includes WL tabs) ────────────────────────────────────
    let rankingsTitle: React.ReactNode = '前百排行榜 (Top 100 Rankings)';
    if (isWl) {
        rankingsTitle = (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
                <div className="flex items-center gap-3">
                    <span className="font-black whitespace-nowrap">{isHighlights ? '精彩片段' : '前百排行榜'}</span>
                </div>
                {WorldLinkTabs}
            </div>
        );
    } else if (isHighlights) {
        rankingsTitle = '精彩片段 (Highlights)';
    }

    // ── aggregateAt for ChartAnalysis ─────────────────────────────────────────
    const chartAggregateAt = (isWl && activeChapter !== 'all' && activeChapterTiming)
        ? activeChapterTiming.aggregateAt
        : liveEventTiming?.aggregateAt;

    // ── Chapter-calculating replacement block ─────────────────────────────────
    const ChapterCalculatingBlock = isChapterCalculating && activeChapterTiming ? (
        <div className="space-y-4">
            {/* Tabs are kept visible so user can navigate away */}
            <div className="bg-white dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                {WorldLinkTabs}
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-amber-900/30 p-6 rounded-2xl border border-amber-700 max-w-sm w-full">
                    <svg className="w-12 h-12 text-amber-400 animate-pulse mx-auto mb-3"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-white font-bold mb-1">章節結算中</p>
                    <p className="text-slate-400 text-sm mb-4">正在統計此章節最終排名</p>
                    <CountdownTimer targetDate={activeChapterTiming.rankingAnnounceAt} />
                </div>
            </div>
        </div>
    ) : null;

    return (
        <div className="animate-fadeIn">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">現時活動 (Live Event)</h2>
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="grid gap-4 lg:gap-6 lg:gap-y-1 w-full items-center grid-cols-1 lg:grid-cols-[auto_minmax(200px,auto)_auto_1fr] [grid-template-areas:'title'_'image'_'countdown'_'update'_'stats'] lg:[grid-template-areas:'image_title_countdown_stats'_'image_update_countdown_stats']">
                        {/* Image */}
                        {liveEventId && (
                            <img
                                src={getAssetUrl(liveEventId.toString(), 'event') || ''}
                                alt="Event Banner"
                                className="[grid-area:image] w-full lg:w-auto lg:max-w-[170px] h-auto rounded-xl shadow-sm object-contain mx-auto lg:mx-0"
                                onError={(e) => e.currentTarget.style.display = 'none'}
                            />
                        )}

                        {/* Title */}
                        <h2
                            className="[grid-area:title] text-xl sm:text-2xl font-bold leading-tight break-words text-center lg:text-left self-end"
                            style={{ color: (liveEventId && getEventColor(liveEventId)) || '#06b6d4' }}
                        >
                            {eventName}
                        </h2>

                        {/* Update Time */}
                        <p className="[grid-area:update] text-slate-500 dark:text-slate-400 text-xs font-mono text-center lg:text-left self-start">
                            最後更新: {lastUpdated ? lastUpdated.toLocaleTimeString() : '更新中...'}
                        </p>

                        {/* Countdown — chapter-aware */}
                        {countdownTarget && (
                            <div className="[grid-area:countdown] w-full max-w-md mx-auto lg:mx-0 flex justify-center lg:justify-start lg:self-start lg:pt-1">
                                <EventHeaderCountdown targetDate={countdownTarget} />
                            </div>
                        )}

                        {/* Stats */}
                        <div className="[grid-area:stats] w-full lg:w-auto border-t lg:border-t-0 border-slate-100 dark:border-slate-700 pt-4 lg:pt-0 flex justify-center lg:justify-end">
                            <StatsDisplay stats={competitiveStats} />
                        </div>
                    </div>
                </div>
            </div>

            {isLoading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : (
                <>
                    {/* Chapter calculating replaces both chart and ranking sections */}
                    {ChapterCalculatingBlock ?? (
                        <>
                            <CollapsibleSection title="圖表分析 (Chart Analysis)" isOpen={isChartsOpen} onToggle={() => setIsChartsOpen(!isChartsOpen)}>
                                <ChartAnalysis
                                    rankings={sortedAndFilteredRankings}
                                    sortOption={sortOption}
                                    isHighlights={isHighlights}
                                    eventId={liveEventId || undefined}
                                    cards={cards || undefined}
                                    isLiveEvent={true}
                                    aggregateAt={chartAggregateAt}
                                />
                            </CollapsibleSection>
                            <CollapsibleSection title={rankingsTitle} isOpen={isRankingsOpen} onToggle={() => setIsRankingsOpen(!isRankingsOpen)}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <Pagination totalItems={100} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage} onPageChange={handlePageChange} activeSort={sortOption} />
                                    <SortSelector activeSort={sortOption} onSortChange={setSortOption} limitToScore={shouldHideStats} />
                                </div>
                                <RankingList
                                    rankings={paginatedRankings}
                                    sortOption={sortOption}
                                    hideStats={shouldHideStats}
                                    aggregateAt={liveEventTiming?.aggregateAt}
                                    eventDuration={currentEventDuration}
                                    cardsMap={cards || undefined}
                                    isLiveEvent={true}
                                    now={now}
                                />
                            </CollapsibleSection>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default LiveEventView;
