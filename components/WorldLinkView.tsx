
import React, { useState, useEffect, useMemo } from 'react';
import { PastEventApiResponse, PastEventBorderApiResponse, WorldBloomChapter, WorldBloomChapterBorder } from '../types';
import CrownIcon from './icons/CrownIcon';
import CollapsibleSection from './CollapsibleSection';
import { CHAR_INFO, WORLD_LINK_IDS } from '../constants';

const BORDER_OPTIONS = [200, 300, 400, 500, 1000, 2000, 5000, 10000];

const EVENT_CHAR_MAP: Record<number, Record<number, string>> = {
  112: { 18: '朝比奈真冬', 20: '曉山瑞希', 19: '東雲繪名', 17: '宵崎奏' },
  118: { 11: '東雲彰人', 12: '青柳冬彌', 10: '白石杏', 9: '小豆澤心羽' },
  124: { 16: '神代類', 15: '草薙寧寧', 14: '鳳笑夢', 13: '天馬司' },
  130: { 7: '桃井愛莉', 6: '桐谷遙', 8: '日野森雫', 5: '花里實乃理' },
  137: { 2: '天馬咲希', 3: '望月穗波', 4: '日野森志步', 1: '星乃一歌' },
  140: { 24: '巡音流歌', 22: '鏡音鈴', 25: 'MEIKO', 23: '鏡音連', 26: 'KAITO', 21: '初音未來' }
};

interface AggregatedCharStat {
    charName: string;
    color: string;
    eventId: number;
    top1: number;
    top10: number;
    top100: number;
    borders: Record<number, number>;
}

type MetricType = 'top1' | 'top10' | 'top100' | number; 

