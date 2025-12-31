
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CHARACTER_MASTER, UNIT_MASTER, getAssetUrl, API_BASE_URL, UNIT_ORDER } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { useConfig } from '../contexts/ConfigContext';
import { fetchJsonWithBigInt } from '../hooks/useRankings';
import { EventSummary, PastEventApiResponse } from '../types';

interface AnalysisResult {
    id: string;
    type: 'global' | 'unit' | 'char';
    rawId: string;
    name: string;
    color: string;
    eventCount: number;
    data: number[]; 
}

type AnalysisMode = 'banner' | 'fourStar';

// 抽取解讀指南組件（含分頁邏輯）
const InterpretationGuide: React.FC = () => {
    const [page, setPage] = useState(1);

    return (
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl flex-1 flex flex-col min-h-[360px] lg:min-h-0 border border-white/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
                <h4 className="text-[12px] font-black text-cyan-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {page === 1 ? '換血率基礎定義' : '排名生態趨勢解讀'}
                </h4>
                <div className="flex gap-1.5">
                    {[1, 2].map(p => (
                        <button key={p} onClick={() => setPage(p)} className={`w-2 h-2 rounded-full transition-all ${page === p ? 'bg-cyan-500 w-5' : 'bg-slate-700'}`} aria-label={`Page ${p}`} />
                    ))}
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 animate-fadeIn" key={page}>
                {page === 1 ? (
                    <div className="space-y-5">
                        <div className="flex gap-3 items-start">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 shadow-[0_0_8px_#10b981]"></div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-black text-emerald-400 mb-0.5">高換血率：生態系活躍</span>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-bold font-sans">數值較高代表該區間在不同期數間「新面孔」極多。意味著新進衝榜者容易進入該階層，玩家層次的流動性非常健康，競爭門檻較低。</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 items-start">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0 shadow-[0_0_8px_#f43f5e]"></div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-black text-rose-400 mb-0.5">低換血率：階級高度固化</span>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-bold font-sans">數值偏低代表該名次長期被特定玩家佔據。形成了一道難以跨越的資源與技術門檻，生態系呈現「滯後」或「死水」狀態。</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <button onClick={() => setPage(2)} className="w-full flex items-center justify-between p-3.5 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-xl transition-all border border-cyan-500/20 group">
                                <div className="flex flex-col items-start">
                                    <span className="text-[11px] font-black text-cyan-400 uppercase tracking-widest">下一頁 (Next Page)</span>
                                    <span className="text-[10px] text-slate-400 font-bold">深入探討排名趨勢與行為分析</span>
                                </div>
                                <svg className="w-5 h-5 text-cyan-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex gap-3 items-start">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 shadow-[0_0_8px_#10b981]"></div>
                            <div className="flex flex-col">
                                <span className="text-[12px] font-black text-emerald-400 mb-0.5">正趨勢 (+)：生態擴張</span>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-bold font-sans">名次越往後，新玩家湧入速度越快。代表該角色的「大眾參與度」隨著名次放寬而顯著提升。</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 items-start">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-500 mt-1 shrink-0 shadow-[0_0_8px_#64748b]"></div>
                            <div className="flex flex-col">
                                <span className="text-[12px] font-black text-slate-400 mb-0.5">零趨勢 (≈0)：結構穩定</span>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-bold font-sans">各區間換血率持平，代表競爭模式固定。無論名次先後，參與競爭的人員比例都沒有顯著變化。</p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0 shadow-[0_0_8px_#f43f5e]"></div>
                            <div className="flex flex-col">
                                <span className="text-[12px] font-black text-rose-400 mb-0.5">負趨勢 (-)：規模萎縮</span>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-bold font-sans">代表即使排名放寬，新玩家增加的速度仍趕不上名次擴張。顯示該角色主要由極少數特定玩家群在反覆角逐。</p>
                            </div>
                        </div>

                        <div className="p-3.5 bg-yellow-400/5 rounded-xl border border-yellow-400/20 mt-1">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-wider">趨勢反轉點 (Pivot Point)</span>
                            </div>
                            <p className="text-[10px] text-slate-300 font-medium leading-relaxed font-sans">
                                趨勢正負交替處即為「行為分水嶺」，代表玩家競爭行為從該名次開始發生本質性的轉變。
                            </p>
                        </div>
                        
                        <button onClick={() => setPage(1)} className="mt-3 text-[10px] font-black text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 group">
                            <svg className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 19l-7-7 7-7" /></svg>
                            返回基礎定義
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const PlayerStructureView: React.FC = () => {
    const { eventDetails, isWorldLink } = useConfig();
    const [allEvents, setAllEvents] = useState<EventSummary[]>([]);
    const [selectedEntries, setSelectedEntries] = useState<{ type: 'global' | 'unit' | 'char', id: string }[]>([{ type: 'global', id: '' }]);
    const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('banner');
    const [eventDataCache, setEventDataCache] = useState<Record<number, any[]>>({});
    const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [hoveredK, setHoveredK] = useState<number | null>(null);
    const [showFormula, setShowFormula] = useState(false);
    
    const abortControllerRef = useRef<AbortController | null>(null);
    const SUPPORTED_UNITS = ["Leo/need", "MORE MORE JUMP!", "Vivid BAD SQUAD", "Wonderlands × Showtime", "25點，Nightcord見。"];

    useEffect(() => {
        fetchJsonWithBigInt(`${API_BASE_URL}/event/list`)
            .then(data => { if (data) setAllEvents(data); })
            .catch(() => setError('無法獲取活動清單'));
    }, []);

    useEffect(() => {
        if (allEvents.length === 0) return;
        const runAnalysis = async () => {
            setIsAnalyzing(true); setProgress(0);
            if (abortControllerRef.current) abortControllerRef.current.abort();
            const controller = new AbortController();
            abortControllerRef.current = controller;
            try {
                const now = new Date();
                const newResults: AnalysisResult[] = [];
                const neededEventIds = new Set<number>();
                const entryMap = selectedEntries.map(entry => {
                    const targetEvents = allEvents.filter(e => {
                        const detail = eventDetails[e.id];
                        if (!detail || isWorldLink(e.id) || new Date(e.closed_at) > now) return false;
                        if (analysisMode === 'banner' && detail.storyType !== 'unit_event') return false;
                        if (entry.type === 'global') return true;
                        if (entry.type === 'unit') return detail.unit === UNIT_ORDER.find(id => UNIT_MASTER[id].name === entry.id);
                        if (entry.type === 'char') {
                            if (analysisMode === 'banner') return detail.banner === entry.id;
                            const starCards = detail["4starcard"]?.split(',') || [];
                            return starCards.some(cardStr => cardStr.trim().split('-')[0] === entry.id);
                        }
                        return false;
                    }).map(e => e.id);
                    targetEvents.forEach(id => { if (!eventDataCache[id]) neededEventIds.add(id); });
                    return { entry, targetEvents };
                });
                const missingIds = Array.from(neededEventIds);
                const newCache = { ...eventDataCache };
                const BATCH_SIZE = 5;
                for (let i = 0; i < missingIds.length; i += BATCH_SIZE) {
                    if (controller.signal.aborted) return;
                    const batch = missingIds.slice(i, i + BATCH_SIZE);
                    const results = await Promise.all(batch.map(async (id) => {
                        try {
                            const res: PastEventApiResponse = await fetchJsonWithBigInt(`${API_BASE_URL}/event/${id}/top100`, controller.signal);
                            return { id, rankings: res.rankings || [] };
                        } catch (e) { return null; }
                    }));
                    results.forEach(res => { if (res) newCache[res.id] = res.rankings; });
                    setProgress(Math.round(((i + batch.length) / (missingIds.length || 1)) * 100));
                }
                setEventDataCache(newCache);
                entryMap.forEach(({ entry, targetEvents }) => {
                    if (targetEvents.length === 0) return;
                    const N = targetEvents.length;
                    const rankSets: Set<string>[] = Array.from({ length: 100 }, () => new Set());
                    targetEvents.forEach(id => {
                        const rankings = newCache[id] || [];
                        rankings.forEach((entry: any) => {
                            const r = entry.rank;
                            if (r >= 1 && r <= 100) { for (let k = r; k <= 100; k++) rankSets[k - 1].add(String(entry.userId)); }
                        });
                    });
                    const uCurve = rankSets.map((s, idx) => parseFloat(((s.size / (N * (idx + 1))) * 100).toFixed(2)));
                    let name = entry.type === 'global' ? '整體遊戲' : (entry.type === 'unit' ? entry.id : CHARACTER_MASTER[entry.id]?.name);
                    let color = entry.type === 'global' ? '#64748b' : (entry.type === 'unit' ? UNIT_MASTER[UNIT_ORDER.find(id => UNIT_MASTER[id].name === entry.id)!]?.color : CHARACTER_MASTER[entry.id]?.color) || '#06b6d4';
                    
                    let rawId = entry.id;
                    if (entry.type === 'unit') {
                        rawId = UNIT_ORDER.find(uid => UNIT_MASTER[uid].name === entry.id) || '';
                    }

                    newResults.push({ id: `${entry.type}-${entry.id}`, type: entry.type, rawId, name, color, eventCount: N, data: uCurve });
                });
                setAnalysisResults(newResults);
            } catch (err: any) { if (err.name !== 'AbortError') setError(err.message); } finally { setIsAnalyzing(false); }
        };
        runAnalysis();
    }, [selectedEntries, analysisMode, allEvents, eventDetails]);

    const toggleEntry = (type: 'global' | 'unit' | 'char', id: string) => {
        setSelectedEntries(prev => {
            const isSame = prev.some(e => e.type === type && e.id === id);
            
            // Global: 可自由切換，不排斥其他
            if (type === 'global') {
                if (isSame) {
                     const remaining = prev.filter(e => e.type !== 'global');
                     return remaining.length > 0 ? remaining : prev;
                }
                return [...prev, { type, id }];
            }

            // Unit/Char: 單選制 (但保留 Global)
            if (isSame) {
                 const remaining = prev.filter(e => !(e.type === type && e.id === id));
                 return remaining.length > 0 ? remaining : prev;
            }

            const globalEntry = prev.find(e => e.type === 'global');
            const newEntry = { type, id };
            return globalEntry ? [globalEntry, newEntry] : [newEntry];
        });
    };

    const isGlobalDimmed = useMemo(() => selectedEntries.some(e => e.type === 'global') && selectedEntries.some(e => e.type !== 'global'), [selectedEntries]);

    // 計算區間趨勢 (Trend Calculation)
    const trends = useMemo(() => {
        if (analysisResults.length === 0) return null;
        // 優先顯示非 Global 的數據，若只有 Global 則顯示 Global
        const targetRes = analysisResults.find(r => r.type !== 'global') || analysisResults[0]; 
        const getT = (start: number, end: number) => {
            const val = (targetRes.data[end-1] - targetRes.data[start-1]) / (end - start);
            return (val >= 0 ? '+' : '') + val.toFixed(2);
        };
        return {
            t10: getT(1, 10),
            t50: getT(10, 50),
            t100: getT(50, 100),
            eventCount: targetRes.eventCount,
            primaryColor: targetRes.color
        };
    }, [analysisResults]);

    const getIconUrl = (res: AnalysisResult) => {
        if (res.type === 'global') return null;
        return getAssetUrl(res.rawId, res.type === 'unit' ? 'unit' : 'character');
    };

    // Y 軸縮放參數
    const Y_MIN = 40;
    const Y_RANGE = 100 - Y_MIN;
    // Y 座標計算：數值越小 Y 越大 (SVG 座標系)
    const getY = (val: number) => 20 + (1 - (Math.max(val, Y_MIN) - Y_MIN) / Y_RANGE) * 350;

    return (
        <div className="w-full lg:h-[calc(100vh-80px)] flex flex-col overflow-hidden animate-fadeIn max-w-[1750px] mx-auto pb-1 px-1">
            {/* 標題區域 */}
            <div className="flex-shrink-0 mb-3 px-1">
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">玩家排名結構 (Player Structure)</h2>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] lg:text-[13px] font-bold leading-tight font-sans">觀察前一百名內排名生態曲線，剖析各角色與整體遊戲玩家排名流動趨勢。</p>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 lg:overflow-hidden">
                
                {/* 左側：控制面板 */}
                <div className="w-full lg:w-80 shrink-0 flex flex-col gap-3">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm">
                        <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 mb-3">
                            {(['banner', 'fourStar'] as const).map(m => (
                                <button key={m} onClick={() => setAnalysisMode(m)} className={`flex-1 py-1.5 rounded-lg font-black text-[12px] transition-all ${analysisMode === m ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{m === 'banner' ? '箱活主打' : '四星登場'}</button>
                            ))}
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">對象篩選 (單選)</span>
                                <button onClick={() => toggleEntry('global', '')} className={`px-3 py-0.5 rounded-lg font-black text-[12px] border transition-all ${selectedEntries.find(e => e.type === 'global') ? 'bg-slate-900 text-white border-transparent' : 'text-slate-500 border-slate-200 dark:border-slate-700'}`}>ALL</button>
                            </div>
                            
                            <div className="flex flex-wrap lg:grid lg:grid-cols-5 gap-1.5 justify-center py-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                {SUPPORTED_UNITS.map(unit => {
                                    const uid = UNIT_ORDER.find(id => UNIT_MASTER[id].name === unit);
                                    const isS = selectedEntries.find(e => e.type === 'unit' && e.id === unit);
                                    return <button key={unit} onClick={() => toggleEntry('unit', unit)} className={`p-0.5 rounded-lg border-2 transition-all ${isS ? 'scale-110 shadow-md border-current bg-white dark:bg-slate-700' : 'opacity-30 grayscale hover:opacity-100'} `} style={{ color: isS ? UNIT_MASTER[uid!]?.color : 'transparent' }}><img src={getAssetUrl(uid, 'unit')} className="w-5 h-5 lg:w-7 lg:h-7 object-contain" /></button>;
                                })}
                            </div>

                            <div className="grid grid-cols-8 sm:grid-cols-9 lg:grid-cols-7 gap-1.5">
                                {Object.values(CHARACTER_MASTER).slice(0, analysisMode === 'fourStar' ? 26 : 20).map(char => {
                                    const isS = selectedEntries.find(e => e.type === 'char' && e.id === char.id);
                                    return <button key={char.id} onClick={() => toggleEntry('char', char.id)} className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full border-2 transition-all relative overflow-hidden ${isS ? 'scale-110 z-10 shadow-md ring-1 ring-offset-1 dark:ring-offset-slate-900 border-current' : 'opacity-25 grayscale hover:opacity-100'}`} style={{ color: isS ? char.color : 'transparent', '--tw-ring-color': char.color } as React.CSSProperties}><img src={getAssetUrl(char.id, 'character')} className="w-full h-full object-cover" /></button>;
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:flex flex-1">
                        <InterpretationGuide />
                    </div>
                </div>

                {/* 右側：圖表與動態趨勢 */}
                <div className="flex-1 flex flex-col gap-3 min-h-0">
                    
                    <div className="lg:hidden shrink-0 px-2">
                        <div className="bg-amber-50 dark:bg-amber-900/40 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-700/50 flex items-center justify-center gap-2 shadow-sm">
                            <svg className="w-4 h-4 text-amber-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            <span className="text-[11px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest leading-none">建議橫向觀看以獲得最佳細節</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-2xl lg:rounded-3xl shadow-2xl relative overflow-hidden flex flex-col min-h-[440px] lg:flex-1 lg:min-h-0">
                        
                        {/* 頂部數據列 */}
                        <div className="absolute top-4 left-0 right-0 z-20 flex justify-between px-4 sm:px-6 pointer-events-none">
                            {/* 公式按鈕與彈窗 */}
                            <div className="flex items-center gap-3 pointer-events-auto">
                                <button 
                                    onMouseEnter={() => setShowFormula(true)} 
                                    onMouseLeave={() => setShowFormula(false)}
                                    onClick={() => setShowFormula(!showFormula)}
                                    className="w-8 h-8 flex items-center justify-center bg-slate-900/80 text-cyan-400 rounded-full border border-white/10 backdrop-blur-md shadow-lg transition-transform active:scale-90"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                                {showFormula && (
                                    <div className="absolute top-10 left-4 z-50 bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl text-[10px] text-white font-mono leading-relaxed animate-fadeIn whitespace-nowrap">
                                        <div className="text-cyan-400 font-black mb-1 tracking-tighter">前K名內換血率定義：</div>
                                        前K名內換血率=(前K名內不重複玩家數/(期數N×名次K))×100%
                                    </div>
                                )}

                                {/* 分析期數顯示 */}
                                {trends && (
                                    <div className="bg-slate-900/80 dark:bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">統計期數:</span>
                                        <span className="text-[11px] font-black font-mono text-white" style={{ color: trends.primaryColor }}>
                                            {trends.eventCount} <span className="text-[8px] opacity-70">SESSIONS</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            {/* 區間趨勢數值：適配手機版並列顯示 */}
                            <div className="flex items-center gap-1 sm:gap-3">
                                {[
                                    { label: 'T1-T10', val: trends?.t10, range: [1, 10] },
                                    { label: 'T11-T50', val: trends?.t50, range: [11, 50] },
                                    { label: 'T50-T100', val: trends?.t100, range: [51, 100] }
                                ].map((t, idx) => {
                                    const isActive = hoveredK && hoveredK >= t.range[0] && hoveredK <= t.range[1];
                                    const isPos = t.val && t.val.startsWith('+');
                                    const isNeg = t.val && t.val.startsWith('-');
                                    // 動態邊框與背景色：若 active 則使用主要色，否則預設
                                    const dynamicStyle = isActive ? { borderColor: trends?.primaryColor, color: trends?.primaryColor } : {};
                                    
                                    return (
                                        <div 
                                            key={idx} 
                                            className={`bg-slate-900/80 dark:bg-black/60 backdrop-blur-md border border-white/10 px-2 sm:px-3 py-1.5 rounded-xl shadow-lg flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 transition-all duration-300 ${isActive ? 'scale-110 ring-2 ring-white/10' : 'opacity-80'}`}
                                            style={isActive ? { borderColor: trends?.primaryColor } : {}}
                                        >
                                            <span 
                                                className="text-[8px] sm:text-[9px] font-black uppercase tracking-tighter whitespace-nowrap text-slate-400"
                                                style={isActive ? { color: trends?.primaryColor } : {}}
                                            >
                                                {t.label}:
                                            </span>
                                            <span className={`text-[10px] sm:text-[11px] font-black font-mono ${isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-slate-300'}`}>
                                                {t.val || '--'}%
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-1 lg:p-2 flex-1 relative flex items-center justify-center pt-16">
                            {analysisResults.length > 0 && (
                                <svg viewBox="0 0 1000 420" className="w-full h-full overflow-visible select-none transition-all duration-300" onMouseMove={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const k = Math.round(((e.clientX - rect.left) / rect.width) * 99) + 1;
                                    setHoveredK(Math.max(1, Math.min(100, k)));
                                }} onMouseLeave={() => setHoveredK(null)}>
                                    {/* 網格輔助線 (40, 50, ..., 100) */}
                                    {[40, 50, 60, 70, 80, 90, 100].map(v => (
                                        <g key={v}>
                                            <line x1="60" y1={getY(v)} x2="970" y2={getY(v)} stroke="currentColor" className="text-slate-100 dark:text-slate-900" strokeWidth="1.5" />
                                            <text x="50" y={getY(v)} className="text-[15px] lg:text-[14px] fill-slate-400 font-mono font-black" textAnchor="end" alignmentBaseline="middle">{v}%</text>
                                        </g>
                                    ))}
                                    {[1, 25, 50, 75, 100].map(k => (
                                        <text key={k} x={60 + ((k - 1) / 99) * 910} y="395" className="text-[15px] lg:text-[14px] fill-slate-400 font-mono font-black" textAnchor="middle">{k}</text>
                                    ))}
                                    <text x="515" y="415" className="text-[12px] fill-slate-300 font-black uppercase tracking-widest font-sans" textAnchor="middle">名次區間 K (Rank Range)</text>

                                    {/* 繪製排名生態曲線 */}
                                    {analysisResults.map(res => {
                                        const isGlobal = res.type === 'global';
                                        const pathD = res.data.map((u, i) => `${i === 0 ? 'M' : 'L'} ${60 + (i / 99) * 910} ${getY(u)}`).join(' ');
                                        return (
                                            <path key={res.id} d={pathD} fill="none" stroke={isGlobal && isGlobalDimmed ? '#cbd5e1' : res.color} strokeWidth={isGlobal && isGlobalDimmed ? "1.5" : "3.5"} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-700 opacity-90" style={{ filter: isGlobal && isGlobalDimmed ? 'none' : 'drop-shadow(0 3px 6px rgba(0,0,0,0.1))' }} />
                                        );
                                    })}

                                    {/* 懸停指示器與角色圖標點 */}
                                    {hoveredK && (
                                        <g className="animate-fadeIn">
                                            <line x1={60 + ((hoveredK - 1) / 99) * 910} y1="20" x2={60 + ((hoveredK - 1) / 99) * 910} y2="370" stroke="#94a3b8" strokeWidth="1" strokeDasharray="5 3" />
                                            
                                            {/* 各曲線上的圖標或點 */}
                                            {analysisResults.map(res => {
                                                const uVal = res.data[hoveredK - 1];
                                                const xPos = 60 + ((hoveredK - 1) / 99) * 910;
                                                const yPos = getY(uVal);
                                                const icon = getIconUrl(res);

                                                return (
                                                    <g key={`indicator-${res.id}`}>
                                                        {icon ? (
                                                            <image href={icon} x={xPos - 12} y={yPos - 12} width="24" height="24" className="rounded-full shadow-lg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                                                        ) : (
                                                            <circle cx={xPos} cy={yPos} r="5" fill={res.color} stroke="white" strokeWidth="2" />
                                                        )}
                                                    </g>
                                                );
                                            })}

                                            {/* Tooltip */}
                                            <rect x={hoveredK > 75 ? 60 + ((hoveredK - 1) / 99) * 910 - 170 : 60 + ((hoveredK - 1) / 99) * 910 + 12} y="30" width="160" height={analysisResults.length * 30 + 55} rx="16" fill="#0f172a" opacity="0.96" className="shadow-2xl" />
                                            <text x={hoveredK > 75 ? 60 + ((hoveredK - 1) / 99) * 910 - 90 : 60 + ((hoveredK - 1) / 99) * 910 + 92} y="58" textAnchor="middle" className="fill-cyan-400 font-black text-[14px] uppercase tracking-widest underline font-mono">Rank {hoveredK}</text>
                                            
                                            {analysisResults.map((res, i) => {
                                                const icon = getIconUrl(res);
                                                const xBase = hoveredK > 75 ? 60 + ((hoveredK - 1) / 99) * 910 - 155 : 60 + ((hoveredK - 1) / 99) * 910 + 25;
                                                const yBase = 88 + i * 30;
                                                return (
                                                    <g key={`tooltip-item-${res.id}`}>
                                                        {icon && <image href={icon} x={xBase} y={yBase - 14} width="18" height="18" className="rounded-full" />}
                                                        <text x={xBase + (icon ? 22 : 0)} y={yBase} className="text-[12px] font-black font-sans" fill={res.type === 'global' && isGlobalDimmed ? '#94a3b8' : 'white'}>
                                                            {res.name.substring(0,8)}: {res.data[hoveredK - 1]}%
                                                        </text>
                                                    </g>
                                                );
                                            })}
                                        </g>
                                    )}
                                </svg>
                            )}
                            {isAnalyzing && (
                                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/10 dark:bg-black/20 backdrop-blur-[1px]">
                                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="mt-4 text-[10px] font-black text-cyan-500 uppercase tracking-widest animate-pulse">分析進行中 {progress}%</span>
                                </div>
                            )}
                        </div>
                        
                        {/* 底部裝飾與註釋 */}
                        <div className="px-5 py-3 border-t border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-black/20 flex flex-col sm:flex-row justify-between items-center shrink-0 gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                                <svg className="w-3.5 h-3.5 text-cyan-500" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" /></svg>
                                排名生態曲線 (Ranking Ecological Curve)
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 italic font-sans">
                                * 數據統計已自動排除 World Link 活動以維持生態分析的一致性
                            </span>
                        </div>
                    </div>

                    {/* 手機版解讀指南 */}
                    <div className="lg:hidden shrink-0 pb-4 px-1">
                        <InterpretationGuide />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerStructureView;
