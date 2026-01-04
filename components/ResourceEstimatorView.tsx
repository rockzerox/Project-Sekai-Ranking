
import React, { useState, useEffect, useMemo } from 'react';
import { EventSummary, PastEventApiResponse, PastEventBorderApiResponse, CalculationResult } from '../types';
import { calculatePreciseDuration, UNIT_ORDER, UNIT_MASTER, API_BASE_URL, getEventStatus, MS_PER_DAY, getAssetUrl } from '../constants';
import Select from './ui/Select';
import Input from './ui/Input';
import Card from './ui/Card';
import { useConfig } from '../contexts/ConfigContext';
import LoadingSpinner from './LoadingSpinner';
import { fetchJsonWithBigInt } from '../hooks/useRankings';
import { UI_TEXT } from '../constants/uiText';

const ENERGY_SCALING: Record<number, number> = {
    0: 1, 1: 5, 2: 10, 3: 15, 4: 19, 5: 23, 6: 26, 7: 29, 8: 31, 9: 33, 10: 35
};

const ENERGY_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const RANK_OPTIONS = [1, 10, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000];

interface ExtendedCalculationResult extends CalculationResult {
    isTargetLive: boolean;
    remainingDuration?: number;
    userCurrentScore?: number;
    isReached?: boolean;
    finalBigCans?: number; // 新增：大罐數量
    finalSmallCans?: number; // 新增：小罐數量
}

