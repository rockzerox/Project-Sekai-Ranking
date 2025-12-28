

import React, { useState, useEffect, useMemo } from 'react';
import { EventSummary, HisekaiApiResponse, HisekaiBorderApiResponse } from '../types';
import { calculatePreciseDuration, API_BASE_URL } from '../constants';
import DashboardTable from './ui/DashboardTable';
import Select from './ui/Select';
import EventFilterGroup, { EventFilterState } from './ui/EventFilterGroup';
import { useConfig } from '../contexts/ConfigContext';
import { fetchJsonWithBigInt } from '../hooks/useRankings';

interface EventStat {
    eventId: number;
    eventName: string;
    duration: number; 
    isLive?: boolean;
    remainingDays?: number;
    top1: number;
    top10: number;
    top50: number;
    top100: number;
    borders: Record<number, number>;
}

const BORDER_OPTIONS = [200, 300, 400, 500, 1000, 2000, 5000, 10000];

const RankAnalysisView: React.FC = () => {
    const { eventDetails, getEventColor, isWorldLink } = useConfig();
    const [processedStats, setProcessedStats] = useState<EventStat[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [totalEvents, setTotalEvents] = useState(0);
    const [selectedBorderRank, setSelectedBorderRank] = useState<number>(1000);
    const [displayMode, setDisplayMode] = useState<'total' | 'daily'>('total');
    
    const [filters, setFilters] = useState<EventFilterState>({
        unit: 'all', banner: 'all', type: 'all', storyType: 'all', cardType: 'all', fourStar: 'all'
    });

    useEffect(() => {
        let alive = true;
        const runAnalysis = async () => {
            try {
                const listData: EventSummary[] = await fetchJsonWithBigInt(`${API_BASE_URL}/event/list`);
                if (!alive || !listData) return;
                const now = new Date();
                const closedEvents = listData.filter(e => new Date(e.closed_at) < now && !isWorldLink(e.id)).sort((a, b) => b.id - a.id);
                setTotalEvents(closedEvents.length + 1);

                try {
                    const [topData, borderData]: [HisekaiApiResponse, HisekaiBorderApiResponse] = await Promise.all([
                        fetchJsonWithBigInt(`${API_BASE_URL}/event/live/tw`),
                        fetchJsonWithBigInt(`${API_BASE_URL}/event/live/tw/border`)
                    ]);
                    if (topData && alive) {
                        const start = new Date(topData.start_at);
                        const agg = new Date(topData.aggregate_at);
                        const remainingMs = Math.max(0, agg.getTime() - now.getTime());
                        const isStillActive = remainingMs > 0;
                        const durationEnd = isStillActive ? now : agg;
                        const durationDays = Math.max(0.1, (durationEnd.getTime() - start.getTime()) / 86400000);
                        const top1 = topData.top_100_player_rankings?.find(r => r.rank === 1)?.score || 0;
                        const top10 = topData.top_100_player_rankings?.find(r => r.rank === 10)?.score || 0;
                        const top50 = topData.top_100_player_rankings?.find(r => r.rank === 50)?.score || 0;
                        const top100 = topData.top_100_player_rankings?.find(r => r.rank === 100)?.score || 0;
                        const borderScores: Record<number, number> = {};
                        borderData?.border_player_rankings?.forEach(item => { borderScores[item.rank] = item.score; });
                        const liveStat: EventStat = { eventId: topData.id, eventName: topData.name, duration: durationDays, remainingDays: remainingMs / 86400000, isLive: isStillActive, top1, top10, top50, top100, borders: borderScores };
                        setProcessedStats(prev => [liveStat, ...prev.filter(p => p.eventId !== liveStat.eventId)]);
                    }
                } catch (liveErr) { console.warn("RankAnalysis: Failed to fetch live event", liveErr); }

                const chunkSize = 5;
                for (let i = 0; i < closedEvents.length; i += chunkSize) {
                    if (!alive) return;
                    while (isPaused && alive) await new Promise(r => setTimeout(r, 500));
                    const chunk = closedEvents.slice(i, i + chunkSize);
                    const chunkResults = await Promise.all(chunk.map(async (event) => {
                        try {
                            const [dataTop, dataBorder] = await Promise.all([
                                fetchJsonWithBigInt(`${API_BASE_URL}/event/${event.id}/top100`),
                                fetchJsonWithBigInt(`${API_BASE_URL}/event/${event.id}/border`)
                            ]);
                            const top1 = dataTop?.rankings?.[0]?.score || 0;
                            const top10 = dataTop?.rankings?.[9]?.score || 0;
                            const top50 = dataTop?.rankings?.[49]?.score || 0;
                            const top100 = dataTop?.rankings?.[99]?.score || 0;
                            const borderScores: Record<number, number> = {};
                            dataBorder?.borderRankings?.forEach((item: any) => { borderScores[item.rank] = item.score; });
                            return { eventId: event.id, eventName: event.name, duration: calculatePreciseDuration(event.start_at, event.aggregate_at), top1, top10, top50, top100, borders: borderScores } as EventStat;
                        } catch (err) { return null; }
                    }));
                    if (!alive) return;
                    const validStats = chunkResults.filter((r): r is EventStat => r !== null);
                    setProcessedStats(prev => {
                        const existingIds = new Set(prev.map(p => p.eventId));
                        return [...prev, ...validStats.filter(s => !existingIds.has(s.eventId))];
                    });
                    setLoadingProgress(Math.round(((i + chunk.length) / closedEvents.length) * 100));
                }
                if (alive) setIsAnalyzing(false);
            } catch (e) { console.error("Analysis failed", e); if (alive) setIsAnalyzing(false); }
        };
        runAnalysis();
        return () => { alive = false; };
    }, [isPaused, isWorldLink]); 

    const { top1List, top10List, top100List, borderRankList } = useMemo(() => {
        const getMetric = (stat: EventStat, rawScore: number) => displayMode === 'total' ? rawScore : Math.ceil(rawScore / Math.max(0.1, stat.duration));
        let filteredStats = processedStats;
        if (filters.unit !== 'all') filteredStats = filteredStats.filter(stat => eventDetails[stat.eventId]?.unit === filters.unit);
        if (filters.type !== 'all') filteredStats = filteredStats.filter(stat => eventDetails[stat.eventId]?.type === filters.type);
        if (filters.banner !== 'all') filteredStats = filteredStats.filter(stat => eventDetails[stat.eventId]?.banner === filters.banner);
        if (filters.storyType !== 'all') filteredStats = filteredStats.filter(stat => eventDetails[stat.eventId]?.storyType === filters.storyType);
        if (filters.cardType !== 'all') filteredStats = filteredStats.filter(stat => eventDetails[stat.eventId]?.cardType === filters.cardType);
        if (filters.fourStar !== 'all') {
            filteredStats = filteredStats.filter(stat => {
                const cards = eventDetails[stat.eventId]?.["4starcard"]?.split(',') || [];
                return cards.some(cardId => cardId.split('-')[0] === filters.fourStar);
            });
        }
        const stableSort = (a: EventStat, b: EventStat, valA: number, valB: number) => valA !== valB ? valB - valA : b.eventId - a.eventId;
        const getTop10 = (key: keyof Pick<EventStat, 'top1' | 'top10' | 'top100'>) => [...filteredStats].sort((a, b) => stableSort(a, b, getMetric(a, a[key]), getMetric(b, b[key]))).slice(0, 10);
        const getTopBorder = (rank: number) => [...filteredStats].filter(stat => (stat.borders[rank] || 0) > 0).sort((a, b) => stableSort(a, b, getMetric(a, a.borders[rank] || 0), getMetric(b, b.borders[rank] || 0))).slice(0, 10);
        return { top1List: getTop10('top1'), top10List: getTop10('top10'), top100List: getTop10('top100'), borderRankList: getTopBorder(selectedBorderRank) };
    }, [processedStats, selectedBorderRank, displayMode, filters, eventDetails]);

    const getValue = (stat: EventStat, rawScore: number) => displayMode === 'total' ? rawScore : Math.ceil(rawScore / Math.max(0.1, stat.duration));
    const renderEventRow = (stat: EventStat, idx: number, score: number) => (
        <tr key={stat.eventId} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            <td className={`px-3 py-2 font-bold ${idx < 3 ? 'text-yellow-500 dark:text-yellow-400' : 'text-slate-400 dark:text-slate-500'}`}>{idx + 1}</td>
            <td className="px-3 py-2">
                <div className="flex items-center gap-2"><div className="font-medium truncate" style={{ color: getEventColor(stat.eventId) || undefined }}>{stat.eventName}</div>{stat.isLive && (<span className="bg-cyan-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">進行中</span>)}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5"><span>ID: {stat.eventId}</span><span className="w-0.5 h-0.5 bg-slate-400 rounded-full"></span>{stat.isLive ? (<span className="text-cyan-600 dark:text-cyan-400 font-bold">剩 {stat.remainingDays?.toFixed(2)} 天</span>) : (<span>{Math.round(stat.duration)} 天</span>)}</div>
            </td>
            <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-white">{score.toLocaleString()}</td>
        </tr>
    );

    return (
        <div className="w-full py-4 animate-fadeIn">
            <div className="mb-6"><div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4"><div><h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">活動榜線排名 (Rank Ranking)</h2><p className="text-slate-500 dark:text-slate-400">分析歷代及現時活動中各個排名的最高分紀錄</p></div>
            <div className="flex flex-wrap items-center gap-3"><EventFilterGroup filters={filters} onFilterChange={setFilters} mode="multi" containerClassName="flex flex-wrap gap-2 items-center" itemClassName="min-w-[120px]" />
            <div className="bg-white dark:bg-slate-800 p-1 rounded-lg flex border border-slate-300 dark:border-slate-700 shadow-sm"><button onClick={() => setDisplayMode('total')} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${displayMode === 'total' ? 'bg-cyan-500 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>總分</button><button onClick={() => setDisplayMode('daily')} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${displayMode === 'daily' ? 'bg-pink-500 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>日均</button></div></div></div>
            {isAnalyzing && (<div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 mb-6 relative overflow-hidden shadow-sm"><div className="flex justify-between items-center mb-2 relative z-10"><span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm animate-pulse">正在同步分析數據... ({loadingProgress}%)</span><span className="text-slate-500 dark:text-slate-400 text-xs">已處理: {processedStats.length} / {totalEvents}</span></div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden relative z-10"><div className="bg-cyan-500 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${loadingProgress}%` }}></div></div><button onClick={() => setIsPaused(!isPaused)} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white px-2 py-1 rounded border border-slate-300 dark:border-transparent">{isPaused ? "繼續" : "暫停"}</button></div>)}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                {/* Fix: Added explicit typing to s and idx to fix 'unknown' type inference in DashboardTable renderRow */}
                <DashboardTable title={`Top 1 ${displayMode === 'daily' ? '日均' : '最高分'}`} data={top1List} columns={[{ header: '#', className: 'w-10' }, { header: '活動 (Event)' }, { header: '分數 (Score)', className: 'text-right' }]} renderRow={(s: EventStat, idx: number) => renderEventRow(s, idx, getValue(s, s.top1))} color="bg-yellow-500" />
                <DashboardTable title={`Top 10 ${displayMode === 'daily' ? '日均' : '最高分'}`} data={top10List} columns={[{ header: '#', className: 'w-10' }, { header: '活動 (Event)' }, { header: '分數 (Score)', className: 'text-right' }]} renderRow={(s: EventStat, idx: number) => renderEventRow(s, idx, getValue(s, s.top10))} color="bg-purple-500" />
                <DashboardTable title={`Top 100 ${displayMode === 'daily' ? '日均' : '最高分'}`} data={top100List} columns={[{ header: '#', className: 'w-10' }, { header: '活動 (Event)' }, { header: '分數 (Score)', className: 'text-right' }]} renderRow={(s: EventStat, idx: number) => renderEventRow(s, idx, getValue(s, s.top100))} color="bg-cyan-500" />
                <DashboardTable title={`Top ${selectedBorderRank}`} headerAction={<Select value={selectedBorderRank} onChange={(val) => setSelectedBorderRank(Number(val))} onClick={(e) => e.stopPropagation()} className="text-xs py-1" options={BORDER_OPTIONS.map(rank => ({ value: rank, label: `T${rank}` }))} />} data={borderRankList} columns={[{ header: '#', className: 'w-10' }, { header: '活動 (Event)' }, { header: '分數 (Score)', className: 'text-right' }]} renderRow={(s: EventStat, idx: number) => renderEventRow(s, idx, getValue(s, s.borders[selectedBorderRank] || 0))} color="bg-teal-500" />
            </div>
        </div>
    );
};

export default RankAnalysisView;
