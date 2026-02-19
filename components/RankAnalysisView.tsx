
import React, { useState, useEffect, useMemo } from 'react';
import { EventSummary, HisekaiApiResponse, HisekaiBorderApiResponse } from '../types';
import { calculatePreciseDuration, API_BASE_URL, MS_PER_DAY } from '../constants';
import DashboardTable from './ui/DashboardTable';
import Select from './ui/Select';
import EventFilterGroup, { EventFilterState } from './ui/EventFilterGroup';
import { useConfig } from '../contexts/ConfigContext';
import { fetchJsonWithBigInt } from '../hooks/useRankings';
import { UI_TEXT } from '../constants/uiText';

interface EventStat {
    eventId: number;
    eventName: string;
    duration: number; 
    startYear: number; // New: 儲存活動年份
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
                        fetchJsonWithBigInt(`${API_BASE_URL}/event/live/top100`),
                        fetchJsonWithBigInt(`${API_BASE_URL}/event/live/border`)
                    ]);
                    if (topData && alive) {
                        const start = new Date(topData.start_at);
                        const agg = new Date(topData.aggregate_at);
                        const remainingMs = Math.max(0, agg.getTime() - now.getTime());
                        const isStillActive = remainingMs > 0;
                        const durationEnd = isStillActive ? now : agg;
                        const durationDays = Math.max(0.1, (durationEnd.getTime() - start.getTime()) / MS_PER_DAY);
                        const top1 = topData.top_100_player_rankings?.find(r => r.rank === 1)?.score || 0;
                        const top10 = topData.top_100_player_rankings?.find(r => r.rank === 10)?.score || 0;
                        const top50 = topData.top_100_player_rankings?.find(r => r.rank === 50)?.score || 0;
                        const top100 = topData.top_100_player_rankings?.find(r => r.rank === 100)?.score || 0;
                        const borderScores: Record<number, number> = {};
                        borderData?.border_player_rankings?.forEach(item => { borderScores[item.rank] = item.score; });
                        const liveStat: EventStat = { 
                            eventId: topData.id, 
                            eventName: topData.name, 
                            duration: durationDays, 
                            startYear: start.getFullYear(), // Get Year
                            remainingDays: remainingMs / MS_PER_DAY, 
                            isLive: isStillActive, 
                            top1, top10, top50, top100, 
                            borders: borderScores 
                        };
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
                            return { 
                                eventId: event.id, 
                                eventName: event.name, 
                                duration: calculatePreciseDuration(event.start_at, event.aggregate_at), 
                                startYear: new Date(event.start_at).getFullYear(), // Get Year
                                top1, top10, top50, top100, 
                                borders: borderScores 
                            } as EventStat;
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
        
        // Filter logic remains the same
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
        
        // Revised Sorting Logic:
        // 1. Separate Live Event (if exists and matches filters)
        // 2. Sort Historical Events
        // 3. Take Top 15 Historical
        // 4. Prepend Live Event
        
        const getRankedList = (getValueFn: (s: EventStat) => number) => {
            const liveEvent = filteredStats.find(s => s.isLive);
            const pastEvents = filteredStats.filter(s => !s.isLive);
            
            const sortedPast = pastEvents
                .filter(s => getValueFn(s) > 0)
                .sort((a, b) => stableSort(a, b, getMetric(a, getValueFn(a)), getMetric(b, getValueFn(b))))
                .slice(0, 15); // Expand to 15
            
            // If live event matches filter (it's in filteredStats), put it at the top
            return liveEvent ? [liveEvent, ...sortedPast] : sortedPast;
        };

        return { 
            top1List: getRankedList(s => s.top1),
            top10List: getRankedList(s => s.top10), 
            top100List: getRankedList(s => s.top100), 
            borderRankList: getRankedList(s => s.borders[selectedBorderRank] || 0)
        };
    }, [processedStats, selectedBorderRank, displayMode, filters, eventDetails]);

    const getValue = (stat: EventStat, rawScore: number) => displayMode === 'total' ? rawScore : Math.ceil(rawScore / Math.max(0.1, stat.duration));
    
    // Updated Render Row
    const renderEventRow = (stat: EventStat, idx: number, score: number, hasLiveInList: boolean) => {
        // Calculate Rank:
        // If the list has a live event at index 0:
        //   - idx 0 (Live) -> Show "NOW" or Icon
        //   - idx 1 (Past Rank 1) -> Show "1"
        // If the list does NOT have a live event:
        //   - idx 0 (Past Rank 1) -> Show "1"
        const isLiveRow = stat.isLive;
        const historicalRank = hasLiveInList ? idx : idx + 1;
        
        let rankDisplay: React.ReactNode = historicalRank;
        let rankClass = "text-slate-400 dark:text-slate-500";

        if (isLiveRow) {
            rankDisplay = <span className="flex items-center justify-center w-full"><span className="relative flex h-2.5 w-2.5 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span></span><span className="text-[10px] font-black tracking-wider">NOW</span></span>;
            rankClass = "text-cyan-600 dark:text-cyan-400";
        } else {
            if (historicalRank === 1) rankClass = "text-yellow-500 dark:text-yellow-400 text-lg";
            else if (historicalRank === 2) rankClass = "text-slate-500 dark:text-slate-300 text-lg"; // Silverish
            else if (historicalRank === 3) rankClass = "text-orange-600 dark:text-orange-400 text-lg"; // Bronze
        }

        return (
            <tr key={stat.eventId} className={`border-b border-slate-100 dark:border-slate-700/50 transition-colors ${isLiveRow ? 'bg-cyan-50/50 dark:bg-cyan-900/10 border-b-2 border-b-cyan-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
                <td className={`px-3 py-2 font-black text-center ${rankClass}`}>{rankDisplay}</td>
                <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                        <div className="font-medium truncate max-w-[140px] sm:max-w-[200px]" style={{ color: getEventColor(stat.eventId) || undefined }}>{stat.eventName}</div>
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                        <span className="font-mono font-bold text-slate-400">第 {stat.eventId} 期</span>
                        <span className="w-0.5 h-2.5 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                        {stat.isLive ? (
                            <span className="text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-100 dark:bg-cyan-900/30 px-1.5 py-0.5 rounded text-[10px]">剩 {stat.remainingDays?.toFixed(1)} 天</span>
                        ) : (
                            <span className="flex items-center gap-1">
                                {Math.round(stat.duration)} 天 
                                <span className="text-[10px] text-slate-400 font-bold">({stat.startYear})</span>
                            </span>
                        )}
                    </div>
                </td>
                <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-white font-bold">{score.toLocaleString()}</td>
            </tr>
        );
    };

    const modeLabel = displayMode === 'daily' ? UI_TEXT.rankAnalysis.modes.daily : UI_TEXT.rankAnalysis.modes.total;

    return (
        <div className="w-full py-4 animate-fadeIn">
            <div className="mb-6"><div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4"><div><h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{UI_TEXT.rankAnalysis.title}</h2><p className="text-slate-500 dark:text-slate-400">{UI_TEXT.rankAnalysis.description}</p></div>
            <div className="flex flex-wrap items-center gap-3"><EventFilterGroup filters={filters} onFilterChange={setFilters} mode="multi" containerClassName="flex flex-wrap gap-2 items-center" itemClassName="min-w-[120px]" />
            <div className="bg-white dark:bg-slate-800 p-1 rounded-lg flex border border-slate-300 dark:border-slate-700 shadow-sm"><button onClick={() => setDisplayMode('total')} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${displayMode === 'total' ? 'bg-cyan-500 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>{UI_TEXT.rankAnalysis.modes.total}</button><button onClick={() => setDisplayMode('daily')} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${displayMode === 'daily' ? 'bg-pink-500 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>{UI_TEXT.rankAnalysis.modes.daily}</button></div></div></div>
            {isAnalyzing && (<div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 mb-6 relative overflow-hidden shadow-sm"><div className="flex justify-between items-center mb-2 relative z-10"><span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm animate-pulse">正在同步分析數據... ({loadingProgress}%)</span><span className="text-slate-500 dark:text-slate-400 text-xs">已處理: {processedStats.length} / {totalEvents}</span></div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden relative z-10"><div className="bg-cyan-500 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${loadingProgress}%` }}></div></div><button onClick={() => setIsPaused(!isPaused)} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white px-2 py-1 rounded border border-slate-300 dark:border-transparent">{isPaused ? "繼續" : "暫停"}</button></div>)}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                <DashboardTable 
                    title={`Top 1 ${modeLabel}`} 
                    data={top1List} 
                    columns={[{ header: '#', className: 'w-14 text-center' }, { header: '活動 (Event)' }, { header: '分數 (Score)', className: 'text-right' }]} 
                    renderRow={(s: EventStat, idx: number) => renderEventRow(s, idx, getValue(s, s.top1), top1List[0]?.isLive ?? false)} 
                    color="bg-yellow-500" 
                />
                <DashboardTable 
                    title={`Top 10 ${modeLabel}`} 
                    data={top10List} 
                    columns={[{ header: '#', className: 'w-14 text-center' }, { header: '活動 (Event)' }, { header: '分數 (Score)', className: 'text-right' }]} 
                    renderRow={(s: EventStat, idx: number) => renderEventRow(s, idx, getValue(s, s.top10), top10List[0]?.isLive ?? false)} 
                    color="bg-purple-500" 
                />
                <DashboardTable 
                    title={`Top 100 ${modeLabel}`} 
                    data={top100List} 
                    columns={[{ header: '#', className: 'w-14 text-center' }, { header: '活動 (Event)' }, { header: '分數 (Score)', className: 'text-right' }]} 
                    renderRow={(s: EventStat, idx: number) => renderEventRow(s, idx, getValue(s, s.top100), top100List[0]?.isLive ?? false)} 
                    color="bg-cyan-500" 
                />
                <DashboardTable 
                    title={`Top ${selectedBorderRank}`} 
                    headerAction={<Select value={selectedBorderRank} onChange={(val) => setSelectedBorderRank(Number(val))} onClick={(e) => e.stopPropagation()} className="text-xs py-1" options={BORDER_OPTIONS.map(rank => ({ value: rank, label: `T${rank}` }))} />} 
                    data={borderRankList} 
                    columns={[{ header: '#', className: 'w-14 text-center' }, { header: '活動 (Event)' }, { header: '分數 (Score)', className: 'text-right' }]} 
                    renderRow={(s: EventStat, idx: number) => renderEventRow(s, idx, getValue(s, s.borders[selectedBorderRank] || 0), borderRankList[0]?.isLive ?? false)} 
                    color="bg-teal-500" 
                />
            </div>
        </div>
    );
};

export default RankAnalysisView;
