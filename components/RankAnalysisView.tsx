
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { EventSummary, PastEventApiResponse, PastEventBorderApiResponse } from '../types';
import CrownIcon from './icons/CrownIcon';
import { EVENT_DETAILS, WORLD_LINK_IDS, getEventColor, UNIT_ORDER, BANNER_ORDER } from '../constants';

interface EventStat {
    eventId: number;
    eventName: string;
    duration: number;
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
                                <div 
                                    className="font-medium truncate" 
                                    title={stat.eventName}
                                    style={{ color: getEventColor(stat.eventId) || undefined }}
                                >
                                    {stat.eventName}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                    <span>ID: {stat.eventId}</span>
                                    <span className="w-0.5 h-0.5 bg-slate-400 rounded-full"></span>
                                    <span>{stat.duration} 天</span>
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

const RankAnalysisView: React.FC = () => {
    const [eventsToProcess, setEventsToProcess] = useState<EventSummary[]>([]);
    const [processedStats, setProcessedStats] = useState<EventStat[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [totalEvents, setTotalEvents] = useState(0);
    const [selectedBorderRank, setSelectedBorderRank] = useState<number>(1000);
    const [displayMode, setDisplayMode] = useState<'total' | 'daily'>('total');
    
    const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
    const [selectedBannerFilter, setSelectedBannerFilter] = useState<string>('all');

    const abortControllerRef = useRef<AbortController | null>(null);

    const calculateEventDays = (startAt: string, closedAt: string): number => {
        const start = new Date(startAt);
        const end = new Date(closedAt);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays - 1);
    };

    useEffect(() => {
        const fetchList = async () => {
            try {
                const response = await fetch('https://api.hisekai.org/event/list');
                const data: EventSummary[] = await response.json();
                const now = new Date();
                
                const closedEvents = data.filter(e => new Date(e.closed_at) < now).sort((a, b) => b.id - a.id);
                const generalEvents = closedEvents.filter(e => !WORLD_LINK_IDS.includes(e.id));
                setEventsToProcess(generalEvents);
                setTotalEvents(generalEvents.length);

            } catch (e) {
                console.error("Failed to fetch event list", e);
                setIsAnalyzing(false);
            }
        };
        fetchList();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    useEffect(() => {
        if (eventsToProcess.length === 0 || !isAnalyzing || isPaused) return;

        const processBatch = async () => {
            const controller = new AbortController();
            abortControllerRef.current = controller;

            const BATCH_SIZE = 5;
            const currentBatch = eventsToProcess.slice(0, BATCH_SIZE);
            const remaining = eventsToProcess.slice(BATCH_SIZE);

            const fetchPromises = currentBatch.map(async (event) => {
                try {
                    const [resTop100, resBorder] = await Promise.all([
                        fetch(`https://api.hisekai.org/event/${event.id}/top100`, { signal: controller.signal }),
                        fetch(`https://api.hisekai.org/event/${event.id}/border`, { signal: controller.signal })
                    ]);

                    let top1 = 0, top10 = 0, top50 = 0, top100 = 0;
                    if (resTop100.ok) {
                        const text = await resTop100.text();
                        const sanitized = text.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');
                        const data: PastEventApiResponse = JSON.parse(sanitized);
                        top1 = data.rankings[0]?.score || 0;
                        top10 = data.rankings[9]?.score || 0;
                        top50 = data.rankings[49]?.score || 0;
                        top100 = data.rankings[99]?.score || 0;
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

                    const duration = calculateEventDays(event.start_at, event.closed_at);

                    return {
                        eventId: event.id,
                        eventName: event.name,
                        duration,
                        top1,
                        top10,
                        top50,
                        top100,
                        borders: borderScores
                    };
                } catch (err) {
                    if ((err as Error).name !== 'AbortError') {
                        console.warn(`Failed to fetch event ${event.id}`, err);
                    }
                    return null;
                }
            });

            const results = await Promise.all(fetchPromises);
            const validResults = results.filter((r): r is EventStat => r !== null);

            if (!controller.signal.aborted) {
                setProcessedStats(prev => [...prev, ...validResults]);
                setEventsToProcess(remaining);
                
                setLoadingProgress(prev => {
                    const processedCount = totalEvents - remaining.length;
                    return Math.round((processedCount / totalEvents) * 100);
                });

                if (remaining.length === 0) {
                    setIsAnalyzing(false);
                }
            }
        };

        processBatch();

    }, [eventsToProcess, isAnalyzing, isPaused, totalEvents]);

    const { top1List, top10List, top100List, borderRankList } = useMemo(() => {
        const getMetric = (stat: EventStat, rawScore: number) => {
            if (displayMode === 'total') return rawScore;
            const days = Math.max(1, stat.duration);
            return Math.ceil(rawScore / days);
        };

        let filteredStats = processedStats;

        if (selectedUnitFilter !== 'all') {
            filteredStats = filteredStats.filter(stat => EVENT_DETAILS[stat.eventId]?.unit === selectedUnitFilter);
        }

        if (selectedBannerFilter !== 'all') {
            filteredStats = filteredStats.filter(stat => EVENT_DETAILS[stat.eventId]?.banner === selectedBannerFilter);
        }

        const getTop10 = (key: keyof Pick<EventStat, 'top1' | 'top10' | 'top100'>) => {
            return [...filteredStats]
                .sort((a, b) => getMetric(b, b[key]) - getMetric(a, a[key]))
                .slice(0, 10);
        };

        const getTopBorder = (rank: number) => {
             return [...filteredStats]
                .filter(stat => (stat.borders[rank] || 0) > 0)
                .sort((a, b) => {
                    const valA = getMetric(a, a.borders[rank] || 0);
                    const valB = getMetric(b, b.borders[rank] || 0);
                    return valB - valA;
                })
                .slice(0, 10);
        };

        return {
            top1List: getTop10('top1'),
            top10List: getTop10('top10'),
            top100List: getTop10('top100'),
            borderRankList: getTopBorder(selectedBorderRank)
        };
    }, [processedStats, selectedBorderRank, displayMode, selectedUnitFilter, selectedBannerFilter]);

    const getValue = (stat: EventStat, rawScore: number) => {
        if (displayMode === 'total') return rawScore;
        const days = Math.max(1, stat.duration);
        return Math.ceil(rawScore / days);
    };

    return (
        <div className="w-full py-4 animate-fadeIn">
            <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">排名分數排行榜 (High Score Hall of Fame)</h2>
                        <p className="text-slate-500 dark:text-slate-400">分析過往活動中各個排名的最高分紀錄</p>
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
