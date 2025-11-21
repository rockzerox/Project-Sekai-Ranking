
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { EventSummary, PastEventApiResponse } from '../types';
import CrownIcon from './icons/CrownIcon';

interface PlayerStat {
    userId: string;
    latestName: string;
    top100Count: number;
    rankSpecificCounts: Record<number, number>; // Key: rank 1-10, Value: count
}

interface RankingTableProps {
    title: string;
    headerAction?: React.ReactNode;
    data: PlayerStat[];
    valueGetter: (stat: PlayerStat) => number;
    color: string;
    rankLabel: string;
}

const RankingTable: React.FC<RankingTableProps> = ({ title, headerAction, data, valueGetter, color, rankLabel }) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden shadow-lg h-full flex flex-col">
        <div className={`px-3 py-3 ${color} bg-opacity-10 border-b border-slate-700 flex justify-between items-center flex-shrink-0 min-h-[56px]`}>
            <div className="flex items-center flex-1 min-w-0 mr-2">
                <h3 className={`font-bold ${color.replace('bg-', 'text-')} truncate mr-2`}>{title}</h3>
                {headerAction}
            </div>
            <CrownIcon className={`w-5 h-5 ${color.replace('bg-', 'text-')} flex-shrink-0`} />
        </div>
        <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 bg-slate-800 uppercase sticky top-0 z-10">
                    <tr>
                        <th className="px-3 py-2 w-10">#</th>
                        <th className="px-3 py-2">玩家 (Player)</th>
                        <th className="px-3 py-2 text-right">{rankLabel}</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((stat, idx) => (
                        <tr key={stat.userId} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                            <td className={`px-3 py-2 font-bold ${idx < 3 ? 'text-yellow-400' : 'text-slate-500'}`}>
                                {idx + 1}
                            </td>
                            <td className="px-3 py-2">
                                <div className="font-medium text-slate-200 truncate" title={stat.latestName}>
                                    {stat.latestName}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5 font-mono">
                                    ID: {stat.userId}
                                </div>
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-white">
                                {valueGetter(stat)} 次
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

const PlayerAnalysisView: React.FC = () => {
    const [eventsToProcess, setEventsToProcess] = useState<EventSummary[]>([]);
    const [playerStats, setPlayerStats] = useState<Record<string, PlayerStat>>({});
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [totalEvents, setTotalEvents] = useState(0);
    
    const [selectedSpecificRank, setSelectedSpecificRank] = useState<number>(1);

    const abortControllerRef = useRef<AbortController | null>(null);

    // 1. Fetch Event List
    useEffect(() => {
        const fetchList = async () => {
            try {
                const response = await fetch('https://api.hisekai.org/event/list');
                const data: EventSummary[] = await response.json();
                const now = new Date();
                // Only process closed events
                const pastEvents = data.filter(e => new Date(e.closed_at) < now).sort((a, b) => b.id - a.id);
                
                setEventsToProcess(pastEvents);
                setTotalEvents(pastEvents.length);
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

    // 2. Batch Processing
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
                    const resTop100 = await fetch(`https://api.hisekai.org/event/${event.id}/top100`, { signal: controller.signal });

                    if (resTop100.ok) {
                        const text = await resTop100.text();
                        const sanitized = text.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');
                        const data: PastEventApiResponse = JSON.parse(sanitized);
                        return data.rankings;
                    }
                    return [];
                } catch (err) {
                    if ((err as Error).name !== 'AbortError') {
                        console.warn(`Failed to fetch event ${event.id}`, err);
                    }
                    return [];
                }
            });

            const results = await Promise.all(fetchPromises);

            if (!controller.signal.aborted) {
                setPlayerStats(prevStats => {
                    const newStats = { ...prevStats };
                    
                    results.forEach(rankings => {
                        rankings.forEach(entry => {
                            const userId = String(entry.userId);
                            
                            if (!newStats[userId]) {
                                newStats[userId] = {
                                    userId,
                                    latestName: entry.name,
                                    top100Count: 0,
                                    rankSpecificCounts: {}
                                };
                            }
                            
                            // Update stats
                            newStats[userId].top100Count += 1;
                            // Keep latest name (simple overwrite strategy, effectively keeps name from random event if order isn't strict, but usually good enough)
                            // Better: if we process from new to old, the first time we see it is the latest. 
                            // The list is sorted ID desc, so first batch is newest. 
                            // So we should only set name if it's not set? Or just update it? 
                            // Actually, "latest" implies most recent event. Since we process new -> old, the first time we encounter a user is their latest appearance.
                            // However, we are iterating batches. 
                            // Let's assume the list is new -> old.
                            // We update name every time, so the *last* processed event (oldest) would overwrite.
                            // To keep NEWEST name, we should check if we already have the user.
                            // But users might change names.
                            // Let's just overwrite for now, precise name tracking is complex without event dates attached to player entry.
                            // Actually, since we process newest events first, we should only set name if it doesn't exist.
                            if (newStats[userId].top100Count === 1) {
                                newStats[userId].latestName = entry.name;
                            }

                            if (entry.rank <= 10) {
                                newStats[userId].rankSpecificCounts[entry.rank] = (newStats[userId].rankSpecificCounts[entry.rank] || 0) + 1;
                            }
                        });
                    });
                    return newStats;
                });

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

    // Memoized Sorted Lists
    const { topFrequent100, topFrequentSpecific } = useMemo(() => {
        const allStats = Object.values(playerStats) as PlayerStat[];

        const sortedByTop100 = [...allStats]
            .sort((a, b) => b.top100Count - a.top100Count)
            .slice(0, 10);

        const sortedBySpecificRank = [...allStats]
            .filter(s => (s.rankSpecificCounts[selectedSpecificRank] || 0) > 0)
            .sort((a, b) => (b.rankSpecificCounts[selectedSpecificRank] || 0) - (a.rankSpecificCounts[selectedSpecificRank] || 0))
            .slice(0, 10);

        return {
            topFrequent100: sortedByTop100,
            topFrequentSpecific: sortedBySpecificRank
        };
    }, [playerStats, selectedSpecificRank]);

    return (
        <div className="w-full py-4 animate-fadeIn">
             <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">活躍玩家分析 (Active Player Analysis)</h2>
                <p className="text-slate-400">分析歷代活動中，最常上榜的玩家</p>

                {isAnalyzing && (
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mt-4 mb-6 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-2 relative z-10">
                            <span className="text-cyan-400 font-bold text-sm animate-pulse">
                                正在同步分析過往數據... ({loadingProgress}%)
                            </span>
                            <span className="text-slate-400 text-xs">
                                已掃描玩家數: {Object.keys(playerStats).length}
                            </span>
                        </div>
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden relative z-10">
                            <div 
                                className="bg-cyan-500 h-2 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${loadingProgress}%` }}
                            ></div>
                        </div>
                         <button 
                            onClick={() => setIsPaused(!isPaused)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded"
                         >
                             {isPaused ? "繼續" : "暫停"}
                         </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Table 1: Most Frequent Top 100 */}
                <RankingTable 
                    title="前百常客 (Top 100 Frequency)"
                    rankLabel="上榜次數"
                    data={topFrequent100}
                    valueGetter={(stat) => stat.top100Count}
                    color="bg-cyan-500"
                />

                {/* Table 2: Specific Rank Frequency */}
                <RankingTable 
                    title={`Top ${selectedSpecificRank} 常客`}
                    rankLabel="獲得次數"
                    headerAction={
                         <select 
                            value={selectedSpecificRank} 
                            onChange={(e) => setSelectedSpecificRank(Number(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 text-white text-xs font-bold py-1 px-1 rounded border border-slate-600 focus:ring-1 focus:ring-pink-500 outline-none cursor-pointer hover:bg-slate-800 ml-2"
                        >
                            {Array.from({ length: 10 }, (_, i) => i + 1).map(rank => (
                                <option key={rank} value={rank}>Rank {rank}</option>
                            ))}
                        </select>
                    }
                    data={topFrequentSpecific}
                    valueGetter={(stat) => stat.rankSpecificCounts[selectedSpecificRank] || 0}
                    color="bg-pink-500"
                />
            </div>
        </div>
    );
};

export default PlayerAnalysisView;
