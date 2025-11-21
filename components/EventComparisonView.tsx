
import React, { useState, useEffect, useMemo } from 'react';
import { EventSummary, PastEventApiResponse, PastEventBorderApiResponse } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface SimpleRankData {
    rank: number;
    score: number;
}

interface ComparisonResult {
    event1: { name: string; data: SimpleRankData[]; duration: number } | null;
    event2: { name: string; data: SimpleRankData[]; duration: number } | null;
}

const EventComparisonView: React.FC = () => {
    const [events, setEvents] = useState<EventSummary[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [listError, setListError] = useState<string | null>(null);

    const [selectedId1, setSelectedId1] = useState<string>('');
    const [selectedId2, setSelectedId2] = useState<string>('');
    
    const [comparisonData, setComparisonData] = useState<ComparisonResult>({ event1: null, event2: null });
    const [isComparing, setIsComparing] = useState(false);
    const [comparisonError, setComparisonError] = useState<string | null>(null);

    // Helper to calculate duration
    const calculateEventDays = (startAt: string, closedAt: string): number => {
        const start = new Date(startAt);
        const end = new Date(closedAt);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        // Deduct 1 rest day as requested
        return Math.max(0, diffDays - 1);
    };

    // Load Event List
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch('https://api.hisekai.org/event/list');
                if (!response.ok) throw new Error('Failed to fetch event list');
                const data: EventSummary[] = await response.json();
                
                const now = new Date();
                // Filter only closed events
                const pastEvents = data.filter(e => new Date(e.closed_at) < now)
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

    const handleCompare = async () => {
        if (!selectedId1 || !selectedId2) return;
        if (selectedId1 === selectedId2) {
            setComparisonError('請選擇兩個不同的活動進行比較');
            return;
        }

        setIsComparing(true);
        setComparisonError(null);
        setComparisonData({ event1: null, event2: null });

        try {
            // Fetch both Top 100 and Border (Highlights) for both events (4 requests)
            const [res1top, res1border, res2top, res2border] = await Promise.all([
                fetch(`https://api.hisekai.org/event/${selectedId1}/top100`),
                fetch(`https://api.hisekai.org/event/${selectedId1}/border`),
                fetch(`https://api.hisekai.org/event/${selectedId2}/top100`),
                fetch(`https://api.hisekai.org/event/${selectedId2}/border`)
            ]);

            if (!res1top.ok || !res2top.ok) throw new Error('無法取得活動排行資料');
            // Border APIs might fail or return empty if very old event, but we proceed if top100 is ok.
            
            const sanitize = (txt: string) => txt.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');

            const text1top = await res1top.text();
            const text2top = await res2top.text();
            const data1top: PastEventApiResponse = JSON.parse(sanitize(text1top));
            const data2top: PastEventApiResponse = JSON.parse(sanitize(text2top));

            // Handle borders
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
                // Remove duplicates and sort
                const uniqueMap = new Map();
                combined.forEach(item => uniqueMap.set(item.rank, item));
                return Array.from(uniqueMap.values()).sort((a, b) => a.rank - b.rank);
            };

            setComparisonData({
                event1: { name: eventName1, data: processRankings(data1top.rankings, data1border.borderRankings), duration: duration1 },
                event2: { name: eventName2, data: processRankings(data2top.rankings, data2border.borderRankings), duration: duration2 }
            });

        } catch (err) {
            setComparisonError('載入比較資料時發生錯誤。');
            console.error(err);
        } finally {
            setIsComparing(false);
        }
    };

    const ChartDisplay = useMemo(() => {
        if (!comparisonData.event1 || !comparisonData.event2) return null;

        const d1 = comparisonData.event1.data;
        const d2 = comparisonData.event2.data;

        // Data Ranges
        const allScores = [...d1.map(d => d.score), ...d2.map(d => d.score)];
        const allRanks = [...d1.map(d => d.rank), ...d2.map(d => d.rank)];
        
        const maxScore = Math.max(...allScores);
        const maxRank = Math.max(...allRanks);
        
        // Dimensions - Internal coordinate system
        const width = 800;
        const height = 400;
        const padding = { top: 20, right: 40, bottom: 40, left: 60 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // --- Hybrid X-Axis Logic ---
        // Split chart: 30% for Top 100 (Linear), 70% for Highlights (Logarithmic)
        const splitRatio = 0.3; 
        const splitPixel = chartWidth * splitRatio;
        
        // Constants for Log scale
        const logMin = Math.log(100);
        const logMax = Math.log(maxRank || 10000); // Fallback if no borders

        const getX = (rank: number) => {
            if (rank <= 100) {
                // Linear Zone (Rank 1 to 100)
                // Map 1..100 -> 0..splitPixel
                return padding.left + ((rank - 1) / 99) * splitPixel;
            } else {
                // Log Zone (Rank 100 to Max)
                // Map log(100)..log(max) -> splitPixel..chartWidth
                const logVal = Math.log(rank);
                const ratio = (logVal - logMin) / (logMax - logMin);
                return padding.left + splitPixel + (ratio * (chartWidth - splitPixel));
            }
        };

        const getY = (score: number) => height - padding.bottom - (score / maxScore) * chartHeight;

        // Path Generator (Solid for <= 100, Dashed for > 100)
        // Note: This is visual only, lines > 100 are estimates
        const renderEventVisuals = (data: SimpleRankData[], color: string) => {
            // Split data into continuous chunks? 
            // Actually, we just draw a polyline. 
            // But we want dashed for > 100.
            
            const points = data.map(p => ({ x: getX(p.rank), y: getY(p.score), ...p }));
            
            // 1. Draw Solid Line for Rank <= 100
            const solidPoints = points.filter(p => p.rank <= 100);
            let solidPath = "";
            if (solidPoints.length > 0) {
                solidPath = solidPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
                
                // Connect to the first border point if exists to bridge the gap visually
                const firstBorder = points.find(p => p.rank > 100);
                if (firstBorder) {
                    solidPath += ` L ${firstBorder.x},${firstBorder.y}`;
                }
            }

            // 2. Draw Dashed Line for Rank > 100 (Fitting line)
            const borderPoints = points.filter(p => p.rank >= 100); // Overlap at 100 for continuity
            let dashedPath = "";
            if (borderPoints.length > 1) {
                 dashedPath = borderPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
            }

            // 3. Draw Circles for Highlights (Rank > 100)
            const scatterPoints = points.filter(p => p.rank > 100).map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke="#1e293b" strokeWidth="1">
                    <title>Rank {p.rank}: {p.score.toLocaleString()}</title>
                </circle>
            ));

            return (
                <g>
                    <path d={solidPath} fill="none" stroke={color} strokeWidth="2" />
                    <path d={dashedPath} fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                    {scatterPoints}
                </g>
            );
        };

        // --- Analysis Helpers ---
        const getScoreAtRank = (data: SimpleRankData[], rank: number) => {
            const item = data.find(r => r.rank === rank);
            return item ? item.score : 0;
        };

        const comparePoint = (rank: number, label: string) => {
            const s1 = getScoreAtRank(d1, rank);
            const s2 = getScoreAtRank(d2, rank);
            const diff = s1 - s2;
            const higher = diff > 0 ? 'A' : (diff < 0 ? 'B' : 'Equal');
            const percent = s2 === 0 ? 0 : ((s1 - s2) / s2) * 100;
            
            return { rank, label, s1, s2, diff, higher, percent };
        };

        // Dynamic stat points based on available data
        const availableBorderRanks = Array.from(new Set([...d1, ...d2].map(d => d.rank).filter(r => r > 100))).sort((a, b) => a - b);
        
        // Pick representative ranks for analysis
        const ranksOfInterest = [1, 10, 100];
        // Add first common border, middle border, max border if available
        if (availableBorderRanks.includes(1000)) ranksOfInterest.push(1000);
        else if (availableBorderRanks.length > 0) ranksOfInterest.push(availableBorderRanks[0]);
        
        if (availableBorderRanks.length > 0) {
             const maxR = availableBorderRanks[availableBorderRanks.length - 1];
             if (!ranksOfInterest.includes(maxR)) ranksOfInterest.push(maxR);
        }

        const stats = ranksOfInterest.map(r => comparePoint(r, r <= 100 ? `Top ${r}` : `Rank ${r}`));

        const formatScore = (num: number) => {
            if (num === 0) return '-';
            if (num > 10000) return `${(num / 10000).toFixed(2)}萬`;
            return num.toLocaleString();
        };

        const totalScore1 = d1.reduce((acc, curr) => acc + curr.score, 0);
        const totalScore2 = d2.reduce((acc, curr) => acc + curr.score, 0);
        const totalDiffPercent = ((totalScore2 - totalScore1) / totalScore1) * 100;
        
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 sm:p-6 mt-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-2">📊 數據比較與分析 (Data Comparison)</h3>
                
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Side: Chart */}
                    <div className="flex-1 min-w-0">
                        <div className="w-full flex justify-center lg:justify-start items-center bg-slate-900/30 rounded-lg p-2">
                            <svg 
                                viewBox={`0 0 ${width} ${height}`} 
                                className="w-full h-auto max-h-[50vh]" 
                                preserveAspectRatio="xMidYMid meet"
                            >
                                {/* Grid Lines & Axis */}
                                <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#475569" strokeWidth="1" />
                                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#475569" strokeWidth="1" />
                                
                                {/* Vertical Split Line at Rank 100 */}
                                <line 
                                    x1={padding.left + splitPixel} 
                                    y1={padding.top} 
                                    x2={padding.left + splitPixel} 
                                    y2={height - padding.bottom} 
                                    stroke="#475569" 
                                    strokeWidth="1" 
                                    strokeDasharray="2 2"
                                />

                                {/* X Axis Labels */}
                                {/* Linear Part */}
                                {[1, 50, 100].map(rank => (
                                    <g key={rank}>
                                        <text x={getX(rank)} y={height - 10} textAnchor="middle" fill="#94a3b8" fontSize="10">#{rank}</text>
                                        <line x1={getX(rank)} y1={height - padding.bottom} x2={getX(rank)} y2={height - padding.bottom + 5} stroke="#475569" />
                                    </g>
                                ))}
                                {/* Log Part (Sample ranks) */}
                                {[200, 500, 1000, 2000, 5000, 10000, 20000, 50000].filter(r => r <= maxRank).map(rank => (
                                     <g key={rank}>
                                        <text x={getX(rank)} y={height - 10} textAnchor="middle" fill="#94a3b8" fontSize="10">
                                            {rank >= 1000 ? `${rank/1000}k` : rank}
                                        </text>
                                        <line x1={getX(rank)} y1={height - padding.bottom} x2={getX(rank)} y2={height - padding.bottom + 5} stroke="#475569" />
                                    </g>
                                ))}

                                {/* Y Axis Labels (Score) */}
                                {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                                    const val = maxScore * ratio;
                                    const y = getY(val);
                                    return (
                                        <g key={ratio}>
                                            <text x={padding.left - 10} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="12">
                                                {(val / 10000).toFixed(0)}萬
                                            </text>
                                            <line x1={padding.left - 5} y1={y} x2={width - padding.right} y2={y} stroke="#334155" strokeDasharray="4 4" />
                                        </g>
                                    );
                                })}

                                {/* Events */}
                                {renderEventVisuals(d1, "#06b6d4")} {/* Cyan */}
                                {renderEventVisuals(d2, "#f472b6")} {/* Pink */}
                            </svg>
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-slate-500 px-4">
                            <span>Top 100 (線性 Linear)</span>
                            <span>Rank 100+ (精彩片段 / 對數 Logarithmic)</span>
                        </div>
                    </div>

                    {/* Right Side: Analysis Panel */}
                    <div className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-700 pt-6 lg:pt-0 lg:pl-6 flex flex-col gap-4">
                        
                        {/* Legend / Header */}
                        <div className="space-y-3 mb-2">
                            <div className="flex items-start gap-2">
                                <div className="w-3 h-3 mt-1.5 rounded-full bg-cyan-500 shrink-0"></div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold">活動 A (基準)</p>
                                    <p className="text-sm text-cyan-300 line-clamp-2 leading-tight">{comparisonData.event1?.name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 font-mono">天數: {comparisonData.event1?.duration} 天</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-3 h-3 mt-1.5 rounded-full bg-pink-500 shrink-0"></div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold">活動 B (比較對象)</p>
                                    <p className="text-sm text-pink-300 line-clamp-2 leading-tight">{comparisonData.event2?.name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 font-mono">天數: {comparisonData.event2?.duration} 天</p>
                                </div>
                            </div>
                        </div>

                        {/* Stat Comparison List */}
                        <div className="space-y-3 bg-slate-900/40 rounded-lg p-3 max-h-64 overflow-y-auto custom-scrollbar">
                            {stats.map((stat) => (
                                <div key={stat.rank} className="flex flex-col border-b border-slate-800 last:border-0 pb-2 last:pb-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-bold text-white">{stat.label}</span>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                            stat.s1 === 0 || stat.s2 === 0 ? 'bg-slate-700 text-slate-400' :
                                            stat.higher === 'A' ? 'bg-cyan-900 text-cyan-300' : 
                                            stat.higher === 'B' ? 'bg-pink-900 text-pink-300' : 'bg-slate-700 text-slate-300'
                                        }`}>
                                            {stat.s1 === 0 || stat.s2 === 0 ? 'N/A' : stat.higher === 'A' ? 'A 勝' : stat.higher === 'B' ? 'B 勝' : '平手'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-cyan-500/80">{formatScore(stat.s1)}</span>
                                        <span className="text-slate-600">vs</span>
                                        <span className="text-pink-500/80">{formatScore(stat.s2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary & Disclaimer */}
                        <div className="space-y-2">
                            <div className="bg-slate-700/30 p-3 rounded text-xs text-slate-300 leading-relaxed">
                                <strong className="block text-white mb-1">📈 分析摘要</strong>
                                {totalDiffPercent > 5 
                                    ? "活動 B 的整體競爭強度明顯高於活動 A。"
                                    : totalDiffPercent < -5
                                    ? "活動 B 的整體競爭強度低於活動 A。"
                                    : "兩期活動的整體競爭強度相當接近。"
                                }
                            </div>
                            <div className="bg-amber-900/20 border border-amber-500/30 p-3 rounded text-[11px] text-amber-200/80 leading-relaxed">
                                <strong className="block text-amber-400 mb-1">⚠️ 趨勢圖說明</strong>
                                圖表右側 (Rank 100+) 使用「散布圖」與「虛線擬合」呈現。
                                由於精彩片段僅提供特定名次 (如 200, 1000)，虛線僅為連結這些點的趨勢示意，
                                <strong>並非代表中間名次的實際連續分數</strong>，請避免誤讀。
                                <br/>
                                此外，X軸在 Rank 100 後採用非線性比例 (斷軸/對數) 以容納大範圍排名。
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }, [comparisonData]);

    if (isLoadingList) return <LoadingSpinner />;
    if (listError) return <ErrorMessage message={listError} />;

    return (
        <div className="w-full animate-fadeIn">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">活動比較分析 (Event Comparison)</h2>
                <p className="text-slate-400">比較過往任意兩期活動的分數分佈 (含前百與精彩片段)</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Selection 1 */}
                    <div>
                        <label className="block text-cyan-400 font-bold mb-2 text-sm sm:text-base">活動 A (基準)</label>
                        <select 
                            value={selectedId1}
                            onChange={(e) => setSelectedId1(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 sm:p-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none text-sm sm:text-base"
                        >
                            <option value="">-- 請選擇活動 --</option>
                            {events.map(e => (
                                <option key={e.id} value={e.id} disabled={e.id.toString() === selectedId2}>
                                    #{e.id} {e.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Selection 2 */}
                    <div>
                        <label className="block text-pink-400 font-bold mb-2 text-sm sm:text-base">活動 B (比較對象)</label>
                        <select 
                            value={selectedId2}
                            onChange={(e) => setSelectedId2(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 sm:p-3 text-white focus:ring-2 focus:ring-pink-500 outline-none text-sm sm:text-base"
                        >
                            <option value="">-- 請選擇活動 --</option>
                            {events.map(e => (
                                <option key={e.id} value={e.id} disabled={e.id.toString() === selectedId1}>
                                    #{e.id} {e.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={handleCompare}
                        disabled={!selectedId1 || !selectedId2 || isComparing}
                        className={`
                            px-6 py-2 sm:px-8 sm:py-3 rounded-lg font-bold text-base sm:text-lg transition-all duration-200 shadow-lg
                            ${!selectedId1 || !selectedId2 || isComparing
                                ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-cyan-600 to-pink-600 text-white hover:from-cyan-500 hover:to-pink-500 transform hover:scale-105'
                            }
                        `}
                    >
                        {isComparing ? '分析中...' : '開始比較分析'}
                    </button>
                </div>

                {comparisonError && (
                    <div className="mt-4 p-3 bg-red-900/30 border border-red-500 rounded text-red-200 text-center">
                        {comparisonError}
                    </div>
                )}
            </div>

            {ChartDisplay}
        </div>
    );
};

export default EventComparisonView;
