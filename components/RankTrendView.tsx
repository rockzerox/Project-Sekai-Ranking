
import React, { useState, useEffect, useMemo } from 'react';
import { EventSummary, PastEventApiResponse, PastEventBorderApiResponse } from '../types';
import LineChart from './LineChart';
import { WORLD_LINK_IDS, calculatePreciseDuration } from '../constants';

interface EventTrendStat {
    eventId: number;
    eventName: string;
    duration: number;
    top1: number;
    top10: number;
    top100: number;
    borders: Record<number, number>;
}

const RANK_OPTIONS = [1, 10, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000];

const RankTrendView: React.FC = () => {
    const [eventsToProcess, setEventsToProcess] = useState<EventSummary[]>([]);
    const [processedStats, setProcessedStats] = useState<EventTrendStat[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [totalEvents, setTotalEvents] = useState(0);
    
    const [selectedRank, setSelectedRank] = useState<number>(100);
    const [displayMode, setDisplayMode] = useState<'total' | 'daily'>('total');

    // Initial Fetch Effect
    useEffect(() => {
        let active = true;

        const fetchList = async () => {
            try {
                const response = await fetch('https://api.hisekai.org/event/list');
                const data: EventSummary[] = await response.json();
                
                if (!active) return;

                const now = new Date();
                
                // Filter closed and non-World Link events, sort by ID asc for trend
                const closedEvents = data.filter(e => new Date(e.closed_at) < now && !WORLD_LINK_IDS.includes(e.id))
                                       .sort((a, b) => a.id - b.id);
                
                setEventsToProcess(closedEvents);
                setTotalEvents(closedEvents.length);

            } catch (e) {
                console.error("Failed to fetch event list", e);
                if (active) setIsAnalyzing(false);
            }
        };

        fetchList();
        
        return () => { active = false; };
    }, []);

    // Batch Processing Effect
    useEffect(() => {
        let alive = true;

        // Guard conditions
        if (eventsToProcess.length === 0 || !isAnalyzing || isPaused) return;

        const processBatch = async () => {
            const BATCH_SIZE = 5;
            const currentBatch = eventsToProcess.slice(0, BATCH_SIZE);
            const remaining = eventsToProcess.slice(BATCH_SIZE);

            const fetchPromises = currentBatch.map(async (event) => {
                try {
                    const [resTop100, resBorder] = await Promise.all([
                        fetch(`https://api.hisekai.org/event/${event.id}/top100`),
                        fetch(`https://api.hisekai.org/event/${event.id}/border`)
                    ]);

                    let top1 = 0, top10 = 0, top100 = 0;
                    
                    if (resTop100.ok) {
                        const text = await resTop100.text();
                        const sanitized = text.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');
                        const data: PastEventApiResponse = JSON.parse(sanitized);
                        top1 = data.rankings?.[0]?.score || 0;
                        top10 = data.rankings?.[9]?.score || 0;
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
                        top100,
                        borders: borderScores
                    } as EventTrendStat;
                } catch (err) {
                    console.warn(`Failed to fetch event ${event.id}`, err);
                    return null;
                }
            });

            // Wait for all requests
            const results = await Promise.all(fetchPromises);
            
            // CRITICAL: Check alive flag before setting state
            if (!alive) return;

            const validResults = results.filter((r): r is EventTrendStat => r !== null);

            // Update Stats
            if (validResults.length > 0) {
                setProcessedStats(prev => {
                    const combined = [...prev, ...validResults];
                    return combined.sort((a, b) => a.eventId - b.eventId);
                });
            }

            // Update Queue
            setEventsToProcess(remaining);
            
            // Update Progress
            const processedCount = totalEvents - remaining.length;
            const progress = totalEvents > 0 ? Math.round((processedCount / totalEvents) * 100) : 0;
            setLoadingProgress(progress);

            // Check if finished
            if (remaining.length === 0) {
                setIsAnalyzing(false);
            }
        };

        processBatch();

        // Cleanup function
        return () => { alive = false; };
    }, [eventsToProcess, isAnalyzing, isPaused, totalEvents]);

    const chartData = useMemo(() => {
        return processedStats.map(stat => {
            let rawScore = 0;
            if (selectedRank === 1) rawScore = stat.top1;
            else if (selectedRank === 10) rawScore = stat.top10;
            else if (selectedRank === 100) rawScore = stat.top100;
            else rawScore = stat.borders[selectedRank] || 0;

            const finalScore = displayMode === 'daily' ? Math.ceil(rawScore / Math.max(1, stat.duration)) : rawScore;

            return {
                label: `Event #${stat.eventId}`,
                value: finalScore,
                rank: stat.eventId // Using eventId as rank for X-axis spacing
            };
        }).filter(d => d.value > 0);
    }, [processedStats, selectedRank, displayMode]);

    return (
        <div className="w-full py-4 animate-fadeIn">
            <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">活動榜線趨勢 (Rank Trends)</h2>
                        <p className="text-slate-500 dark:text-slate-400">觀察歷代活動分數線隨期數變化的趨勢</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                         <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600 dark:text-slate-300 font-bold">排名:</span>
                            <select 
                                value={selectedRank} 
                                onChange={(e) => setSelectedRank(Number(e.target.value))}
                                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold py-2 px-3 rounded border border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-teal-500 outline-none cursor-pointer"
                            >
                                {RANK_OPTIONS.map(rank => (
                                    <option key={rank} value={rank}>Top {rank}</option>
                                ))}
                            </select>
                         </div>

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
                                正在同步歷史數據... ({loadingProgress}%)
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

            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-lg">
                <LineChart 
                    data={chartData}
                    lineColor="teal"
                    xAxisLabel="Event ID"
                    yAxisLabel={displayMode === 'total' ? "Score" : "Daily Avg"}
                    useLinearScale={true}
                    valueFormatter={(v) => displayMode === 'daily' ? v.toLocaleString() : `${(v/10000).toFixed(1)}萬`}
                    yAxisFormatter={(v) => displayMode === 'daily' ? v.toLocaleString() : `${(v/10000).toFixed(0)}萬`}
                />
            </div>
        </div>
    );
};

export default RankTrendView;
