
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { EventSummary, PastEventApiResponse } from '../types';
import { EVENT_DETAILS, UNITS, UNIT_ORDER } from '../constants';
import DashboardTable from './ui/DashboardTable';
import Select from './ui/Select';

interface PlayerStat {
    userId: string;
    latestName: string;
    top100Count: number;
    rankSpecificCounts: Record<number, number>; // Key: rank 1-10, Value: count
    unitCounts: Record<string, number>; // Key: Unit Name, Value: count
}

const WORLD_LINK_IDS = [112, 118, 124, 130, 137, 140, 163];

const PlayerAnalysisView: React.FC = () => {
    const [eventsToProcess, setEventsToProcess] = useState<EventSummary[]>([]);
    const [playerStats, setPlayerStats] = useState<Record<string, PlayerStat>>({});
    
    // Main Analysis Loading State
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
                // Only process closed events AND exclude World Link events
                const pastEvents = data.filter(e => new Date(e.closed_at) < now && !WORLD_LINK_IDS.includes(e.id))
                                       .sort((a, b) => b.id - a.id);
                
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

    // 2. Batch Processing for Player Stats
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
                        return { rankings: data.rankings, eventId: event.id };
                    }
                    return null;
                } catch (err) {
                    if ((err as Error).name !== 'AbortError') {
                        console.warn(`Failed to fetch event ${event.id}`, err);
                    }
                    return null;
                }
            });

            const results = await Promise.all(fetchPromises);

            if (!controller.signal.aborted) {
                setPlayerStats(prevStats => {
                    const newStats = { ...prevStats };
                    
                    results.forEach(result => {
                        if (!result) return;
                        
                        const { rankings, eventId } = result;
                        const eventUnit = EVENT_DETAILS[eventId]?.unit || 'Unknown';

                        rankings.forEach(entry => {
                            const userId = String(entry.userId);
                            
                            if (!newStats[userId]) {
                                newStats[userId] = {
                                    userId,
                                    latestName: entry.name,
                                    top100Count: 0,
                                    rankSpecificCounts: {},
                                    unitCounts: {}
                                };
                            }
                            
                            // Update stats
                            newStats[userId].top100Count += 1;
                            
                            if (newStats[userId].top100Count === 1) {
                                newStats[userId].latestName = entry.name;
                            }

                            // Track Unit
                            if (eventUnit !== 'Unknown') {
                                newStats[userId].unitCounts[eventUnit] = (newStats[userId].unitCounts[eventUnit] || 0) + 1;
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
    const { topFrequent100, topFrequentSpecific, totalPlayersTop100, totalPlayersSpecific } = useMemo(() => {
        const allStats = Object.values(playerStats) as PlayerStat[];

        const sortedByTop100 = [...allStats]
            .sort((a, b) => b.top100Count - a.top100Count)
            .slice(0, 10);

        const specificRankUsers = allStats.filter(s => (s.rankSpecificCounts[selectedSpecificRank] || 0) > 0);
        
        const sortedBySpecificRank = [...specificRankUsers]
            .sort((a, b) => (b.rankSpecificCounts[selectedSpecificRank] || 0) - (a.rankSpecificCounts[selectedSpecificRank] || 0))
            .slice(0, 10);

        return {
            topFrequent100: sortedByTop100,
            topFrequentSpecific: sortedBySpecificRank,
            totalPlayersTop100: allStats.length,
            totalPlayersSpecific: specificRankUsers.length
        };
    }, [playerStats, selectedSpecificRank]);

    const renderRow = (stat: PlayerStat, idx: number, value: number, showUnits: boolean) => (
        <tr key={stat.userId} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            <td className={`px-3 py-2 font-bold ${idx < 3 ? 'text-yellow-500 dark:text-yellow-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {idx + 1}
            </td>
            <td className="px-3 py-2">
                <div className="font-medium text-slate-800 dark:text-slate-200 truncate" title={stat.latestName}>
                    {stat.latestName}
                </div>
                {/* User ID removed for privacy */}
                
                {showUnits && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        {UNIT_ORDER.map(unit => {
                            const count = stat.unitCounts[unit] || 0;
                            if (count === 0) return null;
                            const unitStyle = UNITS[unit]?.style || "";
                            const unitAbbr = UNITS[unit]?.abbr || unit;
                            return (
                                <span 
                                    key={unit} 
                                    className={`text-[9px] px-1.5 py-0.5 rounded-sm font-bold ${unitStyle}`}
                                    title={`${unit}: ${count} 次`}
                                >
                                    {unitAbbr}: {count}
                                </span>
                            );
                        })}
                    </div>
                )}
            </td>
            <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-white align-top pt-3">
                {value} 次
            </td>
        </tr>
    );

    return (
        <div className="w-full py-4 animate-fadeIn">
             <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">活躍玩家分析 (Active Player Analysis)</h2>
                <p className="text-slate-500 dark:text-slate-400">分析歷代活動中，最常上榜的玩家 (不含 World Link)</p>

                {isAnalyzing && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 mt-4 mb-6 relative overflow-hidden shadow-sm">
                        <div className="flex justify-between items-center mb-2 relative z-10">
                            <span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm animate-pulse">
                                正在同步分析過往數據... ({loadingProgress}%)
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 text-xs">
                                已掃描玩家數: {totalPlayersTop100}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Table 1: Most Frequent Top 100 */}
                <DashboardTable 
                    title="前百常客 (Top 100 Frequency)"
                    subtitle={`共 ${totalPlayersTop100.toLocaleString()} 位玩家`}
                    columns={[
                        { header: '#', className: 'w-10' },
                        { header: '玩家 (Player)' },
                        { header: '上榜次數', className: 'text-right' }
                    ]}
                    data={topFrequent100}
                    renderRow={(stat: PlayerStat, idx) => renderRow(stat, idx, stat.top100Count, true)}
                    color="bg-cyan-500"
                />

                {/* Table 2: Specific Rank Frequency */}
                <DashboardTable 
                    title={`Top ${selectedSpecificRank} 常客`}
                    subtitle={`共 ${totalPlayersSpecific.toLocaleString()} 位玩家`}
                    headerAction={
                         <Select
                            value={selectedSpecificRank}
                            onChange={(val) => setSelectedSpecificRank(Number(val))}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs py-1"
                            options={Array.from({ length: 10 }, (_, i) => i + 1).map(rank => ({ value: rank, label: `Rank ${rank}` }))}
                        />
                    }
                    columns={[
                        { header: '#', className: 'w-10' },
                        { header: '玩家 (Player)' },
                        { header: '獲得次數', className: 'text-right' }
                    ]}
                    data={topFrequentSpecific}
                    renderRow={(stat: PlayerStat, idx) => renderRow(stat, idx, stat.rankSpecificCounts[selectedSpecificRank] || 0, true)}
                    color="bg-pink-500"
                />
            </div>
        </div>
    );
};

export default PlayerAnalysisView;
