import React, { useState, useEffect, useMemo } from 'react';
import { useRankings } from '../../hooks/useRankings';
import { useConfig } from '../../contexts/ConfigContext';
import { SortOption } from '../../types';
import { getAssetUrl } from '../../utils/gameUtils';
import { calculateCV } from '../../utils/mathUtils';
import { MS_PER_DAY, CHARACTERS } from '../../config/constants';
import { getWlChapterTimings, WlChapterTiming } from '../../utils/timeUtils';
import { useMobile } from '../../hooks/useMobile';
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
import WorldLinkTabs from '../shared/WorldLinkTabs';
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
    const isMobile = useMobile();

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
        return sorted;
    }, [searchTerm, rankings, sortOption, currentPage, currentEventDuration]);

    // Chart calculations always need the full dataset (not highlights-filtered)
    // Passing sortedAndFilteredRankings to ChartAnalysis strips rank 1-99 in Highlights
    // mode, breaking the 'secured' count and causing T100 inconsistency across views.
    const chartRankings = useMemo(() =>
        [...rankings].sort((a, b) => a.rank - b.rank),
        [rankings]
    );

    const paginatedRankings = useMemo(() => {
        if (currentPage === 'highlights') return sortedAndFilteredRankings;
        // 手機端不分頁，但限制前 100 筆，避免 border entries 混入
        if (isMobile) return sortedAndFilteredRankings.slice(0, 100);
        const pageNum = typeof currentPage === 'number' ? currentPage : 1;
        return sortedAndFilteredRankings.slice((pageNum - 1) * ITEMS_PER_PAGE, pageNum * ITEMS_PER_PAGE);
    }, [sortedAndFilteredRankings, currentPage, isMobile]);

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
    let worldLinkTabsNode: React.ReactNode = null;

    if (isWl && liveEventId) {
        worldLinkTabsNode = (
            <WorldLinkTabs
                chapters={chapterTimings}
                activeChapter={activeChapter}
                onChapterChange={setActiveChapter}
            />
        );
    }

    // 手機端：切換按鈕嵌入標題欄 - 文字為目的地名稱
    const highlightsToggleBtn = !isHighlights
        ? <button
            onClick={(e) => { e.stopPropagation(); handlePageChange('highlights'); }}
            className="sm:hidden px-2 py-0.5 text-[10px] font-bold rounded border border-pink-500/40 text-pink-400 hover:bg-pink-900/30 transition-colors whitespace-nowrap flex-shrink-0"
          >⚡ 精彩片段</button>
        : <button
            onClick={(e) => { e.stopPropagation(); handlePageChange(1); }}
            className="sm:hidden px-2 py-0.5 text-[10px] font-bold rounded border border-cyan-500/40 text-cyan-400 hover:bg-cyan-900/30 transition-colors whitespace-nowrap flex-shrink-0"
          >↩ 前百排行榜</button>;

    // ── Rankings title (includes WL tabs + mobile toggle) ────────────────────
    let rankingsTitle: React.ReactNode = (
        <span className="flex items-center gap-2 w-full">
            <span>{isHighlights ? '精彩片段 (Highlights)' : '前百排行榜 (Top 100 Rankings)'}</span>
            {highlightsToggleBtn}
        </span>
    );
    if (isWl) {
        rankingsTitle = (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
                <div className="flex items-center gap-2">
                    <span className="font-black whitespace-nowrap">{isHighlights ? '精彩片段' : '前百排行榜'}</span>
                    {highlightsToggleBtn}
                </div>
                {worldLinkTabsNode}
            </div>
        );
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
                {worldLinkTabsNode}
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
            <div className="mb-4">
                {/* ── 手機端緊湊 Header（< sm）：小圖 + 名稱第一行，倒數+更新時間第二行 ── */}
                <div className="sm:hidden bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="flex items-start gap-2.5 px-3 py-2.5">
                        {/* 小圖 */}
                        {liveEventId && (
                            <img
                                src={getAssetUrl(liveEventId.toString(), 'event') || ''}
                                alt="Event Banner"
                                className="h-10 w-auto rounded-lg object-contain flex-shrink-0 mt-0.5"
                                onError={(e) => e.currentTarget.style.display = 'none'}
                            />
                        )}
                        {/* 名稱與計時區塊 */}
                        <div className="flex-1 min-w-0">
                            {/* 第一行：活動名稱 */}
                            <h2
                                className="font-black text-sm leading-snug line-clamp-2 mb-1"
                                style={{ color: (liveEventId && getEventColor(liveEventId)) || '#06b6d4' }}
                            >
                                {eventName}
                            </h2>
                            {/* 第二行：倒數計時 + 更新時間（裸文字，相同行） */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {countdownTarget && (
                                    <EventHeaderCountdown
                                        targetDate={countdownTarget}
                                        bare
                                        className="text-[10px]"
                                    />
                                )}
                                {countdownTarget && lastUpdated && (
                                    <span className="text-slate-300 dark:text-slate-600 text-[10px]">·</span>
                                )}
                                <span className="text-[10px] text-slate-400 font-mono">
                                    更新 {lastUpdated ? lastUpdated.toLocaleTimeString() : '載入中...'}
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* 統計區塊 */}
                    {competitiveStats && (
                        <div className="border-t border-slate-100 dark:border-slate-700 px-3 py-2">
                            <StatsDisplay stats={competitiveStats} />
                        </div>
                    )}
                </div>

                {/* ── 桌面端 Header（≥ sm）：保持原有 CSS Grid 佈局 ── */}
                <div className="hidden sm:block">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">現時活動 (Live Event)</h2>
                    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="grid gap-4 lg:gap-6 lg:gap-y-1 w-full items-center grid-cols-1 lg:grid-cols-[auto_minmax(200px,auto)_auto_1fr] [grid-template-areas:'title'_'image'_'countdown'_'update'_'stats'] lg:[grid-template-areas:'image_title_countdown_stats'_'image_update_countdown_stats']">
                            {liveEventId && (
                                <img
                                    src={getAssetUrl(liveEventId.toString(), 'event') || ''}
                                    alt="Event Banner"
                                    className="[grid-area:image] w-full lg:w-auto lg:max-w-[170px] h-auto rounded-xl shadow-sm object-contain mx-auto lg:mx-0"
                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                />
                            )}
                            <h2
                                className="[grid-area:title] text-xl sm:text-2xl font-bold leading-tight break-words text-center lg:text-left self-end"
                                style={{ color: (liveEventId && getEventColor(liveEventId)) || '#06b6d4' }}
                            >
                                {eventName}
                            </h2>
                            <p className="[grid-area:update] text-slate-500 dark:text-slate-400 text-xs font-mono text-center lg:text-left self-start">
                                最後更新: {lastUpdated ? lastUpdated.toLocaleTimeString() : '更新中...'}
                            </p>
                            {countdownTarget && (
                                <div className="[grid-area:countdown] w-full max-w-md mx-auto lg:mx-0 flex justify-center lg:justify-start lg:self-start lg:pt-1">
                                    <EventHeaderCountdown targetDate={countdownTarget} />
                                </div>
                            )}
                            <div className="[grid-area:stats] w-full lg:w-auto border-t lg:border-t-0 border-slate-100 dark:border-slate-700 pt-4 lg:pt-0 flex justify-center lg:justify-end">
                                <StatsDisplay stats={competitiveStats} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isLoading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : (
                <>
                    {/* World Link Tabs */}
                    {isWl && chapterTimings.length > 0 && (
                        <div className="mb-6">
                            <WorldLinkTabs 
                                chapters={chapterTimings} 
                                activeChapter={activeChapter} 
                                onChapterChange={setActiveChapter} 
                            />
                        </div>
                    )}

                    {/* Chapter calculating replaces both chart and ranking sections */}
                    {ChapterCalculatingBlock ?? (
                        <>
                            <CollapsibleSection title="圖表分析 (Chart Analysis)" isOpen={isChartsOpen} onToggle={() => setIsChartsOpen(!isChartsOpen)}>
                                <ChartAnalysis
                                    rankings={chartRankings}
                                    sortOption={sortOption}
                                    isHighlights={isHighlights}
                                    eventId={liveEventId || undefined}
                                    cards={cards || undefined}
                                    isLiveEvent={true}
                                    aggregateAt={chartAggregateAt}
                                    activeChapterId={activeChapter}
                                />
                            </CollapsibleSection>
                            <CollapsibleSection title={rankingsTitle} isOpen={isRankingsOpen} onToggle={() => setIsRankingsOpen(!isRankingsOpen)}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    {/* 手機端已由 rankingsTitle 內的按鈕處理切換，桌面端保留 Pagination */}
                                    {!isMobile && <Pagination totalItems={100} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage} onPageChange={handlePageChange} activeSort={sortOption} />}
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
