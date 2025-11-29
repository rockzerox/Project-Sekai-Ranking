
import React, { useState, useEffect, useMemo } from 'react';
import { EventSummary, PastEventApiResponse, PastEventBorderApiResponse } from '../types';
import CollapsibleSection from './CollapsibleSection';
import { calculatePreciseDuration, calculateDisplayDuration, WORLD_LINK_IDS, getEventStatus, EVENT_DETAILS, UNIT_ORDER, BANNER_ORDER } from '../constants';

const MULTIPLIERS = [1, 5, 10, 15, 20, 25, 27, 29, 31, 33, 35];
const ENERGY_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const RANK_OPTIONS = [1, 10, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000];

interface CalculationResult {
    step_XB: string;
    step_S_adjusted: string;
    step_P: string;
    step_Y: string;
    step_potions_no_recovery: string;
    step_recovery_adjust: string;
    step_final_potions: string;
}

const ResourceEstimatorView: React.FC = () => {
    const [events, setEvents] = useState<EventSummary[]>([]);
    
    // Inputs
    const [selectedPastEventId, setSelectedPastEventId] = useState<number | ''>('');
    const [selectedRank, setSelectedRank] = useState<number>(1000);
    const [selectedFutureEventId, setSelectedFutureEventId] = useState<number | ''>('');
    
    const [inputS, setInputS] = useState<number>(15000);
    const [inputL, setInputL] = useState<number>(5);
    const [targetL, setTargetL] = useState<number>(5);

    // Filters for Past Events
    const [pastUnitFilter, setPastUnitFilter] = useState<string>('all');
    const [pastBannerFilter, setPastBannerFilter] = useState<string>('all');
    const [pastStoryFilter, setPastStoryFilter] = useState<'all' | 'unit_event' | 'mixed_event' | 'world_link'>('all');
    const [pastCardFilter, setPastCardFilter] = useState<'all' | 'permanent' | 'limited' | 'special_limited'>('all');

    // Fetched/Derived Data
    const [pastEventScore, setPastEventScore] = useState<number | null>(null);
    const [pastEventDuration, setPastEventDuration] = useState<number>(0);
    const [futureEventDuration, setFutureEventDuration] = useState<number>(0);
    
    const [result, setResult] = useState<CalculationResult | null>(null);
    const [isStepsOpen, setIsStepsOpen] = useState(true);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Fetch Event List
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch('https://api.hisekai.org/event/list');
                const data: EventSummary[] = await response.json();
                // Sort descending by ID
                setEvents(data.sort((a, b) => b.id - a.id));
            } catch (e) {
                console.error("Failed to fetch events", e);
            }
        };
        fetchEvents();
    }, []);

    // Filtered Past Events List
    const pastEventsList = useMemo(() => {
        const now = new Date();
        let list = events.filter(e => new Date(e.closed_at) < now && !WORLD_LINK_IDS.includes(e.id));

        if (pastUnitFilter !== 'all') {
            list = list.filter(e => EVENT_DETAILS[e.id]?.unit === pastUnitFilter);
        }
        if (pastBannerFilter !== 'all') {
            list = list.filter(e => EVENT_DETAILS[e.id]?.banner === pastBannerFilter);
        }
        if (pastStoryFilter !== 'all') {
            list = list.filter(e => EVENT_DETAILS[e.id]?.storyType === pastStoryFilter);
        }
        if (pastCardFilter !== 'all') {
            list = list.filter(e => EVENT_DETAILS[e.id]?.cardType === pastCardFilter);
        }
        return list;
    }, [events, pastUnitFilter, pastBannerFilter, pastStoryFilter, pastCardFilter]);

    // Active/Future Events List for Target
    const futureEventsList = useMemo(() => {
        return events.filter(e => {
            if (WORLD_LINK_IDS.includes(e.id)) return false;
            const status = getEventStatus(e.start_at, e.aggregate_at, e.closed_at, e.ranking_announce_at);
            return status === 'active' || status === 'calculating' || status === 'future';
        });
    }, [events]);

    // Fetch Past Event Score when Event/Rank changes
    useEffect(() => {
        if (!selectedPastEventId) {
            setPastEventScore(null);
            setPastEventDuration(0);
            return;
        }

        const fetchScore = async () => {
            setIsLoadingData(true);
            try {
                // Find event to get duration
                const event = events.find(e => e.id === Number(selectedPastEventId));
                if (event) {
                    setPastEventDuration(calculatePreciseDuration(event.start_at, event.aggregate_at));
                }

                // Decide which API to call based on rank
                // Top 100 uses top100 endpoint, others use border endpoint
                let score = 0;
                if (selectedRank <= 100) {
                    const res = await fetch(`https://api.hisekai.org/event/${selectedPastEventId}/top100`);
                    if (res.ok) {
                        const text = await res.text();
                        const sanitized = text.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');
                        const data: PastEventApiResponse = JSON.parse(sanitized);
                        const entry = data.rankings.find(r => r.rank === selectedRank);
                        if (entry) score = entry.score;
                        // If exact rank not found (rare for 1-100 unless specific), try index
                        else if (selectedRank === 1) score = data.rankings[0]?.score || 0;
                        else if (selectedRank === 10) score = data.rankings[9]?.score || 0;
                        else if (selectedRank === 100) score = data.rankings[data.rankings.length - 1]?.score || 0;
                    }
                } else {
                    const res = await fetch(`https://api.hisekai.org/event/${selectedPastEventId}/border`);
                    if (res.ok) {
                        const text = await res.text();
                        const sanitized = text.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');
                        const data: PastEventBorderApiResponse = JSON.parse(sanitized);
                        const entry = data.borderRankings.find(r => r.rank === selectedRank);
                        if (entry) score = entry.score;
                    }
                }
                setPastEventScore(score);
            } catch (e) {
                console.error("Failed to fetch score", e);
                setPastEventScore(0);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchScore();
    }, [selectedPastEventId, selectedRank, events]);

    // Update Future Duration
    useEffect(() => {
        if (!selectedFutureEventId) {
            setFutureEventDuration(0);
            return;
        }
        const event = events.find(e => e.id === Number(selectedFutureEventId));
        if (event) {
            const status = getEventStatus(event.start_at, event.aggregate_at, event.closed_at, event.ranking_announce_at);
            
            if (status === 'active' || status === 'calculating') {
                // Dynamic remaining duration: Now -> Aggregate
                const now = new Date();
                const agg = new Date(event.aggregate_at);
                const diffMs = Math.max(0, agg.getTime() - now.getTime());
                // Convert ms to days
                const remainingDays = diffMs / (1000 * 60 * 60 * 24);
                setFutureEventDuration(remainingDays);
            } else {
                // Future event: Use full duration
                setFutureEventDuration(calculatePreciseDuration(event.start_at, event.aggregate_at));
            }
        }
    }, [selectedFutureEventId, events]);

    const calculateResources = () => {
        if (!pastEventScore || !pastEventDuration || !futureEventDuration) return;

        const X = pastEventScore;
        const A_d = pastEventDuration;
        const B_d = futureEventDuration;
        const L_use = targetL;
        const L_input = inputL;
        const S_input = inputS;

        const S_adjusted = S_input * (MULTIPLIERS[L_use] / MULTIPLIERS[L_input]);
        const X_B = X * (B_d / A_d);
        const P = X_B / S_adjusted;
        const Y = P * L_use;
        const potions_no_recovery = Math.ceil(Y / 10);
        // Recovery adjust calculation based on days (approx 48 energy per day)
        // 1 day = 24 hours = 48 energy (1 energy per 30 mins)
        // Natural recovery = B_d * 48
        const recovery_adjust = (B_d * 48) / 10;
        const final_potions = Math.max(0, Math.ceil(Y / 10 - recovery_adjust));

        setResult({
            step_XB: `調整後分數 X_B = ${Math.round(X_B).toLocaleString()}`,
            step_S_adjusted: `調整後單場最高分 S = ${Math.round(S_adjusted).toLocaleString()}`,
            step_P: `需要打場次 P = ${Math.ceil(P).toLocaleString()}`,
            step_Y: `總體力消耗 Y = ${Math.ceil(Y).toLocaleString()}`,
            step_potions_no_recovery: `大補充罐數 (不考慮回體) = ${potions_no_recovery}`,
            step_recovery_adjust: `考慮回體可少準備罐數 ≈ ${Math.floor(recovery_adjust)}`,
            step_final_potions: `最終理論大補充罐數 = ${final_potions}`
        });
    };

    const resetInputs = () => {
        setSelectedPastEventId('');
        setSelectedFutureEventId('');
        setPastEventScore(null);
        setPastEventDuration(0);
        setFutureEventDuration(0);
        setResult(null);
    };

    return (
        <div className="w-full py-4 animate-fadeIn">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">預估資源計算機 (Resource Estimator)</h2>
                <p className="text-slate-500 dark:text-slate-400">依據過往活動分數預估未來活動所需的大補充罐數</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Configuration Card */}
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                        1. 設定基準 (Baseline)
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                             <select
                                value={pastUnitFilter}
                                onChange={(e) => setPastUnitFilter(e.target.value)}
                                className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs outline-none"
                             >
                                <option value="all">所有團體</option>
                                {UNIT_ORDER.map(u => <option key={u} value={u}>{u}</option>)}
                             </select>
                             <select
                                value={pastBannerFilter}
                                onChange={(e) => setPastBannerFilter(e.target.value)}
                                className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs outline-none"
                             >
                                <option value="all">所有 Banner</option>
                                {BANNER_ORDER.map(b => <option key={b} value={b}>{b}</option>)}
                             </select>
                             <select
                                value={pastStoryFilter}
                                onChange={(e) => setPastStoryFilter(e.target.value as any)}
                                className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs outline-none"
                             >
                                <option value="all">所有劇情</option>
                                <option value="unit_event">箱活</option>
                                <option value="mixed_event">混活</option>
                             </select>
                             <select
                                value={pastCardFilter}
                                onChange={(e) => setPastCardFilter(e.target.value as any)}
                                className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs outline-none"
                             >
                                <option value="all">所有卡面</option>
                                <option value="permanent">常駐</option>
                                <option value="limited">限定</option>
                                <option value="special_limited">特殊限定</option>
                             </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                                選擇參考活動 (Past Event)
                            </label>
                            <select 
                                value={selectedPastEventId}
                                onChange={(e) => setSelectedPastEventId(Number(e.target.value))}
                                className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                            >
                                <option value="">請選擇...</option>
                                {pastEventsList.map(e => (
                                    <option key={e.id} value={e.id}>#{e.id} {e.name} ({calculateDisplayDuration(e.start_at, e.aggregate_at)}日)</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                                參考排名 (Rank Target)
                            </label>
                            <select 
                                value={selectedRank}
                                onChange={(e) => setSelectedRank(Number(e.target.value))}
                                className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                            >
                                {RANK_OPTIONS.map(r => (
                                    <option key={r} value={r}>Top {r}</option>
                                ))}
                            </select>
                        </div>

                        {selectedPastEventId !== '' && (
                            <div className="bg-slate-100 dark:bg-slate-900/50 p-3 rounded text-sm flex justify-between items-center">
                                <span className="text-slate-500">基準分數 (X):</span>
                                {isLoadingData ? (
                                    <span className="text-cyan-500 animate-pulse">載入中...</span>
                                ) : (
                                    <span className="font-mono font-bold text-slate-700 dark:text-cyan-400">
                                        {pastEventScore ? pastEventScore.toLocaleString() : 'N/A'}
                                    </span>
                                )}
                            </div>
                        )}
                        {selectedPastEventId !== '' && (
                            <div className="bg-slate-100 dark:bg-slate-900/50 p-3 rounded text-sm flex justify-between items-center">
                                <span className="text-slate-500">基準天數 (Ad):</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {pastEventDuration.toFixed(2)} 天
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Target Card */}
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                        2. 設定目標 (Target)
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                                選擇未來活動/目標長度 (Future Event)
                            </label>
                            <select 
                                value={selectedFutureEventId}
                                onChange={(e) => setSelectedFutureEventId(Number(e.target.value))}
                                className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                            >
                                <option value="">請選擇...</option>
                                {futureEventsList.map(e => {
                                    const status = getEventStatus(e.start_at, e.aggregate_at, e.closed_at, e.ranking_announce_at);
                                    const label = status === 'future' ? '[未來]' : '[進行中]';
                                    return (
                                        <option key={e.id} value={e.id}>
                                            {label} #{e.id} {e.name}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    每場得分 (S)
                                </label>
                                <input 
                                    type="number" 
                                    value={inputS}
                                    onChange={(e) => setInputS(Math.max(1, Number(e.target.value)))}
                                    className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    使用體力 (L Input)
                                </label>
                                <select 
                                    value={inputL}
                                    onChange={(e) => setInputL(Number(e.target.value))}
                                    className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                                >
                                    {ENERGY_OPTIONS.map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                                衝榜預設體力 (Target L)
                            </label>
                            <select 
                                value={targetL}
                                onChange={(e) => setTargetL(Number(e.target.value))}
                                className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                            >
                                {ENERGY_OPTIONS.map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                        </div>

                        {selectedFutureEventId !== '' && (
                            <div className="bg-slate-100 dark:bg-slate-900/50 p-3 rounded text-sm flex justify-between items-center">
                                <span className="text-slate-500">目標天數 (Bd):</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {futureEventDuration.toFixed(2)} 天
                                    {/* Helper text for dynamic duration */}
                                    {events.find(e => e.id === Number(selectedFutureEventId)) && 
                                     ['active', 'calculating'].includes(getEventStatus(
                                         events.find(e => e.id === Number(selectedFutureEventId))!.start_at,
                                         events.find(e => e.id === Number(selectedFutureEventId))!.aggregate_at,
                                         events.find(e => e.id === Number(selectedFutureEventId))!.closed_at,
                                         events.find(e => e.id === Number(selectedFutureEventId))!.ranking_announce_at
                                     )) && " (剩餘)"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button
                    onClick={calculateResources}
                    disabled={!pastEventScore || !selectedFutureEventId}
                    className={`flex-1 py-3 px-6 rounded-lg font-bold text-white shadow-lg transition-all ${
                        !pastEventScore || !selectedFutureEventId
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-500/20'
                    }`}
                >
                    計算預估資源
                </button>
                <button
                    onClick={resetInputs}
                    className="px-6 py-3 rounded-lg font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                    重做評估
                </button>
            </div>

            {result && (
                <div className="mt-8 animate-fadeIn">
                    <CollapsibleSection
                        title="計算步驟與結果 (Results)"
                        isOpen={isStepsOpen}
                        onToggle={() => setIsStepsOpen(!isStepsOpen)}
                    >
                        <div className="space-y-2 font-mono text-sm text-slate-700 dark:text-slate-300">
                            <p className="p-2 border-b border-slate-200 dark:border-slate-700">{result.step_S_adjusted}</p>
                            <p className="p-2 border-b border-slate-200 dark:border-slate-700">{result.step_XB}</p>
                            <p className="p-2 border-b border-slate-200 dark:border-slate-700">{result.step_P}</p>
                            <p className="p-2 border-b border-slate-200 dark:border-slate-700">{result.step_Y}</p>
                            <p className="p-2 border-b border-slate-200 dark:border-slate-700 font-bold text-indigo-600 dark:text-indigo-400">{result.step_potions_no_recovery}</p>
                            <p className="p-2 border-b border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">{result.step_recovery_adjust}</p>
                            <div className="mt-4 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-700/50 text-center">
                                <p className="text-xl sm:text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                                    {result.step_final_potions}
                                </p>
                            </div>
                        </div>
                    </CollapsibleSection>
                </div>
            )}
        </div>
    );
};

export default ResourceEstimatorView;
