
import React, { useState, useEffect, useMemo } from 'react';
import { EventSummary, PastEventApiResponse, PastEventBorderApiResponse } from '../types';
import LineChart from './LineChart';
import { WORLD_LINK_IDS, calculatePreciseDuration, EVENT_DETAILS, UNIT_ORDER, BANNER_ORDER, getEventColor } from '../constants';
import Select from './ui/Select';
import Button from './ui/Button';

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
                
                // 2. Filter Valid Events (Closed)
                const now = new Date();
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
                                    score = json.borderRankings?.find(r => r.rank === selectedRank)?.score || 0;
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
                label: `${d.eventName}`,
                value: displayMode === 'daily' ? Math.ceil(d.score / Math.max(1, d.duration)) : d.score,
                rank: d.eventId,
                isHighlighted: !hasActiveFilters || isMatch,
                pointColor: getEventColor(d.eventId),
                year: d.year
            };
        });

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

        return { chartData: mappedData, meanValue: mean, medianValue: median };
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
                            <span className="text-sm text-slate-600 dark:text-slate-300 font-bold whitespace-nowrap">排名 (Rank):</span>
                            <Select
                                className="py-2"
                                value={selectedRank}
                                onChange={(val) => setSelectedRank(Number(val))}
                                options={RANK_OPTIONS.map(rank => ({ value: rank, label: `Top ${rank}` }))}
                            />
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-1 rounded-lg flex border border-slate-300 dark:border-slate-700 shadow-sm">
                            <Button
                                size="sm"
                                variant={displayMode === 'total' ? 'primary' : 'ghost'}
                                onClick={() => setDisplayMode('total')}
                            >
                                總分
                            </Button>
                            <Button
                                size="sm"
                                variant={displayMode === 'daily' ? 'danger' : 'ghost'}
                                className={displayMode === 'daily' ? 'bg-pink-500 hover:bg-pink-600 focus:ring-pink-500' : ''}
                                onClick={() => setDisplayMode('daily')}
                            >
                                日均
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-6 flex flex-wrap gap-2 items-center">
                     <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">單一篩選:</span>
                     
                     <Select
                        className="py-1.5 text-xs"
                        value={selectedUnitFilter}
                        onChange={(val) => handleFilterChange('unit', val)}
                        options={[
                            { value: 'all', label: '所有團體' },
                            ...UNIT_ORDER.map(u => ({ value: u, label: u }))
                        ]}
                     />

                     <Select
                        className="py-1.5 text-xs"
                        value={selectedBannerFilter}
                        onChange={(val) => handleFilterChange('banner', val)}
                        options={[
                            { value: 'all', label: '所有 Banner' },
                            ...BANNER_ORDER.map(b => ({ value: b, label: b }))
                        ]}
                     />

                     <Select
                        className="py-1.5 text-xs"
                        value={selectedTypeFilter}
                        onChange={(val) => handleFilterChange('type', val)}
                        options={[
                            { value: 'all', label: '所有類型' },
                            { value: 'marathon', label: '馬拉松' },
                            { value: 'cheerful_carnival', label: '歡樂嘉年華' },
                            { value: 'world_link', label: 'World Link' }
                        ]}
                     />

                     <Select
                        className="py-1.5 text-xs"
                        value={selectedStoryFilter}
                        onChange={(val) => handleFilterChange('story', val)}
                        options={[
                            { value: 'all', label: '所有劇情' },
                            { value: 'unit_event', label: '箱活' },
                            { value: 'mixed_event', label: '混活' },
                            { value: 'world_link', label: 'World Link' }
                        ]}
                     />

                     <Select
                        className="py-1.5 text-xs"
                        value={selectedCardFilter}
                        onChange={(val) => handleFilterChange('card', val)}
                        options={[
                            { value: 'all', label: '所有卡面' },
                            { value: 'permanent', label: '常駐' },
                            { value: 'limited', label: '限定' },
                            { value: 'special_limited', label: '特殊限定' }
                        ]}
                     />

                     <div className="flex gap-2 ml-auto">
                        <Button
                            size="sm"
                            variant={showMean ? 'outline' : 'ghost'}
                            className={showMean ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300' : ''}
                            onClick={() => setShowMean(!showMean)}
                        >
                            平均數
                        </Button>
                        <Button
                            size="sm"
                            variant={showMedian ? 'outline' : 'ghost'}
                            className={showMedian ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300' : ''}
                            onClick={() => setShowMedian(!showMedian)}
                        >
                            中位數
                        </Button>
                     </div>
                </div>

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
                         <Button 
                            size="sm"
                            variant="secondary"
                            onClick={() => setIsPaused(!isPaused)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-20"
                         >
                             {isPaused ? "繼續" : "暫停"}
                         </Button>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-lg">
                {trendData.length > 0 ? (
                    <LineChart 
                        data={chartData}
                        variant="trend" 
                        lineColor="teal"
                        xAxisLabel="Event ID"
                        yAxisLabel={displayMode === 'total' ? "Score" : "Daily Avg"}
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
