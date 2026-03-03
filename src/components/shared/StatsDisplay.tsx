import React from 'react';
import { formatScoreForChart } from '../../utils/mathUtils';

interface StatItem {
    label: string;
    diff?: number;
    ratio?: string;
    cv?: number;
    color: string;
}

interface StatsData {
    type: 'top100' | 'highlights';
    stats: StatItem[];
}

interface StatsDisplayProps {
    stats: StatsData | null;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ stats }) => {
    if (!stats) return null;
    return (
        <div className="grid grid-cols-2 lg:flex lg:flex-wrap items-center justify-end gap-x-6 gap-y-4 lg:gap-y-2 w-full">
            {stats.stats.map((s, i) => (
                <div key={i} className="flex flex-col items-start lg:items-end">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-tighter">{s.label}</span>
                    <span className={`text-[12px] sm:text-sm font-mono font-black ${s.color}`}>
                        {s.cv !== undefined ? (s.cv > 0 ? `${s.cv}%` : '—') : (s.diff !== undefined && s.diff > 0 ? `+${formatScoreForChart(s.diff)} (${s.ratio}x)` : '—')}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default StatsDisplay;
