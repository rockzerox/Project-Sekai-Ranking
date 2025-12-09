
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { EventSummary, PastEventApiResponse, PastEventBorderApiResponse, HisekaiApiResponse, HisekaiBorderApiResponse } from '../types';
import CrownIcon from './icons/CrownIcon';
import { EVENT_DETAILS, WORLD_LINK_IDS, getEventColor, UNIT_ORDER, BANNER_ORDER, calculatePreciseDuration } from '../constants';

interface EventStat {
    eventId: number;
    eventName: string;
    duration: number; // For past: total duration. For live: elapsed duration (for daily avg calc)
    isLive?: boolean;
    remainingDays?: number;
    top1: number;
    top10: number;
    top50: number;
    top100: number;
    borders: Record<number, number>;
}

const BORDER_OPTIONS = [200, 300, 400, 500, 1000, 2000, 5000, 10000];

interface RankTableProps {
    title: string;
    headerAction?: React.ReactNode;
    data: EventStat[];
    valueGetter: (stat: EventStat) => number;
    color: string;
}

const RankTable: React.FC<RankTableProps> = ({ title, headerAction, data, valueGetter, color }) => (
    <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-lg h-full flex flex-col transition-colors duration-300">
        <div className={`px-3 py-3 ${color} bg-opacity-10 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0 min-h-[56px]`}>
            <div className="flex items-center flex-1 min-w-0 mr-2">
                <h3 className={`font-bold ${color.replace('bg-', 'text-')} truncate mr-2`}>{title}</h3>
                {headerAction}
            </div>
            <CrownIcon className={`w-5 h-5 ${color.replace('bg-', 'text-')} flex-shrink-0`} />
        </div>
        <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 uppercase sticky top-0 z-10">
                    <tr>
                        <th className="px-3 py-2 w-10">#</th>
                        <th className="px-3 py-2">活動 (Event)</th>
                        <th className="px-3 py-2 text-right">分數 (Score)</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((stat, idx) => (
                        <tr key={stat.eventId} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className={`px-3 py-2 font-bold ${idx < 3 ? 'text-yellow-500 dark:text-yellow-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                {idx + 1}
                            </td>
                            <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <div 
                                        className="font-medium truncate" 
                                        title={stat.eventName}
                                        style={{ color: getEventColor(stat.eventId) || undefined }}
                                    >
                                        {stat.eventName}
                                    </div>
                                    {stat.isLive && (
                                        <span className="bg-cyan-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                                            進行中
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                    <span>ID: {stat.eventId}</span>
                                    <span className="w-0.5 h-0.5 bg-slate-400 rounded-full"></span>
                                    {stat.isLive ? (
                                        <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                                            剩 {stat.remainingDays?.toFixed(2)} 天
                                        </span>
                                    ) : (
                                        <span>{Math.round(stat.duration)} 天</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-white">
                                {valueGetter(stat).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={3} className="px-3 py-4 text-center text-slate-500">
                                暫無資料 (No Data)
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

// Helper for retry logic
const fetchWithRetry = async (url: string, retries = 3, delay = 1000): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url);
            if (res.ok) return res;
        } catch (err) {
            if (i === retries - 1) throw err;
        }
        await new Promise(r => setTimeout(r, delay));
    }
    throw new Error(`Failed to fetch ${url} after ${retries} retries`);
};

const RankAnalysisView: React.FC = () => {
    const [processedStats, setProcessedStats] = useState<EventStat[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [totalEvents, setTotalEvents] = useState(0);
    const [selectedBorderRank, setSelectedBorderRank] = useState<number>(1000);
    const [displayMode, setDisplayMode] = useState<'total' | 'daily'>('total');
    
    const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
    const [selectedBannerFilter, setSelectedBannerFilter] = useState<string>('all');
    const [selectedStoryFilter, setSelectedStoryFilter] = useState<'all' | 'unit_event' | 'mixed_event' | 'world_link'>('all');
    const [selectedCardFilter, setSelectedCardFilter] = useState<'all' | 'permanent' | 'limited' | 'special_limited'>('all');

    // Main Fetching Logic
    useEffect(() => {
        let alive = true;

        const runAnalysis = async () => {
            try {
                // 1. Fetch Event List
                const listRes = await fetchWithRetry('https://api.hisekai.org/event/list');
                const listData: EventSummary[] = await listRes.json();
                
                if (!alive) return;

                const now = new Date();
                const closedEvents = listData.filter(e => new Date(e.closed_at) < now && !WORLD_LINK_IDS.includes(e.id))
                                             .sort((a, b) => b.id - a.id); // Descending ID order
                
                setTotalEvents(closedEvents.length + 1); // +1 for live event

                // 2. Fetch Live Event Data
                try {
                    const [resTop, resBorder] = await Promise.all([
                        fetch('https://api.hisekai.org/event/live/top100'),
                        fetch('https://api.hisekai.org/event/live/border')
                    ]);

                    if (resTop.ok && alive) {
                        const textTop = await resTop.text();
                        const sanitizedTop = textTop.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');
                        const topData: HisekaiApiResponse = JSON.parse(sanitizedTop);

                        let borderData: HisekaiBorderApiResponse | null = null;
                        if (resBorder.ok) {
                            const textBorder = await resBorder.text();
                            const sanitizedBorder = textBorder.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');
                            borderData = JSON.parse(sanitizedBorder);
                        }

                        const start = new Date(topData.start_at);
                        const agg = new Date(topData.aggregate_at);
                        
                        // Check if event is still active (before aggregation)
                        const remainingMs = Math.max(0, agg.getTime() - now.getTime());
                        const isStillActive = remainingMs > 0;
                        
                        // Duration Logic:
                        // If active: duration = now - start (Elapsed)
                        // If ended: duration = agg - start (Total)
                        const durationEnd = isStillActive ? now : agg;
                        const durationMs = Math.max(0, durationEnd.getTime() - start.getTime());
                        const durationDays = durationMs / (1000 * 60 * 60 * 24);
                        
                        const remainingDays = remainingMs / (1000 * 60 * 60 * 24);

                        const top1 = topData.top_100_player_rankings.find(r => r.rank === 1)?.score || 0;
                        const top10 = topData.top_100_player_rankings.find(r => r.rank === 10)?.score || 0;
                        const top50 = topData.top_100_player_rankings.find(r => r.rank === 50)?.score || 0;
                        const top100 = topData.top_100_player_rankings.find(r => r.rank === 100)?.score || 0;

                        const borderScores: Record<number, number> = {};
                        if (borderData && borderData.border_player_rankings) {
                            borderData.border_player_rankings.forEach(item => {
                                borderScores[item.rank] = item.score;
                            });
                        }

                        const liveStat: EventStat = {
                            eventId: topData.id,
                            eventName: topData.name,
                            duration: durationDays,
                            remainingDays: remainingDays,
                            isLive: isStillActive, // Updated dynamic flag
                            top1,
                            top10,
                            top50,
                            top100,
                            borders: borderScores
                        };

                        setProcessedStats(prev => {
                            // Ensure no duplicates if re-run (though useEffect dependency should prevent)
                            const filtered = prev.filter(p => p.eventId !== liveStat.eventId);
                            return [...filtered, liveStat];
                        });
                    }
                } catch (liveErr) {
                    console.warn("Failed to fetch live event", liveErr);
                }

                // 3. Loop through Past Events in Chunks
                const chunkSize = 5;
                for (let i = 0; i < closedEvents.length; i += chunkSize) {
                    if (!alive) return;
                    
                    // Simple pause check (polling)
                    while (isPaused && alive) {
                        await new Promise(r => setTimeout(r, 500));
                    }

                    const chunk = closedEvents.slice(i, i + chunkSize);
                    
                    const chunkPromises = chunk.map(async (event) => {
                        try {
                            const [resTop100, resBorder] = await Promise.all([
                                fetchWithRetry(`https://api.hisekai.org/event/${event.id}/top100`),
                                fetchWithRetry(`https://api.hisekai.org/event/${event.id}/border`)
                            ]);

                            let top1 = 0, top10 = 0, top50 = 0, top100 = 0;
                            if (resTop100.ok) {
                                const text = await resTop100.text();
                                const sanitized = text.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');
                                const data: PastEventApiResponse = JSON.parse(sanitized);
                                top1 = data.rankings?.[0]?.score || 0;
                                top10 = data.rankings?.[9]?.score || 0;
                                top50 = data.rankings?.[49]?.score || 0;
                                top100 = data.rankings?.[99]?.score || 0;
                            }

                            const borderScores: Record<number, number> = {};
                            if (resBorder.ok) {
                                const text = await resBorder.text();
                                const sanitized = text.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');
                                const data: PastEventBorderApiResponse = JSON.parse(sanitized);
                                
                                if (data.borderRankings && Array.isArray(data.borderRankings)) {
                                    data.borderRankings.forEach(item => {
                                        borderScores[item.rank] = item.score;
                                    });
                                }
                            }

                            const duration = calculatePreciseDuration(event.start_at, event.aggregate_at);

                            return {
                                eventId: event.id,
                                eventName: event.name,
                                duration,
                                top1,
                                top10,
                                top50,
                                top100,
                                borders: borderScores
                            } as EventStat;
                        } catch (err) {
                            console.warn(`Failed to fetch event ${event.id}`, err);
                            return null;
                        }
                    });

                    const results = await Promise.all(chunkPromises);
                    
                    if (!alive) return;

                    const validStats = results.filter((r): r is EventStat => r !== null);
                    
                    setProcessedStats(prev => {
                        const existingIds = new Set(prev.map(p => p.eventId));
                        const uniqueNew = validStats.filter(s => !existingIds.has(s.eventId));
                        return [...prev, ...uniqueNew];
                    });

                    setLoadingProgress(Math.round(((i + chunk.length) / closedEvents.length) * 100));
                }

                if (alive) setIsAnalyzing(false);

            } catch (e) {
                console.error("Analysis failed", e);
                if (alive) setIsAnalyzing(false);
            }
        };

        runAnalysis();

        return () => { alive = false; };
    }, [isPaused]); // Depend on isPaused to allow resume logic if needed, but here implemented via polling loop inside effect

    const { top1List, top10List, top100List, borderRankList } = useMemo(() => {
        const getMetric = (stat: EventStat, rawScore: number) => {
            if (displayMode === 'total') return rawScore;
            const days = Math.max(0.1, stat.duration); 
            return Math.ceil(rawScore / days);
        };

        let filteredStats = processedStats;

        if (selectedUnitFilter !== 'all') {
            filteredStats = filteredStats.filter(stat => EVENT_DETAILS[stat.eventId]?.unit === selectedUnitFilter);
        }

        if (selectedBannerFilter !== 'all') {
            filteredStats = filteredStats.filter(stat => EVENT_DETAILS[stat.eventId]?.banner === selectedBannerFilter);
        }

        if (selectedStoryFilter !== 'all') {
            filteredStats = filteredStats.filter(stat => EVENT_DETAILS[stat.eventId]?.storyType === selectedStoryFilter);
        }

        if (selectedCardFilter !== 'all') {
            filteredStats = filteredStats.filter(stat => EVENT_DETAILS[stat.eventId]?.cardType === selectedCardFilter);
        }

        // Deterministic Sort: Score DESC, then Event ID DESC (Newer wins ties)
        const stableSort = (a: EventStat, b: EventStat, valA: number, valB: number) => {
            if (valA !== valB) return valB - valA; 
            return b.eventId - a.eventId; 
        };

        const getTop10 = (key: keyof Pick<EventStat, 'top1' | 'top10' | 'top100'>) => {
            return [...filteredStats]
                .sort((a, b) => stableSort(a, b, getMetric(a, a[key]), getMetric(b, b[key])))
                .slice(0, 10);
        };

        const getTopBorder = (rank: number) => {
             return [...filteredStats]
                .filter(stat => (stat.borders[rank] || 0) > 0)
                .sort((a, b) => stableSort(a, b, getMetric(a, a.borders[rank] || 0), getMetric(b, b.borders[rank] || 0)))
                .slice(0, 10);
        };

        return {
            top1List: getTop10('top1'),
            top10List: getTop10('top10'),
            top100List: getTop10('top100'),
            borderRankList: getTopBorder(selectedBorderRank)
        };
    }, [processedStats, selectedBorderRank, displayMode, selectedUnitFilter, selectedBannerFilter, selectedStoryFilter, selectedCardFilter]);

    const getValue = (stat: EventStat, rawScore: number) => {
        if (displayMode === 'total') return rawScore;
        const days = Math.max(0.1, stat.duration);
        return Math.ceil(rawScore / days);
    };

    return (
        <div className="w-full py-4 animate-fadeIn">
            <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">活動榜線排名 (Rank Ranking)</h2>
                        <p className="text-slate-500 dark:text-slate-400">分析歷代及現時活動中各個排名的最高分紀錄</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                         <select
                            value={selectedUnitFilter}
                            onChange={(e) => setSelectedUnitFilter(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2 outline-none min-w-[140px]"
                         >
                            <option value="all">所有團體 (All Units)</option>
                            {UNIT_ORDER.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                         </select>

                         <select
                            value={selectedBannerFilter}
                            onChange={(e) => setSelectedBannerFilter(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2 outline-none min-w-[140px]"
                         >
                            <option value="all">所有 Banner</option>
                            {BANNER_ORDER.map(banner => (
                                <option key={banner} value={banner}>{banner}</option>
                            ))}
                         </select>

                         <select
                            value={selectedStoryFilter}
                            onChange={(e) => setSelectedStoryFilter(e.target.value as any)}
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2 outline-none min-w-[120px]"
                         >
                            <option value="all">所有劇情 (All Stories)</option>
                            <option value="unit_event">箱活</option>
                            <option value="mixed_event">混活</option>
                            <option value="world_link">World Link</option>
                         </select>

                         <select
                            value={selectedCardFilter}
                            onChange={(e) => setSelectedCardFilter(e.target.value as any)}
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2 outline-none min-w-[120px]"
                         >
                            <option value="all">所有卡面 (All Cards)</option>
                            <option value="permanent">常駐</option>
                            <option value="limited">限定</option>
                            <option value="special_limited">特殊限定</option>
                         </select>

                        <div className="bg-white dark:bg-slate-800 p-1 rounded-lg flex border border-slate-300 dark:border-slate-700 shadow-sm">
                            <button
                                onClick={() => setDisplayMode('total')}
                                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${
                                    displayMode === 'total' 
                                    ? 'bg-cyan-500 text-white shadow' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                總分
                            </button>
                            <button
                                onClick={() => setDisplayMode('daily')}
                                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${
                                    displayMode === 'daily' 
                                    ? 'bg-pink-500 text-white shadow' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                日均
                            </button>
                        </div>
                    </div>
                </div>
                
                {isAnalyzing && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 mb-6 relative overflow-hidden shadow-sm">
                        <div className="flex justify-between items-center mb-2 relative z-10">
                            <span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm animate-pulse">
                                正在同步分析數據... ({loadingProgress}%)
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 text-xs">
                                已處理: {processedStats.length} / {totalEvents}
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden relative z-10">
                            <div 
                                className="bg-cyan-500 h-2 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${loadingProgress}%` }}
                            ></div>
                        </div>
                         <button 
                            onClick={() => setIsPaused(!isPaused)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white px-2 py-1 rounded border border-slate-300 dark:border-transparent"
                         >
                             {isPaused ? "繼續" : "暫停"}
                         </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                <RankTable 
                    title={`Top 1 ${displayMode === 'daily' ? '日均' : '最高分'}`}
                    data={top1List} 
                    valueGetter={(s) => getValue(s, s.top1)} 
                    color="bg-yellow-500" 
                />
                <RankTable 
                    title={`Top 10 ${displayMode === 'daily' ? '日均' : '最高分'}`}
                    data={top10List} 
                    valueGetter={(s) => getValue(s, s.top10)} 
                    color="bg-purple-500" 
                />
                <RankTable 
                    title={`Top 100 ${displayMode === 'daily' ? '日均' : '最高分'}`}
                    data={top100List} 
                    valueGetter={(s) => getValue(s, s.top100)} 
                    color="bg-cyan-500" 
                />
                <RankTable 
                    title={`Top ${selectedBorderRank}`}
                    headerAction={
                        <select 
                            value={selectedBorderRank} 
                            onChange={(e) => setSelectedBorderRank(Number(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold py-1 px-1 rounded border border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-teal-500 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            {BORDER_OPTIONS.map(rank => (
                                <option key={rank} value={rank}>T{rank}</option>
                            ))}
                        </select>
                    }
                    data={borderRankList} 
                    valueGetter={(s) => getValue(s, s.borders[selectedBorderRank] || 0)} 
                    color="bg-teal-500" 
                />
            </div>
        </div>
    );
};

export default RankAnalysisView;
