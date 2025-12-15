
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { EventSummary, PastEventApiResponse, PastEventBorderApiResponse } from '../types';
import LineChart from './LineChart';
import { calculatePreciseDuration, EVENT_DETAILS, UNIT_ORDER, BANNER_ORDER, getEventColor, API_BASE_URL } from '../constants';
import Select from './ui/Select';
import Button from './ui/Button';
import Input from './ui/Input';

interface TrendDataPoint {
    eventId: number;
    eventName: string;
    duration: number;
    score: number;
    year: number;
}

const RANK_OPTIONS = [1, 10, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000];

const RankTrendView: React.FC = () => {
    // Data States
    const [allEvents, setAllEvents] = useState<EventSummary[]>([]);
    const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    
    // Status States
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    
    // Core Selection
    const [selectedRank, setSelectedRank] = useState<number>(100);
    const [displayMode, setDisplayMode] = useState<'total' | 'daily'>('total');

    // Range Selection
    const [rangeMode, setRangeMode] = useState<'year' | 'id'>('year');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [idRange, setIdRange] = useState<{start: string, end: string}>({start: '', end: ''});

    // Chart Config
    const [showStatLines, setShowStatLines] = useState(false);

    // Filters
    const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
    const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'marathon' | 'cheerful_carnival' | 'world_link'>('all');
    const [selectedBannerFilter, setSelectedBannerFilter] = useState<string>('all');
    const [selectedStoryFilter, setSelectedStoryFilter] = useState<'all' | 'unit_event' | 'mixed_event' | 'world_link'>('all');
    const [selectedCardFilter, setSelectedCardFilter] = useState<'all' | 'permanent' | 'limited' | 'special_limited'>('all');

    // 1. Initial Load: Fetch Event List
    useEffect(() => {
        const fetchList = async () => {
            try {
                const listRes = await fetch(`${API_BASE_URL}/event/list`);
                if (!listRes.ok) throw new Error('Failed to fetch event list');
                const listData: EventSummary[] = await listRes.json();
                
                // Sort by ID Ascending for easier range processing
                const sortedEvents = listData.sort((a, b) => a.id - b.id);
                setAllEvents(sortedEvents);

                // Extract Years
                const years = Array.from(new Set(sortedEvents.map(e => new Date(e.start_at).getFullYear())))
                                   .sort((a, b) => b - a); // Descending
                setAvailableYears(years);
                
                // Default to latest year if current is not available, or keep current
                if (!years.includes(selectedYear)) {
                    if (years.length > 0) setSelectedYear(years[0]);
                }

                setIsLoadingList(false);
            } catch (e) {
                console.error(e);
                setFetchError('無法載入活動列表，請重新整理頁面。');
                setIsLoadingList(false);
            }
        };
        fetchList();
    }, []);

    // 2. Data Fetching Logic (Triggered by Range/Rank changes)
    useEffect(() => {
        if (isLoadingList || allEvents.length === 0) return;

        let alive = true;
        const controller = new AbortController();

        const fetchTrendData = async () => {
            setFetchError(null);
            
            // --- A. Determine Target Events based on Range ---
            const now = new Date();
            // Filter closed events first
            let targetEvents = allEvents.filter(e => new Date(e.closed_at) < now);

            if (rangeMode === 'year') {
                targetEvents = targetEvents.filter(e => new Date(e.start_at).getFullYear() === selectedYear);
            } else {
                const s = parseInt(idRange.start);
                const e = parseInt(idRange.end);
                
                // Validate inputs
                if (isNaN(s) || isNaN(e)) {
                    // Don't fetch if inputs are invalid/empty
                    setTrendData([]); 
                    return; 
                }
                
                // Validate Range >= 9
                if (e - s < 8) {
                    setFetchError('自訂範圍須至少包含 9 期活動 (e.g. 1~9)');
                    setTrendData([]);
                    return;
                }

                targetEvents = targetEvents.filter(evt => evt.id >= s && evt.id <= e);
            }

            if (targetEvents.length === 0) {
                setTrendData([]);
                return;
            }

            setIsAnalyzing(true);
            setLoadingProgress(0);
            setTrendData([]); // Clear previous data to show loading state or keep? Let's clear for clarity.

            // --- B. Batch Fetch Scores ---
            const total = targetEvents.length;
            const allResults: TrendDataPoint[] = [];
            const BATCH_SIZE = 5;

            for (let i = 0; i < total; i += BATCH_SIZE) {
                if (!alive) break;
                if (isPaused) {
                    // Spin while paused
                    await new Promise(r => setTimeout(r, 500));
                    i -= BATCH_SIZE; // Retry this batch
                    continue;
                }

                const batch = targetEvents.slice(i, i + BATCH_SIZE);
                
                const batchResults = await Promise.all(batch.map(async (event) => {
                    try {
                        let score = 0;
                        const isTop100 = selectedRank <= 100;
                        const url = isTop100 
                            ? `${API_BASE_URL}/event/${event.id}/top100`
                            : `${API_BASE_URL}/event/${event.id}/border`;

                        const res = await fetch(url, { signal: controller.signal });
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
                        if ((e as Error).name !== 'AbortError') {
                            console.warn(`Failed to fetch event ${event.id}`);
                        }
                        return null;
                    }
                }));

                const validPoints = batchResults.filter((r): r is TrendDataPoint => r !== null && r.score > 0);
                allResults.push(...validPoints);

                // Update intermediate state for better UX (streaming feel)
                if (alive) {
                    setTrendData(prev => [...prev, ...validPoints].sort((a, b) => a.eventId - b.eventId));
                    setLoadingProgress(Math.round(((i + batch.length) / total) * 100));
                }
            }

            if (alive) setIsAnalyzing(false);
        };

        // Debounce ID range fetching slightly to avoid rapid requests while typing
        const timeoutId = setTimeout(() => {
            fetchTrendData();
        }, 500);

        return () => {
            alive = false;
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, [allEvents, isLoadingList, rangeMode, selectedYear, idRange, selectedRank, isPaused]);

    // Exclusive Filter Handler
    const handleFilterChange = (type: 'unit' | 'type' | 'banner' | 'story' | 'card', value: string) => {
        setSelectedUnitFilter('all');
        setSelectedTypeFilter('all');
        setSelectedBannerFilter('all');
        setSelectedStoryFilter('all');
        setSelectedCardFilter('all');

        switch (type) {
            case 'unit': setSelectedUnitFilter(value); break;
            case 'type': setSelectedTypeFilter(value as any); break;
            case 'banner': setSelectedBannerFilter(value); break;
            case 'story': setSelectedStoryFilter(value as any); break;
            case 'card': setSelectedCardFilter(value as any); break;
        }
    };

    const { chartData, meanValue, medianValue, hasMatchingData } = useMemo(() => {
        const hasActiveFilters = 
            selectedUnitFilter !== 'all' || 
            selectedTypeFilter !== 'all' || 
            selectedBannerFilter !== 'all' || 
            selectedStoryFilter !== 'all' || 
            selectedCardFilter !== 'all';

        let visibleCount = 0;

        const mappedData = trendData.map(d => {
            const details = EVENT_DETAILS[d.eventId];
            let isMatch = true;

            if (selectedUnitFilter !== 'all' && details?.unit !== selectedUnitFilter) isMatch = false;
            if (selectedTypeFilter !== 'all' && details?.type !== selectedTypeFilter) isMatch = false;
            if (selectedBannerFilter !== 'all' && details?.banner !== selectedBannerFilter) isMatch = false;
            if (selectedStoryFilter !== 'all' && details?.storyType !== selectedStoryFilter) isMatch = false;
            if (selectedCardFilter !== 'all' && details?.cardType !== selectedCardFilter) isMatch = false;

            if (isMatch) visibleCount++;

            return {
                label: `${d.eventName}`,
                value: displayMode === 'daily' ? Math.ceil(d.score / Math.max(1, d.duration)) : d.score,
                rank: d.eventId,
                isHighlighted: !hasActiveFilters || isMatch,
                pointColor: getEventColor(d.eventId),
                year: d.year
            };
        });

        // Stats calculation based on *Filtered* (Highlighted) data
        const activeValues = mappedData
            .filter(d => d.isHighlighted)
            .map(d => d.value)
            .sort((a, b) => a - b);

        let mean = 0;
        let median = 0;

        if (activeValues.length > 0) {
            mean = activeValues.reduce((acc, val) => acc + val, 0) / activeValues.length;
            const mid = Math.floor(activeValues.length / 2);
            median = activeValues.length % 2 !== 0 
                ? activeValues[mid] 
                : (activeValues[mid - 1] + activeValues[mid]) / 2;
        }

        return { 
            chartData: mappedData, 
            meanValue: mean, 
            medianValue: median,
            hasMatchingData: visibleCount > 0
        };
    }, [trendData, displayMode, selectedUnitFilter, selectedTypeFilter, selectedBannerFilter, selectedStoryFilter, selectedCardFilter]);

    const formatYAxis = (v: number) => {
        if (v >= 10000) {
            return `${(v / 10000).toFixed(1)}萬`.replace('.0萬', '萬');
        }
        return v.toLocaleString();
    };

    return (
        <div className="w-full py-4 animate-fadeIn">
            {/* Header & Title */}
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">活動榜線趨勢 (Rank Trend)</h2>
                <p className="text-slate-500 dark:text-slate-400">觀察特定範圍內的排名分數變化趨勢</p>
            </div>

            {/* Range Selection Bar */}
            <div className="bg-slate-100 dark:bg-slate-800/80 rounded-lg p-4 mb-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex bg-white dark:bg-slate-700 rounded-lg p-1 border border-slate-200 dark:border-slate-600 flex-shrink-0">
                    <button
                        onClick={() => setRangeMode('year')}
                        className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded transition-all ${
                            rangeMode === 'year' 
                            ? 'bg-cyan-500 text-white shadow' 
                            : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        📅 依年份
                    </button>
                    <button
                        onClick={() => setRangeMode('id')}
                        className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded transition-all ${
                            rangeMode === 'id' 
                            ? 'bg-cyan-500 text-white shadow' 
                            : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        🔢 依期數
                    </button>
                </div>

                <div className="flex-1 w-full md:w-auto">
                    {rangeMode === 'year' ? (
                        <Select
                            className="w-full md:max-w-xs"
                            value={selectedYear}
                            onChange={(val) => setSelectedYear(Number(val))}
                            options={availableYears.map(y => ({ value: y, label: `${y} 年` }))}
                        />
                    ) : (
                        <div className="flex items-center gap-2 w-full md:max-w-sm">
                            <Input
                                placeholder="Start ID"
                                type="number"
                                value={idRange.start}
                                onChange={(val) => setIdRange(prev => ({ ...prev, start: val }))}
                                className="text-center"
                            />
                            <span className="text-slate-400 font-bold">~</span>
                            <Input
                                placeholder="End ID"
                                type="number"
                                value={idRange.end}
                                onChange={(val) => setIdRange(prev => ({ ...prev, end: val }))}
                                className="text-center"
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-slate-700 rounded-lg p-1 border border-slate-200 dark:border-slate-600 ml-auto flex-shrink-0">
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

            {/* Error Message for Range */}
            {fetchError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {fetchError}
                </div>
            )}

            {/* Filters & Stats Bar */}
            <div className="bg-white dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-6 flex flex-col xl:flex-row gap-4 items-start xl:items-center">
                 <div className="flex flex-wrap gap-2 items-center flex-1">
                     <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">排名:</span>
                     <Select
                        className="py-1.5 text-xs w-24"
                        value={selectedRank}
                        onChange={(val) => setSelectedRank(Number(val))}
                        options={RANK_OPTIONS.map(rank => ({ value: rank, label: `Top ${rank}` }))}
                     />

                     <div className="w-px h-6 bg-slate-200 dark:bg-slate-600 mx-2 hidden sm:block"></div>

                     <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">篩選:</span>
                     <Select
                        className="py-1.5 text-xs w-24 sm:w-auto"
                        value={selectedUnitFilter}
                        onChange={(val) => handleFilterChange('unit', val)}
                        options={[{ value: 'all', label: '團體' }, ...UNIT_ORDER.map(u => ({ value: u, label: u }))]}
                     />
                     <Select
                        className="py-1.5 text-xs w-24 sm:w-auto"
                        value={selectedBannerFilter}
                        onChange={(val) => handleFilterChange('banner', val)}
                        options={[{ value: 'all', label: 'Banner' }, ...BANNER_ORDER.map(b => ({ value: b, label: b }))]}
                     />
                     <Select
                        className="py-1.5 text-xs w-24 sm:w-auto"
                        value={selectedTypeFilter}
                        onChange={(val) => handleFilterChange('type', val)}
                        options={[{ value: 'all', label: '類型' }, { value: 'marathon', label: '馬拉松' }, { value: 'cheerful_carnival', label: '歡樂嘉年華' }, { value: 'world_link', label: 'WL' }]}
                     />
                     <Select
                        className="py-1.5 text-xs w-24 sm:w-auto"
                        value={selectedStoryFilter}
                        onChange={(val) => handleFilterChange('story', val)}
                        options={[{ value: 'all', label: '劇情' }, { value: 'unit_event', label: '箱活' }, { value: 'mixed_event', label: '混活' }]}
                     />
                     <Select
                        className="py-1.5 text-xs w-24 sm:w-auto"
                        value={selectedCardFilter}
                        onChange={(val) => handleFilterChange('card', val)}
                        options={[{ value: 'all', label: '卡面' }, { value: 'permanent', label: '常駐' }, { value: 'limited', label: '限定' }, { value: 'special_limited', label: '特殊限定' }]}
                     />
                 </div>

                 {/* Stats Badges */}
                 {hasMatchingData && (
                     <div className="flex gap-3 w-full xl:w-auto border-t xl:border-t-0 border-slate-100 dark:border-slate-700/50 pt-2 xl:pt-0 items-center justify-end">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none group">
                            <input 
                                type="checkbox" 
                                checked={showStatLines} 
                                onChange={(e) => setShowStatLines(e.target.checked)}
                                className="w-4 h-4 text-cyan-500 rounded border-slate-300 dark:border-slate-600 focus:ring-cyan-500 dark:bg-slate-700"
                            />
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">顯示輔助線</span>
                        </label>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-md border border-purple-200 dark:border-purple-800/50">
                            <span className="text-[10px] font-bold uppercase tracking-wider">平均</span>
                            <span className="text-sm font-mono font-bold">{meanValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800/50">
                            <span className="text-[10px] font-bold uppercase tracking-wider">中位</span>
                            <span className="text-sm font-mono font-bold">{medianValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                     </div>
                 )}
            </div>

            {/* Loading / Content Area */}
            <div className="relative">
                {isAnalyzing && (
                    <div className="absolute inset-x-0 top-0 z-10 mx-4 mt-4">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-between">
                            <div className="flex items-center gap-3 w-full">
                                <span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm animate-pulse whitespace-nowrap">
                                    讀取中... ({loadingProgress}%)
                                </span>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-cyan-500 h-full rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${loadingProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                            <Button 
                                size="sm"
                                variant="secondary"
                                onClick={() => setIsPaused(!isPaused)}
                                className="ml-3 h-7 text-xs"
                            >
                                {isPaused ? "繼續" : "暫停"}
                            </Button>
                        </div>
                    </div>
                )}

                <div className={`bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-lg transition-opacity duration-300 ${isAnalyzing ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                    {trendData.length > 0 ? (
                        hasMatchingData ? (
                            <LineChart 
                                data={chartData}
                                variant="trend" 
                                lineColor="teal"
                                xAxisLabel="Event ID"
                                yAxisLabel={displayMode === 'total' ? "Score" : "Daily Avg"}
                                valueFormatter={(v) => displayMode === 'daily' ? v.toLocaleString() : `${(v/10000).toFixed(1)}萬`}
                                yAxisFormatter={formatYAxis}
                                meanValue={showStatLines ? meanValue : undefined}
                                medianValue={showStatLines ? medianValue : undefined}
                            />
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/20 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                                <p className="font-bold mb-1">找不到符合條件的結果</p>
                                <p className="text-sm">在選定的範圍內，沒有活動符合目前的篩選條件。</p>
                            </div>
                        )
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                            {fetchError ? (
                                <p className="text-sm">{fetchError}</p>
                            ) : (
                                <>
                                    <p className="font-bold mb-1">準備就緒</p>
                                    <p className="text-sm">請選擇年份或期數範圍以開始分析</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RankTrendView;
