
import React, { useState, useEffect, useMemo } from 'react';
import { EventSummary, PastEventApiResponse } from '../types';
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
            // Fetch both in parallel
            const [res1, res2] = await Promise.all([
                fetch(`https://api.hisekai.org/event/${selectedId1}/top100`),
                fetch(`https://api.hisekai.org/event/${selectedId2}/top100`)
            ]);

            if (!res1.ok || !res2.ok) throw new Error('無法取得活動資料');

            const text1 = await res1.text();
            const text2 = await res2.text();

            // Robust regex sanitization for any key ending in "Id" or "id"
            const sanitize = (txt: string) => txt.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');

            const data1: PastEventApiResponse = JSON.parse(sanitize(text1));
            const data2: PastEventApiResponse = JSON.parse(sanitize(text2));

            const eventSummary1 = events.find(e => e.id.toString() === selectedId1);
            const eventSummary2 = events.find(e => e.id.toString() === selectedId2);

            const eventName1 = eventSummary1?.name || `Event ${selectedId1}`;
            const eventName2 = eventSummary2?.name || `Event ${selectedId2}`;

            const duration1 = eventSummary1 ? calculateEventDays(eventSummary1.start_at, eventSummary1.closed_at) : 0;
            const duration2 = eventSummary2 ? calculateEventDays(eventSummary2.start_at, eventSummary2.closed_at) : 0;

            const processRankings = (rankings: any[]): SimpleRankData[] => {
                return rankings.map(r => ({ rank: r.rank, score: r.score })).sort((a, b) => a.rank - b.rank);
            };

            setComparisonData({
                event1: { name: eventName1, data: processRankings(data1.rankings), duration: duration1 },
                event2: { name: eventName2, data: processRankings(data2.rankings), duration: duration2 }
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

        // Combine data to find max values for scaling
        const allScores = [...d1.map(d => d.score), ...d2.map(d => d.score)];
        const maxScore = Math.max(...allScores);
        
        // Dimensions - Internal coordinate system
        const width = 800;
        const height = 400;
        const padding = { top: 20, right: 20, bottom: 40, left: 60 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Helpers
        const getX = (rank: number) => (rank / 100) * chartWidth + padding.left; // Assuming 100 ranks
        const getY = (score: number) => height - padding.bottom - (score / maxScore) * chartHeight;

        const createPath = (data: SimpleRankData[]) => {
            return data.map((p, i) => {
                const x = getX(p.rank);
                const y = getY(p.score);
                return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
            }).join(' ');
        };

        const path1 = createPath(d1);
        const path2 = createPath(d2);

        // --- Analysis Helpers ---
        const getScoreAtRank = (data: SimpleRankData[], rank: number) => {
            const item = data.find(r => r.rank === rank);
            // If exact rank missing (unlikely for 1/100 but possible), find closest or return 0
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

        const stats = [
            comparePoint(1, "Top 1 (榜首)"),
            comparePoint(10, "Top 10 (十榜)"),
            comparePoint(50, "Top 50 (五十榜)"),
            comparePoint(100, "Top 100 (百榜線)")
        ];

        const formatScore = (num: number) => {
            if (num > 10000) return `${(num / 10000).toFixed(2)}萬`;
            return num.toLocaleString();
        };

        const totalScore1 = d1.reduce((acc, curr) => acc + curr.score, 0);
        const totalScore2 = d2.reduce((acc, curr) => acc + curr.score, 0);
        const totalDiffPercent = ((totalScore2 - totalScore1) / totalScore1) * 100;
        
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 sm:p-6 mt-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-2">📊 數據比較與分析</h3>
                
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
                                
                                {/* X Axis Labels (Rank 1, 50, 100) */}
                                {[1, 25, 50, 75, 100].map(rank => (
                                    <g key={rank}>
                                        <text x={getX(rank)} y={height - 10} textAnchor="middle" fill="#94a3b8" fontSize="12">#{rank}</text>
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

                                {/* Paths */}
                                <path d={path1} fill="none" stroke="#06b6d4" strokeWidth="3" /> {/* Cyan - Event 1 */}
                                <path d={path2} fill="none" stroke="#f472b6" strokeWidth="3" /> {/* Pink - Event 2 */}
                            </svg>
                        </div>
                        <div className="mt-2 text-center text-xs text-slate-500">
                            X軸: 排名 (Rank) / Y軸: 分數 (Score)
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
                        <div className="space-y-3 bg-slate-900/40 rounded-lg p-3">
                            {stats.map((stat) => (
                                <div key={stat.rank} className="flex flex-col border-b border-slate-800 last:border-0 pb-2 last:pb-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-bold text-white">{stat.label}</span>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                            stat.higher === 'A' ? 'bg-cyan-900 text-cyan-300' : 
                                            stat.higher === 'B' ? 'bg-pink-900 text-pink-300' : 'bg-slate-700 text-slate-300'
                                        }`}>
                                            {stat.higher === 'A' ? 'A 勝' : stat.higher === 'B' ? 'B 勝' : '平手'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-cyan-500/80">{formatScore(stat.s1)}</span>
                                        <span className="text-slate-600">vs</span>
                                        <span className="text-pink-500/80">{formatScore(stat.s2)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] ${stat.diff > 0 ? 'text-cyan-400' : 'text-pink-400'}`}>
                                            差異: {Math.abs(stat.diff).toLocaleString()} ({Math.abs(stat.percent).toFixed(1)}%)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="bg-slate-700/30 p-3 rounded text-xs text-slate-300 leading-relaxed">
                            <strong className="block text-white mb-1">📈 分析摘要</strong>
                            {totalDiffPercent > 5 
                                ? "活動 B 的前百競爭強度整體明顯高於活動 A，分數線普遍提升。"
                                : totalDiffPercent < -5
                                ? "活動 B 的前百競爭強度整體低於活動 A，分數線呈現下降趨勢。"
                                : "兩期活動的前百競爭強度相當接近，分數分佈模式相似。"
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }, [comparisonData]);

    if (isLoadingList) return <LoadingSpinner />;
    if (listError) return <ErrorMessage message={listError} />;

    return (
        <div className="container mx-auto px-4 py-6 animate-fadeIn">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">活動比較分析 (Event Comparison)</h2>
                <p className="text-slate-400">比較過往任意兩期活動的前百名分數分佈</p>
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
