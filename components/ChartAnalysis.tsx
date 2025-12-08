
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
    // We visualize using Cosine Interpolation in Log-Log space. 
    // We must invert this to find the exact Rank cutoff.
    const findCutoffRank = (dataPoints: { value: number, rank?: number }[], threshold: number, maxRankFallback: number) => {
        // Since the curve is monotonic descending:
        // Safe Zone: People with Score > Threshold.
        // Give Up Zone: People with Score < Threshold.

        // Find the index where scores dip below threshold
        const firstUnsafeIdx = dataPoints.findIndex(d => d.value <= threshold);
        
        if (firstUnsafeIdx === -1) return maxRankFallback; // Everyone is safe/above threshold (or threshold is super low)
        if (firstUnsafeIdx === 0) return 0; // Everyone is unsafe/below threshold (or threshold is super high)

        const d1 = dataPoints[firstUnsafeIdx - 1]; // Score > Threshold
        const d2 = dataPoints[firstUnsafeIdx];     // Score <= Threshold
        
        // Safety check for Log calculation
        if (d1.value > 0 && d2.value > 0 && threshold > 0 && d1.rank && d2.rank) {
             const lnY = Math.log(threshold);
             const lnY1 = Math.log(d1.value);
             const lnY2 = Math.log(d2.value);
             
             // Calculate curved progress t_curved based on Log values
             // lnY = lnY1 + (lnY2 - lnY1) * t_curved
             // t_curved = (lnY - lnY1) / (lnY2 - lnY1)
             // Note: lnY2 < lnY1 because score is decreasing.
             const t_curved = (lnY - lnY1) / (lnY2 - lnY1);
             
             // Clamp to 0-1 to avoid acos errors if threshold is slightly out of bounds due to float precision
             const t_curved_clamped = Math.max(0, Math.min(1, t_curved));

             // Invert Cosine Interpolation: 
             // Formula used in LineChart: t_curved_val = (1 - cos(t_linear * PI)) / 2
             // Let y = t_curved_clamped
             // y = (1 - cos(x * PI)) / 2
             // 2y = 1 - cos(x * PI)
             // cos(x * PI) = 1 - 2y
             // x * PI = acos(1 - 2y)
             // x (t_linear) = acos(1 - 2y) / PI
             
             const t_linear = Math.acos(1 - 2 * t_curved_clamped) / Math.PI;

             // Linear Interpolation for Rank
             return d1.rank + (d2.rank - d1.rank) * t_linear;

        } else {
             // Fallback to Linear Interpolation if values are 0 or missing ranks
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
                // Show ONLY Highlights, Filter <= 10000 for Chart clarity and > 0 to prevent log errors
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

                            calculatedSafeRankCutoff = findCutoffRank(data, calculatedSafeThreshold, 10000);
                            calculatedGiveUpRankCutoff = findCutoffRank(data, calculatedGiveUpThreshold, 10001);
                        }
                    }
                }

            } else {
                variant = 'live'; // Top 100
                // Show ONLY Top 100
                data = sourceData.map(r => ({ 
                    label: `#${r.rank} ${r.user.display_name}`, 
                    value: r.score,
                    rank: r.rank
                }));

                // Live Event Top 100: Calculate Safe Line for Rank 100
                if (!eventId && liveAggregateAt && data.length > 0) {
                    const now = Date.now();
                    const end = new Date(liveAggregateAt).getTime();
                    const remainingSeconds = (end - now) / 1000;

                    if (remainingSeconds > 0) {
                        const maxGain = (remainingSeconds / 100) * 68000;
                        // Use exact Rank 100 score, or 0 if rank 100 not populated yet
                        const rank100Score = data.find(r => r.rank === 100)?.value || 0; 
                        calculatedSafeThreshold = rank100Score + maxGain;

                        calculatedSafeRankCutoff = findCutoffRank(data, calculatedSafeThreshold, 100);

                        // Calculate remaining available slots in Top 100
                        // Slots = 100 - (Number of people currently above the Safe Line)
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

  return (
    <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-md font-semibold text-slate-200 text-center md:text-left">{title}</h3>
            
            {/* Live Top 100 Remaining Slots Display */}
            {!isHighlights && !eventId && sortOption === 'score' && remainingSafeSlots !== undefined && (
                 <div 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm transition-all animate-fadeIn bg-emerald-900/20 border-emerald-500/30 text-emerald-400"
                    title={`目前有 ${100 - remainingSafeSlots} 人分數已超越安全線，剩餘 ${remainingSafeSlots} 個名額可供爭奪`}
                 >
                    <CrownIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">T100 剩餘名額:</span>
                    <span className="text-sm font-mono font-black">{remainingSafeSlots}</span>
                 </div>
            )}

            {/* Rank Toggles for Live Highlights */}
            {isHighlights && !eventId && sortOption === 'score' && (
                <div className="flex flex-wrap gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                    {[100, 200, 300, 400, 500, 1000].map(r => (
                        <button
                            key={r}
                            onClick={() => setSelectedHighlightRank(r)}
                            className={`px-2 py-1 text-xs font-bold rounded ${selectedHighlightRank === r ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
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
