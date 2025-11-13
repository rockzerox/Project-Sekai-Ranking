
import React, { useMemo, useState } from 'react';
import { RankEntry, SortOption, ChartType } from '../types';
import BarChart from './BarChart';
import LineChart from './LineChart';

interface ChartAnalysisProps {
  rankings: RankEntry[];
  sortOption: SortOption;
}

const ChartAnalysis: React.FC<ChartAnalysisProps> = ({ rankings, sortOption }) => {
  const [chartType, setChartType] = useState<ChartType>('bar');

  const { chartData, title, valueFormatter, color } = useMemo(() => {
    let data: { label: string, value: number }[] = [];
    let chartTitle = '';
    let formatter = (v: number) => Math.round(v).toLocaleString();
    let chartColor = 'bg-sky-500';

    switch(sortOption) {
        case 'score':
            chartTitle = 'Total Score Distribution';
            data = rankings.map(r => ({ label: r.user.display_name, value: r.score }));
            chartColor = 'bg-cyan-500';
            break;
        case 'lastPlayedAt':
            chartTitle = 'Last Online Time Distribution (Minutes Ago)';
            const now = Date.now();
            data = rankings.map(r => ({ label: r.user.display_name, value: (now - new Date(r.lastPlayedAt).getTime()) / 60000 }));
            formatter = v => `${Math.round(v)} min ago`;
            chartColor = 'bg-indigo-500';
            break;
        case 'last1h_count':
            chartTitle = '1-Hour Play Count Distribution';
            data = rankings.map(r => ({ label: r.user.display_name, value: r.stats.last1h.count }));
            chartColor = 'bg-sky-500';
            break;
        case 'last1h_speed':
            chartTitle = '1-Hour Score Speed (pts/hr)';
            data = rankings.map(r => ({ label: r.user.display_name, value: r.stats.last1h.speed }));
            formatter = v => `${Math.round(v).toLocaleString()} pts/hr`;
            chartColor = 'bg-emerald-500';
            break;
        case 'last1h_average':
            chartTitle = '1-Hour Average Score';
            data = rankings.map(r => ({ label: r.user.display_name, value: r.stats.last1h.average }));
            formatter = v => `${Math.round(v).toLocaleString()} pts`;
            chartColor = 'bg-amber-500';
            break;
        // Add cases for 3h and 24h stats
        case 'last3h_count':
            chartTitle = '3-Hour Play Count Distribution';
            data = rankings.map(r => ({ label: r.user.display_name, value: r.stats.last3h.count }));
            chartColor = 'bg-sky-600';
            break;
        case 'last3h_speed':
            chartTitle = '3-Hour Score Speed (pts/hr)';
            data = rankings.map(r => ({ label: r.user.display_name, value: r.stats.last3h.speed }));
            formatter = v => `${Math.round(v).toLocaleString()} pts/hr`;
            chartColor = 'bg-emerald-600';
            break;
        case 'last3h_average':
            chartTitle = '3-Hour Average Score';
            data = rankings.map(r => ({ label: r.user.display_name, value: r.stats.last3h.average }));
            formatter = v => `${Math.round(v).toLocaleString()} pts`;
            chartColor = 'bg-amber-600';
            break;
        case 'last24h_count':
            chartTitle = '24-Hour Play Count Distribution';
            data = rankings.map(r => ({ label: r.user.display_name, value: r.stats.last24h.count }));
            chartColor = 'bg-sky-700';
            break;
        case 'last24h_speed':
            chartTitle = '24-Hour Score Speed (pts/hr)';
            data = rankings.map(r => ({ label: r.user.display_name, value: r.stats.last24h.speed }));
            formatter = v => `${Math.round(v).toLocaleString()} pts/hr`;
            chartColor = 'bg-emerald-700';
            break;
        case 'last24h_average':
            chartTitle = '24-Hour Average Score';
            data = rankings.map(r => ({ label: r.user.display_name, value: r.stats.last24h.average }));
            formatter = v => `${Math.round(v).toLocaleString()} pts`;
            chartColor = 'bg-amber-700';
            break;
    }

    return { chartData: data, title: chartTitle, valueFormatter: formatter, color: chartColor };

  }, [rankings, sortOption]);

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
        <div className="flex justify-between items-center">
            <h3 className="text-md font-semibold text-slate-200">{title}</h3>
            <div className="flex items-center gap-2">
                <ChartToggleButton type="bar" label="Bar Chart" />
                <ChartToggleButton type="line" label="Line Chart" />
            </div>
        </div>
        {chartType === 'bar' ? (
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
        )}
    </div>
  );
};

export default ChartAnalysis;
