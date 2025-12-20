import React, { useState, useEffect, useMemo } from 'react';
import { PastEventApiResponse, PastEventBorderApiResponse, WorldBloomChapter, WorldBloomChapterBorder } from '../types';
import CollapsibleSection from './CollapsibleSection';
import { CHARACTER_MASTER, WORLD_LINK_ROUND_1_IDS, WORLD_LINK_ROUND_2_IDS, EVENT_CHAPTER_ORDER, getAssetUrl, EVENT_CHAR_MAP, API_BASE_URL, getChar } from '../constants';
import DashboardTable from './ui/DashboardTable';
import Select from './ui/Select';

const BORDER_OPTIONS = [200, 300, 400, 500, 1000, 2000, 5000, 10000];

interface AggregatedCharStat {
    charName: string;
    charId: string;
    color: string;
    eventId: number;
    top1: number;
    top10: number;
    top100: number;
    borders: Record<number, number>;
    duration: number;
    chapterOrder: number;
}

type MetricType = 'top1' | 'top10' | 'top100' | number; 

const HorizontalBarChart: React.FC<{
    data: AggregatedCharStat[];
    dataKey: MetricType;
    displayMode: 'total' | 'daily';
}> = ({ data, dataKey, displayMode }) => {
    const isBorder = typeof dataKey === 'number';
    
    const getValue = (char: AggregatedCharStat) => {
        const raw = isBorder ? (char.borders[dataKey as number] || 0) : char[dataKey as keyof AggregatedCharStat] as number;
        return displayMode === 'daily' ? Math.ceil(raw / char.duration) : raw;
    };

    const sortedData = [...data].sort((a, b) => getValue(b) - getValue(a));
    const maxVal = Math.max(...sortedData.map(d => getValue(d)));
    
    return (
        <div className="flex flex-col gap-2 pr-12">
            {sortedData.map((char, idx) => {
                const val = getValue(char);
                const percentage = maxVal > 0 ? (val / maxVal) * 100 : 0;
                const charImg = getAssetUrl(char.charId, 'character');
                
                return (
                    <div key={`${char.eventId}-${char.charId}`} className="flex items-center text-xs sm:text-sm group">
                        <div 
                            className="w-24 sm:w-32 flex-shrink-0 text-right pr-3 truncate font-bold"
                            style={{ color: char.color }}
                        >
                            {char.charName}
                        </div>
                        <div className="flex-1 h-8 bg-slate-200 dark:bg-slate-700/50 rounded-r relative flex items-center overflow-visible">
                            <div 
                                className="h-full rounded-r transition-all duration-500 ease-out flex items-center justify-end px-2"
                                style={{ 
                                    width: `${percentage}%`, 
                                    backgroundColor: char.color,
                                    opacity: 0.85
                                }}
                            >
                            </div>
                            <span className="absolute left-2 text-slate-700 dark:text-white font-mono drop-shadow-md font-bold z-10 pointer-events-none">
                                {val.toLocaleString()}
                            </span>
                            {charImg && (
                                <img 
                                    src={charImg} 
                                    alt={char.charName} 
                                    className="absolute w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 object-cover z-20 transition-all duration-500 ease-out"
                                    style={{ left: `${percentage}%`, marginLeft: '0.5rem' }}
                                />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

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
        case 2000:
            return <svg viewBox="0 0 10 10" className={classes}><path d="M2.5 1 L7.5 1 L10 5 L7.5 9 L2.5 9 L0 5 Z" fill={color} stroke={stroke} strokeWidth="1" /></svg>;
        case 5000:
            return <svg viewBox="0 0 10 10" className={classes}><polygon points="1,1 9,1 5,9" fill={color} stroke={stroke} strokeWidth="1" /></svg>;
        case 10000:
            return <svg viewBox="0 0 10 10" className={classes}><path d="M2 2 L8 8 M8 2 L2 8" stroke={color} strokeWidth="2.5" /></svg>;
        case 50000:
            return <svg viewBox="0 0 10 10" className={classes}><rect x="2.5" y="2.5" width="5" height="5" transform="rotate(45 5 5)" fill={color} stroke={stroke} strokeWidth="1" /></svg>;
        default:
            return <div className="w-2 h-2 rounded-full bg-white" />;
    }
};

const GlobalScoreChart: React.FC<{
    data: AggregatedCharStat[];
    displayMode: 'total' | 'daily';
    globalBase: 'T100' | 'T500';
}> = ({ data, displayMode, globalBase }) => {
    
    const getVal = (char: AggregatedCharStat, raw: number) => displayMode === 'daily' ? Math.ceil(raw / char.duration) : raw;

    const getBaseValue = (char: AggregatedCharStat) => {
        if (globalBase === 'T100') return getVal(char, char.top100);
        return getVal(char, char.borders[500] || 0);
    };

    const sortedData = [...data].sort((a, b) => getBaseValue(b) - getBaseValue(a));
    const globalMax = Math.max(...data.map(d => getBaseValue(d))) * 1.05;

    const scatterRanks = globalBase === 'T100' 
        ? [200, 300, 400, 500, 1000]
        : [1000, 2000, 5000, 10000, 50000];

    return (
        <div className="flex flex-col gap-3 pr-12">
            <div className="flex flex-wrap justify-end items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-300 mb-2 px-2">
                <div className="flex items-center gap-1">
                    <div className="w-8 h-4 bg-slate-300/50 dark:bg-slate-500/30 border border-slate-400 dark:border-slate-500 rounded-sm"></div>
                    <span>{globalBase} Range</span>
                </div>
                {scatterRanks.map(rank => (
                     <div key={rank} className="flex items-center gap-1" title={`Rank ${rank}`}>
                        <RankShape rank={rank} color="#71717a" />
                        <span className="font-mono">T{rank}</span>
                     </div>
                ))}
            </div>

            {sortedData.map((char, idx) => {
                const val = getBaseValue(char);
                const barWidth = (val / globalMax) * 100;
                const charImg = getAssetUrl(char.charId, 'character');
                
                return (
                    <div key={`${char.eventId}-${char.charId}`} className="flex items-center text-xs sm:text-sm group">
                        <div 
                            className="w-24 sm:w-32 flex-shrink-0 text-right pr-3 truncate font-bold"
                            style={{ color: char.color }}
                        >
                            {char.charName}
                        </div>

                        <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-800/30 rounded-r relative border-l border-slate-300 dark:border-slate-700 overflow-visible">
                            <div 
                                className="absolute top-0 left-0 h-full rounded-r transition-all duration-500 ease-out flex items-center justify-end px-2"
                                style={{ 
                                    width: `${barWidth}%`, 
                                    backgroundColor: char.color,
                                    opacity: 0.4
                                }}
                            >
                                <div className="text-[10px] text-slate-700 dark:text-white font-mono font-bold whitespace-nowrap drop-shadow-sm pointer-events-none">
                                    {displayMode === 'daily' ? val.toLocaleString() : `${(val / 10000).toFixed(1)}萬`}
                                </div>
                            </div>

                            {scatterRanks.map(rank => {
                                const rawScore = char.borders[rank] || 0;
                                if (rawScore === 0) return null;
                                const score = getVal(char, rawScore);
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

                            {charImg && (
                                <img 
                                    src={charImg} 
                                    alt={char.charName} 
                                    className="absolute top-0 w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 object-cover z-20 transition-all duration-500 ease-out"
                                    style={{ left: `${barWidth}%`, marginLeft: '0.5rem' }}
                                />
                            )}
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

const WorldLinkView: React.FC = () => {
    const [aggregatedData, setAggregatedData] = useState<AggregatedCharStat[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [currentRound, setCurrentRound] = useState<1 | 2>(1);
    
    const [isChartOpen, setIsChartOpen] = useState(true);
    const [chartViewMode, setChartViewMode] = useState<'activity' | 'global'>('activity');
    const [displayMode, setDisplayMode] = useState<'total' | 'daily'>('total');
    const [chartMetric, setChartMetric] = useState<MetricType>('top1');
    const [selectedBorderRank, setSelectedBorderRank] = useState<number>(1000);
    const [globalBase, setGlobalBase] = useState<'T100' | 'T500'>('T100');

    useEffect(() => {
        const fetchData = async () => {
            setIsAnalyzing(true);
            setAggregatedData([]);
            
            const tempStats: AggregatedCharStat[] = [];
            const targetIds = currentRound === 1 ? WORLD_LINK_ROUND_1_IDS : WORLD_LINK_ROUND_2_IDS;
            const total = targetIds.length;

            for (let i = 0; i < total; i++) {
                const eventId = targetIds[i];
                try {
                    const [resTop, resBorder] = await Promise.all([
                        fetch(`${API_BASE_URL}/event/${eventId}/top100`),
                        fetch(`${API_BASE_URL}/event/${eventId}/border`)
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

                    const charIdToNameMap = EVENT_CHAR_MAP[eventId] || {};
                    const chapterList = EVENT_CHAPTER_ORDER[eventId] || [];
                    
                    const duration = eventId === 140 ? 2 : 3;

                    Object.keys(charIdToNameMap).forEach(key => {
                        const charId = key; // 已經是 string ID
                        const charInfo = getChar(charId);
                        
                        const topData = chaptersTop.find(c => String(c.gameCharacterId) === charId)?.rankings || [];
                        const getScore = (r: number) => topData.find(x => x.rank === r)?.score || 0;

                        const charBorderObj = chaptersBorder.find(c => String(c.gameCharacterId) === charId);
                        const borderData = charBorderObj?.borderRankings || [];
                        
                        const borderScores: Record<number, number> = {};
                        borderData.forEach(b => {
                            borderScores[b.rank] = b.score;
                        });

                        const orderIndex = chapterList.indexOf(charInfo?.name || "");
                        const chapterOrder = orderIndex >= 0 ? orderIndex + 1 : 0;

                        const maxScore = Math.max(getScore(1), getScore(100), borderScores[1000] || 0);
                        
                        if (maxScore > 0 && charInfo) {
                            tempStats.push({
                                charName: charInfo.name,
                                charId: charInfo.id,
                                color: charInfo.color,
                                eventId,
                                top1: getScore(1),
                                top10: getScore(10),
                                top100: getScore(100),
                                borders: borderScores,
                                duration,
                                chapterOrder
                            });
                        }
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
    }, [currentRound]);

    const getValue = (stat: AggregatedCharStat, raw: number) => {
        return displayMode === 'daily' ? Math.ceil(raw / stat.duration) : raw;
    };

    const getSortedList = (key: 'top1' | 'top10' | 'top100') => {
        return [...aggregatedData].sort((a, b) => getValue(b, b[key]) - getValue(a, a[key]));
    };

    const getBorderList = (rank: number) => {
        return [...aggregatedData].sort((a, b) => getValue(b, b.borders[rank] || 0) - getValue(a, a.borders[rank] || 0));
    };

    const renderRow = (stat: AggregatedCharStat, idx: number, value: number) => (
        <tr key={`${stat.eventId}-${stat.charId}`} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            <td className={`px-3 py-2 font-bold ${idx < 3 ? 'text-yellow-500 dark:text-yellow-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {idx + 1}
            </td>
            <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                    <div 
                        className="w-2 h-8 rounded-sm flex-shrink-0" 
                        style={{ backgroundColor: stat.color }}
                    ></div>
                    <div className="min-w-0">
                        <div 
                            className="font-bold truncate" 
                            title={stat.charName}
                            style={{ color: stat.color }}
                        >
                            {stat.charName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <span>Event #{stat.eventId}</span>
                            {stat.chapterOrder > 0 && (
                                <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1 rounded text-[9px] font-bold">
                                    Ch.{stat.chapterOrder}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-white font-medium">
                {value.toLocaleString()}
            </td>
        </tr>
    );

    const columns = [
        { header: '#', className: 'w-10' },
        { header: '角色 (Character)' },
        { header: '分數 (Score)', className: 'text-right' }
    ];

    return (
        <div className="w-full animate-fadeIn py-4">
             <div className="mb-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">World Link 綜合分析 (Aggregated Analysis)</h2>
                        <p className="text-slate-500 dark:text-slate-400">彙整所有 World Link 期數，比較各角色分數排行</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                            <button
                                onClick={() => setCurrentRound(1)}
                                className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${
                                    currentRound === 1 
                                    ? 'bg-white dark:bg-slate-600 shadow-md text-cyan-600 dark:text-cyan-400' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                            >
                                第一輪 (Round 1)
                            </button>
                            <button
                                onClick={() => setCurrentRound(2)}
                                className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${
                                    currentRound === 2
                                    ? 'bg-white dark:bg-slate-600 shadow-md text-emerald-500 dark:text-emerald-400' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                            >
                                第二輪 (Round 2)
                            </button>
                        </div>

                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <button
                                onClick={() => setDisplayMode('total')}
                                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${
                                    displayMode === 'total' 
                                    ? 'bg-cyan-500 text-white shadow' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                總分
                            </button>
                            <button
                                onClick={() => setDisplayMode('daily')}
                                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${
                                    displayMode === 'daily' 
                                    ? 'bg-pink-500 text-white shadow' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                日均
                            </button>
                        </div>
                    </div>
                </div>

                {isAnalyzing ? (
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 mt-4 mb-6 relative overflow-hidden shadow-sm">
                         <div className="flex justify-between items-center mb-2 relative z-10">
                            <span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm animate-pulse">
                                正在同步 World Link 數據... ({loadingProgress}%)
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden relative z-10">
                            <div 
                                className="bg-cyan-500 h-2 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${loadingProgress}%` }}
                            ></div>
                        </div>
                    </div>
                ) : aggregatedData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 animate-fadeIn">
                        <div className="bg-slate-200 dark:bg-slate-700 p-4 rounded-full mb-4">
                            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-2">活動尚未開始</h3>
                        <p className="text-slate-500 dark:text-slate-400">目前沒有相關的排名資訊</p>
                    </div>
                ) : (
                    <>
                        <CollapsibleSection
                            title="圖表分析 (Chart Analysis)"
                            isOpen={isChartOpen}
                            onToggle={() => setIsChartOpen(!isChartOpen)}
                        >
                            <div className="mb-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                <div className="flex flex-wrap gap-3">
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

                                    {chartViewMode === 'global' && (
                                        <div className="flex bg-slate-100 dark:bg-slate-700 rounded p-1">
                                            <button 
                                                onClick={() => setGlobalBase('T100')}
                                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${globalBase === 'T100' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                            >
                                                T100 Base
                                            </button>
                                            <button 
                                                onClick={() => setGlobalBase('T500')}
                                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${globalBase === 'T500' ? 'bg-teal-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                            >
                                                T500 Base
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {chartViewMode === 'activity' && (
                                     <div className="flex items-center gap-2">
                                        <label className="text-sm text-slate-500 dark:text-slate-400 font-medium">排名基準:</label>
                                        <Select
                                            value={typeof chartMetric === 'string' ? chartMetric : chartMetric.toString()}
                                            onChange={(val) => {
                                                if (['top1', 'top10', 'top100'].includes(val)) {
                                                    setChartMetric(val as MetricType);
                                                } else {
                                                    setChartMetric(Number(val));
                                                }
                                            }}
                                            className="text-xs py-1.5"
                                            options={[
                                                { value: 'top1', label: 'Top 1' },
                                                { value: 'top10', label: 'Top 10' },
                                                { value: 'top100', label: 'Top 100' },
                                                ...BORDER_OPTIONS.map(rank => ({ value: rank, label: `T${rank}` }))
                                            ]}
                                        />
                                    </div>
                                )}
                            </div>
                            
                            {chartViewMode === 'activity' ? (
                                 <HorizontalBarChart 
                                    data={aggregatedData} 
                                    dataKey={chartMetric} 
                                    displayMode={displayMode}
                                />
                            ) : (
                                <GlobalScoreChart 
                                    data={aggregatedData} 
                                    displayMode={displayMode}
                                    globalBase={globalBase}
                                />
                            )}
                        </CollapsibleSection>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            <DashboardTable 
                                title={`Top 1 ${displayMode === 'daily' ? '(日均)' : '(最高分)'}`}
                                data={getSortedList('top1')} 
                                columns={columns}
                                renderRow={(d, idx) => renderRow(d, idx, getValue(d, d.top1))} 
                                color="bg-yellow-500" 
                            />
                            <DashboardTable 
                                title={`Top 10 ${displayMode === 'daily' ? '(日均)' : ''}`}
                                data={getSortedList('top10')} 
                                columns={columns}
                                renderRow={(d, idx) => renderRow(d, idx, getValue(d, d.top10))} 
                                color="bg-purple-500" 
                            />
                            <DashboardTable 
                                title={`Top 100 ${displayMode === 'daily' ? '(日均)' : ''}`}
                                data={getSortedList('top100')} 
                                columns={columns}
                                renderRow={(d, idx) => renderRow(d, idx, getValue(d, d.top100))} 
                                color="bg-cyan-500" 
                            />
                            <DashboardTable 
                                title={`Highlights T${selectedBorderRank} ${displayMode === 'daily' ? '(日均)' : ''}`}
                                headerAction={
                                     <Select
                                        value={selectedBorderRank} 
                                        onChange={(val) => setSelectedBorderRank(Number(val))}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-xs py-1"
                                        options={BORDER_OPTIONS.map(rank => ({ value: rank, label: `T${rank}` }))}
                                    />
                                }
                                data={getBorderList(selectedBorderRank)} 
                                columns={columns}
                                renderRow={(d, idx) => renderRow(d, idx, getValue(d, d.borders[selectedBorderRank] || 0))} 
                                color="bg-teal-500" 
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default WorldLinkView;
