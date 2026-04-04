
import React, { useState, useEffect } from 'react';
import { useMobile } from '../../hooks/useMobile';
import { WorldBloomChapter, WorldBloomChapterBorder } from '../../types';
import { CHARACTERS, API_BASE_URL } from '../../config/constants';
import { getAssetUrl } from '../../utils/gameUtils';
import DashboardTable from '../../components/ui/DashboardTable';
import Select from '../../components/ui/Select';
import { fetchJsonWithBigInt } from '../../hooks/useRankings';
import { useConfig } from '../../contexts/ConfigContext';
import { UI_TEXT } from '../../config/uiText';

const BORDER_OPTIONS = [200, 300, 400, 500, 1000, 2000, 5000, 10000];

const ROUND_OPTIONS = [
    { value: 1, label: '第一輪 (Round 1)' },
    { value: 2, label: '第二輪 (Round 2)' },
    { value: 3, label: '第三輪 (Round 3)' },
];

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
    isMobile?: boolean;
}> = ({ data, dataKey, displayMode, isMobile }) => {
    const isBorder = typeof dataKey === 'number';
    const getValue = (char: AggregatedCharStat) => {
        const raw = isBorder ? (char.borders[dataKey as number] || 0) : char[dataKey as keyof AggregatedCharStat] as number;
        return displayMode === 'daily' ? Math.ceil(raw / char.duration) : raw;
    };
    const sortedData = [...data].sort((a, b) => getValue(b) - getValue(a));
    const maxVal = Math.max(...sortedData.map(d => getValue(d)));
    // Compact sizes for mobile
    const barH   = isMobile ? 'h-5' : 'h-8';
    const imgSz  = isMobile ? 'w-5 h-5' : 'w-8 h-8';
    const gap    = isMobile ? 'gap-1' : 'gap-2';
    const pr     = isMobile ? 'pr-8'  : 'pr-12';
    const valSz  = isMobile ? 'text-[9px]' : 'text-xs';
    return (
        <div className={`flex flex-col ${gap} ${pr}`}>
            {sortedData.map((char) => {
                const val = getValue(char);
                const percentage = maxVal > 0 ? (val / maxVal) * 100 : 0;
                const charImg = getAssetUrl(char.charId, 'character');
                return (
                    <div key={`${char.eventId}-${char.charId}`} className="flex items-center text-xs sm:text-sm group relative">
                        <div className="hidden sm:block w-24 flex-shrink-0 text-right pr-3 truncate font-bold" style={{ color: char.color }}>{char.charName}</div>
                        <div className="absolute left-0 -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-800/90 px-2 py-1 rounded text-xs font-bold shadow-md z-30 pointer-events-none" style={{ color: char.color }}>{char.charName}</div>
                        <div className={`flex-1 ${barH} bg-slate-200 dark:bg-slate-700/50 rounded-r relative flex items-center overflow-visible`}>
                            <div className={`h-full rounded-r transition-all duration-500 ease-out flex items-center justify-end px-1`} style={{ width: `${percentage}%`, backgroundColor: char.color, opacity: 0.85 }}></div>
                            <span className={`absolute left-1.5 text-slate-700 dark:text-white font-mono drop-shadow-md font-bold z-10 pointer-events-none ${valSz}`}>{val.toLocaleString()}</span>
                            {charImg && <img src={charImg} alt={char.charName} className={`absolute ${imgSz} rounded-full border border-slate-200 dark:border-slate-600 object-cover z-20 transition-all duration-500 ease-out`} style={{ left: `${percentage}%`, marginLeft: '0.35rem' }} />}
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
        case 200: return <svg viewBox="0 0 10 10" className={classes}><circle cx="5" cy="5" r="4" fill={color} stroke={stroke} strokeWidth="1" /></svg>;
        case 300: return <svg viewBox="0 0 10 10" className={classes}><rect x="2" y="2" width="6" height="6" fill={color} stroke={stroke} strokeWidth="1" /></svg>;
        case 400: return <svg viewBox="0 0 10 10" className={classes}><polygon points="5,1 9,8 1,8" fill={color} stroke={stroke} strokeWidth="1" /></svg>;
        case 500: return <svg viewBox="0 0 10 10" className={classes}><polygon points="5,1 9,5 5,9 1,5" fill={color} stroke={stroke} strokeWidth="1" /></svg>;
        case 1000: return <svg viewBox="0 0 10 10" className={classes}><polygon points="5,1 6.3,3.5 9,3.9 7,5.7 7.5,8.5 5,7.2 2.5,8.5 3,5.7 1,3.9 3.7,3.5" fill={color} stroke={stroke} strokeWidth="1" /></svg>;
        case 2000: return <svg viewBox="0 0 10 10" className={classes}><path d="M2.5 1 L7.5 1 L10 5 L7.5 9 L2.5 9 L0 5 Z" fill={color} stroke={stroke} strokeWidth="1" /></svg>;
        case 5000: return <svg viewBox="0 0 10 10" className={classes}><polygon points="1,1 9,1 5,9" fill={color} stroke={stroke} strokeWidth="1" /></svg>;
        case 10000: return <svg viewBox="0 0 10 10" className={classes}><path d="M2 2 L8 8 M8 2 L2 8" stroke={color} strokeWidth="2.5" /></svg>;
        case 50000: return <svg viewBox="0 0 10 10" className={classes}><rect x="2.5" y="2.5" width="5" height="5" transform="rotate(45 5 5)" fill={color} stroke={stroke} strokeWidth="1" /></svg>;
        default: return <div className="w-2 h-2 rounded-full bg-white" />;
    }
};

const GlobalScoreChart: React.FC<{
    data: AggregatedCharStat[];
    displayMode: 'total' | 'daily';
    globalBase: 'T100' | 'T500';
    isMobile?: boolean;
}> = ({ data, displayMode, globalBase, isMobile }) => {
    const getVal = (char: AggregatedCharStat, raw: number) => displayMode === 'daily' ? Math.ceil(raw / char.duration) : raw;
    const getBaseValue = (char: AggregatedCharStat) => globalBase === 'T100' ? getVal(char, char.top100) : getVal(char, char.borders[500] || 0);
    const sortedData = [...data].sort((a, b) => getBaseValue(b) - getBaseValue(a));
    const globalMax = Math.max(...data.map(d => getBaseValue(d))) * 1.05;
    const scatterRanks = globalBase === 'T100' ? [200, 300, 400, 500, 1000] : [1000, 2000, 5000, 10000, 50000];
    // Compact sizes for mobile
    const barH   = isMobile ? 'h-5' : 'h-8';
    const imgSz  = isMobile ? 'w-5 h-5' : 'w-8 h-8';
    const gap    = isMobile ? 'gap-1' : 'gap-3';
    const pr     = isMobile ? 'pr-8'  : 'pr-12';
    const valSz  = isMobile ? 'text-[8px]' : 'text-[10px]';
    return (
        <div className={`flex flex-col ${gap} ${pr}`}>
            <div className="flex flex-wrap justify-end items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-300 mb-1 px-2">
                <div className="flex items-center gap-1"><div className="w-6 h-3 bg-slate-300/50 dark:bg-slate-500/30 border border-slate-400 dark:border-slate-500 rounded-sm"></div><span className={isMobile ? 'text-[10px]' : ''}>{globalBase} Range</span></div>
                {scatterRanks.map(rank => (<div key={rank} className="flex items-center gap-0.5" title={`Rank ${rank}`}><RankShape rank={rank} color="#71717a" /><span className={`font-mono ${isMobile ? 'text-[9px]' : ''}`}>T{rank}</span></div>))}
            </div>
            {sortedData.map((char) => {
                const val = getBaseValue(char);
                const barWidth = (val / globalMax) * 100;
                const charImg = getAssetUrl(char.charId, 'character');
                return (
                    <div key={`${char.eventId}-${char.charId}`} className="flex items-center text-xs sm:text-sm group relative">
                        <div className="hidden sm:block w-24 flex-shrink-0 text-right pr-3 truncate font-bold" style={{ color: char.color }}>{char.charName}</div>
                        <div className="absolute left-0 -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-800/90 px-2 py-1 rounded text-xs font-bold shadow-md z-30 pointer-events-none" style={{ color: char.color }}>{char.charName}</div>
                        <div className={`flex-1 ${barH} bg-slate-100 dark:bg-slate-800/30 rounded-r relative border-l border-slate-300 dark:border-slate-700 overflow-visible`}>
                            <div className="absolute top-0 left-0 h-full rounded-r transition-all duration-500 ease-out flex items-center justify-end px-1" style={{ width: `${barWidth}%`, backgroundColor: char.color, opacity: 0.4 }}>
                                <div className={`${valSz} text-slate-700 dark:text-white font-mono font-bold whitespace-nowrap drop-shadow-sm pointer-events-none`}>{displayMode === 'daily' ? val.toLocaleString() : `${(val / 10000).toFixed(1)}萬`}</div>
                            </div>
                            {scatterRanks.map(rank => {
                                const rawScore = char.borders[rank] || 0;
                                if (rawScore === 0) return null;
                                const score = getVal(char, rawScore);
                                const pos = (score / globalMax) * 100;
                                return (<div key={rank} className="absolute top-1/2 -translate-y-1/2 transform -translate-x-1/2 z-10" style={{ left: `${pos}%` }} title={`Top ${rank}: ${score.toLocaleString()}`}><RankShape rank={rank} color={char.color} /></div>);
                            })}
                            {charImg && <img src={charImg} alt={char.charName} className={`absolute top-0 ${imgSz} rounded-full border border-slate-200 dark:border-slate-600 object-cover z-20 transition-all duration-500 ease-out`} style={{ left: `${barWidth}%`, marginLeft: '0.35rem' }} />}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const WorldLinkView: React.FC = () => {
    const { getWlIdsByRound, getWlDetail } = useConfig();
    const isMobile = useMobile();
    const [aggregatedData, setAggregatedData] = useState<AggregatedCharStat[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    
    // View States
    const [currentRound, setCurrentRound] = useState<number>(1);
    const [contentMode, setContentMode] = useState<'chart' | 'table'>('chart');
    const [chartViewMode, setChartViewMode] = useState<'activity' | 'global'>('activity');
    const [displayMode, setDisplayMode] = useState<'total' | 'daily'>('total');
    const [chartMetric, setChartMetric] = useState<MetricType>('top1');
    const [selectedBorderRank, setSelectedBorderRank] = useState<number>(1000);
    const [globalBase, setGlobalBase] = useState<'T100' | 'T500'>('T100');

    useEffect(() => {
        const fetchData = async () => {
            setIsAnalyzing(true);
            setAggregatedData([]);
            setLoadingProgress(0);

            const targetIds = getWlIdsByRound(currentRound);
            if (targetIds.length === 0) { setIsAnalyzing(false); return; }

            try {
                // 一次性獲取所有 WL 章節統計 (極速)
                const res = await fetch(`/api/stats/border-stats`);
                if (!res.ok) throw new Error("Failed to fetch border stats");
                const borderStatsData = await res.json();
                const wlStats = borderStatsData.wlStats || borderStatsData.data?.wlStats || [];

                const tempStats: AggregatedCharStat[] = [];
                
                // 只篩選目前輪次 (currentRound) 的活動
                const currentRoundStats = (wlStats || []).filter((s: any) => targetIds.includes(s.eventId));

                currentRoundStats.forEach((stat: any) => {
                    const eventId = stat.eventId;
                    const charId = String(stat.chapterCharId);
                    const wlDetail = getWlDetail(eventId);
                    const chapterIds = wlDetail?.chorder || [];
                    const duration = wlDetail?.chDavg || 3;
                    const orderIdx = chapterIds.indexOf(charId);
                    const charInfo = CHARACTERS[charId];

                    if (charInfo && orderIdx !== -1) {
                        tempStats.push({
                            charName: charInfo.name,
                            charId: charInfo.id,
                            color: charInfo.color,
                            eventId,
                            top1: stat.top1,
                            top10: stat.top10,
                            top100: stat.top100,
                            borders: stat.borders || {},
                            duration,
                            chapterOrder: orderIdx + 1
                        });
                    }
                });

                // 照 eventId 和 chapterOrder 排序
                tempStats.sort((a, b) => a.eventId !== b.eventId ? a.eventId - b.eventId : a.chapterOrder - b.chapterOrder);
                
                setAggregatedData(tempStats);
                setLoadingProgress(100);
            } catch (e) {
                console.error("WorldLink Analysis Error:", e);
            } finally {
                setIsAnalyzing(false);
            }
        };
        fetchData();
    }, [currentRound, getWlIdsByRound, getWlDetail]);

    const getValue = (stat: AggregatedCharStat, raw: number) => displayMode === 'daily' ? Math.ceil(raw / stat.duration) : raw;
    const getSortedList = (key: 'top1' | 'top10' | 'top100') => [...aggregatedData].sort((a, b) => getValue(b, b[key]) - getValue(a, a[key]));
    const getBorderList = (rank: number) => [...aggregatedData].sort((a, b) => getValue(b, b.borders[rank] || 0) - getValue(a, a.borders[rank] || 0));

    const renderRow = (stat: AggregatedCharStat, idx: number, value: number) => (
        <tr key={`${stat.eventId}-${stat.charId}`} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            <td className={`px-3 py-2 font-bold ${idx < 3 ? 'text-yellow-500 dark:text-yellow-400' : 'text-slate-400 dark:text-slate-500'}`}>{idx + 1}</td>
            <td className="px-3 py-2"><div className="flex items-center gap-2"><div className="w-2 h-8 rounded-sm flex-shrink-0" style={{ backgroundColor: stat.color }}></div><div className="min-w-0"><div className="font-bold truncate" title={stat.charName} style={{ color: stat.color }}>{stat.charName}</div><div className="text-[10px] text-slate-500 font-mono flex items-center gap-1"><span>Event #{stat.eventId}</span><span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1 rounded text-[9px] font-bold">Ch.{stat.chapterOrder}</span></div></div></div></td>
            <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-white font-medium">{value.toLocaleString()}</td>
        </tr>
    );

    return (
        <div className="w-full animate-fadeIn py-4">
             <div className="mb-6">
                <div className="mb-4">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{UI_TEXT.worldLink.title}</h2>
                    <p className="text-slate-500 dark:text-slate-400">{UI_TEXT.worldLink.description}</p>
                </div>

                {/* Control Dashboard */}
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    
                    {/* Left: Data Settings */}
                    <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                        <Select 
                            label="活動輪次 (Round)"
                            options={ROUND_OPTIONS}
                            value={currentRound}
                            onChange={(val) => setCurrentRound(Number(val))}
                            className="w-full sm:w-48 text-sm font-bold"
                            containerClassName="w-full sm:w-auto"
                        />
                        
                        <div className="flex flex-col w-full sm:w-auto">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">分數模式</span>
                            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
                                <button onClick={() => setDisplayMode('total')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all ${displayMode === 'total' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>總分</button>
                                <button onClick={() => setDisplayMode('daily')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all ${displayMode === 'daily' ? 'bg-pink-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>日均</button>
                            </div>
                        </div>
                    </div>

                    {/* Right: View Mode Toggle */}
                    <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1 w-full md:w-auto">
                        <button onClick={() => setContentMode('chart')} className={`flex-1 md:flex-none px-6 py-2 text-sm font-black rounded-md transition-all flex items-center justify-center gap-2 ${contentMode === 'chart' ? 'bg-white dark:bg-slate-600 shadow text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            圖表分析
                        </button>
                        <button onClick={() => setContentMode('table')} className={`flex-1 md:flex-none px-6 py-2 text-sm font-black rounded-md transition-all flex items-center justify-center gap-2 ${contentMode === 'table' ? 'bg-white dark:bg-slate-600 shadow text-emerald-500 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7-4h14M2 20.535V3.465C2 2.656 2.656 2 3.465 2h17.07C21.344 2 22 2.656 22 3.465v17.07c0 .809-.656 1.465-1.465 1.465H3.465C2.656 22 2 21.344 2 20.535z" /></svg>
                            排行榜
                        </button>
                    </div>
                </div>
            </div>

            {isAnalyzing ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-8 border border-slate-200 dark:border-slate-700 relative overflow-hidden shadow-sm flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm animate-pulse">正在同步跨期數據... ({loadingProgress}%)</span>
                    <div className="w-64 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-4 overflow-hidden">
                        <div className="bg-cyan-500 h-full transition-all duration-300 ease-out" style={{ width: `${loadingProgress}%` }}></div>
                    </div>
                </div>
            ) : (
                <div className="min-h-[400px]">
                    {contentMode === 'chart' ? (
                        <div className="animate-fadeIn bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 lg:p-6 shadow-lg">
                            <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                                <div className="flex bg-slate-100 dark:bg-slate-700 rounded p-1">
                                    <button onClick={() => setChartViewMode('activity')} className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${chartViewMode === 'activity' ? 'bg-cyan-600 text-white shadow' : 'text-slate-500 dark:text-slate-300'}`}>{UI_TEXT.worldLink.modes.activity}</button>
                                    <button onClick={() => setChartViewMode('global')} className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${chartViewMode === 'global' ? 'bg-purple-600 text-white shadow' : 'text-slate-500 dark:text-slate-300'}`}>{UI_TEXT.worldLink.modes.global}</button>
                                </div>
                                
                                {chartViewMode === 'activity' && (
                                    <Select 
                                        value={typeof chartMetric === 'string' ? chartMetric : chartMetric.toString()} 
                                        onChange={(val) => setChartMetric(isNaN(Number(val)) ? val as MetricType : Number(val))} 
                                        className="text-xs w-40" 
                                        options={[{ value: 'top1', label: 'Top 1' }, { value: 'top10', label: 'Top 10' }, { value: 'top100', label: 'Top 100' }, ...BORDER_OPTIONS.map(r => ({ value: r, label: `T${r}` }))]} 
                                    />
                                )}

                                {chartViewMode === 'global' && (
                                    <div className="flex bg-slate-100 dark:bg-slate-700 rounded p-1">
                                        <button onClick={() => setGlobalBase('T100')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${globalBase === 'T100' ? 'bg-purple-600 text-white shadow' : 'text-slate-500 dark:text-slate-300'}`}>T100 Base</button>
                                        <button onClick={() => setGlobalBase('T500')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${globalBase === 'T500' ? 'bg-purple-600 text-white shadow' : 'text-slate-500 dark:text-slate-300'}`}>T500 Base</button>
                                    </div>
                                )}
                            </div>
                            
                            {chartViewMode === 'activity' ? <HorizontalBarChart data={aggregatedData} dataKey={chartMetric} displayMode={displayMode} isMobile={isMobile} /> : <GlobalScoreChart data={aggregatedData} displayMode={displayMode} globalBase={globalBase} isMobile={isMobile} />}
                        </div>
                    ) : (
                        <div className="animate-fadeIn grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            <DashboardTable title={`Top 1 ${displayMode === 'daily' ? '(日均)' : ''}`} data={getSortedList('top1')} columns={[{ header: '#', className: 'w-10' }, { header: '角色' }, { header: '分數', className: 'text-right' }]} renderRow={(d, idx) => renderRow(d, idx, getValue(d, d.top1))} color="bg-yellow-500" />
                            <DashboardTable title={`Top 10 ${displayMode === 'daily' ? '(日均)' : ''}`} data={getSortedList('top10')} columns={[{ header: '#', className: 'w-10' }, { header: '角色' }, { header: '分數', className: 'text-right' }]} renderRow={(d, idx) => renderRow(d, idx, getValue(d, d.top10))} color="bg-purple-500" />
                            <DashboardTable title={`Top 100 ${displayMode === 'daily' ? '(日均)' : ''}`} data={getSortedList('top100')} columns={[{ header: '#', className: 'w-10' }, { header: '角色' }, { header: '分數', className: 'text-right' }]} renderRow={(d, idx) => renderRow(d, idx, getValue(d, d.top100))} color="bg-cyan-500" />
                            <DashboardTable title={`T${selectedBorderRank} ${displayMode === 'daily' ? '(日均)' : ''}`} headerAction={<Select value={selectedBorderRank} onChange={(val) => setSelectedBorderRank(Number(val))} className="text-xs" options={BORDER_OPTIONS.map(r => ({ value: r, label: `T${r}` }))} />} data={getBorderList(selectedBorderRank)} columns={[{ header: '#', className: 'w-10' }, { header: '角色' }, { header: '分數', className: 'text-right' }]} renderRow={(d, idx) => renderRow(d, idx, getValue(d, d.borders[selectedBorderRank] || 0))} color="bg-teal-500" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WorldLinkView;
