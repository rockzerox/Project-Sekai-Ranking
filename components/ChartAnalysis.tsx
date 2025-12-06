
import React, { useState, useEffect, useMemo } from 'react';
import { RankEntry, SortOption, HisekaiBorderApiResponse, PastEventBorderApiResponse } from '../types';
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

  // Fetch border data when viewing Score distribution
  useEffect(() => {
    const fetchBorders = async () => {
        if (sortOption !== 'score') {
            setBorderData([]);
            return;
        }

        try {
            const url = eventId 
                ? `https://api.hisekai.org/event/${eventId}/border`
                : `https://api.hisekai.org/event/live/border`;

            const response = await fetch(url);
            if (!response.ok) return;

            const text = await response.text();
            const sanitized = text.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');
            const json = JSON.parse(sanitized);
            
            let items: BorderItem[] = [];

            if (eventId) {
                // Past Event Structure
                const data = json as PastEventBorderApiResponse;
                if (data.borderRankings) {
                    items = data.borderRankings.map(r => ({ rank: r.rank, score: r.score, name: r.name }));
                }
            } else {
                // Live Event Structure
                const data = json as HisekaiBorderApiResponse;
                if (data.border_player_rankings) {
                    items = data.border_player_rankings.map(r => ({ rank: r.rank, score: r.score, name: r.name }));
                }
            }
            setBorderData(items);

        } catch (e) {
            console.error("Failed to fetch chart border data", e);
        }
    };

    fetchBorders();
  }, [sortOption, eventId]);


  const { chartData, title, valueFormatter, yAxisFormatter, color, yLabel } = useMemo(() => {
    let data: { label: string, value: number, rank?: number }[] = [];
    let chartTitle = '';
    let formatter = (v: number) => Math.round(v).toLocaleString(); // For Tooltip
    let axisFormatter = (v: number) => Math.round(v).toLocaleString(); // For Y-Axis Labels
    let chartColor = 'cyan'; 
    let axisY = 'Value';

    // Base Data: Top 100 sorted by Rank
    const sourceData = [...rankings].sort((a, b) => a.rank - b.rank);

    switch(sortOption) {
        case 'score':
            chartTitle = '總分分佈 (Total Score Distribution)';
            axisY = '分數 (Score)';
            
            // 1. Map Top 100
            const top100 = sourceData.map(r => ({ 
                label: `#${r.rank} ${r.user.display_name}`, 
                value: r.score,
                rank: r.rank
            }));

            // 2. If Border Data exists, merge it
            const borders = borderData.map(b => ({
                label: `#${b.rank} ${b.name || 'Player'}`,
                value: b.score,
                rank: b.rank
            })).sort((a, b) => (a.rank || 0) - (b.rank || 0));

            // Combine and sort by rank
            data = [...top100, ...borders].sort((a, b) => (a.rank || 0) - (b.rank || 0));
            
            chartColor = 'cyan';
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(0)}萬` : v.toLocaleString();
            break;
        case 'lastPlayedAt':
            chartTitle = '最後上線時間 (分鐘前)';
            axisY = '分鐘 (Mins Ago)';
            const now = Date.now();
            data = sourceData.map(r => ({ 
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
            data = sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last1h.count, rank: r.rank }));
            chartColor = 'sky';
            axisFormatter = v => Math.round(v).toString();
            break;
        case 'last1h_score':
            chartTitle = '1H 獲得分數分佈';
            axisY = '分數 (Score)';
            data = sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last1h.score, rank: r.rank }));
            chartColor = 'pink';
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : v.toLocaleString();
            break;
        case 'last1h_speed':
            chartTitle = '1H 時速 (分/時)';
            axisY = '分/時 (Speed)';
            data = sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last1h.speed, rank: r.rank }));
            formatter = v => `${Math.round(v).toLocaleString()} pts/hr`;
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : v.toLocaleString();
            chartColor = 'emerald';
            break;
        case 'last1h_average':
            chartTitle = '1H 平均分';
            axisY = '平均分 (Avg)';
            data = sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last1h.average, rank: r.rank }));
            formatter = v => `${Math.round(v).toLocaleString()} pts`;
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : v.toLocaleString();
            chartColor = 'amber';
            break;
        case 'last3h_count':
            chartTitle = '3H 遊玩次數分佈';
            axisY = '次數 (Count)';
            data = sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last3h.count, rank: r.rank }));
            chartColor = 'sky';
            axisFormatter = v => Math.round(v).toString();
            break;
        case 'last3h_score':
            chartTitle = '3H 獲得分數分佈';
            axisY = '分數 (Score)';
            data = sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last3h.score, rank: r.rank }));
            chartColor = 'pink';
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : v.toLocaleString();
            break;
        case 'last3h_speed':
            chartTitle = '3H 速度 (分/時)';
            axisY = '分/時 (Speed)';
            data = sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last3h.speed, rank: r.rank }));
            formatter = v => `${Math.round(v).toLocaleString()} pts/hr`;
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : v.toLocaleString();
            chartColor = 'emerald';
            break;
        case 'last3h_average':
            chartTitle = '3H 平均分';
            axisY = '平均分 (Avg)';
            data = sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last3h.average, rank: r.rank }));
            formatter = v => `${Math.round(v).toLocaleString()} pts`;
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : v.toLocaleString();
            chartColor = 'amber';
            break;
        case 'last24h_count':
            chartTitle = '24H 遊玩次數分佈';
            axisY = '次數 (Count)';
            data = sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last24h.count, rank: r.rank }));
            chartColor = 'sky';
            axisFormatter = v => Math.round(v).toString();
            break;
        case 'last24h_score':
            chartTitle = '24H 獲得分數分佈';
            axisY = '分數 (Score)';
            data = sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last24h.score, rank: r.rank }));
            chartColor = 'pink';
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : v.toLocaleString();
            break;
        case 'last24h_speed':
            chartTitle = '24H 速度 (分/時)';
            axisY = '分/時 (Speed)';
            data = sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last24h.speed, rank: r.rank }));
            formatter = v => `${Math.round(v).toLocaleString()} pts/hr`;
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : v.toLocaleString();
            chartColor = 'emerald';
            break;
        case 'last24h_average':
            chartTitle = '24H 平均分';
            axisY = '平均分 (Avg)';
            data = sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.stats.last24h.average, rank: r.rank }));
            formatter = v => `${Math.round(v).toLocaleString()} pts`;
            axisFormatter = (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : v.toLocaleString();
            chartColor = 'amber';
            break;
    }

    return { chartData: data, title: chartTitle, valueFormatter: formatter, yAxisFormatter: axisFormatter, color: chartColor, yLabel: axisY };

  }, [rankings, sortOption, borderData]);

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
            />
        ) : (
             <div className="text-center py-10">
                <p className="text-slate-400">
                   暫無資料顯示。
                </p>
            </div>
        )}
    </div>
  );
};

export default ChartAnalysis;
