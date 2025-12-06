import React, { useState, useEffect, useMemo } from 'react';
import { RankEntry, SortOption, HisekaiBorderApiResponse, PastEventBorderApiResponse, HisekaiApiResponse } from '../types';
import LineChart from './LineChart';

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
                }
            }

        } catch (e) {
            console.error("Failed to fetch chart data", e);
        }
    };

    fetchData();
  }, [sortOption, eventId, isHighlights]);


  const { chartData, title, valueFormatter, yAxisFormatter, color, yLabel, safeThreshold, giveUpThreshold, safeRankCutoff, giveUpRankCutoff, chartVariant } = useMemo(() => {
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
    let variant: 'live' | 'highlights' | 'default' = 'default';

    // Base Data: Top 100 sorted by Rank
    const sourceData = [...rankings].sort((a, b) => a.rank - b.rank);

    switch(sortOption) {
        case 'score':
            chartTitle = isHighlights ? '精彩片段分佈 (Highlights)' : 'Top 100 總分分佈';
            axisY = '分數 (Score)';
            
            if (isHighlights) {
                variant = 'highlights';
                // Show ONLY Highlights, Filter <= 10000 for Chart clarity
                data = borderData
                    .filter(b => b.rank <= 10000)
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
                        const rankScore = borderData.find(b => b.rank === selectedHighlightRank)?.score || 0;
                        
                        if (rankScore > 0) {
                            calculatedSafeThreshold = rankScore + maxGain;
                            calculatedGiveUpThreshold = Math.max(0, rankScore - maxGain);

                            // Interpolation Logic
                            const firstUnsafeIdx = data.findIndex(d => d.value <= (calculatedSafeThreshold as number));
                            if (firstUnsafeIdx === -1) calculatedSafeRankCutoff = 10000;
                            else if (firstUnsafeIdx === 0) calculatedSafeRankCutoff = 0;
                            else {
                                const d1 = data[firstUnsafeIdx - 1];
                                const d2 = data[firstUnsafeIdx];
                                const ratio = (calculatedSafeThreshold! - d1.value) / (d2.value - d1.value);
                                calculatedSafeRankCutoff = d1.rank! + (d2.rank! - d1.rank!) * ratio;
                            }

                            const firstGiveUpIdx = data.findIndex(d => d.value < (calculatedGiveUpThreshold as number));
                            if (firstGiveUpIdx === -1) calculatedGiveUpRankCutoff = 10001; 
                            else if (firstGiveUpIdx === 0) calculatedGiveUpRankCutoff = 0;
                            else {
                                const d1 = data[firstGiveUpIdx - 1];
                                const d2 = data[firstGiveUpIdx];
                                const ratio = (calculatedGiveUpThreshold! - d1.value) / (d2.value - d1.value);
                                calculatedGiveUpRankCutoff = d1.rank! + (d2.rank! - d1.rank!) * ratio;
                            }
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
                        const rank100Score = data[data.length - 1]?.value || 0; 
                        calculatedSafeThreshold = rank100Score + maxGain;

                        const firstUnsafeIdx = data.findIndex(d => d.value <= (calculatedSafeThreshold as number));
                        if (firstUnsafeIdx === -1) calculatedSafeRankCutoff = 100;
                        else if (firstUnsafeIdx === 0) calculatedSafeRankCutoff = 0;
                        else {
                             const d1 = data[firstUnsafeIdx - 1];
                             const d2 = data[firstUnsafeIdx];
                             const ratio = (calculatedSafeThreshold! - d1.value) / (d2.value - d1.value);
                             calculatedSafeRankCutoff = d1.rank! + (d2.rank! - d1.rank!) * ratio;
                        }
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
        chartVariant: variant
    };

  }, [rankings, sortOption, borderData, isHighlights, eventId, liveAggregateAt, selectedHighlightRank]);

  return (
    <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-md font-semibold text-slate-200 text-center md:text-left">{title}</h3>
            
            {/* Rank Toggles for Live Highlights */}
            {isHighlights && !eventId && sortOption === 'score' && (
                <div className="flex flex-wrap gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                    {[200, 300, 400, 500, 1000].map(r => (
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