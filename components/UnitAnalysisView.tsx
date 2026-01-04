
import React, { useState, useEffect, useMemo } from 'react';
import { EventSummary } from '../types';
import { 
    UNIT_ORDER, UNIT_MASTER, API_BASE_URL, getAssetUrl 
} from '../constants';
import * as Stats from '../utils/mathUtils';
import LoadingSpinner from './LoadingSpinner';
import { useConfig } from '../contexts/ConfigContext';
import { fetchJsonWithBigInt } from '../hooks/useRankings';
import { UI_TEXT } from '../constants/uiText';

type StoryType = 'unit_event' | 'world_link';
const STORY_TYPES: { id: StoryType, label: string }[] = [
    { id: 'unit_event', label: '箱活' },
    { id: 'world_link', label: 'World Link' }
];

const RANK_TARGETS = [1, 10, 100, 500, 1000, 5000, 10000];

const UnitAnalysisView: React.FC = () => {
    const { eventDetails, getEventColor } = useConfig();
    const [selectedUnit, setSelectedUnit] = useState<string>('1'); // Leo/need ID
    const [storyType, setStoryType] = useState<StoryType>('unit_event');
    const [rankTarget, setRankTarget] = useState<number>(100);

    const [events, setEvents] = useState<EventSummary[]>([]);
    const [analyzedData, setAnalyzedData] = useState<any[]>([]);
    const [uniquePlayers, setUniquePlayers] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    const unitInfo = UNIT_MASTER[selectedUnit];
    const unitThemeColor = unitInfo?.color || '#0891b2';

    useEffect(() => {
        const fetchList = async () => {
            try {
                const data = await fetchJsonWithBigInt(`${API_BASE_URL}/event/list`);
                if (data) setEvents(data);
            } catch (e) { console.error("UnitAnalysis: Failed to fetch event list", e); }
        };
        fetchList();
    }, []);

    useEffect(() => {
        if (events.length === 0) return;

        let isMounted = true;
        const abortController = new AbortController();

        const runAnalysis = async () => {
            setIsLoading(true);
            setProgress(0);
            
            const now = new Date();
            const filteredEvents = events.filter(e => {
                const details = eventDetails[e.id];
                if (!details) return false;
                if (new Date(e.closed_at) > now) return false; 
                
                return details.unit === selectedUnit && details.storyType === storyType;
            }).sort((a, b) => b.id - a.id);

            if (filteredEvents.length === 0) {
                setAnalyzedData([]);
                setUniquePlayers(0);
                setIsLoading(false);
                return;
            }

            const results: any[] = [];
            const playerIds = new Set<string>();

            const BATCH_SIZE = 5;
            for (let i = 0; i < filteredEvents.length; i += BATCH_SIZE) {
                if (!isMounted) break;
                const batch = filteredEvents.slice(i, i + BATCH_SIZE);
                
                const batchResults = await Promise.all(batch.map(async (evt) => {
                    try {
                        const isT100 = rankTarget <= 100;
                        const scoreUrl = isT100 
                            ? `${API_BASE_URL}/event/${evt.id}/top100`
                            : `${API_BASE_URL}/event/${evt.id}/border`;
                        
                        const [jsonScore, jsonTop100] = await Promise.all([
                            fetchJsonWithBigInt(scoreUrl, abortController.signal),
                            fetchJsonWithBigInt(`${API_BASE_URL}/event/${evt.id}/top100`, abortController.signal)
                        ]);

                        let targetScore = 0;
                        if (jsonScore) {
                            const rankings = isT100 ? jsonScore.rankings : jsonScore.borderRankings;
                            targetScore = rankings?.find((r: any) => r.rank === rankTarget)?.score || 0;
                        }

                        if (jsonTop100 && jsonTop100.rankings) {
                            jsonTop100.rankings.forEach((r: any) => playerIds.add(String(r.userId)));
                        }

                        return { id: evt.id, name: evt.name, score: targetScore };
                    } catch (e) { return null; }
                }));

                results.push(...batchResults.filter(r => r !== null && r.score > 0));
                setProgress(Math.round(((i + batch.length) / filteredEvents.length) * 100));
            }

            if (isMounted) {
                setAnalyzedData(results);
                setUniquePlayers(playerIds.size);
                setIsLoading(false);
            }
        };

        runAnalysis();

        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [events, selectedUnit, storyType, rankTarget, eventDetails]);

    const stats = useMemo(() => {
        const scores = analyzedData.map(d => d.score);
        const count = analyzedData.length;
        const uniquenessRatio = count > 0 ? ((uniquePlayers / (count * 100)) * 100).toFixed(1) : "0.0";

        return {
            count,
            uniquenessRatio,
            mean: Stats.calculateMean(scores),
            median: Stats.calculateMedian(scores),
            min: Stats.calculateMin(scores),
            max: Stats.calculateMax(scores),
            stdDev: Stats.calculateStdDev(scores)
        };
    }, [analyzedData, uniquePlayers]);

    const top5 = useMemo(() => {
        return [...analyzedData].sort((a, b) => b.score - a.score).slice(0, 5);
    }, [analyzedData]);

    const StatCard: React.FC<{ label: string, value: number, sub: string }> = ({ label, value, sub }) => (
        <div 
            className="flex-1 flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border shadow-sm transition-colors"
            style={{ borderColor: `${unitThemeColor}44` }}
        >
            <div className="flex flex-col">
                <span className="text-[13px] font-black text-slate-400 uppercase tracking-tight mb-0.5">{label}</span>
                <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase">{sub}</span>
            </div>
            <div className="text-right">
                <div className="text-lg font-black text-slate-800 dark:text-white font-mono" style={{ color: unitThemeColor }}>
                    {Stats.formatScoreToChinese(value)}
                </div>
            </div>
        </div>
    );

    const storyLabel = useMemo(() => STORY_TYPES.find(t => t.id === storyType)?.label || '箱活', [storyType]);

    return (
        <div className="w-full animate-fadeIn pb-4 max-h-screen overflow-y-auto no-scrollbar">
            <div className="mb-4">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{UI_TEXT.unitAnalysis.title}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">{UI_TEXT.unitAnalysis.description}</p>
            </div>

            <div 
                className="bg-white dark:bg-slate-800 rounded-2xl border shadow-sm overflow-hidden mb-4"
                style={{ borderColor: `${unitThemeColor}66` }}
            >
                <div className="flex justify-center gap-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                    {UNIT_ORDER.filter(u => u !== '99').map(id => (
                        <button 
                            key={id}
                            onClick={() => setSelectedUnit(id)}
                            className={`relative transition-all duration-300 ${selectedUnit === id ? 'scale-110' : 'grayscale opacity-40 hover:grayscale-0 hover:opacity-100'}`}
                        >
                            <img src={getAssetUrl(id, 'unit')} alt={UNIT_MASTER[id].name} className="w-9 h-9 object-contain" />
                            {selectedUnit === id && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full" style={{ backgroundColor: unitThemeColor }}></div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="px-3 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                    {/* 手機版隱藏團體 LOGO */}
                    <div className="flex-shrink-0 hidden md:block">
                        <img src={getAssetUrl(selectedUnit, 'unit_full')} alt="full logo" className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm" />
                    </div>
                    
                    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900/40 px-3 md:px-6 py-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <p 
                            className="text-slate-700 dark:text-slate-200 font-bold leading-relaxed flex flex-wrap items-center"
                            style={{ fontSize: 'clamp(12px, 3.5vw, 16px)' }}
                        >
                            <span>{UI_TEXT.unitAnalysis.summary.prefix} <span className="text-xl px-1" style={{ color: unitThemeColor }}>{stats.count}</span> {UI_TEXT.unitAnalysis.summary.middle1}</span>
                            <span className="px-1" style={{ color: unitThemeColor }}>{unitInfo?.name}</span>
                            <span className="px-1" style={{ color: unitThemeColor }}>{storyLabel}</span>
                            <span>{UI_TEXT.unitAnalysis.summary.middle2} <span className="text-xl px-1" style={{ color: unitThemeColor }}>{uniquePlayers.toLocaleString()}</span> {UI_TEXT.unitAnalysis.summary.middle3}</span>
                            <span className="md:ml-1">{UI_TEXT.unitAnalysis.summary.suffix} <span className="text-xl px-1" style={{ color: unitThemeColor }}>{stats.uniquenessRatio}%</span>。</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-5 flex flex-col gap-4">
                    <div 
                        className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border flex flex-col gap-3"
                        style={{ borderColor: `${unitThemeColor}44` }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">劇情</span>
                            <div className="flex flex-wrap gap-1.5">
                                {STORY_TYPES.map(t => (
                                    <button 
                                        key={t.id} 
                                        onClick={() => setStoryType(t.id)}
                                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${storyType === t.id ? 'text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200'}`}
                                        style={storyType === t.id ? { backgroundColor: unitThemeColor } : {}}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">名次</span>
                            <div className="flex flex-wrap gap-1.5">
                                {RANK_TARGETS.map(r => (
                                    <button 
                                        key={r} 
                                        onClick={() => setRankTarget(r)}
                                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all border ${rankTarget === r ? 'text-white shadow-md' : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
                                        style={rankTarget === r ? { backgroundColor: unitThemeColor, borderColor: unitThemeColor } : {}}
                                    >
                                        T{r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div 
                        className="bg-slate-100 dark:bg-slate-900/60 p-4 rounded-2xl flex items-center justify-between border"
                        style={{ borderColor: `${unitThemeColor}44` }}
                    >
                         <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-400 uppercase">{UI_TEXT.common.stats.count}</span>
                            <span className="text-[10px] text-slate-500 font-bold tracking-tighter">BASE SESSIONS ANALYZED</span>
                         </div>
                         <div className="text-3xl font-black text-slate-800 dark:text-white font-mono">{stats.count}</div>
                    </div>

                    <div className="flex-1 relative flex flex-col gap-3 min-h-[360px]">
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl border border-white/5 shadow-inner">
                                <LoadingSpinner />
                                <span className="mt-2 font-black text-[10px] animate-pulse" style={{ color: unitThemeColor }}>分析中 ({progress}%)</span>
                            </div>
                        )}

                        <StatCard label={UI_TEXT.common.stats.max} value={stats.max} sub="MAX RECORD" />
                        <StatCard label={UI_TEXT.common.stats.mean} value={stats.mean} sub="MEAN AVERAGE" />
                        <StatCard label={UI_TEXT.common.stats.median} value={stats.median} sub="MEDIAN SCORE" />
                        <StatCard label={UI_TEXT.common.stats.min} value={stats.min} sub="MIN RECORD" />
                        <StatCard label={UI_TEXT.common.stats.stdDev} value={stats.stdDev} sub="STANDARD DEVIATION" />
                    </div>
                </div>

                <div 
                    className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl border shadow-sm overflow-hidden flex flex-col min-h-[520px]"
                    style={{ borderColor: `${unitThemeColor}44` }}
                >
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/30">
                        <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                             <svg className="w-5 h-5" style={{ color: unitThemeColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
                             {UI_TEXT.unitAnalysis.topRecords} T{rankTarget}
                        </h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOP 5 RECORDS</span>
                    </div>

                    <div className="flex-1 p-4 flex flex-col gap-3">
                        {top5.length > 0 ? (
                            <div className="flex-1 flex flex-col gap-3">
                                {top5.map((evt, idx) => {
                                    const eventColor = getEventColor(evt.id);
                                    const logoUrl = getAssetUrl(evt.id.toString(), 'event');
                                    
                                    return (
                                        <div 
                                            key={evt.id} 
                                            className="flex-1 flex items-center gap-4 py-2 px-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 shadow-sm group"
                                            style={{ borderColor: `${unitThemeColor}22` }}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-black text-sm shadow-sm ${idx === 0 ? 'bg-yellow-400 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                                {idx + 1}
                                            </div>
                                            
                                            {logoUrl && (
                                                <div className="w-24 h-11 flex-shrink-0 flex items-center bg-white/5 rounded p-1">
                                                    <img src={logoUrl} alt="evt" className="w-full h-full object-contain" />
                                                </div>
                                            )}

                                            <div className="hidden sm:block flex-1 min-w-0">
                                                <div className="font-black leading-snug line-clamp-2 text-sm sm:text-base mb-1" style={{ color: eventColor }}>
                                                    {evt.name}
                                                </div>
                                                <div className="text-xs text-slate-400 font-mono font-bold">第 {evt.id} 期</div>
                                            </div>

                                            <div className="text-right flex-1 sm:flex-shrink-0 ml-2">
                                                <div className="text-lg sm:text-xl font-black text-slate-800 dark:text-white font-mono leading-none" style={{ color: unitThemeColor }}>
                                                    {Stats.formatScoreToChinese(evt.score)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs italic font-bold py-10">
                                暫無符合條件的數據
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnitAnalysisView;
