import React, { useState, useEffect, useMemo } from 'react';
import { EventSummary, PastEventApiResponse, PastEventBorderApiResponse } from '../types';
import { calculatePreciseDuration, WORLD_LINK_IDS, UNIT_ORDER, API_BASE_URL } from '../constants';
import Select from './ui/Select';
import Input from './ui/Input';
import Card from './ui/Card';
import { useConfig } from '../contexts/ConfigContext';
import LoadingSpinner from './LoadingSpinner';

// PJSK Energy Scaling Map (Energy -> Score Multiplier)
const ENERGY_SCALING: Record<number, number> = {
    0: 1,
    1: 5,
    2: 10,
    3: 15,
    4: 19,
    5: 23,
    6: 26,
    7: 29,
    8: 31,
    9: 33,
    10: 35
};

const ENERGY_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const RANK_OPTIONS = [1, 10, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000];

interface CalculationResult {
    refDuration: number;
    targetDuration: number;
    adjustedTargetScore: number;
    estimatedPtPerGame: number;
    gamesNeeded: number;
    totalEnergyNeeded: number;
    naturalRecovery: number;
    finalPotions: number;
    isWarning: boolean;
}

const ResourceEstimatorView: React.FC = () => {
    const { eventDetails, getEventColor } = useConfig();
    const [events, setEvents] = useState<EventSummary[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(true);

    // --- State: Selections ---
    const [refUnitFilter, setRefUnitFilter] = useState<string>('all');
    const [selectedPastId, setSelectedPastId] = useState<number | ''>('');
    const [selectedTargetId, setSelectedTargetId] = useState<number | ''>('');
    const [selectedRank, setSelectedRank] = useState<number>(1000);

    // --- State: Player Condition ---
    const [inputPt, setInputPt] = useState<string>('15000'); 
    const [inputEnergyUsed, setInputEnergyUsed] = useState<number>(3); 
    const [planEnergyPerGame, setPlanEnergyPerGame] = useState<number>(10); 

    // --- State: Fetched Data ---
    const [pastEventScore, setPastEventScore] = useState<number | null>(null);
    const [pastEventDuration, setPastEventDuration] = useState<number | null>(null);
    const [isFetchingScore, setIsFetchingScore] = useState(false);

    // --- Effect: Fetch All Events ---
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/event/list`);
                if (res.ok) {
                    const data: EventSummary[] = await res.json();
                    setEvents(data);
                }
            } catch (e) {
                console.error("Failed to load events", e);
            } finally {
                setIsLoadingList(false);
            }
        };
        fetchEvents();
    }, []);

    // --- Effect: Fetch Reference Score & Duration ---
    useEffect(() => {
        if (!selectedPastId) {
            setPastEventScore(null);
            setPastEventDuration(null);
            return;
        }

        const fetchScore = async () => {
            setIsFetchingScore(true);
            try {
                const isTop100 = selectedRank <= 100;
                const url = isTop100 
                    ? `${API_BASE_URL}/event/${selectedPastId}/top100`
                    : `${API_BASE_URL}/event/${selectedPastId}/border`;

                const res = await fetch(url);
                if (res.ok) {
                    const txt = await res.text();
                    const sanitized = txt.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');
                    const json = JSON.parse(sanitized);
                    
                    let score = 0;
                    if (isTop100) {
                        const data = json as PastEventApiResponse;
                        score = data.rankings.find(r => r.rank === selectedRank)?.score || 0;
                    } else {
                        const data = json as PastEventBorderApiResponse;
                        score = data.borderRankings.find(r => r.rank === selectedRank)?.score || 0;
                    }
                    setPastEventScore(score);

                    const evt = events.find(e => e.id === selectedPastId);
                    if (evt) {
                        setPastEventDuration(calculatePreciseDuration(evt.start_at, evt.aggregate_at));
                    }
                }
            } catch (e) {
                console.error(e);
                setPastEventScore(0);
            } finally {
                setIsFetchingScore(false);
            }
        };
        fetchScore();
    }, [selectedPastId, selectedRank, events]);

    // --- Memo: Categorized Events ---
    const { refEventOptions, targetEventOptions } = useMemo(() => {
        const now = new Date();
        
        // Filter past events with unit filter
        const past = events.filter(e => {
            const isPast = new Date(e.closed_at) < now;
            if (!isPast) return false;
            if (refUnitFilter !== 'all' && eventDetails[e.id]?.unit !== refUnitFilter) return false;
            return true;
        }).sort((a,b) => b.id - a.id);

        // Target events: currently active or starting in future
        const target = events.filter(e => new Date(e.closed_at) >= now).sort((a,b) => b.id - a.id);

        return {
            refEventOptions: past.map(e => ({
                value: e.id,
                label: `#${e.id} ${e.name}`,
                style: { color: getEventColor(e.id) }
            })),
            targetEventOptions: target.map(e => ({
                value: e.id,
                label: `#${e.id} ${e.name}`,
                style: { color: getEventColor(e.id) }
            }))
        };
    }, [events, refUnitFilter, eventDetails, getEventColor]);

    // --- Logic: Calculation ---
    const result: CalculationResult | null = useMemo(() => {
        const targetEvt = events.find(e => e.id === selectedTargetId);
        const ptValue = parseInt(inputPt);

        if (!pastEventScore || !pastEventDuration || !targetEvt || isNaN(ptValue) || ptValue <= 0) return null;

        // 1. Target Duration
        const targetDur = calculatePreciseDuration(targetEvt.start_at, targetEvt.aggregate_at);

        // 2. Adjust Target Total Score based on Duration Ratio
        const adjustedTargetScore = Math.ceil(pastEventScore * (targetDur / pastEventDuration));

        // 3. Normalize to Base Pt (0 energy)
        const inputScale = ENERGY_SCALING[inputEnergyUsed] || 1;
        const basePt = ptValue / inputScale;

        // 4. Calculate Planned Pt
        const planScale = ENERGY_SCALING[planEnergyPerGame] || 1;
        const estimatedPtPerGame = Math.ceil(basePt * planScale);

        // Check if unreasonable (Warning if basePt * 35 > 75000)
        const isWarning = (basePt * 35) > 75000;

        // 5. Games & Energy
        const gamesNeeded = Math.ceil(adjustedTargetScore / estimatedPtPerGame);
        const totalEnergyNeeded = gamesNeeded * planEnergyPerGame;

        // 6. Natural Recovery (48 per day)
        const naturalRecovery = Math.floor(targetDur * 48);

        // 7. Final Potions
        const finalPotions = Math.ceil(Math.max(0, totalEnergyNeeded - naturalRecovery) / 10);

        return {
            refDuration: pastEventDuration,
            targetDuration: targetDur,
            adjustedTargetScore,
            estimatedPtPerGame,
            gamesNeeded,
            totalEnergyNeeded,
            naturalRecovery,
            finalPotions,
            isWarning
        };
    }, [pastEventScore, pastEventDuration, selectedTargetId, inputPt, inputEnergyUsed, planEnergyPerGame, events]);

    if (isLoadingList) return <LoadingSpinner />;

    return (
        <div className="w-full animate-fadeIn py-4">
            <div className="mb-8 px-2">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">預估資源計算機 (Resource Estimator)</h2>
                <p className="text-slate-500 dark:text-slate-400">
                    參考歷史數據，透過體力倍率換算精確估計衝榜所需的 Live Bonus 飲料數量。
                </p>
            </div>

            {/* Input Layer - Utilizing full width */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                
                {/* Column 1: Reference */}
                <Card title="1. 參考過往活動" className="flex flex-col h-full shadow-md">
                    <div className="space-y-4">
                        <Select
                            label="快速篩選團體"
                            value={refUnitFilter}
                            onChange={setRefUnitFilter}
                            options={[{value: 'all', label: '所有團體'}, ...UNIT_ORDER.map(u => ({value: u, label: u}))]}
                        />
                        <Select
                            label="選擇參考期數"
                            value={selectedPastId}
                            onChange={(v) => setSelectedPastId(Number(v))}
                            placeholder="請選擇活動..."
                            options={refEventOptions}
                        />
                        <div className="grid grid-cols-1 gap-3">
                            <Select
                                label="參考名次"
                                value={selectedRank}
                                onChange={(v) => setSelectedRank(Number(v))}
                                options={RANK_OPTIONS.map(r => ({ value: r, label: `Top ${r}` }))}
                            />
                            {pastEventScore && !isFetchingScore && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 animate-fadeIn">
                                    <div className="flex justify-between items-baseline mb-1.5">
                                        <span className="text-[10px] text-slate-400 uppercase font-black">基準分數線</span>
                                        <span className="text-base font-mono font-black text-cyan-600 dark:text-cyan-400">
                                            {pastEventScore.toLocaleString()} pt
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-[10px] text-slate-400 uppercase font-black">活動時長</span>
                                        <span className="text-base font-mono font-black text-slate-600 dark:text-slate-300">
                                            {pastEventDuration?.toFixed(2)} 天
                                        </span>
                                    </div>
                                </div>
                            )}
                            {isFetchingScore && <div className="text-center text-xs text-cyan-500 py-4 animate-pulse">讀取數據中...</div>}
                        </div>
                    </div>
                </Card>

                {/* Column 2: Target */}
                <Card title="2. 設定目標活動" className="flex flex-col h-full shadow-md">
                    <div className="space-y-4">
                        <Select
                            label="衝榜目標活動"
                            value={selectedTargetId}
                            onChange={(v) => setSelectedTargetId(Number(v))}
                            placeholder="選擇進行中/未來活動..."
                            options={targetEventOptions}
                        />
                        {selectedTargetId && result && (
                            <div className="p-5 bg-cyan-500/5 dark:bg-cyan-400/5 rounded-xl border border-cyan-500/20 dark:border-cyan-400/20 animate-fadeIn">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm text-slate-600 dark:text-slate-300 font-black">預估活動時長:</span>
                                    <span className="font-mono font-black text-xl text-cyan-600 dark:text-cyan-400">
                                        {result.targetDuration.toFixed(2)} 天
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                                    * 系統已根據兩期活動的天數比率 ({ (result.targetDuration / result.refDuration).toFixed(2) }x) 自動校正目標分。
                                </p>
                            </div>
                        )}
                        {!selectedTargetId && (
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-400 p-8">
                                <svg className="w-10 h-10 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                請選取目標活動以換算天數
                            </div>
                        )}
                    </div>
                </Card>

                {/* Column 3: Player stats */}
                <Card title="3. 自身條件與計畫" className="flex flex-col h-full shadow-md">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                                <label className="text-sm font-black text-slate-700 dark:text-slate-300">單場參考分數 (pt)</label>
                                <div className="group relative cursor-help">
                                    <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center text-[10px] font-black">?</div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                                        這是您個人目前打一場的平均得分（請依當下使用的體力填寫）。系統將依此倍率逆推出您的「基礎分」。
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Input
                                        value={inputPt}
                                        onChange={setInputPt}
                                        type="number"
                                        placeholder="例: 15000"
                                        className="font-mono font-bold"
                                    />
                                </div>
                                <div className="w-28">
                                    <Select
                                        value={inputEnergyUsed}
                                        onChange={(v) => setInputEnergyUsed(Number(v))}
                                        options={ENERGY_OPTIONS.map(e => ({ value: e, label: `${e} 體遊玩` }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Select
                                label="計畫衝榜使用體力"
                                value={planEnergyPerGame}
                                onChange={(v) => setPlanEnergyPerGame(Number(v))}
                                options={ENERGY_OPTIONS.map(e => ({ value: e, label: `衝榜時用 ${e} 體/場` }))}
                            />
                            {result && (
                                <div className="mt-3 flex justify-between items-center text-[11px]">
                                    <span className="text-slate-500 font-bold uppercase tracking-tight">換算單場預計:</span>
                                    <span className="text-cyan-600 dark:text-cyan-400 font-black">{result.estimatedPtPerGame.toLocaleString()} pt</span>
                                </div>
                            )}
                        </div>

                        {result?.isWarning && (
                            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] rounded-lg border border-amber-500/20 animate-pulse font-bold">
                                ⚠️ 注意：單場基礎分換算後偏高，請確認數值準確性。
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Output Layer - Full Width Hero View */}
            <div className="w-full">
                {result ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 md:p-12 shadow-2xl animate-fadeIn relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                            <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h6V3h-8z" /></svg>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 items-center relative z-10">
                            
                            {/* Detailed Stats Groups */}
                            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                                <div className="space-y-6">
                                    <h4 className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] border-l-4 border-cyan-500 pl-3">目標校正 (Targeting)</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                            <span className="text-sm text-slate-500 dark:text-slate-400 font-bold">校正後目標分數</span>
                                            <span className="font-mono font-black text-xl text-slate-900 dark:text-white">{result.adjustedTargetScore.toLocaleString()} pt</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                            <span className="text-sm text-slate-500 dark:text-slate-400 font-bold">預計總遊玩場數</span>
                                            <span className="font-mono font-black text-xl text-slate-900 dark:text-white">{result.gamesNeeded.toLocaleString()} <span className="text-xs font-normal">場</span></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] border-l-4 border-amber-500 pl-3">能源與效率 (Efficiency)</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                            <span className="text-sm text-slate-500 dark:text-slate-400 font-bold">總消耗能源需求</span>
                                            <span className="font-mono font-black text-xl text-slate-900 dark:text-white">{result.totalEnergyNeeded.toLocaleString()} ⚡</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                            <span className="text-sm text-slate-500 dark:text-slate-400 font-bold">自然回體抵扣</span>
                                            <span className="font-mono font-black text-xl text-emerald-500 dark:text-emerald-400">-{result.naturalRecovery.toLocaleString()} ⚡</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Final Result Circle */}
                            <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-[3rem] p-12 border border-slate-200 dark:border-slate-700 shadow-inner group">
                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-4">預估所需資源</span>
                                
                                <div className="flex items-baseline gap-3 relative">
                                    <span className="text-8xl font-black font-mono text-cyan-600 dark:text-cyan-400 tracking-tighter">
                                        {result.finalPotions}
                                    </span>
                                    <span className="text-2xl font-black text-slate-400">罐</span>
                                </div>

                                <div className="mt-8 px-8 py-3 bg-cyan-600 text-white rounded-2xl shadow-xl shadow-cyan-600/20 transform group-hover:scale-105 transition-all duration-300">
                                    <span className="font-black text-sm uppercase tracking-wider">Live Bonus 飲料（大）</span>
                                </div>

                                <p className="mt-8 text-[10px] text-slate-400 font-bold text-center leading-relaxed max-w-[220px]">
                                    * 數值僅供策略參考，衝榜末期常有劇烈變動，建議額外準備 15% 以上的安全邊際。
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-24 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm text-center animate-fadeIn group">
                        <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-full mb-8 group-hover:scale-110 transition-transform duration-500 border border-slate-100 dark:border-slate-700">
                            <svg className="w-16 h-16 text-slate-200 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <h4 className="text-slate-900 dark:text-white font-black text-xl mb-3 tracking-tight">準備就緒，等待設定</h4>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm px-6 leading-relaxed font-medium">
                            完成上方三個步驟的基準設定與計畫，系統將為您生成專屬衝榜資源報告。
                        </p>
                    </div>
                )}
            </div>
            
            <div className="mt-10 flex justify-center px-4">
                <div className="inline-flex items-center gap-2.5 px-5 py-3 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-xs text-amber-700 dark:text-amber-400 font-bold leading-relaxed">
                        注意：計算結果未包含「等級提升 (Rank Up)」與「官方登入活動」贈送的體力，實際喝水量可能會更少。
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ResourceEstimatorView;