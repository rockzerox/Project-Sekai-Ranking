
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { EventSummary, PastEventApiResponse, PastEventBorderApiResponse } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { EVENT_DETAILS, WORLD_LINK_IDS, getEventColor, UNIT_ORDER, BANNER_ORDER } from '../constants';

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
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [listError, setListError] = useState<string | null>(null);

    const [selectedId1, setSelectedId1] = useState<string>('');
    const [selectedId2, setSelectedId2] = useState<string>('');
    const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
    const [selectedBannerFilter, setSelectedBannerFilter] = useState<string>('all');
    
    const [comparisonData, setComparisonData] = useState<ComparisonResult>({ event1: null, event2: null });
    const [isComparing, setIsComparing] = useState(false);
    const [comparisonError, setComparisonError] = useState<string | null>(null);

    const [zoomRange, setZoomRange] = useState<{start: number, end: number}>({ start: 0, end: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<number | null>(null);
    
    const [displayMode, setDisplayMode] = useState<'total' | 'daily'>('total');
    
    const calculateEventDays = (startAt: string, closedAt: string): number => {
        const start = new Date(startAt);
        const end = new Date(closedAt);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays - 1);
    };

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch('https://api.hisekai.org/event/list');
                if (!response.ok) throw new Error('Failed to fetch event list');
                const data: EventSummary[] = await response.json();
                
                const now = new Date();
                const pastEvents = data.filter(e => new Date(e.closed_at) < now && !WORLD_LINK_IDS.includes(e.id))
                                       .sort((a, b) => b.id - a.id);
                setEvents(pastEvents);
            } catch (err) {
                setListError('無法載入活動列表');
                console.error(err);
            } finally {
                setIsLoadingList(false);
            }
        };
        fetchEvents();
    }, []);

    const filteredEvents = useMemo(() => {
        let result = events;
        if (selectedUnitFilter !== 'all') {
            result = result.filter(e => EVENT_DETAILS[e.id]?.unit === selectedUnitFilter);
        }
        if (selectedBannerFilter !== 'all') {
            result = result.filter(e => EVENT_DETAILS[e.id]?.banner === selectedBannerFilter);
        }
        return result;
    }, [events, selectedUnitFilter, selectedBannerFilter]);

    const handleCompare = async () => {
        if (!selectedId1 || !selectedId2) return;
        if (selectedId1 === selectedId2) {
            setComparisonError('請選擇兩個不同的活動進行比較');
            return;
        }

        setIsComparing(true);
        setComparisonError(null);
        setComparisonData({ event1: null, event2: null });
        setZoomRange({ start: 0, end: 1 }); 

        try {
            const [res1top, res1border, res2top, res2border] = await Promise.all([
                fetch(`https://api.hisekai.org/event/${selectedId1}/top100`),
                fetch(`https://api.hisekai.org/event/${selectedId1}/border`),
                fetch(`https://api.hisekai.org/event/${selectedId2}/top100`),
                fetch(`https://api.hisekai.org/event/${selectedId2}/border`)
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

            const duration1 = eventSummary1 ? calculateEventDays(eventSummary1.start_at, eventSummary1.closed_at) : 0;
            const duration2 = eventSummary2 ? calculateEventDays(eventSummary2.start_at, eventSummary2.closed_at) : 0;

            const processRankings = (topData: any[], borderData: any[] = []): SimpleRankData[] => {
                const combined = [
                    ...topData.map(r => ({ rank: r.rank, score: r.score })),
                    ...(borderData || []).map(r => ({ rank: r.rank, score: r.score }))
                ];
                const uniqueMap = new Map();
                combined.forEach(item => uniqueMap.set(item.rank, item));
                return Array.from(uniqueMap.values()).sort((a, b) => a.rank - b.rank);
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

    const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!comparisonData.event1) return;
        const svgRect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - svgRect.left;
        const width = 800; 
        const paddingLeft = 60;
        const paddingRight = 40;
        const chartWidth = width - paddingLeft - paddingRight;
        
        let relX = (x - paddingLeft) / chartWidth;
        relX = Math.max(0, Math.min(1, relX));

        setIsDragging(true);
        setDragStart(relX);
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!isDragging || dragStart === null) return;
    };

    const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!isDragging || dragStart === null) return;
        
        const svgRect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - svgRect.left;
        const width = 800;
        const paddingLeft = 60;
        const paddingRight = 40;
        const chartWidth = width - paddingLeft - paddingRight;
        
        let relX = (x - paddingLeft) / chartWidth;
        relX = Math.max(0, Math.min(1, relX));

        const start = Math.min(dragStart, relX);
        const end = Math.max(dragStart, relX);
        
        if (end - start > 0.05) {
            const currentSpan = zoomRange.end - zoomRange.start;
            const newStart = zoomRange.start + (start * currentSpan);
            const newEnd = zoomRange.start + (end * currentSpan);
            setZoomRange({ start: newStart, end: newEnd });
        }
        
        setIsDragging(false);
        setDragStart(null);
    };

    const resetZoom = () => setZoomRange({ start: 0, end: 1 });

    const ChartDisplay = useMemo(() => {
        if (!comparisonData.event1 || !comparisonData.event2) return null;

        // Apply mode transformation
        const d1 = comparisonData.event1.data.map(d => ({
            ...d,
            score: displayMode === 'daily' ? Math.ceil(d.score / Math.max(1, comparisonData.event1!.duration)) : d.score
        }));
        const d2 = comparisonData.event2.data.map(d => ({
            ...d,
            score: displayMode === 'daily' ? Math.ceil(d.score / Math.max(1, comparisonData.event2!.duration)) : d.score
        }));

        const allScores = [...d1.map(d => d.score), ...d2.map(d => d.score)];
        const allRanks = [...d1.map(d => d.rank), ...d2.map(d => d.rank)];
        
        const maxScore = Math.max(...allScores);
        const maxRank = Math.max(...allRanks);
        
        const width = 800;
        const height = 400;
        const padding = { top: 20, right: 40, bottom: 40, left: 60 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const zoomSpan = zoomRange.end - zoomRange.start;
        const splitRatio = 0.3; 
        const logMin = Math.log(100);
        const logMax = Math.log(maxRank || 10000);
        
        const rankToGlobalPos = (rank: number) => {
            if (rank <= 100) {
                return ((rank - 1) / 99) * splitRatio; 
            } else {
                const logVal = Math.log(rank);
                const ratio = (logVal - logMin) / (logMax - logMin);
                return splitRatio + (ratio * (1 - splitRatio)); 
            }
        };

        const getX = (rank: number) => {
            const globalPos = rankToGlobalPos(rank);
            const viewPos = (globalPos - zoomRange.start) / zoomSpan;
            return padding.left + (viewPos * chartWidth);
        };

        const getY = (score: number) => height - padding.bottom - (score / maxScore) * chartHeight;

        const isVisible = (rank: number) => {
             const pos = rankToGlobalPos(rank);
             return pos >= zoomRange.start - 0.1 && pos <= zoomRange.end + 0.1;
        };

        const renderEventVisuals = (data: SimpleRankData[], color: string) => {
            const points = data.map(p => ({ x: getX(p.rank), y: getY(p.score), ...p }));
            
            const solidPoints = points.filter(p => p.rank <= 100);
            let solidPath = "";
            if (solidPoints.length > 0) {
                solidPath = solidPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
                const firstBorder = points.find(p => p.rank > 100);
                if (firstBorder) {
                    solidPath += ` L ${firstBorder.x},${firstBorder.y}`;
                }
            }

            const borderPoints = points.filter(p => p.rank >= 100); 
            let dashedPath = "";
            if (borderPoints.length > 1) {
                 dashedPath = borderPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
            }

            const scatterPoints = points.filter(p => p.rank > 100 && isVisible(p.rank)).map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="4" fill={color} stroke="#1e293b" strokeWidth="1" className="hover:r-6 transition-all cursor-pointer">
                    <title>Rank {p.rank}: {p.score.toLocaleString()}</title>
                </circle>
            ));

            return (
                <g>
                     <defs>
                        <clipPath id="chart-clip">
                            <rect x={padding.left} y={padding.top} width={chartWidth} height={chartHeight} />
                        </clipPath>
                    </defs>
                    <g clipPath="url(#chart-clip)">
                        <path d={solidPath} fill="none" stroke={color} strokeWidth="2" />
                        <path d={dashedPath} fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                        {scatterPoints}
                    </g>
                </g>
            );
        };

        const generateTicks = () => {
            const ticks = [];
            if (isVisible(1)) ticks.push({ rank: 1, label: '#1' });
            if (isVisible(10)) ticks.push({ rank: 10, label: '#10' });
            if (isVisible(50)) ticks.push({ rank: 50, label: '#50' });
            if (isVisible(100)) ticks.push({ rank: 100, label: '#100' });
            
            const logRanks = [200, 500, 1000, 2000, 5000, 10000, 20000, 50000].filter(r => r <= maxRank);
            logRanks.forEach(r => {
                if (isVisible(r)) ticks.push({ rank: r, label: r >= 1000 ? `${r/1000}k` : String(r) });
            });
            return ticks;
        };
        const xTicks = generateTicks();

        // --- TREND & SCORE ANALYSIS LOGIC ---
        const getTrendAnalysis = () => {
            const ranges = [
                { label: 'Top 1-10', min: 1, max: 10 },
                { label: 'Top 10-100', min: 10, max: 100 },
                { label: 'Top 100-1000', min: 100, max: 1000 },
                { label: 'Top 1000+', min: 1000, max: Infinity }
            ];

            const analysisResults = ranges.map(range => {
                const getMetrics = (data: SimpleRankData[]) => {
                    const inRange = data.filter(d => d.rank >= range.min && d.rank < range.max);
                    if (inRange.length < 2) return null;
                    
                    const maxS = Math.max(...inRange.map(d => d.score));
                    const minS = Math.min(...inRange.map(d => d.score));
                    const avgS = inRange.reduce((a, b) => a + b.score, 0) / inRange.length;
                    
                    // Spread Ratio: (Max - Min) / Avg. Higher = Steeper Gap.
                    const spread = (maxS - minS) / avgS; 
                    
                    return { spread, avgScore: avgS };
                };

                const metricsA = getMetrics(d1);
                const metricsB = getMetrics(d2);

                if (metricsA === null || metricsB === null) return null;

                // 1. Steepness Analysis
                let steepnessWinner = 'equal';
                // Threshold: 10% diff
                if (metricsA.spread > metricsB.spread * 1.1) steepnessWinner = 'A'; 
                else if (metricsB.spread > metricsA.spread * 1.1) steepnessWinner = 'B'; 

                // 2. Score/Resource Analysis
                let scoreWinner = 'equal';
                // Threshold: 5% diff
                if (metricsA.avgScore > metricsB.avgScore * 1.05) scoreWinner = 'A';
                else if (metricsB.avgScore > metricsA.avgScore * 1.05) scoreWinner = 'B';

                // 3. Combined Evaluation String
                let evaluation = '';
                if (steepnessWinner === 'A' && scoreWinner === 'A') evaluation = 'A 競爭強度極高，且斷層明顯';
                else if (steepnessWinner === 'B' && scoreWinner === 'B') evaluation = 'B 競爭強度極高，且斷層明顯';
                else if (steepnessWinner === 'equal' && scoreWinner === 'equal') evaluation = '兩者競爭環境與投入程度相當';
                
                else if (steepnessWinner === 'A' && scoreWinner === 'B') evaluation = 'A 前段斷層大，但 B 整體投入較高';
                else if (steepnessWinner === 'B' && scoreWinner === 'A') evaluation = 'B 前段斷層大，但 A 整體投入較高';
                
                else if (steepnessWinner === 'A' && scoreWinner === 'equal') evaluation = '投入相當，但 A 排名競爭較不均';
                else if (steepnessWinner === 'B' && scoreWinner === 'equal') evaluation = '投入相當，但 B 排名競爭較不均';
                
                else if (steepnessWinner === 'equal' && scoreWinner === 'A') evaluation = 'A 整體投入較高，但斷層分佈相似';
                else if (steepnessWinner === 'equal' && scoreWinner === 'B') evaluation = 'B 整體投入較高，但斷層分佈相似';

                return {
                    range: range.label,
                    steepnessWinner,
                    scoreWinner,
                    evaluation
                };
            }).filter(res => res !== null);

            return analysisResults;
        };

        const trendStats = getTrendAnalysis();

        return (
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 sm:p-6 mt-6 shadow-lg transition-colors duration-300">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 border-b border-slate-200 dark:border-slate-700 pb-2 flex flex-wrap justify-between items-center gap-4">
                    <span>📊 綜合分析 (Comprehensive Analysis)</span>
                    <div className="flex gap-2">
                        <div className="bg-white dark:bg-slate-800 p-1 rounded-lg flex border border-slate-300 dark:border-slate-700 shadow-sm mr-2">
                            <button
                                onClick={() => setDisplayMode('total')}
                                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                                    displayMode === 'total' 
                                    ? 'bg-cyan-500 text-white shadow' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                總分
                            </button>
                            <button
                                onClick={() => setDisplayMode('daily')}
                                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                                    displayMode === 'daily' 
                                    ? 'bg-pink-500 text-white shadow' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                日均
                            </button>
                        </div>

                        {zoomSpan < 0.99 && (
                            <button 
                                onClick={resetZoom}
                                className="text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 transition-colors"
                            >
                                重置縮放
                            </button>
                        )}
                    </div>
                </h3>
                
                <div className="mb-4 text-xs text-slate-500 dark:text-slate-400 grid grid-cols-1 sm:grid-cols-2 gap-2">
                     <p>
                        <span className="font-bold text-slate-700 dark:text-slate-300">[趨勢] 陡峭 (Steep):</span> 分數斷層大，排名固化
                     </p>
                     <p>
                        <span className="font-bold text-slate-700 dark:text-slate-300">[數值] 整體分數 (Score):</span> 該區間平均分數，代表資源投入量
                     </p>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 min-w-0 relative group">
                        <div className="absolute top-2 right-2 text-[10px] text-slate-500 bg-white/80 dark:bg-slate-900/50 px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm">
                            拖曳滑鼠可放大區域 (Drag to Zoom)
                        </div>

                        <div className="w-full flex justify-center lg:justify-start items-center bg-slate-50 dark:bg-slate-900/30 rounded-lg p-2 cursor-crosshair overflow-hidden border border-slate-200 dark:border-transparent">
                            <svg 
                                viewBox={`0 0 ${width} ${height}`} 
                                className="w-full h-auto max-h-[50vh]" 
                                preserveAspectRatio="xMidYMid meet"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                            >
                                <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#94a3b8" strokeWidth="1" />
                                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#94a3b8" strokeWidth="1" />
                                
                                {isVisible(100) && (
                                    <line 
                                        x1={getX(100)} 
                                        y1={padding.top} 
                                        x2={getX(100)} 
                                        y2={height - padding.bottom} 
                                        stroke="#94a3b8" 
                                        strokeWidth="1" 
                                        strokeDasharray="2 2"
                                    />
                                )}

                                {xTicks.map(tick => (
                                    <g key={tick.rank}>
                                        <text x={getX(tick.rank)} y={height - 10} textAnchor="middle" fill="#94a3b8" fontSize="10">{tick.label}</text>
                                        <line x1={getX(tick.rank)} y1={height - padding.bottom} x2={getX(tick.rank)} y2={height - padding.bottom + 5} stroke="#94a3b8" />
                                    </g>
                                ))}

                                {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                                    const val = maxScore * ratio;
                                    const y = getY(val);
                                    return (
                                        <g key={ratio}>
                                            <text x={padding.left - 10} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="12">
                                                {displayMode === 'daily' 
                                                    ? val.toLocaleString(undefined, {maximumFractionDigits: 0}) 
                                                    : `${(val / 10000).toFixed(0)}萬`
                                                }
                                            </text>
                                            <line x1={padding.left - 5} y1={y} x2={width - padding.right} y2={y} stroke="#94a3b8" strokeDasharray="4 4" strokeOpacity="0.5" />
                                        </g>
                                    );
                                })}

                                {renderEventVisuals(d1, "#06b6d4")} 
                                {renderEventVisuals(d2, "#f472b6")}
                            </svg>
                        </div>
                    </div>

                    <div className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700 pt-6 lg:pt-0 lg:pl-6 flex flex-col gap-4">
                         <div className="space-y-3 mb-2">
                            <div className="flex items-start gap-2">
                                <div className="w-3 h-3 mt-1.5 rounded-full bg-cyan-500 shrink-0"></div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">活動 A</p>
                                    <p 
                                        className="text-sm font-bold line-clamp-2 leading-tight"
                                        style={{ color: getEventColor(comparisonData.event1?.id || 0) || '#0891b2' }}
                                    >
                                        {comparisonData.event1?.name}
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{comparisonData.event1?.duration} 天</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-3 h-3 mt-1.5 rounded-full bg-pink-500 shrink-0"></div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">活動 B</p>
                                    <p 
                                        className="text-sm font-bold line-clamp-2 leading-tight"
                                        style={{ color: getEventColor(comparisonData.event2?.id || 0) || '#db2777' }}
                                    >
                                        {comparisonData.event2?.name}
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{comparisonData.event2?.duration} 天</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 bg-slate-100 dark:bg-slate-900/40 rounded-lg p-3 max-h-[300px] overflow-y-auto custom-scrollbar border border-slate-200 dark:border-transparent">
                            {trendStats.map((stat, idx) => (
                                <div key={idx} className="flex flex-col border-b border-slate-200 dark:border-slate-800 last:border-0 pb-3 last:pb-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-bold text-slate-800 dark:text-white">{stat.range}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] mb-1">
                                        <div className="flex flex-col">
                                            <span className="text-slate-500">變化 (Steep)</span>
                                            <span className={`font-bold ${
                                                stat.steepnessWinner === 'A' ? 'text-cyan-600' : stat.steepnessWinner === 'B' ? 'text-pink-600' : 'text-slate-500'
                                            }`}>
                                                {stat.steepnessWinner === 'A' ? 'A 較陡' : stat.steepnessWinner === 'B' ? 'B 較陡' : '相似'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-slate-500">分數 (Score)</span>
                                            <span className={`font-bold ${
                                                stat.scoreWinner === 'A' ? 'text-cyan-600' : stat.scoreWinner === 'B' ? 'text-pink-600' : 'text-slate-500'
                                            }`}>
                                                {stat.scoreWinner === 'A' ? 'A 較高' : stat.scoreWinner === 'B' ? 'B 較高' : '相似'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700/50">
                                        {stat.evaluation}
                                    </div>
                                </div>
                            ))}
                            {trendStats.length === 0 && (
                                <p className="text-xs text-center text-slate-500 py-4">無足夠數據進行區間分析</p>
                            )}
                        </div>
                        
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 italic px-1">
                            註：此分析僅基於最終分數數值，無法校正遊戲歷程中因改版造成的活動倍率或計算公式差異。
                        </div>
                    </div>
                </div>
            </div>
        );
    }, [comparisonData, zoomRange, displayMode]);

    return (
        <div className="w-full animate-fadeIn">
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-6 shadow-sm">
                 <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">活動比較 (Event Comparison)</h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            活動 1 (Base Event)
                        </label>
                        <select 
                            value={selectedId1}
                            onChange={(e) => setSelectedId1(e.target.value)}
                            className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        >
                            <option value="">選擇活動...</option>
                            {filteredEvents.map(e => (
                                <option key={e.id} value={e.id} style={{ color: getEventColor(e.id) }}>
                                    #{e.id} {e.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="lg:col-span-2">
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            活動 2 (Comparison)
                        </label>
                        <select 
                             value={selectedId2}
                             onChange={(e) => setSelectedId2(e.target.value)}
                             className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                        >
                            <option value="">選擇活動...</option>
                            {filteredEvents.map(e => (
                                <option key={e.id} value={e.id} style={{ color: getEventColor(e.id) }}>
                                    #{e.id} {e.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="lg:col-span-1">
                        <button
                            onClick={handleCompare}
                            disabled={isComparing || !selectedId1 || !selectedId2}
                            className={`w-full py-2 px-4 rounded font-bold text-white transition-all ${
                                isComparing || !selectedId1 || !selectedId2 
                                ? 'bg-slate-400 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-cyan-500 to-pink-500 hover:opacity-90 shadow-md'
                            }`}
                        >
                            {isComparing ? '分析中...' : '開始比較'}
                        </button>
                    </div>
                 </div>

                 <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2">
                     <span className="text-sm text-slate-500">篩選列表:</span>
                     <select
                        value={selectedUnitFilter}
                        onChange={(e) => setSelectedUnitFilter(e.target.value)}
                        className="text-sm p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                     >
                        <option value="all">所有團體</option>
                        {UNIT_ORDER.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                        ))}
                     </select>

                     <select
                        value={selectedBannerFilter}
                        onChange={(e) => setSelectedBannerFilter(e.target.value)}
                        className="text-sm p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                     >
                        <option value="all">所有 Banner</option>
                        {BANNER_ORDER.map(banner => (
                            <option key={banner} value={banner}>{banner}</option>
                        ))}
                     </select>
                 </div>
            </div>

            {listError && <ErrorMessage message={listError} />}
            {comparisonError && <ErrorMessage message={comparisonError} />}
            
            {ChartDisplay}
        </div>
    );
};

export default EventComparisonView;
