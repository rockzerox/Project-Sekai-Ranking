import React, { useMemo, useState, useEffect } from 'react';
import { RankEntry, SortOption, ChartType } from '../types';
import BarChart from './BarChart';
import LineChart from './LineChart';

interface ChartAnalysisProps {
  rankings: RankEntry[];
  sortOption: SortOption;
  isHighlights?: boolean;
}

const ChartAnalysis: React.FC<ChartAnalysisProps> = ({ rankings, sortOption, isHighlights = false }) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [startRankInput, setStartRankInput] = useState('1');
  const [endRankInput, setEndRankInput] = useState('100');

  useEffect(() => {
    // When the rankings data is loaded, set the end rank to the max available.
    // Only if NOT in highlights mode, as highlights mode uses fixed logic
    if (rankings.length > 0 && !isHighlights) {
      setEndRankInput(String(rankings.length));
    }
  }, [rankings, isHighlights]);
  
  const { filteredRankings, validationError } = useMemo(() => {
    if (isHighlights) {
        // In highlights mode, ignore user inputs and return all data sorted by rank (ascending)
        const sorted = [...rankings].sort((a, b) => a.rank - b.rank);
        return { filteredRankings: sorted, validationError: null };
    }

    const start = parseInt(startRankInput, 10);
    const end = parseInt(endRankInput, 10);
    let error: string | null = null;
    let data: RankEntry[] = [];

    const maxRank = rankings.length > 0 ? rankings.length : 100;

    if (isNaN(start) || isNaN(end)) {
        error = "請輸入有效的排名數字。";
    } else if (start < 1) {
        error = "起始排名必須至少為 1。";
    } else if (end > maxRank) {
        error = `結束排名不能超過 ${maxRank}。`;
    } else if (start >= end) {
        error = "起始排名必須小於結束排名。";
    } else if (end - start < 9) { // e.g. 1 to 10 has a diff of 9 (10 players)
        error = "範圍必須包含至少 10 名玩家。";
    }

    if (!error && rankings.length > 0) {
        data = rankings.slice(start - 1, end);
    } else if (rankings.length > 0 && error) {
        // If there's an error, we return an empty array to show no data
        data = [];
    } else {
        // If rankings aren't loaded yet
        data = [];
    }
    
    return { filteredRankings: data, validationError: error };
  }, [rankings, startRankInput, endRankInput, isHighlights]);


  const { chartData, title, valueFormatter, color } = useMemo(() => {
    let data: { label: string, value: number }[] = [];
    let chartTitle = '';
    let formatter = (v: number) => Math.round(v).toLocaleString();
    let chartColor = 'bg-sky-500';

    const sourceData = filteredRankings;

    // For highlights, we might want to show Rank as label instead of name if name is crowded
    // But stick to name for consistency unless specified. 
    // Actually, display name is good.

    switch(sortOption) {
        case 'score':
            chartTitle = isHighlights ? '精彩片段分數分佈 (Highlights)' : '總分分佈 (Total Score)';
            data = sourceData.map(r => ({ 
                label: isHighlights ? `#${r.rank}` : r.user.display_name, // In highlights, use Rank # as label for clarity on sparse data
                value: r.score 
            }));
            chartColor = 'bg-cyan-500';
            break;
        case 'lastPlayedAt':
            chartTitle = '最後上線時間 (分鐘前)';
            const now = Date.now();
            data = sourceData.map(r => ({ label: r.user.display_name, value: (now - new Date(r.lastPlayedAt).getTime()) / 60000 }));
            formatter = v => `${Math.round(v)} 分鐘前`;
            chartColor = 'bg-indigo-500';
            break;
        case 'last1h_count':
            chartTitle = '1H 遊玩次數分佈';
            data = sourceData.map(r => ({ label: r.user.display_name, value: r.stats.last1h.count }));
            chartColor = 'bg-sky-500';
            break;
        case 'last1h_speed':
            chartTitle = '1H 速度 (分/時)';
            data = sourceData.map(r => ({ label: r.user.display_name, value: r.stats.last1h.speed }));
            formatter = v => `${Math.round(v).toLocaleString()} pts/hr`;
            chartColor = 'bg-emerald-500';
            break;
        case 'last1h_average':
            chartTitle = '1H 平均分';
            data = sourceData.map(r => ({ label: r.user.display_name, value: r.stats.last1h.average }));
            formatter = v => `${Math.round(v).toLocaleString()} pts`;
            chartColor = 'bg-amber-500';
            break;
        case 'last3h_count':
            chartTitle = '3H 遊玩次數分佈';
            data = sourceData.map(r => ({ label: r.user.display_name, value: r.stats.last3h.count }));
            chartColor = 'bg-sky-600';
            break;
        case 'last3h_speed':
            chartTitle = '3H 速度 (分/時)';
            data = sourceData.map(r => ({ label: r.user.display_name, value: r.stats.last3h.speed }));
            formatter = v => `${Math.round(v).toLocaleString()} pts/hr`;
            chartColor = 'bg-emerald-600';
            break;
        case 'last3h_average':
            chartTitle = '3H 平均分';
            data = sourceData.map(r => ({ label: r.user.display_name, value: r.stats.last3h.average }));
            formatter = v => `${Math.round(v).toLocaleString()} pts`;
            chartColor = 'bg-amber-600';
            break;
        case 'last24h_count':
            chartTitle = '24H 遊玩次數分佈';
            data = sourceData.map(r => ({ label: r.user.display_name, value: r.stats.last24h.count }));
            chartColor = 'bg-sky-700';
            break;
        case 'last24h_speed':
            chartTitle = '24H 速度 (分/時)';
            data = sourceData.map(r => ({ label: r.user.display_name, value: r.stats.last24h.speed }));
            formatter = v => `${Math.round(v).toLocaleString()} pts/hr`;
            chartColor = 'bg-emerald-700';
            break;
        case 'last24h_average':
            chartTitle = '24H 平均分';
            data = sourceData.map(r => ({ label: r.user.display_name, value: r.stats.last24h.average }));
            formatter = v => `${Math.round(v).toLocaleString()} pts`;
            chartColor = 'bg-amber-700';
            break;
    }

    return { chartData: data, title: chartTitle, valueFormatter: formatter, color: chartColor };

  }, [filteredRankings, sortOption, isHighlights]);

  const ChartToggleButton: React.FC<{type: ChartType, label: string}> = ({ type, label }) => (
    <button
        onClick={() => setChartType(type)}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
            chartType === type
            ? 'bg-cyan-500 text-white'
            : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
        }`}
    >
        {label}
    </button>
  );

  return (
    <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-md font-semibold text-slate-200 text-center md:text-left">{title}</h3>
            <div className="flex items-center gap-2">
                <ChartToggleButton type="bar" label="長條圖 (Bar)" />
                <ChartToggleButton type="line" label="折線圖 (Line)" />
            </div>
        </div>

        {!isHighlights && (
            <div className="bg-slate-800/50 p-3 rounded-md flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
                <label htmlFor="startRank" className="text-slate-300 font-medium">排名範圍:</label>
                <input 
                    id="startRank"
                    type="number" 
                    value={startRankInput}
                    onChange={(e) => setStartRankInput(e.target.value)}
                    className="w-24 bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-center focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                    aria-label="Start Rank"
                />
                <span className="text-slate-500">至</span>
                <input 
                    id="endRank"
                    type="number" 
                    value={endRankInput}
                    onChange={(e) => setEndRankInput(e.target.value)}
                    className="w-24 bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-center focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                    aria-label="End Rank"
                />
            </div>
        )}
        
        {isHighlights && (
            <div className="bg-slate-800/50 p-3 rounded-md text-center text-sm text-slate-400">
                排名範圍: 精選名次 (Highlights) - 100 ~ 50000
            </div>
        )}

        {validationError && (
            <p className="text-red-400 text-xs text-center -mt-2">{validationError}</p>
        )}

        {chartData.length > 0 ? (
            chartType === 'bar' ? (
                 <BarChart 
                    data={chartData} 
                    barColor={color}
                    valueFormatter={valueFormatter}
                  />
            ) : (
                <LineChart
                    data={chartData}
                    lineColor={color.replace('bg-','').split('-')[0]} // Extract color name from Tailwind class
                    valueFormatter={valueFormatter}
                />
            )
        ) : (
             <div className="text-center py-10">
                <p className="text-slate-400">
                    { validationError ? '選擇的範圍無效。' : '所選範圍無資料顯示。' }
                </p>
            </div>
        )}
    </div>
  );
};

export default ChartAnalysis;