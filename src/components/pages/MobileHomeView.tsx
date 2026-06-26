import React, { useState, useEffect, useMemo } from 'react';
import { useRankings } from '../../hooks/useRankings';
import { useConfig } from '../../contexts/ConfigContext';
import { getAssetUrl } from '../../utils/gameUtils';
import { getWlChapterTimings, WlChapterTiming } from '../../utils/timeUtils';
import { CHARACTERS, UNITS } from '../../config/constants';
import EventHeaderCountdown from '../ui/EventHeaderCountdown';
import CountdownTimer from '../ui/CountdownTimer';
import LoadingSpinner from '../ui/LoadingSpinner';
import WorldLinkTabs from '../shared/WorldLinkTabs';
import { useCardData } from '../../services/cardService';

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
        worldLinkChapters,
        worldLinkChapterTimings,
        isLoading,
        eventName,
        liveEventId,
        liveEventTiming,
        lastUpdated,
        fetchRankings,
    } = useRankings();

    const { getEventColor, isWorldLink, getWlDetail, getPrevRoundWlChapterScore } = useConfig();
    const { cards } = useCardData();

    const [activeChapter, setActiveChapter] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'thresholds' | 'leaders'>('thresholds');

    // 心跳計時：每 2 分鐘更新 now，供 WL 章節狀態計算使用
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 2 * 60 * 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        fetchRankings('live');
    }, [fetchRankings]);

    // 結算中偵測
    const isCalculating = useMemo(() => {
        if (!liveEventTiming) return false;
        const n = new Date();
        return n >= new Date(liveEventTiming.aggregateAt) && n < new Date(liveEventTiming.rankingAnnounceAt);
    }, [liveEventTiming]);

    // 活動是否進行中（倒數計時顯示條件）
    const isEventActive = useMemo(() => {
        if (!liveEventTiming) return false;
        return new Date() < new Date(liveEventTiming.aggregateAt);
    }, [liveEventTiming]);

    // ── World Link 設定 ──────────────────────────────────────────────────────
    const isWl = !!(liveEventId && isWorldLink(liveEventId));

    const chapterTimings: WlChapterTiming[] = useMemo(() => {
        if (!isWl || !liveEventId || !liveEventTiming) return [];
        let timings: WlChapterTiming[] = [];

        // 優先：API 回傳的真實章節時間戳
        if (Object.keys(worldLinkChapterTimings).length > 0) {
            timings = Object.entries(worldLinkChapterTimings).map(([charId, timing]) => {
                const start = new Date(timing.startAt).getTime();
                const end = new Date(timing.aggregateAt).getTime();
                const announce = end + 10 * 60 * 1000;
                let status: WlChapterTiming['status'];
                if (now < start) status = 'not_started';
                else if (now < start + 3 * 60 * 1000) status = 'warming';
                else if (now < end) status = 'active';
                else if (now < announce) status = 'calculating';
                else status = 'ended';
                return {
                    charId,
                    startAt: timing.startAt,
                    aggregateAt: timing.aggregateAt,
                    rankingAnnounceAt: new Date(announce).toISOString(),
                    status,
                    chapterOrder: timing.chapterOrder
                };
            });
        } else {
            // Fallback：WorldLinkDetail.json 靜態計算
            const wlInfo = getWlDetail(liveEventId);
            if (wlInfo) {
                timings = getWlChapterTimings(wlInfo, liveEventTiming.startAt, now);
            }
        }

        // Apply official chapter order
        if (timings.some(t => t.chapterOrder !== undefined)) {
            timings.sort((a, b) => (a.chapterOrder || 0) - (b.chapterOrder || 0));
        } else {
            const wlInfo = getWlDetail(liveEventId);
            if (wlInfo && wlInfo.chorder) {
                timings.sort((a, b) => {
                    const idxA = wlInfo.chorder.indexOf(a.charId);
                    const idxB = wlInfo.chorder.indexOf(b.charId);
                    if (idxA === -1 && idxB === -1) return 0;
                    if (idxA === -1) return 1;
                    if (idxB === -1) return -1;
                    return idxA - idxB;
                });
            }
        }
        return timings;
    }, [isWl, liveEventId, liveEventTiming, getWlDetail, now, worldLinkChapterTimings]);

    // 切換章節時重置
    const handleChapterChange = (charId: string) => {
        setActiveChapter(charId);
    };

    // 依據選定章節決定顯示哪組排名數據
    const displayRankings = useMemo(() => {
        if (!isWl || activeChapter === 'all') return rankings;
        return worldLinkChapters[activeChapter] || [];
    }, [isWl, activeChapter, rankings, worldLinkChapters]);

    const getEntry = (rank: number) => displayRankings.find(r => r.rank === rank);

    // 統計 Top 5 熱門隊長
    const top5Leaders = useMemo(() => {
        const top100 = displayRankings.filter(r => r.rank >= 1 && r.rank <= 100);
        const total = top100.length;
        if (total === 0) return [];

        const counts: Record<string, number> = {};
        let unknownCount = 0;

        top100.forEach(entry => {
            const cardId = entry.last_player_info?.card?.id;
            const card = (cardId && cards) ? cards[cardId.toString()] : null;
            if (card?.characterId) {
                const charId = String(card.characterId);
                counts[charId] = (counts[charId] || 0) + 1;
            } else {
                unknownCount++;
            }
        });

        const stats = Object.entries(counts).map(([charId, count]) => {
            const charInfo = CHARACTERS[charId];
            const unitId = charInfo?.unit;
            const unitColor = (unitId && UNITS[unitId]) ? UNITS[unitId].color : '#64748b';
            return {
                charId,
                name: charInfo ? charInfo.name : `未知 (${charId})`,
                color: charInfo ? charInfo.color : '#64748b',
                unitColor,
                count,
                percentage: total > 0 ? (count / total) * 100 : 0
            };
        }).sort((a, b) => b.count - a.count);

        if (unknownCount > 0) {
            stats.push({
                charId: 'unknown',
                name: '未知/未載入',
                color: '#475569',
                unitColor: '#475569',
                count: unknownCount,
                percentage: total > 0 ? (unknownCount / total) * 100 : 0
            });
        }

        return stats.slice(0, 5);
    }, [displayRankings, cards]);

    const bannerUrl = liveEventId ? getAssetUrl(liveEventId.toString(), 'event') : null;
    const eventColor = liveEventId ? getEventColor(liveEventId) : '#06b6d4';

    // 取得上一輪的 WL 數據 (如果有)
    const prevRoundScores = useMemo(() => {
        if (!isWl || !liveEventId || activeChapter === 'all') return null;
        return getPrevRoundWlChapterScore(liveEventId, activeChapter);
    }, [isWl, liveEventId, activeChapter, getPrevRoundWlChapterScore]);

    // 取得角色主題色
    const activeCharColor = useMemo(() => {
        if (activeChapter && activeChapter !== 'all') {
            return CHARACTERS[activeChapter]?.color || '#999999';
        }
        return undefined;
    }, [activeChapter]);

    // ── 結算中畫面 ──────────────────────────────────────────────────────────
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

            {/* 活動資訊卡 (Event Banner Card) */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {/* Banner 圖片 */}
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
                    {/* 活動名稱 */}
                    <h2
                        className="font-black text-base leading-snug line-clamp-2"
                        style={{ color: eventColor }}
                    >
                        {isLoading ? '載入中...' : (eventName || '暫無活動')}
                    </h2>

                    {/* 倒數計時 + 更新時間 — 同一行顯示 */}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        {liveEventTiming && isEventActive && (
                            <>
                                <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <EventHeaderCountdown
                                    targetDate={liveEventTiming.aggregateAt}
                                    className="text-xs px-2 py-0.5 rounded-lg border"
                                />
                            </>
                        )}
                        {lastUpdated && (
                            <p className="text-[10px] text-slate-400 font-mono">
                                更新: {lastUpdated.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* WL 章節切換 Tabs — 僅於 World Link 活動期間顯示 */}
            {isWl && chapterTimings.length > 0 && (
                <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm px-3 py-2.5">
                    <WorldLinkTabs
                        chapters={chapterTimings}
                        activeChapter={activeChapter}
                        onChapterChange={handleChapterChange}
                    />
                </div>
            )}

            {/* 榜線分數卡片 — 結算期間隱藏 */}
            {!isCalculating && (
                <div className="flex flex-col gap-2.5">
                    {/* 零滑動分頁切換 Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800 mb-2 gap-4 px-1">
                        <button
                            onClick={() => setActiveTab('thresholds')}
                            className={`pb-1.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                                activeTab === 'thresholds'
                                    ? 'border-cyan-500 text-slate-850 dark:text-white'
                                    : 'border-transparent text-slate-400 dark:text-slate-500'
                            }`}
                        >
                            {isWl && activeChapter !== 'all' ? '章節即時榜線' : '即時榜線分數'}
                        </button>
                        <button
                            onClick={() => setActiveTab('leaders')}
                            className={`pb-1.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                                activeTab === 'leaders'
                                    ? 'border-cyan-500 text-slate-850 dark:text-white'
                                    : 'border-transparent text-slate-400 dark:text-slate-500'
                            }`}
                        >
                            {isWl && activeChapter !== 'all' ? '章節熱門隊長' : '即時熱門隊長'}
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <LoadingSpinner />
                        </div>
                    ) : activeTab === 'thresholds' ? (
                        RANK_CARDS.map(({ rank, label, badgeClass, accentColor }) => {
                            const entry = getEntry(rank);
                            if (!entry) return null;
                            return (
                                <div
                                    key={rank}
                                    className="relative bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-[52px_1fr_auto] items-center px-4 py-3 gap-3 overflow-hidden animate-fadeIn"
                                >
                                    {/* 左側色條 */}
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-sm"
                                        style={{ backgroundColor: accentColor }}
                                    />

                                    {/* 名次徽章 */}
                                    <div className="flex justify-start">
                                        <span className={`w-[48px] text-center text-[11px] font-black px-1 py-0.5 rounded-full border ${badgeClass}`}>
                                            {label}
                                        </span>
                                    </div>

                                    {/* 分數 + 玩家名稱 */}
                                    <div className="min-w-0 flex flex-col justify-center">
                                        <p className="font-black text-xl font-mono text-slate-900 dark:text-white leading-none tracking-tight truncate">
                                            {entry.score.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                            {entry.user.display_name}
                                        </p>
                                    </div>
                                    
                                    {/* 上一輪 WL 數據 (靠右對齊) */}
                                    {prevRoundScores && activeCharColor && prevRoundScores[`top${rank}` as keyof typeof prevRoundScores] !== undefined && (
                                        <div className="flex flex-col items-end justify-center border-l border-slate-100 dark:border-slate-700 pl-3 w-[90px] flex-shrink-0">
                                            <span 
                                                className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-0.5"
                                                style={{ color: activeCharColor }}
                                            >
                                                上輪 {label}
                                            </span>
                                            <span 
                                                className="text-sm font-mono font-black"
                                                style={{ color: activeCharColor }}
                                            >
                                                {prevRoundScores[`top${rank}` as keyof typeof prevRoundScores] > 0 
                                                    ? prevRoundScores[`top${rank}` as keyof typeof prevRoundScores].toLocaleString() 
                                                    : '—'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        top5Leaders.map((item, idx) => {
                            const avatar = item.charId !== 'unknown' ? getAssetUrl(item.charId, 'character') : undefined;
                            const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
                            const badge = medals[idx];
                            return (
                                <div
                                    key={item.charId}
                                    className="relative bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-[36px_36px_1fr_auto] items-center px-4 py-2.5 gap-3 overflow-hidden animate-fadeIn"
                                >
                                    {/* 左側發光色條 - 套用團體色 (unitColor) */}
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-sm"
                                        style={{ backgroundColor: item.unitColor, boxShadow: `0 0 8px ${item.unitColor}` }}
                                    />
                                    
                                    {/* 名次徽章 */}
                                    <div className="text-sm font-black text-slate-400 text-center flex items-center justify-center">
                                        {badge}
                                    </div>
                                    
                                    {/* 頭像貼紙 - 外框套用角色色 (charColor) */}
                                    <div className="flex items-center justify-center">
                                        {avatar ? (
                                            <img
                                                src={avatar}
                                                alt={item.name}
                                                className="w-7 h-7 rounded-full object-cover border-2 bg-slate-800"
                                                style={{ borderColor: item.color, boxShadow: `0 0 5px ${item.color}50` }}
                                            />
                                        ) : (
                                            <div 
                                                className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold border-2 text-white"
                                                style={{ borderColor: item.color }}
                                            >
                                                ?
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* 角色名字 - 套用角色色 */}
                                    <div className="min-w-0 flex items-center">
                                        <span className="font-bold text-sm truncate" style={{ color: item.color }}>
                                            {item.name}
                                        </span>
                                    </div>
                                    
                                    {/* 人數統計 */}
                                    <div className="text-right pl-1">
                                        <span className="text-sm font-mono font-bold text-slate-750 dark:text-slate-200 block leading-tight">
                                            {item.count} 人
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400">
                                            {item.percentage.toFixed(0)}%
                                        </span>
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
