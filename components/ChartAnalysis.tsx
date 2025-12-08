
import React, { useState, useEffect, useMemo } from 'react';
import { RankEntry, SortOption, HisekaiBorderApiResponse, PastEventBorderApiResponse, HisekaiApiResponse } from '../types';
import LineChart from './LineChart';
import CrownIcon from './icons/CrownIcon';

interface ChartAnalysisProps {
  rankings: RankEntry[];
  sortOption: SortOption;
  isHighlights?: boolean;
  eventId?: number; // If undefined, implies Live event
}

// Helper for simple border items
interface BorderItem {
    rank: number;
    score: number;
    name: string;
}

const ChartAnalysis: React.FC<ChartAnalysisProps> = ({ rankings, sortOption, isHighlights = false, eventId }) => {
  
  const [borderData, setBorderData] = useState<BorderItem[]>([]);
  const [liveAggregateAt, setLiveAggregateAt] = useState<string | null>(null);
  const [t100Score, setT100Score] = useState<number>(0);
  const [t100SafeCount, setT100SafeCount] = useState<number | null>(null);
  
  // Selected Rank for Highlights Safety calculation (Default T200)
  const [selectedHighlightRank, setSelectedHighlightRank] = useState<number>(200);

  // Fetch border data when viewing Score distribution
  useEffect(() => {
    const fetchData = async () => {
        if (sortOption !== 'score') {
            setBorderData([]);
            return;
        }

        try {
            // 1. Fetch Border Data if needed (Highlights or Past Events)
            if (isHighlights) {
                const url = eventId 
                    ? `https://api.hisekai.org/event/${eventId}/border`
                    : `https://api.hisekai.org/event/live/border`;

                const response = await fetch(url);
                if (response.ok) {
                    const text = await response.text();
                    const sanitized = text.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');
                    const json = JSON.parse(sanitized);
                    
                    let items: BorderItem[] = [];
                    if (eventId) {
                        const data = json as PastEventBorderApiResponse;
                        if (data.borderRankings) {
                            items = data.borderRankings.map(r => ({ rank: r.rank, score: r.score, name: r.name }));
                        }
                    } else {
                        const data = json as HisekaiBorderApiResponse;
                        if (data.border_player_rankings) {
                            items = data.border_player_rankings.map(r => ({ rank: r.rank, score: r.score, name: r.name }));
                        }
                    }
                    setBorderData(items);
                }
            }

            // 2. Fetch Live Event Timing (For Safety Calculation) if Live Mode
            if (!eventId) {
                const resTop = await fetch('https://api.hisekai.org/event/live/top100');
                if (resTop.ok) {
                    const textTop = await resTop.text();
                    const sanitizedTop = textTop.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');
                    const topData: HisekaiApiResponse = JSON.parse(sanitizedTop);
                    setLiveAggregateAt(topData.aggregate_at);

                    // Store T100 score for calculation purposes
                    const r100 = topData.top_100_player_rankings.find(r => r.rank === 100);
                    if (r100) setT100Score(r100.score);

                    // Calculate precise T100 safety slots
                    const now = Date.now();
                    const end = new Date(topData.aggregate_at).getTime();
                    const remainingSeconds = (end - now) / 1000;
                    if (remainingSeconds > 0) {
                        const maxGain = (remainingSeconds / 100) * 68000;
                        const safeThreshold = (r100?.score || 0) + maxGain;
                        const safeCount = topData.top_100_player_rankings.filter(r => r.score > safeThreshold).length;
                        setT100SafeCount(safeCount);
                    } else {
                        setT100SafeCount(100); // Event ended, all fixed? or 0? irrelevant as calculations stop.
                    }
                }
            }

        } catch (e) {
            console.error("Failed to fetch chart data", e);
        }
    };

    fetchData();
  }, [sortOption, eventId, isHighlights]);


  const { chartData, title, valueFormatter, yAxisFormatter, color, yLabel, safeThreshold, giveUpThreshold, safeRankCutoff, giveUpRankCutoff, chartVariant, remainingSafeSlots } = useMemo(() => {
    let data: { label: string, value: number, rank?: number }[] = [];
    let chartTitle = '';
    let formatter = (v: number) => Math.round(v).toLocaleString();
    let axisFormatter = (v: number) => Math.round(v).toLocaleString();
    let chartColor = 'cyan'; 
    let axisY = 'Value';
    
    let calculatedSafeThreshold: number | undefined = undefined;
    let calculatedGiveUpThreshold: number | undefined = undefined;
    let calculatedSafeRankCutoff: number | undefined = undefined;
    let calculatedGiveUpRankCutoff: number | undefined = undefined;
    let calculatedRemainingSlots: number | undefined = undefined;
    let variant: 'live' | 'highlights' | 'default' = 'default';

    // Base Data: Top 100 sorted by Rank
    const sourceData = [...rankings].sort((a, b) => a.rank - b.rank);

    // Helper: Log-Log Inverse Cosine Interpolation
    const findCutoffRank = (dataPoints: { value: number, rank?: number }[], threshold: number, maxRankFallback: number) => {
        const firstUnsafeIdx = dataPoints.findIndex(d => d.value <= threshold);
        
        if (firstUnsafeIdx === -1) return maxRankFallback; 
        if (firstUnsafeIdx === 0) return 0; 

        const d1 = dataPoints[firstUnsafeIdx - 1]; 
        const d2 = dataPoints[firstUnsafeIdx];     
        
        if (d1.value > 0 && d2.value > 0 && threshold > 0 && d1.rank && d2.rank) {
             const lnY = Math.log(threshold);
             const lnY1 = Math.log(d1.value);
             const lnY2 = Math.log(d2.value);
             
             const t_curved = (lnY - lnY1) / (lnY2 - lnY1);
             const t_curved_clamped = Math.max(0, Math.min(1, t_curved));

             const t_linear = Math.acos(1 - 2 * t_curved_clamped) / Math.PI;

             return d1.rank + (d2.rank - d1.rank) * t_linear;

        } else {
             const ratio = (threshold - d1.value) / (d2.value - d1.value);
             return (d1.rank || 0) + ((d2.rank || 0) - (d1.rank || 0)) * ratio;
        }
    };

    switch(sortOption) {
        case 'score':
            chartTitle = isHighlights ? '精彩片段分佈 (Highlights)' : 'Top 100 總分分佈';
            axisY = '分數 (Score)';
            
            if (isHighlights) {
                variant = 'highlights';
                data = borderData
                    .filter(b => b.rank <= 10000 && b.score > 0)
                    .map(b => ({
                        label: `#${b.rank} ${b.name || 'Player'}`,
                        value: b.score,
                        rank: b.rank
                    }))
                    .sort((a, b) => (a.rank || 0) - (b.rank || 0));

                // Live Event Highlights: Calculate Safe/GiveUp for SELECTED RANK
                if (!eventId && liveAggregateAt) {
                    const now = Date.now();
                    const end = new Date(liveAggregateAt).getTime();
                    const remainingSeconds = (end - now) / 1000;

                    if (remainingSeconds > 0) {
                        const maxGain = (remainingSeconds / 100) * 68000;
                        
                        let rankScore = 0;
                        if (selectedHighlightRank === 100) {
                            rankScore = t100Score;
                        } else {
                            rankScore = borderData.find(b => b.rank === selectedHighlightRank)?.score || 0;
                        }
                        
                        if (rankScore > 0) {
                            calculatedSafeThreshold = rankScore + maxGain;
                            calculatedGiveUpThreshold = Math.max(0, rankScore - maxGain);

                            // Note: For T100 in highlights, cutoff might be < 100, which findCutoffRank handles as 0
                            calculatedSafeRankCutoff = findCutoffRank(data, calculatedSafeThreshold, 10000);
                            calculatedGiveUpRankCutoff = findCutoffRank(data, calculatedGiveUpThreshold, 10001);
                        }
                    }
                }

            } else {
                variant = 'live'; // Top 100
                data = sourceData.map(r => ({ 
                    label: `#${r.rank} ${r.user.display_name}`, 
                    value: r.score,
                    rank: r.rank
                }));

                if (!eventId && liveAggregateAt && data.length > 0) {
                    const now = Date.now();
                    const end = new Date(liveAggregateAt).getTime();
                    const remainingSeconds = (end - now) / 1000;

                    if (remainingSeconds > 0) {
                        const maxGain = (remainingSeconds / 100) * 68000;
                        const rank100Score = data.find(r => r.rank === 100)?.value || 0; 
                        calculatedSafeThreshold = rank100Score + maxGain;

                        calculatedSafeRankCutoff = findCutoffRank(data, calculatedSafeThreshold, 100);

                        const safelySecuredCount = data.filter(r => r.value > calculatedSafeThreshold!).length;
                        calculatedRemainingSlots = Math.max(0, 100 - safelySecuredCount);
                    }
                }
            }
            
            chartColor = 'cyan';
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(0)}萬` : v.toLocaleString();
            break;
        
        case 'lastPlayedAt':
            chartTitle = '最後上線時間';
            axisY = '分鐘 (Mins)';
            const now = Date.now();
            data = isHighlights ? [] : sourceData.map(r => ({ 
                label: `#${r.rank}`, 
                value: Math.max(0, (now - new Date(r.lastPlayedAt).getTime()) / 60000),
                rank: r.rank
            }));
            chartColor = 'indigo';
            break;
        default:
            data = isHighlights ? [] : sourceData.map(r => ({ 
                label: `#${r.rank}`, 
                value: (r.stats as any)[sortOption.split('_')[0]]?.[sortOption.split('_')[1]] || 0,
                rank: r.rank
            }));
    }

    return { 
        chartData: data, 
        title: chartTitle, 
        valueFormatter: formatter, 
        yAxisFormatter: axisFormatter, 
        color: chartColor, 
        yLabel: axisY,
        safeThreshold: calculatedSafeThreshold,
        giveUpThreshold: calculatedGiveUpThreshold,
        safeRankCutoff: calculatedSafeRankCutoff,
        giveUpRankCutoff: calculatedGiveUpRankCutoff,
        chartVariant: variant,
        remainingSafeSlots: calculatedRemainingSlots
    };

  }, [rankings, sortOption, borderData, isHighlights, eventId, liveAggregateAt, selectedHighlightRank, t100Score]);

  // Derive Dashboard Stats for Highlights
  const dashboardStats = useMemo(() => {
    // Check undefined only, allow 0
    if (!isHighlights || safeRankCutoff === undefined || giveUpRankCutoff === undefined) return null;
    
    const safe = Math.floor(safeRankCutoff);
    const giveUp = Math.ceil(giveUpRankCutoff);
    const battleSize = Math.max(0, giveUp - safe);

    return { safe, giveUp, battleSize };
  }, [isHighlights, safeRankCutoff, giveUpRankCutoff]);

  return (
    <div className="space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 w-full lg:w-auto">
                <h3 className="text-md font-semibold text-slate-200 whitespace-nowrap">{title}</h3>

                {/* --- Compact Dashboard Badges --- */}
                
                {/* 1. Live Top 100 Remaining Slots */}
                {!isHighlights && !eventId && sortOption === 'score' && remainingSafeSlots !== undefined && (
                     <div 
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border bg-emerald-900/20 border-emerald-500/30 text-emerald-400 animate-fadeIn"
                        title={`目前有 ${100 - remainingSafeSlots} 人分數已超越安全線，剩餘 ${remainingSafeSlots} 個名額可供爭奪`}
                     >
                        <CrownIcon className="w-3.5 h-3.5" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">T100 剩餘名額:</span>
                        <span className="text-xs sm:text-sm font-mono font-black">{remainingSafeSlots}</span>
                     </div>
                )}

                {/* 2. Highlights Dashboard */}
                {dashboardStats && !eventId && (
                    <div className="flex flex-wrap items-center gap-2 animate-fadeIn">
                        {/* Special Logic for T100: Use Precise Slot Calculation if available */}
                        {selectedHighlightRank === 100 && t100SafeCount !== null ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border bg-emerald-900/20 border-emerald-500/30 text-emerald-400">
                                <CrownIcon className="w-3.5 h-3.5" />
                                <span className="text-[10px] sm:text-xs font-bold">T100 剩餘名額:</span>
                                <span className="text-xs sm:text-sm font-mono font-black">{Math.max(0, 100 - t100SafeCount)}</span>
                            </div>
                        ) : (
                            /* Standard Estimation for T200+ */
                            <>
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-emerald-900/20 border-emerald-500/30 text-emerald-400" title="推估安全圈：排名高於此名次理論上安全">
                                    <span className="text-[10px] font-bold">✅ 安全:</span>
                                    <span className="text-xs font-mono font-bold">{dashboardStats.safe > 0 ? `Top ${dashboardStats.safe}` : '—'}</span>
                                </div>
                                
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-amber-900/20 border-amber-500/30 text-amber-400" title="激戰區間：安全線與死心線之間的灰色地帶人數">
                                    <span className="text-[10px] font-bold">⚔️ 激戰:</span>
                                    <span className="text-xs font-mono font-bold">{dashboardStats.battleSize > 0 ? dashboardStats.battleSize : '—'}</span>
                                </div>

                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-rose-900/20 border-rose-500/30 text-rose-400" title="推估死心線：排名低於此名次理論上無法追上">
                                    <span className="text-[10px] font-bold">⛔ 死心:</span>
                                    <span className="text-xs font-mono font-bold">{dashboardStats.giveUp < 10000 ? `Rank ${dashboardStats.giveUp}+` : '10000+'}</span>
                                </div>
                                
                                {/* Friendly Disclaimer for Young Players */}
                                <div 
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-500/90 cursor-help group relative"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <span className="text-[10px] font-bold">數值為推測僅供參考</span>
                                    
                                    {/* Tooltip */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-60 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center leading-relaxed">
                                        因為官方只公布特定名次的分數，中間的名次是系統『推算』出來的，實際分數可能會不一樣，請不要完全依賴它來壓線喔！
                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-600"></div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
            
            {/* Rank Toggles for Live Highlights */}
            {isHighlights && !eventId && sortOption === 'score' && (
                <div className="flex flex-wrap gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 self-start lg:self-auto">
                    {[100, 200, 300, 400, 500, 1000].map(r => (
                        <button
                            key={r}
                            onClick={() => setSelectedHighlightRank(r)}
                            className={`px-2 py-1 text-xs font-bold rounded transition-colors ${selectedHighlightRank === r ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            T{r}
                        </button>
                    ))}
                </div>
            )}
        </div>
        
        {chartData.length > 0 ? (
            <LineChart
                data={chartData}
                variant={chartVariant}
                lineColor={color}
                valueFormatter={valueFormatter}
                yAxisFormatter={yAxisFormatter}
                xAxisLabel="Rank"
                yAxisLabel={yLabel}
                safeThreshold={safeThreshold}
                safeRankCutoff={safeRankCutoff}
                giveUpThreshold={giveUpThreshold}
                giveUpRankCutoff={giveUpRankCutoff}
            />
        ) : (
             <div className="text-center py-10">
                <p className="text-slate-400">暫無資料顯示</p>
            </div>
        )}
    </div>
  );
};

export default ChartAnalysis;
