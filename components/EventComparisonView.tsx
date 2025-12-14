
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { EventSummary, PastEventApiResponse, PastEventBorderApiResponse } from '../types';
import ErrorMessage from './ErrorMessage';
import { EVENT_DETAILS, WORLD_LINK_IDS, getEventColor, UNIT_ORDER, BANNER_ORDER, calculatePreciseDuration, API_BASE_URL } from '../constants';
import Select from './ui/Select';
import Button from './ui/Button';

interface SimpleRankData {
    rank: number;
    score: number;
}

interface ComparisonResult {
    event1: { name: string; data: SimpleRankData[]; duration: number, id: number } | null;
    event2: { name: string; data: SimpleRankData[]; duration: number, id: number } | null;
}

const EventComparisonView: React.FC = () => {
    const [events, setEvents] = useState<EventSummary[]>([]);
    const [listError, setListError] = useState<string | null>(null);

    const [selectedId1, setSelectedId1] = useState<string>('');
    const [selectedId2, setSelectedId2] = useState<string>('');
    
    // Filters
    const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
    const [selectedBannerFilter, setSelectedBannerFilter] = useState<string>('all');
    const [selectedStoryFilter, setSelectedStoryFilter] = useState<'all' | 'unit_event' | 'mixed_event' | 'world_link'>('all');
    const [selectedCardFilter, setSelectedCardFilter] = useState<'all' | 'permanent' | 'limited' | 'special_limited'>('all');
    
    const [comparisonData, setComparisonData] = useState<ComparisonResult>({ event1: null, event2: null });
    const [isComparing, setIsComparing] = useState(false);
    const [comparisonError, setComparisonError] = useState<string | null>(null);

    // Tooltip State
    const [hoveredRank, setHoveredRank] = useState<number | null>(null);
    const [cursorPercent, setCursorPercent] = useState<number | null>(null);
    
    const [displayMode, setDisplayMode] = useState<'total' | 'daily'>('total');
    
    // Responsive State
    const [isMobile, setIsMobile] = useState(false);
    
    const plotAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // Using Dynamic API Base URL
                const response = await fetch(`${API_BASE_URL}/event/list`);
                if (!response.ok) throw new Error('Failed to fetch event list');
                const data: EventSummary[] = await response.json();
                
                const now = new Date();
                const pastEvents = data.filter(e => new Date(e.closed_at) < now && !WORLD_LINK_IDS.includes(e.id))
                                       .sort((a, b) => b.id - a.id);
                setEvents(pastEvents);
            } catch (err) {
                setListError('無法載入活動列表');
                console.error(err);
            }
        };
        fetchEvents();
    }, []);

    // Filter Logic
    const filteredEventOptions = useMemo(() => {
        let result = events;
        if (selectedUnitFilter !== 'all') {
            result = result.filter(e => EVENT_DETAILS[e.id]?.unit === selectedUnitFilter);
        }
        if (selectedBannerFilter !== 'all') {
            result = result.filter(e => EVENT_DETAILS[e.id]?.banner === selectedBannerFilter);
        }
        if (selectedStoryFilter !== 'all') {
            result = result.filter(e => EVENT_DETAILS[e.id]?.storyType === selectedStoryFilter);
        }
        if (selectedCardFilter !== 'all') {
            result = result.filter(e => EVENT_DETAILS[e.id]?.cardType === selectedCardFilter);
        }
        return result;
    }, [events, selectedUnitFilter, selectedBannerFilter, selectedStoryFilter, selectedCardFilter]);

    const getOptions = (currentSelected: string) => {
        const baseOptions = filteredEventOptions.map(e => ({
            value: e.id,
            label: `#${e.id} ${e.name}`,
            style: { color: getEventColor(e.id) }
        }));

        if (currentSelected && !baseOptions.find(o => o.value.toString() === currentSelected)) {
            const missingEvent = events.find(e => e.id.toString() === currentSelected);
            if (missingEvent) {
                baseOptions.push({
                    value: missingEvent.id,
                    label: `#${missingEvent.id} ${missingEvent.name}`,
                    style: { color: getEventColor(missingEvent.id) }
                });
                baseOptions.sort((a, b) => (b.value as number) - (a.value as number));
            }
        }
        return [{ value: '', label: '選擇活動...' }, ...baseOptions];
    };

    const handleCompare = async () => {
        if (!selectedId1 || !selectedId2) return;
        if (selectedId1 === selectedId2) {
            setComparisonError('請選擇兩個不同的活動進行比較');
            return;
        }

        setIsComparing(true);
        setComparisonError(null);
        setComparisonData({ event1: null, event2: null });
        setHoveredRank(null);

        try {
            // Using Dynamic API Base URL
            const [res1top, res1border, res2top, res2border] = await Promise.all([
                fetch(`${API_BASE_URL}/event/${selectedId1}/top100`),
                fetch(`${API_BASE_URL}/event/${selectedId1}/border`),
                fetch(`${API_BASE_URL}/event/${selectedId2}/top100`),
                fetch(`${API_BASE_URL}/event/${selectedId2}/border`)
            ]);

            if (!res1top.ok || !res2top.ok) throw new Error('無法取得活動排行資料');
            
            const sanitize = (txt: string) => txt.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');

            const text1top = await res1top.text();
            const text2top = await res2top.text();
            const data1top: PastEventApiResponse = JSON.parse(sanitize(text1top));
            const data2top: PastEventApiResponse = JSON.parse(sanitize(text2top));

            let data1border: PastEventBorderApiResponse = { borderRankings: [] };
            let data2border: PastEventBorderApiResponse = { borderRankings: [] };

            if (res1border.ok) {
                const text = await res1border.text();
                data1border = JSON.parse(sanitize(text));
            }
            if (res2border.ok) {
                const text = await res2border.text();
                data2border = JSON.parse(sanitize(text));
            }

            const eventSummary1 = events.find(e => e.id.toString() === selectedId1);
            const eventSummary2 = events.find(e => e.id.toString() === selectedId2);

            const eventName1 = eventSummary1?.name || `Event ${selectedId1}`;
            const eventName2 = eventSummary2?.name || `Event ${selectedId2}`;

            const duration1 = eventSummary1 ? calculatePreciseDuration(eventSummary1.start_at, eventSummary1.aggregate_at) : 0;
            const duration2 = eventSummary2 ? calculatePreciseDuration(eventSummary2.start_at, eventSummary2.aggregate_at) : 0;

            const processRankings = (topData: any[], borderData: any[] = []): SimpleRankData[] => {
                const combined = [
                    ...topData.map(r => ({ rank: r.rank, score: r.score })),
                    ...(borderData || []).map(r => ({ rank: r.rank, score: r.score }))
                ];
                
                const uniqueMap = new Map();
                combined.forEach(item => uniqueMap.set(item.rank, item));
                
                return Array.from(uniqueMap.values())
                    .sort((a, b) => a.rank - b.rank)
                    .filter(item => item.score > 0);
            };

            setComparisonData({
                event1: { name: eventName1, data: processRankings(data1top.rankings, data1border.borderRankings), duration: duration1, id: Number(selectedId1) },
                event2: { name: eventName2, data: processRankings(data2top.rankings, data2border.borderRankings), duration: duration2, id: Number(selectedId2) }
            });

        } catch (err) {
            setComparisonError('載入比較資料時發生錯誤。');
            console.error(err);
        } finally {
            setIsComparing(false);
        }
    };

    // --- Interaction Handlers (Simplified: Only Hover) ---

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, getXPercent: (rank: number) => number, maxRank: number, ranks: number[]) => {
        if (!plotAreaRef.current) return;
        const rect = plotAreaRef.current.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const mousePercent = (relX / rect.width) * 100;
        
        if (ranks.length > 0) {
            let bestRank = ranks[0];
            let minDiff = Infinity;
            let bestPercent = 0;

            for (const r of ranks) {
                const p = getXPercent(r);
                const diff = Math.abs(p - mousePercent);
                if (diff < minDiff) {
                    minDiff = diff;
                    bestRank = r;
                    bestPercent = p;
                }
            }

            // Snap Threshold (5% of width)
            if (minDiff < 5) { 
                setHoveredRank(bestRank);
                setCursorPercent(bestPercent);
            } else {
                setHoveredRank(null);
                setCursorPercent(null);
            }
        }
    };

    // --- Chart Calculation ---

    const ChartDisplay = useMemo(() => {
        if (!comparisonData.event1 || !comparisonData.event2) return null;

        const color1 = getEventColor(comparisonData.event1.id) || '#06b6d4';
        const color2 = getEventColor(comparisonData.event2.id) || '#ec4899';

        const processData = (data: SimpleRankData[], duration: number) => {
            return data.map(d => ({
                ...d,
                score: displayMode === 'daily' ? Math.ceil(d.score / Math.max(1, duration)) : d.score
            }));
        };

        const d1 = processData(comparisonData.event1.data, comparisonData.event1.duration);
        const d2 = processData(comparisonData.event2.data, comparisonData.event2.duration);

        const allScores = [...d1.map(d => d.score), ...d2.map(d => d.score)];
        const allRanks = [...d1.map(d => d.rank), ...d2.map(d => d.rank)];
        const uniqueRanks = Array.from(new Set(allRanks)).sort((a,b) => a-b);

        const maxScore = Math.max(...allScores, 1) * 1.05;
        const maxRank = Math.max(...allRanks, 1000);

        // Split Scale Config (No Zoom)
        // 1-100: Takes 30% of chart width (Give Top 100 more space)
        // 100-Max: Takes 70% of chart width
        const SPLIT_RATIO = 0.3; 
        const SPLIT_RANK = 100;
        
        // Rank to Percentage (0-100)
        const getXPercent = (rank: number) => {
            let ratio = 0;
            if (rank <= 1) ratio = 0;
            else if (rank <= SPLIT_RANK) {
                // Linear part
                ratio = ((rank - 1) / (SPLIT_RANK - 1)) * SPLIT_RATIO;
            } else {
                // Log part
                const logMin = Math.log(SPLIT_RANK);
                const logMax = Math.log(maxRank);
                const logVal = Math.log(rank);
                const logRatio = (logVal - logMin) / (logMax - logMin);
                ratio = SPLIT_RATIO + (logRatio * (1 - SPLIT_RATIO));
            }
            return ratio * 100;
        };

        // Convert Score to Percentage (0-100) (Y axis is typically inverted in SVG, but here we output 0-100 for css bottom)
        const getYPercent = (score: number) => {
            return (score / maxScore) * 100;
        };

        // Ranks to show dots for - Expanded List
        const SCATTER_RANKS = [
            1, 10, 20, 30, 40, 50, 
            100, 200, 300, 400, 500, 
            1000, 2000, 5000, 10000
        ];

        // Calculate Points
        const calculatePoints = (data: SimpleRankData[]) => {
            if (data.length < 2) return { path: "", points: [] };
            
            const points = data.map(p => {
                const x = getXPercent(p.rank);
                const y = 100 - getYPercent(p.score); // SVG Y is top-down
                const showDot = SCATTER_RANKS.includes(p.rank);
                return { x, y, rank: p.rank, score: p.score, showDot };
            });

            const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
            return { path, points: points.filter(p => p.showDot) };
        };

        const result1 = calculatePoints(d1);
        const result2 = calculatePoints(d2);

        // Responsive Ticks
        let xTicksList;
        if (isMobile) {
            xTicksList = [1, 100, 1000, 10000, 50000];
        } else {
            xTicksList = [1, 10, 50, 100, 500, 1000, 2000, 5000, 10000, 20000, 50000];
        }

        const xTicks = xTicksList
            .filter(r => r <= maxRank)
            .map(r => ({
                label: r >= 1000 ? `${r/1000}k` : r.toString(),
                xPercent: getXPercent(r),
                rank: r
            }));

        const yTicks = [0, 0.25, 0.5, 0.75, 1].map(r => {
            const val = maxScore * r;
            return {
                label: displayMode === 'daily' 
                    ? (val >= 10000 ? `${(val/10000).toFixed(1)}萬` : Math.round(val).toLocaleString())
                    : (val >= 10000 ? `${(val/10000).toFixed(0)}萬` : Math.round(val).toLocaleString()),
                yPercent: r * 100
            };
        });

        // Split Line Position
        const splitLineX = getXPercent(SPLIT_RANK);

        // Tooltip Values
        const getTooltipData = () => {
            if (hoveredRank === null) return null;
            const s1 = d1.find(d => d.rank === hoveredRank)?.score;
            const s2 = d2.find(d => d.rank === hoveredRank)?.score;
            return { s1, s2 };
        };

        // Stats Logic
        const getTrendAnalysis = () => {
             const ranges = [
                { label: 'Top 1-10', min: 1, max: 10 },
                { label: 'Top 10-100', min: 10, max: 100 },
                { label: 'Top 100-1k', min: 100, max: 1000 },
                { label: 'Top 1k-10k', min: 1000, max: 10001 }
            ];

            const name1 = `第${comparisonData.event1?.id}期`;
            const name2 = `第${comparisonData.event2?.id}期`;

            return ranges.map(range => {
                const getMetrics = (data: SimpleRankData[]) => {
                    const inRange = data.filter(d => d.rank >= range.min && d.rank < range.max);
                    if (inRange.length < 2 && range.min > 100) return null;
                    
                    const maxS = Math.max(...inRange.map(d => d.score), 0);
                    const minS = Math.min(...inRange.map(d => d.score), maxS);
                    const avgS = inRange.reduce((a, b) => a + b.score, 0) / (inRange.length || 1);
                    
                    const spread = avgS > 0 ? (maxS - minS) / avgS : 0;
                    return { spread, avgScore: avgS };
                };
                const metricsA = getMetrics(d1);
                const metricsB = getMetrics(d2);

                if (!metricsA || !metricsB) return null;
                
                let steepnessWinner = 'equal';
                if (metricsA.spread > metricsB.spread * 1.1) steepnessWinner = 'A'; 
                else if (metricsB.spread > metricsA.spread * 1.1) steepnessWinner = 'B'; 
                
                let scoreWinner = 'equal';
                if (metricsA.avgScore > metricsB.avgScore * 1.05) scoreWinner = 'A';
                else if (metricsB.avgScore > metricsA.avgScore * 1.05) scoreWinner = 'B';

                // Evaluation Text using Event ID
                let evaluation = '兩者趨勢與分數分佈相近。';
                if (steepnessWinner === 'A' && scoreWinner === 'A') evaluation = `${name1} 分數大幅領先，且排名前段斷層極大 (高度競爭)。`;
                else if (steepnessWinner === 'B' && scoreWinner === 'B') evaluation = `${name2} 分數大幅領先，且排名前段斷層極大 (高度競爭)。`;
                else if (scoreWinner === 'A') evaluation = `${name1} 整體分數較高，需準備更多資源。`;
                else if (scoreWinner === 'B') evaluation = `${name2} 整體分數較高，需準備更多資源。`;
                else if (steepnessWinner === 'A') evaluation = `${name1} 排名分數落差較大，前段名次固化嚴重。`;
                else if (steepnessWinner === 'B') evaluation = `${name2} 排名分數落差較大，前段名次固化嚴重。`;

                return { range: range.label, steepnessWinner, scoreWinner, evaluation };
            }).filter(res => res !== null);
        };

        return {
            color1, color2,
            path1: result1.path,
            path2: result2.path,
            points1: result1.points,
            points2: result2.points,
            xTicks, yTicks,
            splitLineX,
            tooltipValues: getTooltipData(),
            trendStats: getTrendAnalysis(),
            handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => handleMouseMove(e, getXPercent, maxRank, uniqueRanks),
            formatY: (val: number) => Math.round(val).toLocaleString()
        };

    }, [comparisonData, displayMode, hoveredRank, isMobile]);

    if (listError) return <ErrorMessage message={listError} />;

    return (
        <div className="w-full animate-fadeIn py-2">
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">活動比較分析 (Event Comparison)</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">選擇兩期活動，比較其分數線分佈與競爭強度</p>
            </div>

            {/* Selection Controls */}
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-4 shadow-sm">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                    <div className="lg:col-span-2">
                        <Select
                            label="活動 A (Base)"
                            value={selectedId1}
                            onChange={setSelectedId1}
                            options={getOptions(selectedId1)}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <Select
                            label="活動 B (Compare)"
                            value={selectedId2}
                            onChange={setSelectedId2}
                            options={getOptions(selectedId2)}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <Button
                            variant="gradient"
                            fullWidth
                            disabled={isComparing || !selectedId1 || !selectedId2}
                            onClick={handleCompare}
                            isLoading={isComparing}
                        >
                            {isComparing ? '分析中...' : '開始比較'}
                        </Button>
                    </div>
                 </div>
                 <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2">
                     <span className="text-xs font-bold text-slate-500 mr-1">快速搜尋:</span>
                     <Select className="py-1 text-xs" value={selectedUnitFilter} onChange={setSelectedUnitFilter} options={[{ value: 'all', label: '團體' }, ...UNIT_ORDER.map(unit => ({ value: unit, label: unit }))]} />
                     <Select className="py-1 text-xs" value={selectedBannerFilter} onChange={setSelectedBannerFilter} options={[{ value: 'all', label: 'Banner' }, ...BANNER_ORDER.map(banner => ({ value: banner, label: banner }))]} />
                     <Select className="py-1 text-xs" value={selectedStoryFilter} onChange={(val) => setSelectedStoryFilter(val as any)} options={[{ value: 'all', label: '劇情' }, { value: 'unit_event', label: '箱活' }, { value: 'mixed_event', label: '混活' }, { value: 'world_link', label: 'World Link' }]} />
                     <Select className="py-1 text-xs" value={selectedCardFilter} onChange={(val) => setSelectedCardFilter(val as any)} options={[{ value: 'all', label: '卡面' }, { value: 'permanent', label: '常駐' }, { value: 'limited', label: '限定' }, { value: 'special_limited', label: '特殊限定' }]} />
                 </div>
            </div>

            {comparisonError && <ErrorMessage message={comparisonError} />}
            
            {/* Chart Container */}
            {ChartDisplay && (
                <div className="flex flex-col gap-4">
                    {/* Header Controls (Outside Chart) */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 gap-2">
                        {/* Legend - Updated Layout */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 px-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ChartDisplay.color1 }}></div>
                                <div className="flex items-baseline gap-2 overflow-hidden">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{comparisonData.event1?.name}</span>
                                    <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">({comparisonData.event1?.duration.toFixed(1)} 天)</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ChartDisplay.color2 }}></div>
                                <div className="flex items-baseline gap-2 overflow-hidden">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{comparisonData.event2?.name}</span>
                                    <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">({comparisonData.event2?.duration.toFixed(1)} 天)</span>
                                </div>
                            </div>
                        </div>

                        {/* Controls with Info Icon */}
                        <div className="flex items-center gap-2">
                            {/* Info Tooltip */}
                            <div className="group relative">
                                <button className="p-1 text-slate-400 hover:text-cyan-500 dark:text-slate-500 dark:hover:text-cyan-400 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                                <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-64 sm:w-72 p-3 bg-white dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    <p className="mb-1">
                                        <strong className="text-cyan-600 dark:text-cyan-400">陡峭 (Steep):</strong> 名次間分數斷層極大，排名相對固化。
                                    </p>
                                    <p className="mb-1">
                                        <strong className="text-pink-500 dark:text-pink-400">平緩 (Flat):</strong> 名次間分數密集，排名容易變動。
                                    </p>
                                    <p className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 opacity-75 italic">
                                        註：此分析僅基於最終分數數值，無法完全校正改版造成的倍率差異。
                                    </p>
                                </div>
                            </div>

                            <div className="flex bg-slate-100 dark:bg-slate-700 rounded p-1">
                                <button 
                                    onClick={() => setDisplayMode('total')}
                                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${displayMode === 'total' ? 'bg-white dark:bg-slate-600 shadow text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`}
                                >
                                    總分
                                </button>
                                <button 
                                    onClick={() => setDisplayMode('daily')}
                                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${displayMode === 'daily' ? 'bg-white dark:bg-slate-600 shadow text-pink-500' : 'text-slate-500 dark:text-slate-400'}`}
                                >
                                    日均
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Chart Body */}
                    <div className="relative bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-10 select-none h-[400px] sm:h-[500px] flex">
                        
                        {/* Y-Axis Labels (Left Sidebar) */}
                        <div className="w-12 flex-shrink-0 relative h-full border-r border-slate-200 dark:border-slate-700 mr-2">
                            {ChartDisplay.yTicks.map((tick, i) => (
                                <div 
                                    key={`y-${i}`}
                                    className="absolute right-2 transform translate-y-1/2 text-xs text-slate-400 font-mono text-right w-full font-medium"
                                    style={{ bottom: `${tick.yPercent}%` }}
                                >
                                    {tick.label}
                                </div>
                            ))}
                        </div>

                        {/* Main Plot Area */}
                        <div className="flex-1 relative h-full flex flex-col mx-4">
                            {/* Plot Box (Bordered) - Overflow Visible to prevent clipping Rank 1 */}
                            <div 
                                ref={plotAreaRef}
                                className="relative flex-1 border border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/20 overflow-visible cursor-crosshair mb-10"
                                onMouseMove={ChartDisplay.handleMouseMove}
                                onMouseLeave={() => {
                                    setHoveredRank(null);
                                    setCursorPercent(null);
                                }}
                            >
                                {/* Scale Change Separator */}
                                <div 
                                    className="absolute top-0 bottom-0 border-l border-slate-300 dark:border-slate-600 border-dashed"
                                    style={{ left: `${ChartDisplay.splitLineX}%` }}
                                >
                                    <div className="absolute top-1 left-1 text-[9px] text-slate-400 font-mono whitespace-nowrap bg-slate-100/80 dark:bg-slate-800/80 px-1 rounded pointer-events-none">
                                        Scale Change
                                    </div>
                                </div>

                                {/* Y Grid Lines Only */}
                                {ChartDisplay.yTicks.map((tick, i) => (
                                    <div 
                                        key={`yg-${i}`}
                                        className="absolute w-full border-b border-slate-200 dark:border-slate-700/50"
                                        style={{ bottom: `${tick.yPercent}%` }}
                                    />
                                ))}
                                {/* Vertical Grid Lines Removed as requested */}

                                {/* SVG Lines (0-100 coordinate system) */}
                                <svg 
                                    viewBox="0 0 100 100" 
                                    preserveAspectRatio="none"
                                    className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                                >
                                    <path d={ChartDisplay.path1} fill="none" stroke={ChartDisplay.color1} strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d={ChartDisplay.path2} fill="none" stroke={ChartDisplay.color2} strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>

                                {/* Scatter Points (Absolute HTML Divs to avoid aspect-ratio distortion) - Filtered to specific ranks */}
                                {ChartDisplay.points1.map((p, i) => (
                                    <div 
                                        key={`p1-${i}`}
                                        className="absolute w-2.5 h-2.5 rounded-full -ml-[5px] -mt-[5px] pointer-events-none border border-white dark:border-slate-800"
                                        style={{ 
                                            left: `${p.x}%`, 
                                            top: `${p.y}%`, 
                                            backgroundColor: ChartDisplay.color1,
                                            boxShadow: '0 0 2px rgba(0,0,0,0.3)'
                                        }}
                                    />
                                ))}
                                {ChartDisplay.points2.map((p, i) => (
                                    <div 
                                        key={`p2-${i}`}
                                        className="absolute w-2.5 h-2.5 rounded-full -ml-[5px] -mt-[5px] pointer-events-none border border-white dark:border-slate-800"
                                        style={{ 
                                            left: `${p.x}%`, 
                                            top: `${p.y}%`, 
                                            backgroundColor: ChartDisplay.color2,
                                            boxShadow: '0 0 2px rgba(0,0,0,0.3)'
                                        }}
                                    />
                                ))}

                                {/* Cursor Line */}
                                {cursorPercent !== null && (
                                    <div 
                                        className="absolute top-0 bottom-0 border-l border-slate-500 border-dashed pointer-events-none"
                                        style={{ left: `${cursorPercent}%` }}
                                    />
                                )}
                            </div>

                            {/* X-Axis Labels (Bottom) - Moved down by using top-3 */}
                            <div className="absolute bottom-0 left-0 right-0 h-10">
                                {ChartDisplay.xTicks.map((tick, i) => (
                                    <div 
                                        key={`x-${i}`}
                                        className="absolute transform -translate-x-1/2 text-xs font-bold text-slate-500 font-mono text-center top-3"
                                        style={{ left: `${tick.xPercent}%` }}
                                    >
                                        #{tick.label}
                                    </div>
                                ))}
                            </div>

                            {/* Tooltip (Floating over container) */}
                            {hoveredRank !== null && cursorPercent !== null && ChartDisplay.tooltipValues && (
                                <div 
                                    className="absolute z-30 pointer-events-none"
                                    style={{ 
                                        left: `${Math.min(Math.max(cursorPercent, 10), 90)}%`, // Clamp tooltip position
                                        top: '10%',
                                        transform: 'translateX(-50%)' 
                                    }}
                                >
                                    <div className="bg-slate-900/95 text-white text-xs rounded-lg p-3 shadow-xl border border-slate-600 whitespace-nowrap backdrop-blur-md">
                                        <div className="font-bold text-center border-b border-slate-600 pb-1 mb-1 text-slate-300">
                                            Rank {hoveredRank}
                                        </div>
                                        <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1 items-center">
                                            <div className="flex items-center gap-1.5 max-w-[120px]">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ChartDisplay.color1 }}></div>
                                                <span className="text-slate-300 truncate text-[10px]">{comparisonData.event1?.name}</span>
                                            </div>
                                            <span className="font-mono font-bold text-right">
                                                {ChartDisplay.tooltipValues.s1 ? ChartDisplay.formatY(ChartDisplay.tooltipValues.s1) : '—'}
                                            </span>

                                            <div className="flex items-center gap-1.5 max-w-[120px]">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ChartDisplay.color2 }}></div>
                                                <span className="text-slate-300 truncate text-[10px]">{comparisonData.event2?.name}</span>
                                            </div>
                                            <span className="font-mono font-bold text-right">
                                                {ChartDisplay.tooltipValues.s2 ? ChartDisplay.formatY(ChartDisplay.tooltipValues.s2) : '—'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900/95"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Analysis Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {ChartDisplay.trendStats.map((stat, idx) => {
                            const steepColor = stat.steepnessWinner === 'A' ? ChartDisplay.color1 : (stat.steepnessWinner === 'B' ? ChartDisplay.color2 : '#94a3b8');
                            const scoreColor = stat.scoreWinner === 'A' ? ChartDisplay.color1 : (stat.scoreWinner === 'B' ? ChartDisplay.color2 : '#94a3b8');
                            
                            // Use "第X期" instead of Full Name for Card Headers
                            const steepName = stat.steepnessWinner === 'A' ? `第${comparisonData.event1?.id}期` : (stat.steepnessWinner === 'B' ? `第${comparisonData.event2?.id}期` : '—');
                            const scoreName = stat.scoreWinner === 'A' ? `第${comparisonData.event1?.id}期` : (stat.scoreWinner === 'B' ? `第${comparisonData.event2?.id}期` : '—');

                            return (
                                <div key={idx} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-center mb-2 border-b border-slate-100 dark:border-slate-700/50 pb-1">
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{stat.range}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex flex-col text-xs">
                                            <span className="text-slate-400 mb-0.5">競爭陡峭度 (Steepness)</span>
                                            <div className="flex items-center gap-1">
                                                {stat.steepnessWinner !== 'equal' && (
                                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: steepColor }}></div>
                                                )}
                                                <span 
                                                    className="font-bold truncate"
                                                    style={{ color: steepColor }}
                                                >
                                                    {steepName}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col text-xs">
                                            <span className="text-slate-400 mb-0.5">平均分數 (Avg Score)</span>
                                            <div className="flex items-center gap-1">
                                                {stat.scoreWinner !== 'equal' && (
                                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: scoreColor }}></div>
                                                )}
                                                <span 
                                                    className="font-bold truncate"
                                                    style={{ color: scoreColor }}
                                                >
                                                    {scoreName}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/30 text-[11px] leading-tight text-slate-600 dark:text-slate-300 font-medium">
                                            {stat.evaluation}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventComparisonView;
