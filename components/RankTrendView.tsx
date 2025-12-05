import React, { useState, useEffect, useMemo } from 'react';
import { EventSummary, PastEventApiResponse, PastEventBorderApiResponse } from '../types';
import LineChart from './LineChart';
import { WORLD_LINK_IDS, calculatePreciseDuration, EVENT_DETAILS, UNIT_ORDER, BANNER_ORDER, getEventColor } from '../constants';

interface TrendDataPoint {
    eventId: number;
    eventName: string;
    duration: number;
    score: number;
    year: number;
}

const RANK_OPTIONS = [1, 10, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000];

const RankTrendView: React.FC = () => {
    const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    
    const [selectedRank, setSelectedRank] = useState<number>(100);
    const [displayMode, setDisplayMode] = useState<'total' | 'daily'>('total');

    // Filters
    const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
    const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'marathon' | 'cheerful_carnival' | 'world_link'>('all');
    const [selectedBannerFilter, setSelectedBannerFilter] = useState<string>('all');
    const [selectedStoryFilter, setSelectedStoryFilter] = useState<'all' | 'unit_event' | 'mixed_event' | 'world_link'>('all');
    const [selectedCardFilter, setSelectedCardFilter] = useState<'all' | 'permanent' | 'limited' | 'special_limited'>('all');

    // Stats Toggles
    const [showMean, setShowMean] = useState(false);
    const [showMedian, setShowMedian] = useState(false);

    // Exclusive Filter Handler
    const handleFilterChange = (type: 'unit' | 'type' | 'banner' | 'story' | 'card', value: string) => {
        // Reset all first
        setSelectedUnitFilter('all');
        setSelectedTypeFilter('all');
        setSelectedBannerFilter('all');
        setSelectedStoryFilter('all');
        setSelectedCardFilter('all');

        // Set the specific one
        switch (type) {
            case 'unit': setSelectedUnitFilter(value); break;
            case 'type': setSelectedTypeFilter(value as any); break;
            case 'banner': setSelectedBannerFilter(value); break;
            case 'story': setSelectedStoryFilter(value as any); break;
            case 'card': setSelectedCardFilter(value as any); break;
        }
    };

    // Robust Data Fetching Effect
    useEffect(() => {
        let alive = true;
        
        const fetchTrendData = async () => {
            setIsAnalyzing(true);
            setLoadingProgress(0);
            setTrendData([]);

            try {
                // 1. Fetch Event List
                const listRes = await fetch('https://api.hisekai.org/event/list');
                if (!alive) return;
                const listData: EventSummary[] = await listRes.json();
                
                // 2. Filter Valid Events (Closed & Not World Link)
                const now = new Date();
                // Note: Previous prompts asked to INCLUDE World Link, so we removed the exclusion filter.
                const validEvents = listData
                    .filter(e => new Date(e.closed_at) < now) 
                    .sort((a, b) => a.id - b.id); // Ascending ID order

                const total = validEvents.length;
                const allResults: TrendDataPoint[] = [];
                
                // 3. Sequential Batch Processing
                const BATCH_SIZE = 5;
                for (let i = 0; i < total; i += BATCH_SIZE) {
                    if (!alive) break;
                    if (isPaused) break;

                    const batch = validEvents.slice(i, i + BATCH_SIZE);
                    const batchResults = await Promise.all(batch.map(async (event) => {
                        try {
                            let score = 0;
                            
                            // Decide endpoint based on selected rank
                            const isTop100 = selectedRank <= 100;
                            const url = isTop100 
                                ? `https://api.hisekai.org/event/${event.id}/top100`
                                : `https://api.hisekai.org/event/${event.id}/border`;

                            const res = await fetch(url);
                            if (res.ok) {
                                const txt = await res.text();
                                const sanitized = txt.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');
                                
                                if (isTop100) {
                                    const json: PastEventApiResponse = JSON.parse(sanitized);
                                    if (selectedRank === 1) score = json.rankings?.[0]?.score || 0;
                                    else if (selectedRank === 10) score = json.rankings?.[9]?.score || 0;
                                    else if (selectedRank === 100) score = json.rankings?.[99]?.score || 0;
                                    else score = json.rankings.find(r => r.rank === selectedRank)?.score || 0;
                                } else {
                                    const json: PastEventBorderApiResponse = JSON.parse(sanitized);
                                    // Handle standard border or WL specific structure if needed, usually borderRankings is standardized
                                    score = json.borderRankings?.find(r => r.rank === selectedRank)?.score || 0;
                                    
                                    // Fallback for WL if standard structure empty (though typically handled by API wrapper now)
                                    if (score === 0 && json.userWorldBloomChapterRankingBorders) {
                                         // Logic for WL border aggregation if needed, but keeping simple for trend view
                                    }
                                }
                            }

                            return {
                                eventId: event.id,
                                eventName: event.name,
                                duration: calculatePreciseDuration(event.start_at, event.aggregate_at),
                                score: score,
                                year: new Date(event.start_at).getFullYear()
                            };
                        } catch (e) {
                            return null;
                        }
                    }));

                    if (!alive) break;

                    const validPoints = batchResults.filter((r): r is TrendDataPoint => r !== null && r.score > 0);
                    allResults.push(...validPoints);

                    const progress = Math.round(((i + batch.length) / total) * 100);
                    setLoadingProgress(progress);
                }

                if (alive) {
                    setTrendData(allResults.sort((a, b) => a.eventId - b.eventId));
                    setIsAnalyzing(false);
                }

            } catch (e) {
                console.error("Trend analysis failed", e);
                if (alive) setIsAnalyzing(false);
            }
        };

        fetchTrendData();

        return () => { alive = false; };
    }, [selectedRank, isPaused]);

    const { chartData, meanValue, medianValue } = useMemo(() => {
        // Determine if any filter is active
        const hasActiveFilters = 
            selectedUnitFilter !== 'all' || 
            selectedTypeFilter !== 'all' || 
            selectedBannerFilter !== 'all' || 
            selectedStoryFilter !== 'all' || 
            selectedCardFilter !== 'all';

        const mappedData = trendData.map(d => {
            const details = EVENT_DETAILS[d.eventId];
            let isMatch = true;

            if (selectedUnitFilter !== 'all' && details?.unit !== selectedUnitFilter) isMatch = false;
            if (selectedTypeFilter !== 'all' && details?.type !== selectedTypeFilter) isMatch = false;
            if (selectedBannerFilter !== 'all' && details?.banner !== selectedBannerFilter) isMatch = false;
            if (selectedStoryFilter !== 'all' && details?.storyType !== selectedStoryFilter) isMatch = false;
            if (selectedCardFilter !== 'all' && details?.cardType !== selectedCardFilter) isMatch = false;

            return {
                label: `Event #${d.eventId}`,
                value: displayMode === 'daily' ? Math.ceil(d.score / Math.max(1, d.duration)) : d.score,
                rank: d.eventId,
                isHighlighted: !hasActiveFilters || isMatch,
                pointColor: getEventColor(d.eventId),
                year: d.year
            };
        });

        // Calculate Statistics on Highlighted Data
        const highlightedValues = mappedData
            .filter(d => d.isHighlighted)
            .map(d => d.value)
            .sort((a, b) => a - b);

        let mean = 0;
        let median = 0;

        if (highlightedValues.length > 0) {
            mean = highlightedValues.reduce((acc, val) => acc + val, 0) / highlightedValues.length;
            
            const mid = Math.floor(highlightedValues.length / 2);
            if (highlightedValues.length % 2 === 0) {
                median = (highlightedValues[mid - 1] + highlightedValues[mid]) / 2;
            } else {
                median = highlightedValues[mid];
            }
        }

        return { 
            chartData: mappedData, 
            meanValue: mean, 
            medianValue: median 
        };
    }, [trendData, displayMode, selectedUnitFilter, selectedTypeFilter, selectedBannerFilter, selectedStoryFilter, selectedCardFilter]);

    return (
        <div className="w-full py-4 animate-fadeIn">
            <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">活動榜線趨勢 (Rank Trend)</h2>
                        <p className="text-slate-500 dark:text-slate-400">觀察歷代活動特定排名分數隨期數變化的趨勢</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600 dark:text-slate-300 font-bold">排名 (Rank):</span>
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
                                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${displayMode === 'total' ? 'bg-cyan-500 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                總分
                            </button>
                            <button
                                onClick={() => setDisplayMode('daily')}
                                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${displayMode === 'daily' ? 'bg-pink-500 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                日均
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-6 flex flex-wrap gap-2 items-center">
                     <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">單一篩選 (Exclusive Filter):</span>
                     <select
                        value={selectedUnitFilter}
                        onChange={(e) => handleFilterChange('unit', e.target.value)}
                        className="text-sm p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                     >
                        <option value="all">所有團體</option>
                        {UNIT_ORDER.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                     </select>

                     <select
                        value={selectedBannerFilter}
                        onChange={(e) => handleFilterChange('banner', e.target.value)}
                        className="text-sm p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                     >
                        <option value="all">所有 Banner</option>
                        {BANNER_ORDER.map(banner => <option key={banner} value={banner}>{banner}</option>)}
                     </select>

                     <select
                        value={selectedTypeFilter}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="text-sm p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                     >
                        <option value="all">所有類型</option>
                        <option value="marathon">馬拉松</option>
                        <option value="cheerful_carnival">歡樂嘉年華</option>
                        <option value="world_link">World Link</option>
                     </select>

                     <select
                        value={selectedStoryFilter}
                        onChange={(e) => handleFilterChange('story', e.target.value)}
                        className="text-sm p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                     >
                        <option value="all">所有劇情</option>
                        <option value="unit_event">箱活</option>
                        <option value="mixed_event">混活</option>
                        <option value="world_link">World Link</option>
                     </select>

                     <select
                        value={selectedCardFilter}
                        onChange={(e) => handleFilterChange('card', e.target.value)}
                        className="text-sm p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                     >
                        <option value="all">所有卡面</option>
                        <option value="permanent">常駐</option>
                        <option value="limited">限定</option>
                        <option value="special_limited">特殊限定</option>
                     </select>

                     {/* Stat Toggles */}
                     <div className="flex gap-2 ml-auto">
                        <button 
                            onClick={() => setShowMean(!showMean)}
                            className={`text-xs px-2 py-1 rounded border transition-colors ${showMean ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 border-slate-300 dark:border-slate-600'}`}
                        >
                            平均數 (Mean)
                        </button>
                        <button 
                            onClick={() => setShowMedian(!showMedian)}
                            className={`text-xs px-2 py-1 rounded border transition-colors ${showMedian ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 border-slate-300 dark:border-slate-600'}`}
                        >
                            中位數 (Median)
                        </button>
                     </div>
                </div>

                {/* Statistics Panel */}
                {(showMean || showMedian) && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {showMean && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded p-3 flex justify-between items-center">
                                <span className="text-sm text-purple-700 dark:text-purple-300 font-bold">平均數 (Mean)</span>
                                <span className="text-lg font-mono font-bold text-purple-800 dark:text-purple-200">
                                    {meanValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                        )}
                        {showMedian && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3 flex justify-between items-center">
                                <span className="text-sm text-amber-700 dark:text-amber-300 font-bold">中位數 (Median)</span>
                                <span className="text-lg font-mono font-bold text-amber-800 dark:text-amber-200">
                                    {medianValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {isAnalyzing && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 mb-6 relative overflow-hidden shadow-sm">
                        <div className="flex justify-between items-center mb-2 relative z-10">
                            <span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm animate-pulse">
                                正在讀取並分析歷史數據... ({loadingProgress}%)
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 text-xs">
                                已載入: {trendData.length} 期
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
                {trendData.length > 0 ? (
                    <LineChart 
                        data={chartData}
                        lineColor="teal"
                        xAxisLabel="Event ID"
                        yAxisLabel={displayMode === 'total' ? "Score" : "Daily Avg"}
                        useLinearScale={true}
                        valueFormatter={(v) => displayMode === 'daily' ? v.toLocaleString() : `${(v/10000).toFixed(1)}萬`}
                        yAxisFormatter={(v) => displayMode === 'daily' ? v.toLocaleString() : `${(v/10000).toFixed(0)}萬`}
                        meanValue={showMean ? meanValue : undefined}
                        medianValue={showMedian ? medianValue : undefined}
                    />
                ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400">
                        {isAnalyzing ? "數據載入中..." : "暫無數據顯示"}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RankTrendView;