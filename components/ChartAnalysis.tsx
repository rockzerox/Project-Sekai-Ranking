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

  // Fetch border data when viewing Score distribution
  useEffect(() => {
    const fetchData = async () => {
        if (sortOption !== 'score') {
            setBorderData([]);
            return;
        }

        try {
            // 1. Fetch Border Data
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
            if (!eventId && !isHighlights) {
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


  const { chartData, title, valueFormatter, yAxisFormatter, color, yLabel, safeThreshold, safeRankCutoff } = useMemo(() => {
    let data: { label: string, value: number, rank?: number }[] = [];
    let chartTitle = '';
    let formatter = (v: number) => Math.round(v).toLocaleString();
    let axisFormatter = (v: number) => Math.round(v).toLocaleString();
    let chartColor = 'cyan'; 
    let axisY = 'Value';
    
    let calculatedSafeThreshold: number | undefined = undefined;
    let calculatedSafeRankCutoff: number | undefined = undefined;

    // Base Data: Top 100 sorted by Rank
    const sourceData = [...rankings].sort((a, b) => a.rank - b.rank);

    switch(sortOption) {
        case 'score':
            chartTitle = isHighlights ? '精彩片段分佈 (Highlights)' : 'Top 100 總分分佈';
            axisY = '分數 (Score)';
            
            if (isHighlights) {
                // Show ONLY Highlights
                data = borderData.map(b => ({
                    label: `#${b.rank} ${b.name || 'Player'}`,
                    value: b.score,
                    rank: b.rank
                })).sort((a, b) => (a.rank || 0) - (b.rank || 0));
            } else {
                // Show ONLY Top 100
                data = sourceData.map(r => ({ 
                    label: `#${r.rank} ${r.user.display_name}`, 
                    value: r.score,
                    rank: r.rank
                }));

                // Calculate Safety Zone (Only for Live Event Top 100)
                if (!eventId && liveAggregateAt && data.length > 0) {
                    const now = Date.now();
                    const end = new Date(liveAggregateAt).getTime();
                    const remainingSeconds = (end - now) / 1000;

                    if (remainingSeconds > 0) {
                        const maxGain = (remainingSeconds / 100) * 68000;
                        // Using Rank 100 score as the reference base
                        const rank100Score = data[data.length - 1]?.value || 0;
                        calculatedSafeThreshold = rank100Score + maxGain;

                        // Find cutoff: The last rank that is SAFE (Score > Threshold)
                        // Iterate from Rank 1 downwards
                        const cutoffItem = data.find(d => d.value < (calculatedSafeThreshold as number));
                        // If all are safe (unlikely), cutoff is 100. If none, 0.
                        // Actually, findLastIndex logic:
                        // Safe: Score > Threshold.
                        // We want the boundary.
                        // Example: Rank 50 is 200k (Safe > 150k), Rank 51 is 140k (Unsafe). Cutoff is 50.
                        
                        // Since data is sorted by Rank 1..100 (High Score to Low Score)
                        // We find the first item that is *below* the threshold. The one before it is the last safe rank.
                        const firstUnsafeIndex = data.findIndex(d => d.value <= (calculatedSafeThreshold as number));
                        
                        if (firstUnsafeIndex === -1) {
                            // All are safe (e.g. threshold is very low)
                            calculatedSafeRankCutoff = 100;
                        } else if (firstUnsafeIndex === 0) {
                            // None are safe
                            calculatedSafeRankCutoff = 0;
                        } else {
                            calculatedSafeRankCutoff = data[firstUnsafeIndex - 1].rank;
                        }
                    }
                }
            }
            
            chartColor = 'cyan';
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(0)}萬` : v.toLocaleString();
            break;
        
        // Other cases remain mostly same, but respecting isHighlights to separate views
        case 'lastPlayedAt':
            chartTitle = '最後上線時間 (分鐘前)';
            axisY = '分鐘 (Mins Ago)';
            const now = Date.now();
            data = isHighlights ? [] : sourceData.map(r => ({ 
                label: `#${r.rank} ${r.user.display_name}`, 
                value: Math.max(0, (now - new Date(r.lastPlayedAt).getTime()) / 60000),
                rank: r.rank
            }));
            formatter = v => `${Math.round(v)} 分鐘前`;
            axisFormatter = v => Math.round(v).toString();
            chartColor = 'indigo';
            break;
        case 'last1h_count':
            chartTitle = '1H 遊玩次數分佈';
            axisY = '次數 (Count)';
            data = isHighlights ? [] : sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last1h.count, rank: r.rank }));
            chartColor = 'sky';
            axisFormatter = v => Math.round(v).toString();
            break;
        // ... (Repeat pattern for other stats, preventing highlights from showing irrelevant data or mixing)
        case 'last1h_score':
            chartTitle = '1H 獲得分數分佈';
            axisY = '分數 (Score)';
            data = isHighlights ? [] : sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last1h.score, rank: r.rank }));
            chartColor = 'pink';
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : v.toLocaleString();
            break;
        case 'last1h_speed':
            chartTitle = '1H 時速 (分/時)';
            axisY = '分/時 (Speed)';
            data = isHighlights ? [] : sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last1h.speed, rank: r.rank }));
            formatter = v => `${Math.round(v).toLocaleString()} pts/hr`;
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : v.toLocaleString();
            chartColor = 'emerald';
            break;
        case 'last1h_average':
            chartTitle = '1H 平均分';
            axisY = '平均分 (Avg)';
            data = isHighlights ? [] : sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last1h.average, rank: r.rank }));
            formatter = v => `${Math.round(v).toLocaleString()} pts`;
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : v.toLocaleString();
            chartColor = 'amber';
            break;
        case 'last3h_count':
            chartTitle = '3H 遊玩次數分佈';
            axisY = '次數 (Count)';
            data = isHighlights ? [] : sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last3h.count, rank: r.rank }));
            chartColor = 'sky';
            axisFormatter = v => Math.round(v).toString();
            break;
        case 'last3h_score':
            chartTitle = '3H 獲得分數分佈';
            axisY = '分數 (Score)';
            data = isHighlights ? [] : sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last3h.score, rank: r.rank }));
            chartColor = 'pink';
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : v.toLocaleString();
            break;
        case 'last3h_speed':
            chartTitle = '3H 速度 (分/時)';
            axisY = '分/時 (Speed)';
            data = isHighlights ? [] : sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last3h.speed, rank: r.rank }));
            formatter = v => `${Math.round(v).toLocaleString()} pts/hr`;
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : v.toLocaleString();
            chartColor = 'emerald';
            break;
        case 'last3h_average':
            chartTitle = '3H 平均分';
            axisY = '平均分 (Avg)';
            data = isHighlights ? [] : sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last3h.average, rank: r.rank }));
            formatter = v => `${Math.round(v).toLocaleString()} pts`;
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : v.toLocaleString();
            chartColor = 'amber';
            break;
        case 'last24h_count':
            chartTitle = '24H 遊玩次數分佈';
            axisY = '次數 (Count)';
            data = isHighlights ? [] : sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last24h.count, rank: r.rank }));
            chartColor = 'sky';
            axisFormatter = v => Math.round(v).toString();
            break;
        case 'last24h_score':
            chartTitle = '24H 獲得分數分佈';
            axisY = '分數 (Score)';
            data = isHighlights ? [] : sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last24h.score, rank: r.rank }));
            chartColor = 'pink';
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : v.toLocaleString();
            break;
        case 'last24h_speed':
            chartTitle = '24H 速度 (分/時)';
            axisY = '分/時 (Speed)';
            data = isHighlights ? [] : sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last24h.speed, rank: r.rank }));
            formatter = v => `${Math.round(v).toLocaleString()} pts/hr`;
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : v.toLocaleString();
            chartColor = 'emerald';
            break;
        case 'last24h_average':
            chartTitle = '24H 平均分';
            axisY = '平均分 (Avg)';
            data = isHighlights ? [] : sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last24h.average, rank: r.rank }));
            formatter = v => `${Math.round(v).toLocaleString()} pts`;
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : v.toLocaleString();
            chartColor = 'amber';
            break;
    }

    return { 
        chartData: data, 
        title: chartTitle, 
        valueFormatter: formatter, 
        yAxisFormatter: axisFormatter, 
        color: chartColor, 
        yLabel: axisY,
        safeThreshold: calculatedSafeThreshold,
        safeRankCutoff: calculatedSafeRankCutoff
    };

  }, [rankings, sortOption, borderData, isHighlights, eventId, liveAggregateAt]);

  return (
    <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-md font-semibold text-slate-200 text-center md:text-left">{title}</h3>
        </div>

        {chartData.length > 0 ? (
            <LineChart
                data={chartData}
                lineColor={color}
                valueFormatter={valueFormatter}
                yAxisFormatter={yAxisFormatter}
                xAxisLabel="Rank"
                yAxisLabel={yLabel}
                safeThreshold={safeThreshold}
                safeRankCutoff={safeRankCutoff}
            />
        ) : (
             <div className="text-center py-10">
                <p className="text-slate-400">
                   暫無資料顯示 (No Data)
                </p>
            </div>
        )}
    </div>
  );
};

export default ChartAnalysis;