const HorizontalBarChart: React.FC<{
    data: AggregatedCharStat[];
    dataKey: MetricType;
}> = ({ data, dataKey }) => {
    const isBorder = typeof dataKey === 'number';
    
    const sortedData = [...data].sort((a, b) => {
        const valA = isBorder ? (a.borders[dataKey as number] || 0) : a[dataKey as keyof AggregatedCharStat] as number;
        const valB = isBorder ? (b.borders[dataKey as number] || 0) : b[dataKey as keyof AggregatedCharStat] as number;
        return valB - valA;
    });

    const maxVal = Math.max(...sortedData.map(d => isBorder ? (d.borders[dataKey as number] || 0) : d[dataKey as keyof AggregatedCharStat] as number));
    
    return (
        <div className="flex flex-col gap-2 pr-2">
            {sortedData.map((char, idx) => {
                const val = isBorder ? (char.borders[dataKey as number] || 0) : char[dataKey as keyof AggregatedCharStat] as number;
                const percentage = maxVal > 0 ? (val / maxVal) * 100 : 0;
                
                return (
                    <div key={`${char.eventId}-${char.charName}`} className="flex items-center text-xs sm:text-sm group">
                        <div 
                            className="w-24 sm:w-32 flex-shrink-0 text-right pr-3 truncate font-bold"
                            style={{ color: char.color }}
                        >
                            #{idx + 1} {char.charName}
                        </div>
                        <div className="flex-1 h-6 bg-slate-200 dark:bg-slate-700/50 rounded-r overflow-hidden relative flex items-center">
                            <div 
                                className="h-full rounded-r transition-all duration-500 ease-out flex items-center justify-end px-2"
                                style={{ 
                                    width: `${percentage}%`, 
                                    backgroundColor: char.color,
                                    opacity: 0.85
                                }}
                            >
                            </div>
                            <span className="absolute left-2 text-slate-700 dark:text-white font-mono drop-shadow-md font-bold z-10">
                                {val.toLocaleString()}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const SCATTER_RANKS = [200, 300, 400, 500, 1000];

const RankShape: React.FC<{ rank: number; color: string }> = ({ rank, color }) => {
    const classes = "w-3 h-3 drop-shadow-md hover:scale-150 transition-transform cursor-help";
    const stroke = "#fff";

    switch (rank) {
        case 200: 
            return <svg viewBox="0 0 10 10" className={classes}><circle cx="5" cy="5" r="4" fill={color} stroke={stroke} strokeWidth="1" /></svg>;
        case 300:
            return <svg viewBox="0 0 10 10" className={classes}><rect x="2" y="2" width="6" height="6" fill={color} stroke={stroke} strokeWidth="1" /></svg>;
        case 400:
            return <svg viewBox="0 0 10 10" className={classes}><polygon points="5,1 9,8 1,8" fill={color} stroke={stroke} strokeWidth="1" /></svg>;
        case 500:
            return <svg viewBox="0 0 10 10" className={classes}><polygon points="5,1 9,5 5,9 1,5" fill={color} stroke={stroke} strokeWidth="1" /></svg>;
        case 1000:
            return <svg viewBox="0 0 10 10" className={classes}><polygon points="5,1 6.3,3.5 9,3.9 7,5.7 7.5,8.5 5,7.2 2.5,8.5 3,5.7 1,3.9 3.7,3.5" fill={color} stroke={stroke} strokeWidth="1" /></svg>;
        default:
            return <div className="w-2 h-2 rounded-full bg-white" />;
    }
};

const GlobalScoreChart: React.FC<{
    data: AggregatedCharStat[];
}> = ({ data }) => {
    const sortedData = [...data].sort((a, b) => b.top100 - a.top100);
    const globalMax = Math.max(...data.map(d => d.top100)) * 1.05;

    return (
        <div className="flex flex-col gap-3 pr-2">
            <div className="flex flex-wrap justify-end items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-300 mb-2 px-2">
                <div className="flex items-center gap-1">
                    <div className="w-8 h-4 bg-slate-300/50 dark:bg-slate-500/30 border border-slate-400 dark:border-slate-500 rounded-sm"></div>
                    <span>Top 100 Range</span>
                </div>
                {SCATTER_RANKS.map(rank => (
                     <div key={rank} className="flex items-center gap-1" title={`Rank ${rank}`}>
                        <RankShape rank={rank} color="#71717a" />
                        <span className="font-mono">T{rank}</span>
                     </div>
                ))}
            </div>

            {sortedData.map((char, idx) => {
                const top100Width = (char.top100 / globalMax) * 100;
                
                return (
                    <div key={`${char.eventId}-${char.charName}`} className="flex items-center text-xs sm:text-sm group">
                        <div 
                            className="w-24 sm:w-32 flex-shrink-0 text-right pr-3 truncate font-bold"
                            style={{ color: char.color }}
                        >
                            #{idx + 1} {char.charName}
                        </div>

                        <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-800/30 rounded-r relative border-l border-slate-300 dark:border-slate-700">
                            <div 
                                className="absolute top-0 left-0 h-full rounded-r transition-all duration-500 ease-out flex items-center"
                                style={{ 
                                    width: `${top100Width}%`, 
                                    backgroundColor: char.color,
                                    opacity: 0.4
                                }}
                            >
                            </div>
                            <div 
                                className="absolute top-1/2 -translate-y-1/2 text-[10px] text-slate-600 dark:text-white/60 font-mono z-0 pl-2 pointer-events-none whitespace-nowrap"
                                style={{ left: `${top100Width}%` }}
                            >
                                T100: {(char.top100 / 10000).toFixed(1)}萬
                            </div>

                            {SCATTER_RANKS.map(rank => {
                                const score = char.borders[rank] || 0;
                                if (score === 0) return null;
                                const pos = (score / globalMax) * 100;

                                return (
                                    <div 
                                        key={rank}
                                        className="absolute top-1/2 -translate-y-1/2 transform -translate-x-1/2 z-10"
                                        style={{ left: `${pos}%` }}
                                        title={`Top ${rank}: ${score.toLocaleString()}`}
                                    >
                                        <RankShape rank={rank} color={char.color} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
             <div className="flex ml-24 sm:ml-32 mt-1 border-t border-slate-300 dark:border-slate-700 pt-1 text-[10px] text-slate-500 justify-between font-mono">
                <span>0</span>
                <span>{(globalMax / 2).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                <span>{globalMax.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
        </div>
    );
};

const RankTable: React.FC<{
    title: string;
    headerAction?: React.ReactNode;
    data: AggregatedCharStat[];
    valueGetter: (stat: AggregatedCharStat) => number;
    color: string;
}> = ({ title, headerAction, data, valueGetter, color }) => (
    <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-lg h-full flex flex-col transition-colors duration-300">
        <div className={`px-3 py-3 ${color} bg-opacity-10 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0 min-h-[56px]`}>
            <div className="flex items-center flex-1 min-w-0 mr-2">
                <h3 className={`font-bold ${color.replace('bg-', 'text-')} truncate mr-2`}>{title}</h3>
                {headerAction}
            </div>
            <CrownIcon className={`w-5 h-5 ${color.replace('bg-', 'text-')} flex-shrink-0`} />
        </div>
        <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 uppercase sticky top-0 z-10">
                    <tr>
                        <th className="px-3 py-2 w-10">#</th>
                        <th className="px-3 py-2">角色 (Character)</th>
                        <th className="px-3 py-2 text-right">分數 (Score)</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((stat, idx) => (
                        <tr key={`${stat.eventId}-${stat.charName}`} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className={`px-3 py-2 font-bold ${idx < 3 ? 'text-yellow-500 dark:text-yellow-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                {idx + 1}
                            </td>
                            <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <div 
                                        className="w-2 h-8 rounded-sm" 
                                        style={{ backgroundColor: stat.color }}
                                    ></div>
                                    <div>
                                        <div 
                                            className="font-bold" 
                                            title={stat.charName}
                                            style={{ color: stat.color }}
                                        >
                                            {stat.charName}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono">
                                            Event #{stat.eventId}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-white font-medium">
                                {valueGetter(stat).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const WorldLinkView: React.FC = () => {
    const [aggregatedData, setAggregatedData] = useState<AggregatedCharStat[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    
    const [isChartOpen, setIsChartOpen] = useState(true);
    const [chartViewMode, setChartViewMode] = useState<'activity' | 'global'>('activity');
    const [chartMetric, setChartMetric] = useState<MetricType>('top1');
    const [selectedBorderRank, setSelectedBorderRank] = useState<number>(1000);

    useEffect(() => {
        const fetchData = async () => {
            setIsAnalyzing(true);
            setAggregatedData([]);
            
            const tempStats: AggregatedCharStat[] = [];
            const total = WORLD_LINK_IDS.length;

            for (let i = 0; i < total; i++) {
                const eventId = WORLD_LINK_IDS[i];
                try {
                    const [resTop, resBorder] = await Promise.all([
                        fetch(`https://api.hisekai.org/event/${eventId}/top100`),
                        fetch(`https://api.hisekai.org/event/${eventId}/border`)
                    ]);

                    const sanitize = (t: string) => t.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');
                    
                    let chaptersTop: WorldBloomChapter[] = [];
                    if (resTop.ok) {
                        const txt = await resTop.text();
                        const json: PastEventApiResponse = JSON.parse(sanitize(txt));
                        chaptersTop = json.userWorldBloomChapterRankings || [];
                    }

                    let chaptersBorder: WorldBloomChapterBorder[] = [];
                    if (resBorder.ok) {
                        const txt = await resBorder.text();
                        const json: PastEventBorderApiResponse = JSON.parse(sanitize(txt));
                        chaptersBorder = json.userWorldBloomChapterRankingBorders || [];
                    }

                    const charMap = EVENT_CHAR_MAP[eventId] || {};
                    Object.keys(charMap).forEach(key => {
                        const charId = Number(key);
                        const charName = charMap[charId];
                        
                        const topData = chaptersTop.find(c => c.gameCharacterId === charId)?.rankings || [];
                        const getScore = (r: number) => topData.find(x => x.rank === r)?.score || 0;

                        const charBorderObj = chaptersBorder.find(c => c.gameCharacterId === charId);
                        const borderData = charBorderObj?.borderRankings || [];
                        
                        const borderScores: Record<number, number> = {};
                        borderData.forEach(b => {
                            borderScores[b.rank] = b.score;
                        });

                        tempStats.push({
                            charName,
                            color: CHAR_INFO[charName] || '#999',
                            eventId,
                            top1: getScore(1),
                            top10: getScore(10),
                            top100: getScore(100),
                            borders: borderScores
                        });
                    });

                } catch (e) {
                    console.error(`Error fetching WL event ${eventId}`, e);
                }

                setLoadingProgress(Math.round(((i + 1) / total) * 100));
            }

            setAggregatedData(tempStats);
            setIsAnalyzing(false);
        };

        fetchData();
    }, []);

    const getSortedList = (key: 'top1' | 'top10' | 'top100') => {
        return [...aggregatedData].sort((a, b) => b[key] - a[key]);
    };

    const getBorderList = (rank: number) => {
        return [...aggregatedData].sort((a, b) => (b.borders[rank] || 0) - (a.borders[rank] || 0));
    };

    return (
        <div className="w-full animate-fadeIn py-4">
             <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">World Link 綜合分析 (Aggregated Analysis)</h2>
                <p className="text-slate-500 dark:text-slate-400">彙整所有 World Link 期數，比較各角色分數排行</p>

                {isAnalyzing && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 mt-4 mb-6 relative overflow-hidden shadow-sm">
                         <div className="flex justify-between items-center mb-2 relative z-10">
                            <span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm animate-pulse">
                                正在同步所有 World Link 數據... ({loadingProgress}%)
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden relative z-10">
                            <div 
                                className="bg-cyan-500 h-2 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${loadingProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            {!isAnalyzing && aggregatedData.length > 0 && (
                <CollapsibleSection
                    title="圖表分析 (Chart Analysis)"
                    isOpen={isChartOpen}
                    onToggle={() => setIsChartOpen(!isChartOpen)}
                >
                    <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex bg-slate-100 dark:bg-slate-700 rounded p-1">
                            <button 
                                onClick={() => setChartViewMode('activity')}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${chartViewMode === 'activity' ? 'bg-cyan-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                活躍程度 (Activity)
                            </button>
                            <button 
                                onClick={() => setChartViewMode('global')}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${chartViewMode === 'global' ? 'bg-purple-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                全域顯示 (Global)
                            </button>
                        </div>

                        {chartViewMode === 'activity' && (
                             <div className="flex flex-wrap gap-2">
                                <button onClick={() => setChartMetric('top1')} className={`px-2 py-1 rounded text-xs font-bold transition-colors ${chartMetric === 'top1' ? 'bg-yellow-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Top 1</button>
                                <button onClick={() => setChartMetric('top10')} className={`px-2 py-1 rounded text-xs font-bold transition-colors ${chartMetric === 'top10' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Top 10</button>
                                <button onClick={() => setChartMetric('top100')} className={`px-2 py-1 rounded text-xs font-bold transition-colors ${chartMetric === 'top100' ? 'bg-cyan-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Top 100</button>
                                <div className="w-px bg-slate-300 dark:bg-slate-600 mx-1 h-5 self-center"></div>
                                {BORDER_OPTIONS.map(rank => (
                                    <button 
                                        key={rank}
                                        onClick={() => setChartMetric(rank)} 
                                        className={`px-2 py-1 rounded text-xs font-bold transition-colors ${chartMetric === rank ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                    >
                                        T{rank}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {chartViewMode === 'activity' ? (
                         <HorizontalBarChart 
                            data={aggregatedData} 
                            dataKey={chartMetric} 
                        />
                    ) : (
                        <GlobalScoreChart data={aggregatedData} />
                    )}
                </CollapsibleSection>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <RankTable 
                    title="Top 1 (最高分)" 
                    data={getSortedList('top1')} 
                    valueGetter={d => d.top1} 
                    color="bg-yellow-500" 
                />
                <RankTable 
                    title="Top 10" 
                    data={getSortedList('top10')} 
                    valueGetter={d => d.top10} 
                    color="bg-purple-500" 
                />
                <RankTable 
                    title="Top 100" 
                    data={getSortedList('top100')} 
                    valueGetter={d => d.top100} 
                    color="bg-cyan-500" 
                />
                <RankTable 
                    title={`Highlights T${selectedBorderRank}`}
                    headerAction={
                         <select 
                            value={selectedBorderRank} 
                            onChange={(e) => setSelectedBorderRank(Number(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold py-1 px-1 rounded border border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-teal-500 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            {BORDER_OPTIONS.map(rank => (
                                <option key={rank} value={rank}>T{rank}</option>
                            ))}
                        </select>
                    }
                    data={getBorderList(selectedBorderRank)} 
                    valueGetter={d => d.borders[selectedBorderRank] || 0} 
                    color="bg-teal-500" 
                />
            </div>
        </div>
    );
};

export default WorldLinkView;
