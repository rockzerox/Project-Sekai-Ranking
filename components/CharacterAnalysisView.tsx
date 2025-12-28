import React, { useState, useEffect, useMemo, useRef } from 'react';
import { EventSummary, PastEventApiResponse, PastEventBorderApiResponse } from '../types';
import { 
    CHARACTER_MASTER, API_BASE_URL, getAssetUrl 
} from '../constants';
import * as Stats from '../utils/mathUtils';
import LoadingSpinner from './LoadingSpinner';
import { useConfig } from '../contexts/ConfigContext';
import { fetchJsonWithBigInt } from '../hooks/useRankings';
import Select from './ui/Select';

type StoryType = 'all' | 'unit_event' | 'mixed_event' | 'world_link';
const STORY_TYPES: {value: StoryType, label: string}[] = [
    { value: 'all', label: '全部' },
    { value: 'unit_event', label: '箱活' },
    { value: 'mixed_event', label: '混活' },
    { value: 'world_link', label: 'World Link' }
];

const RANK_OPTIONS = [1, 10, 100, 500, 1000, 5000, 10000].map(r => ({ value: r, label: `Top ${r}` }));
const PAGE_SIZE = 5;

const CharacterAnalysisView: React.FC = () => {
    const { eventDetails, getEventColor, wlDetails } = useConfig();
    
    const [activeCharId, setActiveCharId] = useState<string>('1'); 
    const [tempCharId, setTempCharId] = useState<string>('1');
    
    const [storyType, setStoryType] = useState<StoryType>('all');
    const [rankTarget, setRankTarget] = useState<number>(100);
    const [sortMode, setSortMode] = useState<'score' | 'id'>('id');
    const [currentPage, setCurrentPage] = useState(1);

    const [events, setEvents] = useState<EventSummary[]>([]);
    const [analyzedData, setAnalyzedData] = useState<any[]>([]);
    const [uniquePlayers, setUniquePlayers] = useState<number>(0);
    const [wlRankInfo, setWlRankInfo] = useState<{totalRank: number, dailyRank: number} | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    const scrollIntervalRef = useRef<number | null>(null);
    const currentChar = CHARACTER_MASTER[activeCharId];
    const tempChar = CHARACTER_MASTER[tempCharId];
    const charThemeColor = tempChar?.color || '#0891b2';
    const isWlMode = storyType === 'world_link';

    const charArray = useMemo(() => Object.values(CHARACTER_MASTER), []);
    const getVisibleChars = (centerId: string) => {
        const len = charArray.length;
        const centerIdx = charArray.findIndex(c => c.id === centerId);
        return [-2, -1, 0, 1, 2].map(offset => charArray[(centerIdx + offset + len) % len]);
    };

    const startScrolling = (direction: 'prev' | 'next') => {
        if (scrollIntervalRef.current) return;
        const scroll = () => {
            setTempCharId(current => {
                const len = charArray.length;
                const idx = charArray.findIndex(c => c.id === current);
                const nextIdx = direction === 'next' ? (idx + 1) % len : (idx - 1 + len) % len;
                return charArray[nextIdx].id;
            });
        };
        scroll();
        scrollIntervalRef.current = window.setInterval(scroll, 120);
    };

    const stopScrolling = () => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
            setActiveCharId(tempCharId);
        }
    };

    useEffect(() => {
        if (!scrollIntervalRef.current) setActiveCharId(tempCharId);
    }, [tempCharId]);

    useEffect(() => {
        fetchJsonWithBigInt(`${API_BASE_URL}/event/list`).then(setEvents).catch(console.error);
    }, []);

    useEffect(() => {
        if (events.length === 0) return;
        let isMounted = true;
        const abortController = new AbortController();

        const runAnalysis = async () => {
            setIsLoading(true);
            setProgress(0);
            setCurrentPage(1);
            setWlRankInfo(null);

            if (isWlMode) {
                // 從 wlDetails 中抓取活動 ID
                const targetWlIds = Object.keys(wlDetails).map(Number).sort((a,b) => a - b);
                const allCharScores: {id: string, total: number, daily: number, wlId: number, wlName: string, chapterOrder: number}[] = [];
                
                for (let wlId of targetWlIds) {
                    try {
                        const url = rankTarget <= 100 
                            ? `${API_BASE_URL}/event/${wlId}/top100` 
                            : `${API_BASE_URL}/event/${wlId}/border`;
                        
                        const json = await fetchJsonWithBigInt(url, abortController.signal);
                        const chapters = rankTarget <= 100 ? json.userWorldBloomChapterRankings : json.userWorldBloomChapterRankingBorders;
                        
                        const wlInfo = wlDetails[wlId];
                        const duration = wlInfo?.chDavg || 3; // 從 JSON 讀取
                        const eventInfo = events.find(e => e.id === wlId);
                        
                        chapters?.forEach((chap: any) => {
                            const cid = String(chap.gameCharacterId);
                            const rankings = chap.rankings || chap.borderRankings;
                            const score = rankings?.find((r: any) => r.rank === rankTarget)?.score || 0;
                            const order = wlInfo?.chorder.indexOf(cid) + 1 || 0;
                            
                            if (score > 0) allCharScores.push({ id: cid, total: score, daily: score / duration, wlId: wlId, wlName: eventInfo?.name || "World Link", chapterOrder: order });
                        });
                    } catch(e) {}
                }
                
                if (isMounted) {
                    const myWlData = allCharScores.filter(s => s.id === activeCharId);
                    const currentScore = myWlData[0];
                    if (currentScore) {
                        setWlRankInfo({ 
                            totalRank: allCharScores.filter(s => s.total > currentScore.total).length + 1, 
                            dailyRank: allCharScores.filter(s => s.daily > currentScore.daily).length + 1 
                        });
                        setAnalyzedData(myWlData.map(d => ({ id: d.wlId, name: d.wlName, score: d.total, daily: d.daily, isWl: true, chapterOrder: d.chapterOrder })));
                    } else setAnalyzedData([]);
                    setIsLoading(false);
                }
                return;
            }

            const now = new Date();
            const filteredEvents = events.filter(e => {
                const d = eventDetails[e.id];
                return d && new Date(e.closed_at) <= now && d.banner === activeCharId && (storyType === 'all' || d.storyType === storyType);
            }).sort((a, b) => b.id - a.id);

            if (filteredEvents.length === 0) { setAnalyzedData([]); setUniquePlayers(0); setIsLoading(false); return; }

            const results: any[] = [];
            const playerIds = new Set<string>();
            for (let i = 0; i < filteredEvents.length; i += 5) {
                if (!isMounted) break;
                const batch = filteredEvents.slice(i, i + 5);
                const batchRes = await Promise.all(batch.map(async (evt) => {
                    try {
                        const isT100 = rankTarget <= 100;
                        const scoreUrl = isT100 ? `${API_BASE_URL}/event/${evt.id}/top100` : `${API_BASE_URL}/event/${evt.id}/border`;
                        const top100Url = `${API_BASE_URL}/event/${evt.id}/top100`;

                        const [jsonScore, jsonTop100] = await Promise.all([
                            fetchJsonWithBigInt(scoreUrl, abortController.signal),
                            fetchJsonWithBigInt(top100Url, abortController.signal)
                        ]);
                        
                        let targetScore = 0;
                        if (jsonScore) {
                            targetScore = (isT100 ? jsonScore.rankings : jsonScore.borderRankings)?.find((r: any) => r.rank === rankTarget)?.score || 0;
                        }
                        if (jsonTop100 && jsonTop100.rankings) {
                            jsonTop100.rankings.forEach((r: any) => playerIds.add(String(r.userId)));
                        }
                        const duration = Math.max(1, Math.round((new Date(evt.aggregate_at).getTime() - new Date(evt.start_at).getTime()) / 86400000));
                        return { id: evt.id, name: evt.name, score: targetScore, daily: targetScore / duration };
                    } catch (e) { return null; }
                }));
                results.push(...batchRes.filter(r => r !== null && r.score > 0));
                setProgress(Math.round(((i + batch.length) / filteredEvents.length) * 100));
            }
            if (isMounted) { setAnalyzedData(results); setUniquePlayers(playerIds.size); setIsLoading(false); }
        };
        runAnalysis();
        return () => { isMounted = false; abortController.abort(); };
    }, [events, activeCharId, storyType, rankTarget, eventDetails, wlDetails]);

    const { stats, paginatedData, totalPages } = useMemo(() => {
        const scores = analyzedData.map(d => d.score);
        const sorted = [...analyzedData].sort((a, b) => sortMode === 'score' ? b.score - a.score : a.id - b.id);
        return {
            stats: { count: analyzedData.length, mean: Stats.calculateMean(scores), median: Stats.calculateMedian(scores), min: Stats.calculateMin(scores), max: Stats.calculateMax(scores), stdDev: Stats.calculateStdDev(scores) },
            paginatedData: sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
            totalPages: Math.ceil(sorted.length / PAGE_SIZE)
        };
    }, [analyzedData, sortMode, currentPage]);

    const storyLabel = useMemo(() => STORY_TYPES.find(t => t.value === storyType)?.label || '全部', [storyType]);

    const StatCard: React.FC<{ label: string, value: number | string, sub: string }> = ({ label, value, sub }) => (
        <div className="flex items-center justify-between p-4 bg-white/5 dark:bg-slate-800/20 backdrop-blur-xl rounded-2xl border border-white/10 shadow-sm transition-colors">
            <div className="flex flex-col">
                <span className="text-[12px] font-black text-slate-400 uppercase tracking-tight mb-1">{label}</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase">{sub}</span>
            </div>
            <div className="text-right">
                <div className="text-lg font-black text-slate-800 dark:text-white font-mono" style={{ color: charThemeColor }}>
                    {typeof value === 'number' ? Stats.formatScoreToChinese(value) : value}
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full animate-fadeIn pb-4 max-h-screen overflow-y-auto no-scrollbar relative">
            <div className="mb-6 px-1">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">推角分析 (Character Analytics)</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">以角色視角整合統計數據，分析 Banner 活動的熱度分佈與玩家參與分佈。</p>
            </div>

            <div className="bg-white/10 dark:bg-slate-800/10 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden mb-6 relative z-10">
                <div className="py-2.5 bg-black/20 dark:bg-white/5 border-b border-white/5">
                    <div className="flex md:hidden items-center justify-center gap-1 sm:gap-6">
                        <button onMouseDown={() => startScrolling('prev')} onMouseUp={stopScrolling} onMouseLeave={stopScrolling} className="p-2 text-slate-400 hover:text-white transition-colors active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg></button>
                        <div className="flex items-center gap-2 sm:gap-4">
                            {getVisibleChars(tempCharId).map((char, idx) => {
                                const isMain = idx === 2;
                                return (
                                    <div key={`${char.id}-${idx}`} className={`transition-all duration-300 ${isMain ? 'scale-125 z-20 opacity-100' : 'scale-75 opacity-20 blur-[1px]'}`}>
                                        <img src={getAssetUrl(char.id, 'character')} alt="c" className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${isMain ? 'shadow-xl' : ''}`} style={{ borderColor: isMain ? char.color : 'transparent' }} />
                                    </div>
                                );
                            })}
                        </div>
                        <button onMouseDown={() => startScrolling('next')} onMouseUp={stopScrolling} onMouseLeave={stopScrolling} className="p-2 text-slate-400 hover:text-white transition-colors active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg></button>
                    </div>

                    <div className="hidden md:flex flex-wrap items-center justify-center gap-2 px-4 max-h-[50px] overflow-y-auto no-scrollbar">
                        {charArray.map((char) => {
                            const isActive = activeCharId === char.id;
                            return (
                                <button 
                                    key={char.id} 
                                    onClick={() => { setActiveCharId(char.id); setTempCharId(char.id); }}
                                    className={`relative transition-all duration-300 hover:scale-110 hover:z-10 ${isActive ? 'scale-110 opacity-100' : 'opacity-30 grayscale hover:grayscale-0 hover:opacity-80'}`}
                                >
                                    <img src={getAssetUrl(char.id, 'character')} alt={char.name} className={`w-9 h-9 rounded-full border-2 shadow-sm`} style={{ borderColor: isActive ? char.color : 'transparent' }} title={char.name} />
                                    {isActive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full" style={{ backgroundColor: char.color }}></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="px-8 py-5 flex items-center gap-8 h-32 md:h-44 overflow-hidden">
                    <div className="h-full flex-shrink-0 animate-float">
                        <img src={getAssetUrl(activeCharId, 'character_q')} alt="q" className="h-full w-auto object-contain drop-shadow-2xl" />
                    </div>
                    <div className="flex-1 bg-black/10 dark:bg-slate-900/20 px-6 py-4 rounded-2xl border border-white/5 backdrop-blur-md">
                        {isWlMode ? (
                            <p className="text-slate-800 dark:text-slate-200 font-bold text-sm md:text-base leading-relaxed">
                                <span className="px-1" style={{ color: charThemeColor }}>{currentChar?.name}</span>
                                在 WL 活動時，於 <span className="px-1 font-mono" style={{ color: charThemeColor }}>T{rankTarget}</span> 
                                總分為全角色第 <span className="text-xl px-1" style={{ color: charThemeColor }}>{wlRankInfo?.totalRank || '-'}</span> 名，
                                日均分為全角色第 <span className="text-xl px-1" style={{ color: charThemeColor }}>{wlRankInfo?.dailyRank || '-'}</span> 名。
                            </p>
                        ) : (
                            <p className="text-slate-800 dark:text-slate-200 font-bold text-sm md:text-base leading-relaxed">
                                在共 <span className="text-xl px-0.5" style={{ color: charThemeColor }}>{stats.count}</span> 期 
                                <span className="px-1" style={{ color: charThemeColor }}>{currentChar?.name}</span> 
                                <span className="px-1" style={{ color: charThemeColor }}>{storyLabel}</span> 活動中，共 <span className="text-xl px-0.5" style={{ color: charThemeColor }}>{uniquePlayers.toLocaleString()}</span> 名玩家曾進入前百名， 
                                前百名不同玩家比例為 <span className="text-xl px-0.5" style={{ color: charThemeColor }}>{stats.count > 0 ? ((uniquePlayers/(stats.count*100))*100).toFixed(1) : "0.0"}%</span>。
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10 px-1">
                <div className="lg:col-span-3 hidden lg:flex flex-col justify-end bg-black/5 dark:bg-white/5 rounded-3xl overflow-hidden border border-white/5 p-4 min-h-[500px]">
                    <img src={getAssetUrl(activeCharId, 'character_full')} alt="full" className="w-full h-full object-contain object-bottom transition-all duration-700 animate-fadeIn" />
                </div>

                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="bg-white/10 dark:bg-slate-800/10 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 shadow-sm flex flex-col gap-4">
                        <div className="flex gap-2 w-full">
                            <div className="flex-1">
                                <Select value={storyType} onChange={(val) => setStoryType(val as any)} options={STORY_TYPES} className="py-2 text-xs font-black" />
                            </div>
                            <div className="flex-1">
                                <Select value={rankTarget} onChange={(val) => setRankTarget(Number(val))} options={RANK_OPTIONS} className="py-2 text-xs font-black" />
                            </div>
                        </div>
                    </div>

                    <div className="relative flex flex-col gap-3 h-full">
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/10 dark:bg-slate-900/10 backdrop-blur-md z-20 flex flex-col items-center justify-center rounded-2xl border border-white/5">
                                <LoadingSpinner />
                                <span className="mt-2 font-black text-xs animate-pulse" style={{ color: charThemeColor }}>分析中 {progress}%</span>
                            </div>
                        )}
                        {!isWlMode && stats.count === 0 ? (
                            <div className="bg-white/5 p-12 rounded-2xl border border-dashed border-white/10 text-center flex-1">
                                <p className="text-slate-400 text-sm font-bold italic">該角色未曾擔任過此類 Banner</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-[11px] h-full">
                                <StatCard label="統計期數" value={`${stats.count} 期`} sub="TOTAL SESSIONS" />
                                <StatCard label="最高分紀錄" value={stats.max} sub="MAX RECORD" />
                                <StatCard label="平均分數" value={stats.mean} sub="AVERAGE" />
                                <StatCard label="中位數" value={stats.median} sub="MEDIAN" />
                                <StatCard label="最低分紀錄" value={stats.min} sub="MIN RECORD" />
                                <StatCard label="標準差" value={stats.stdDev} sub="STD DEVIATION" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-5 bg-white/10 dark:bg-slate-800/10 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                    <div className="px-5 py-4 border-b border-white/10 bg-black/20 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                            <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2 flex-shrink-0">
                                <svg className="w-4 h-4" style={{ color: charThemeColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                <span className="hidden sm:inline">個人活動紀錄</span>
                                <span className="sm:hidden">紀錄</span>
                            </h3>
                            {!isWlMode && (
                                <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5 flex-shrink-0 scale-90 sm:scale-100 origin-left">
                                    <button onClick={() => {setSortMode('id'); setCurrentPage(1);}} className={`px-2.5 py-0.5 rounded text-[10px] font-black transition-all ${sortMode === 'id' ? 'bg-white/20 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>期數</button>
                                    <button onClick={() => {setSortMode('score'); setCurrentPage(1);}} className={`px-2.5 py-0.5 rounded text-[10px] font-black transition-all ${sortMode === 'score' ? 'bg-white/20 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>分數</button>
                                </div>
                            )}
                        </div>

                        {!isWlMode && totalPages > 1 && (
                            <div className="flex items-center gap-2 bg-black/30 px-2 py-1 rounded-full border border-white/10 flex-shrink-0 scale-90 sm:scale-100">
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="text-slate-400 hover:text-white disabled:opacity-20"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg></button>
                                <span className="text-[10px] font-black text-slate-300 font-mono min-w-[2.5rem] text-center">{currentPage}/{totalPages}</span>
                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="text-slate-400 hover:text-white disabled:opacity-20"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg></button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 p-3 flex flex-col gap-3">
                        {paginatedData.length > 0 ? (
                            <div className="flex flex-col h-full gap-3">
                                {paginatedData.map((evt, idx) => {
                                    const globalIdx = (currentPage - 1) * PAGE_SIZE + idx + 1;
                                    return (
                                        <div key={evt.id} className="flex-1 min-h-[75px] flex items-center gap-4 py-2 px-5 rounded-2xl bg-white/5 dark:bg-slate-900/20 border border-white/5 hover:bg-white/10 transition-all duration-300 shadow-sm group">
                                            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-black text-[12px] shadow-sm ${globalIdx === 1 ? 'bg-yellow-400 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                                {globalIdx}
                                            </div>
                                            <div className="w-24 h-11 flex-shrink-0 flex items-center bg-white/5 rounded p-1">
                                                <img src={getAssetUrl(evt.id.toString(), 'event')} alt="e" className="w-full h-full object-contain" />
                                            </div>
                                            <div className="flex-1 min-w-0 ml-1">
                                                <div className="font-black leading-tight truncate text-[13px] text-slate-200 hidden sm:block mb-1">
                                                    {evt.name}
                                                </div>
                                                <div className="text-[11px] text-slate-500 font-mono font-bold flex items-center gap-3">
                                                    <span className="text-slate-400">第 {evt.id} 期</span>
                                                    {evt.isWl && <span className="text-cyan-500 bg-cyan-500/10 px-1.5 rounded text-[10px]">第 {evt.chapterOrder} 章</span>}
                                                    <span className="text-emerald-500/80">日均:{Stats.formatScoreToChinese(evt.daily)}</span>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-2">
                                                <div className="text-base font-black text-white font-mono" style={{ color: charThemeColor }}>
                                                    {Stats.formatScoreToChinese(evt.score)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs italic font-bold">NO DATA</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CharacterAnalysisView;