const ResourceEstimatorView: React.FC = () => {
    const { eventDetails, getEventColor, isWorldLink } = useConfig();
    const [events, setEvents] = useState<EventSummary[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(true);

    const [refUnitFilter, setRefUnitFilter] = useState<string>('all');
    const [selectedPastId, setSelectedPastId] = useState<number | ''>('');
    const [selectedTargetId, setSelectedTargetId] = useState<number | ''>('');
    const [selectedRank, setSelectedRank] = useState<number>(1000);

    const [inputPt, setInputPt] = useState<string>('15000'); 
    const [inputEnergyUsed, setInputEnergyUsed] = useState<number>(3); 
    const [planEnergyPerGame, setPlanEnergyPerGame] = useState<number>(10); 
    
    // 新增：目前分數 (字串以方便輸入)
    const [userCurrentScore, setUserCurrentScore] = useState<string>('0');

    const [pastEventScore, setPastEventScore] = useState<number | null>(null);
    const [pastEventDuration, setPastEventDuration] = useState<number | null>(null);
    const [isFetchingScore, setIsFetchingScore] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data: EventSummary[] = await fetchJsonWithBigInt(`${API_BASE_URL}/event/list`);
                if (data) setEvents(data);
            } catch (e) {
                console.error("Estimator: Failed to load events", e);
            } finally {
                setIsLoadingList(false);
            }
        };
        fetchEvents();
    }, []);

    // 當目標活動切換時，重置目前分數
    useEffect(() => {
        setUserCurrentScore('0');
    }, [selectedTargetId]);

    useEffect(() => {
        if (!selectedPastId) { setPastEventScore(null); setPastEventDuration(null); return; }

        const fetchScore = async () => {
            setIsFetchingScore(true);
            try {
                const isTop100 = selectedRank <= 100;
                const url = isTop100 ? `${API_BASE_URL}/event/${selectedPastId}/top100` : `${API_BASE_URL}/event/${selectedPastId}/border`;
                const json = await fetchJsonWithBigInt(url);
                if (json) {
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
                    if (evt) setPastEventDuration(calculatePreciseDuration(evt.start_at, evt.aggregate_at));
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

    const { refEventOptions, targetEventOptions } = useMemo(() => {
        const now = new Date();
        const past = events.filter(e => {
            const isPast = new Date(e.closed_at) < now;
            if (!isPast || isWorldLink(e.id)) return false;
            if (refUnitFilter !== 'all' && eventDetails[e.id]?.unit !== refUnitFilter) return false;
            return true;
        }).sort((a,b) => b.id - a.id);
        const target = events.filter(e => new Date(e.closed_at) >= now).sort((a,b) => b.id - a.id);

        return {
            refEventOptions: past.map(e => ({ value: e.id, label: `#${e.id} ${e.name}`, style: { color: getEventColor(e.id) } })),
            targetEventOptions: target.map(e => {
                const isLive = getEventStatus(e.start_at, e.aggregate_at, e.closed_at, e.ranking_announce_at) === 'live';
                return { 
                    value: e.id, 
                    label: `${isLive ? UI_TEXT.resourceEstimator.step2.liveLabel + ' ' : ''}#${e.id} ${e.name}`, 
                    style: { color: getEventColor(e.id), fontWeight: isLive ? 'bold' : 'normal' } 
                };
            })
        };
    }, [events, refUnitFilter, eventDetails, getEventColor, isWorldLink]);

    const result: ExtendedCalculationResult | null = useMemo(() => {
        const targetEvt = events.find(e => e.id === selectedTargetId);
        const ptValue = parseInt(inputPt);
        if (!pastEventScore || !pastEventDuration || !targetEvt || isNaN(ptValue) || ptValue <= 0) return null;
        
        // 1. 計算目標活動總時長
        const targetTotalDur = calculatePreciseDuration(targetEvt.start_at, targetEvt.aggregate_at);
        
        // 2. 判斷是否為進行中活動，並計算剩餘時間
        const isTargetLive = getEventStatus(targetEvt.start_at, targetEvt.aggregate_at, targetEvt.closed_at, targetEvt.ranking_announce_at) === 'live';
        let remainingDays = targetTotalDur;
        if (isTargetLive) {
            const now = Date.now();
            const end = new Date(targetEvt.aggregate_at).getTime();
            remainingDays = Math.max(0, (end - now) / MS_PER_DAY);
        }

        // 3. 根據 "總時長比例" 預估 "最終目標分數"
        const finalTargetScore = Math.ceil(pastEventScore * (targetTotalDur / pastEventDuration));
        
        // 4. 計算剩餘需求分數 (扣除使用者目前分數)
        const userScoreVal = parseInt(userCurrentScore) || 0;
        const scoreNeeded = finalTargetScore - userScoreVal;

        if (scoreNeeded <= 0) {
            return { 
                refDuration: pastEventDuration, 
                targetDuration: targetTotalDur, 
                adjustedTargetScore: finalTargetScore, 
                estimatedPtPerGame: 0, 
                gamesNeeded: 0, 
                totalEnergyNeeded: 0, 
                naturalRecovery: 0, 
                finalPotions: 0,
                finalBigCans: 0,
                finalSmallCans: 0,
                isWarning: false,
                isTargetLive,
                remainingDuration: remainingDays,
                userCurrentScore: userScoreVal,
                isReached: true
            };
        }

        const inputScale = ENERGY_SCALING[inputEnergyUsed] || 1;
        const basePt = ptValue / inputScale;
        const planScale = ENERGY_SCALING[planEnergyPerGame] || 1;
        const estimatedPtPerGame = Math.ceil(basePt * planScale);
        const isWarning = (basePt * 35) > 75000;
        
        // 5. 計算剩餘場數與體力
        const gamesNeeded = Math.ceil(scoreNeeded / estimatedPtPerGame);
        const totalEnergyNeeded = gamesNeeded * planEnergyPerGame;
        
        // 6. 自然回體計算：若為進行中活動，僅計算剩餘時間的回體
        const recoveryDuration = isTargetLive ? remainingDays : targetTotalDur;
        const naturalRecovery = Math.floor(recoveryDuration * 48);
        
        // 7. 計算火數缺口 (Energy Deficit)
        const energyDeficit = Math.max(0, totalEnergyNeeded - naturalRecovery);
        
        // 8. 換算為大罐 + 小罐 (1 大 = 10 火, 1 小 = 1 火)
        const finalBigCans = Math.floor(energyDeficit / 10);
        const finalSmallCans = energyDeficit % 10;

        return { 
            refDuration: pastEventDuration, 
            targetDuration: targetTotalDur, 
            adjustedTargetScore: finalTargetScore, 
            estimatedPtPerGame, 
            gamesNeeded, 
            totalEnergyNeeded, 
            naturalRecovery, 
            finalPotions: energyDeficit, // 這裡暫存總缺口火數，用於下方顯示
            finalBigCans,
            finalSmallCans,
            isWarning,
            isTargetLive,
            remainingDuration: remainingDays,
            userCurrentScore: userScoreVal,
            isReached: false
        };
    }, [pastEventScore, pastEventDuration, selectedTargetId, inputPt, inputEnergyUsed, planEnergyPerGame, events, userCurrentScore]);

    if (isLoadingList) return <LoadingSpinner />;

    return (
        <div className="w-full animate-fadeIn py-2">
            <div className="mb-4 px-2">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{UI_TEXT.resourceEstimator.title}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{UI_TEXT.resourceEstimator.description}</p>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
                <Card title={UI_TEXT.resourceEstimator.step1.title} className="flex flex-col h-full shadow-md">
                    <div className="space-y-3">
                        <Select label={UI_TEXT.resourceEstimator.step1.filterUnit} value={refUnitFilter} onChange={setRefUnitFilter} options={[{value: 'all', label: '所有團體'}, ...UNIT_ORDER.filter(id => id !== '99').map(id => ({value: id, label: UNIT_MASTER[id].name}))]} />
                        <Select label={UI_TEXT.resourceEstimator.step1.selectEvent} value={selectedPastId} onChange={(v) => setSelectedPastId(Number(v))} placeholder="請選擇活動..." options={refEventOptions} />
                        <div className="grid grid-cols-1 gap-3">
                            <Select label={UI_TEXT.resourceEstimator.step1.selectRank} value={selectedRank} onChange={(v) => setSelectedRank(Number(v))} options={RANK_OPTIONS.map(r => ({ value: r, label: `Top ${r}` }))} />
                            {pastEventScore && !isFetchingScore && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 animate-fadeIn"><div className="flex justify-between items-baseline mb-1.5"><span className="text-[10px] text-slate-400 uppercase font-black">{UI_TEXT.resourceEstimator.step1.baseScore}</span><span className="text-base font-mono font-black text-cyan-600 dark:text-cyan-400">{pastEventScore.toLocaleString()} pt</span></div><div className="flex justify-between items-baseline"><span className="text-[10px] text-slate-400 uppercase font-black">{UI_TEXT.resourceEstimator.step1.duration}</span><span className="text-base font-mono font-black text-slate-600 dark:text-slate-300">{pastEventDuration?.toFixed(2)} 天</span></div></div>
                            )}
                            {isFetchingScore && <div className="text-center text-xs text-cyan-500 py-4 animate-pulse">{UI_TEXT.resourceEstimator.step1.loading}</div>}
                        </div>
                    </div>
                </Card>
                <Card title={UI_TEXT.resourceEstimator.step2.title} className="flex flex-col h-full shadow-md">
                    <div className="space-y-4">
                        <Select label={UI_TEXT.resourceEstimator.step2.selectTarget} value={selectedTargetId} onChange={(v) => setSelectedTargetId(Number(v))} placeholder="選擇進行中/未來活動..." options={targetEventOptions} />
                        {selectedTargetId && result && (
                            <div className="p-3 bg-cyan-500/5 dark:bg-cyan-400/5 rounded-xl border border-cyan-500/20 dark:border-cyan-400/20 animate-fadeIn">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-sm text-slate-600 dark:text-slate-300 font-black">{UI_TEXT.resourceEstimator.step2.estDuration}</span>
                                    <span className="font-mono font-black text-lg text-cyan-600 dark:text-cyan-400">{result.targetDuration.toFixed(2)} 天</span>
                                </div>
                                {result.isTargetLive && result.remainingDuration !== undefined && (
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{UI_TEXT.resourceEstimator.step2.estRemaining}</span>
                                        <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400 animate-pulse">{result.remainingDuration.toFixed(2)} 天</span>
                                    </div>
                                )}
                                <p className="text-[10px] text-slate-400 leading-relaxed italic">{UI_TEXT.resourceEstimator.step2.note.replace('{ratio}', (result.targetDuration / result.refDuration).toFixed(2))}</p>
                            </div>
                        )}
                        {!selectedTargetId && (<div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-400 p-8"><svg className="w-10 h-10 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>{UI_TEXT.resourceEstimator.step2.placeholder}</div>)}
                    </div>
                </Card>
                <Card title={UI_TEXT.resourceEstimator.step3.title} className="flex flex-col h-full shadow-md">
                    <div className="space-y-3">
                        <div className="space-y-2"><div className="flex items-center gap-1.5"><label className="text-sm font-black text-slate-700 dark:text-slate-300">{UI_TEXT.resourceEstimator.step3.ptLabel}</label><div className="group relative cursor-help"><div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center text-[10px] font-black">?</div><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">{UI_TEXT.resourceEstimator.step3.ptHelp}<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div></div></div></div><div className="flex gap-2"><div className="flex-1"><Input value={inputPt} onChange={setInputPt} type="number" placeholder="例: 15000" className="font-mono font-bold" /></div><div className="w-28"><Select value={inputEnergyUsed} onChange={(v) => setInputEnergyUsed(Number(v))} options={ENERGY_OPTIONS.map(e => ({ value: e, label: `${e} 體遊玩` }))} /></div></div></div>
                        
                        {/* 進行中活動：目前分數輸入 */}
                        {result?.isTargetLive && (
                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-1.5">
                                    <label className="text-sm font-black text-cyan-700 dark:text-cyan-400">{UI_TEXT.resourceEstimator.step3.currentScoreLabel}</label>
                                    <div className="group relative cursor-help">
                                        <div className="w-4 h-4 rounded-full bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-[10px] font-black">?</div>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                                            {UI_TEXT.resourceEstimator.step3.currentScoreHelp}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                        </div>
                                    </div>
                                </div>
                                <Input value={userCurrentScore} onChange={setUserCurrentScore} type="number" placeholder="0" className="font-mono font-bold text-cyan-600 dark:text-cyan-400" />
                            </div>
                        )}

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800"><Select label={UI_TEXT.resourceEstimator.step3.planEnergy} value={planEnergyPerGame} onChange={(v) => setPlanEnergyPerGame(Number(v))} options={ENERGY_OPTIONS.map(e => ({ value: e, label: `衝榜時用 ${e} 體/場` }))} />{result && !result.isReached && (<div className="mt-2 flex justify-between items-center text-[11px]"><span className="text-slate-500 font-bold uppercase tracking-tight">{UI_TEXT.resourceEstimator.step3.estSingle}</span><span className="text-cyan-600 dark:text-cyan-400 font-black">{result.estimatedPtPerGame.toLocaleString()} pt</span></div>)}</div>
                        {result?.isWarning && !result.isReached && (<div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] rounded-lg border border-amber-500/20 animate-pulse font-bold">{UI_TEXT.resourceEstimator.step3.warning}</div>)}
                    </div>
                </Card>
            </div>
            
            <div className="w-full">
                {result ? (
                    result.isReached ? (
                        <div className="py-10 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900 rounded-3xl border border-emerald-200 dark:border-emerald-800/50 shadow-lg text-center animate-fadeIn group relative overflow-hidden">
                            <div className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-full mb-4 group-hover:scale-110 transition-transform duration-500 border-4 border-emerald-100 dark:border-emerald-800 shadow-xl relative z-10">
                                <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h4 className="text-slate-900 dark:text-white font-black text-xl mb-2 tracking-tight relative z-10">{UI_TEXT.resourceEstimator.result.reachedTitle}</h4>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm px-6 leading-relaxed font-bold text-sm relative z-10">{UI_TEXT.resourceEstimator.result.reachedDesc}</p>
                            <div className="mt-4 flex flex-col gap-1 relative z-10">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Target Score</span>
                                <span className="text-xl font-mono font-black text-slate-700 dark:text-slate-300">{result.adjustedTargetScore.toLocaleString()}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xl animate-fadeIn relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"><svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h6V3h-8z" /></svg></div>
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-center relative z-10">
                                <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                    <div className="space-y-3">
                                        <h4 className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] border-l-4 border-cyan-500 pl-3">{UI_TEXT.resourceEstimator.result.targetLabel}</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                                <span className="text-sm text-slate-500 dark:text-slate-400 font-bold">{UI_TEXT.resourceEstimator.result.adjScore}</span>
                                                <span className="font-mono font-black text-lg text-slate-900 dark:text-white">{result.adjustedTargetScore.toLocaleString()} pt</span>
                                            </div>
                                            {result.isTargetLive && (
                                                <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                                    <span className="text-sm text-slate-500 dark:text-slate-400 font-bold">{UI_TEXT.resourceEstimator.result.remainingScore}</span>
                                                    <span className="font-mono font-black text-lg text-pink-600 dark:text-pink-400">{(result.adjustedTargetScore - (result.userCurrentScore || 0)).toLocaleString()} pt</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                                <span className="text-sm text-slate-500 dark:text-slate-400 font-bold">{UI_TEXT.resourceEstimator.result.totalGames}</span>
                                                <span className="font-mono font-black text-lg text-slate-900 dark:text-white">{result.gamesNeeded.toLocaleString()} <span className="text-xs font-normal">場</span></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] border-l-4 border-amber-500 pl-3">{UI_TEXT.resourceEstimator.result.efficiencyLabel}</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                                <span className="text-sm text-slate-500 dark:text-slate-400 font-bold">{UI_TEXT.resourceEstimator.result.totalEnergy}</span>
                                                <span className="font-mono font-black text-lg text-slate-900 dark:text-white">{result.totalEnergyNeeded.toLocaleString()} ⚡</span>
                                            </div>
                                            <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                                <span className="text-sm text-slate-500 dark:text-slate-400 font-bold">
                                                    {UI_TEXT.resourceEstimator.result.naturalRecovery} 
                                                    {result.isTargetLive && <span className="text-[10px] ml-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">(剩餘)</span>}
                                                </span>
                                                <span className="font-mono font-black text-lg text-emerald-500 dark:text-emerald-400">-{result.naturalRecovery.toLocaleString()} ⚡</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-inner group">
                                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-4">{UI_TEXT.resourceEstimator.result.estResource}</span>
                                    
                                    <div className="flex justify-center items-center gap-4 mb-2">
                                        {/* 大罐 */}
                                        <div className="flex flex-col items-center">
                                            <div className="relative w-16 h-16 mb-2">
                                                <img src={getAssetUrl('LiveBonus-big.png', 'item')} alt="Live Bonus Big" className="w-full h-full object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full scale-110 animate-pulse -z-10"></div>
                                            </div>
                                            <span className="text-3xl font-black font-mono text-cyan-600 dark:text-cyan-400">x{result.finalBigCans}</span>
                                        </div>

                                        {/* 小罐 (如果有) */}
                                        {(result.finalSmallCans || 0) > 0 && (
                                            <>
                                                <span className="text-slate-300 dark:text-slate-600 text-2xl font-thin">+</span>
                                                <div className="flex flex-col items-center">
                                                    <div className="relative w-12 h-12 mb-2 pt-2">
                                                        <img src={getAssetUrl('LiveBonus-small.png', 'item')} alt="Live Bonus Small" className="w-full h-full object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-110" />
                                                    </div>
                                                    <span className="text-2xl font-black font-mono text-slate-600 dark:text-slate-300">x{result.finalSmallCans}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-col items-center mt-2">
                                        <span className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Live Bonus 組合</span>
                                        <span className="text-[10px] font-mono text-slate-400 mt-1">缺口: {result.finalPotions} ⚡</span>
                                    </div>
                                    <p className="mt-4 text-[10px] text-slate-400 font-bold text-center leading-relaxed opacity-80">{UI_TEXT.resourceEstimator.result.disclaimer}</p>
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center animate-fadeIn group">
                        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-full mb-4 group-hover:scale-110 transition-transform duration-500 border border-slate-100 dark:border-slate-700"><svg className="w-12 h-12 text-slate-200 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
                        <h4 className="text-slate-900 dark:text-white font-black text-lg mb-2 tracking-tight">{UI_TEXT.resourceEstimator.result.readyTitle}</h4>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm px-6 leading-relaxed font-medium text-sm">{UI_TEXT.resourceEstimator.result.readyDesc}</p>
                    </div>
                )}
            </div>
            <div className="mt-4 flex justify-center px-4"><div className="inline-flex items-center gap-2.5 px-5 py-3 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30"><svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span className="text-xs text-amber-700 dark:text-amber-400 font-bold leading-relaxed">{UI_TEXT.resourceEstimator.globalWarning}</span></div></div>
        </div>
    );
};

export default ResourceEstimatorView;
