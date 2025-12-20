
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { EventSummary, PastEventApiResponse } from '../types';
import { UNITS, UNIT_ORDER, API_BASE_URL } from '../constants';
import DashboardTable from './ui/DashboardTable';
import Select from './ui/Select';
import { useConfig } from '../contexts/ConfigContext';

interface PlayerStat {
    userId: string;
    latestName: string;
    top100Count: number;
    // 紀錄該玩家獲得特定排名的次數 (Key: Rank 1-10, Value: Count)
    specificRankCounts: Record<number, number>; 
    // 紀錄該玩家使用的隊伍次數 (Key: Unit Name, Value: Count)
    unitCounts: Record<string, number>; 
}

const PlayerAnalysisView: React.FC = () => {
    const { eventDetails } = useConfig();
    // 待處理的活動隊列
    const [eventsQueue, setEventsQueue] = useState<EventSummary[]>([]);
    const [playerStats, setPlayerStats] = useState<Record<string, PlayerStat>>({});
    
    // 分析狀態
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    
    // 統計數據
    const [totalEventsCount, setTotalEventsCount] = useState(0);
    const [processedCount, setProcessedCount] = useState(0);
    
    // UI 篩選
    const [selectedSpecificRank, setSelectedSpecificRank] = useState<number>(1);

    const abortControllerRef = useRef<AbortController | null>(null);

    // 1. 初始化：取得所有活動列表
    useEffect(() => {
        const fetchList = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/event/list`);
                const data: EventSummary[] = await response.json();
                const now = new Date();
                
                // 篩選條件：
                // 1. 已結束的活動 (closed_at < now)
                // 2. 包含 World Link (原本排除，現在納入，只統計總榜不統計章節)
                const pastEvents = data
                    .filter(e => new Date(e.closed_at) < now)
                    .sort((a, b) => b.id - a.id); // 由新到舊排序 (ID 大 -> 小)
                
                setEventsQueue(pastEvents);
                setTotalEventsCount(pastEvents.length);
            } catch (e) {
                console.error("Failed to fetch event list", e);
                setIsAnalyzing(false);
            }
        };
        fetchList();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // 2. 批次處理活動數據
    useEffect(() => {
        if (eventsQueue.length === 0) {
            if (totalEventsCount > 0 && processedCount === totalEventsCount) {
                setIsAnalyzing(false);
            }
            return;
        }
        
        if (!isAnalyzing || isPaused) return;

        const processBatch = async () => {
            const controller = new AbortController();
            abortControllerRef.current = controller;

            // 每次處理 5 個活動，避免請求過於頻繁
            const BATCH_SIZE = 5;
            const currentBatch = eventsQueue.slice(0, BATCH_SIZE);
            const remainingBatch = eventsQueue.slice(BATCH_SIZE);

            const fetchPromises = currentBatch.map(async (event) => {
                try {
                    const res = await fetch(`${API_BASE_URL}/event/${event.id}/top100`, { 
                        signal: controller.signal 
                    });

                    if (res.ok) {
                        const text = await res.text();
                        // 處理 BigInt 問題
                        const sanitized = text.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');
                        const data: PastEventApiResponse = JSON.parse(sanitized);
                        // 回傳 rankings (總榜)，自動忽略 userWorldBloomChapterRankings (章節榜)
                        return { rankings: data.rankings, eventId: event.id };
                    }
                    return null;
                } catch (err) {
                    if ((err as Error).name !== 'AbortError') {
                        console.warn(`Failed to fetch event ${event.id}`, err);
                    }
                    return null;
                }
            });

            const results = await Promise.all(fetchPromises);

            if (!controller.signal.aborted) {
                // 更新統計數據
                setPlayerStats(prevStats => {
                    const newStats = { ...prevStats };
                    
                    results.forEach(result => {
                        if (!result) return;
                        
                        const { rankings, eventId } = result;
                        const eventUnit = eventDetails[eventId]?.unit || 'Unknown';

                        rankings.forEach(entry => {
                            const userId = String(entry.userId); // 確保 ID 是字串
                            
                            if (!newStats[userId]) {
                                newStats[userId] = {
                                    userId,
                                    latestName: entry.name, // 因為是由新到舊處理，第一次遇到就是最新名稱
                                    top100Count: 0,
                                    specificRankCounts: {},
                                    unitCounts: {}
                                };
                            }
                            
                            // 1. 增加總上榜次數
                            newStats[userId].top100Count += 1;

                            // 2. 統計團體偏好 (Mix 也計入，Unknown 不計入)
                            if (eventUnit !== 'Unknown') {
                                newStats[userId].unitCounts[eventUnit] = (newStats[userId].unitCounts[eventUnit] || 0) + 1;
                            }

                            // 3. 統計 Rank 1-10 的特定次數
                            if (entry.rank <= 15) { // 稍微放寬統計範圍以支援未來可能的擴充
                                newStats[userId].specificRankCounts[entry.rank] = (newStats[userId].specificRankCounts[entry.rank] || 0) + 1;
                            }
                        });
                    });
                    return newStats;
                });

                // 更新進度
                setEventsQueue(remainingBatch);
                setProcessedCount(prev => prev + currentBatch.length);
                setLoadingProgress(Math.round(((processedCount + currentBatch.length) / totalEventsCount) * 100));
            }
        };

        processBatch();

    }, [eventsQueue, isAnalyzing, isPaused, totalEventsCount, processedCount, eventDetails]);


    // 3. 數據排序與過濾 (Memoized)
    const { topFrequent100, topFrequentSpecific, uniquePlayersCount, uniqueSpecificRankCount } = useMemo(() => {
        const allStats = Object.values(playerStats) as PlayerStat[];

        // 左表：Top 100 常客 (依照上榜總次數排序)
        const sortedByTop100 = [...allStats]
            .sort((a, b) => b.top100Count - a.top100Count)
            .slice(0, 15); // 取前 15 名

        // 右表：特定排名常客 (依照該排名獲得次數排序)
        const specificRankUsers = allStats.filter(s => (s.specificRankCounts[selectedSpecificRank] || 0) > 0);
        
        const sortedBySpecificRank = [...specificRankUsers]
            .sort((a, b) => {
                const countA = a.specificRankCounts[selectedSpecificRank] || 0;
                const countB = b.specificRankCounts[selectedSpecificRank] || 0;
                if (countA !== countB) return countB - countA;
                return b.top100Count - a.top100Count; // 次數相同時，比較總上榜次數
            })
            .slice(0, 15); // 取前 15 名

        return {
            topFrequent100: sortedByTop100,
            topFrequentSpecific: sortedBySpecificRank,
            uniquePlayersCount: allStats.length,
            uniqueSpecificRankCount: specificRankUsers.length
        };
    }, [playerStats, selectedSpecificRank]);

    // 渲染表格列
    const renderRow = (stat: PlayerStat, idx: number, value: number) => (
        <tr key={stat.userId} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            <td className={`px-3 py-2 font-bold ${idx < 3 ? 'text-yellow-500 dark:text-yellow-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {idx + 1}
            </td>
            <td className="px-3 py-2">
                <div className="flex items-center gap-3">
                    <div className="w-[110px] sm:w-[150px] flex-shrink-0 font-medium text-slate-800 dark:text-slate-200 truncate" title={stat.latestName}>
                        {stat.latestName}
                    </div>
                    
                    {/* 顯示該玩家上榜過的所有團體 (固定起點顯示) */}
                    <div className="flex flex-wrap gap-1">
                        {Object.entries(stat.unitCounts)
                            .sort(([, a], [, b]) => b - a)
                            .map(([unit, count]) => {
                                const unitConfig = UNITS[unit];
                                const style = unitConfig ? unitConfig.style : "bg-slate-200 text-slate-600";
                                const abbr = unitConfig ? unitConfig.abbr : unit;
                                return (
                                    <span 
                                        key={unit} 
                                        className={`text-[9px] px-1.5 py-0.5 rounded-sm font-bold whitespace-nowrap ${style}`}
                                        title={`${unit}: ${count} 次`}
                                    >
                                        {abbr} {count}
                                    </span>
                                );
                            })
                        }
                    </div>
                </div>
            </td>
            <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-white align-middle font-bold">
                {value} <span className="text-xs text-slate-400 font-normal">次</span>
            </td>
        </tr>
    );

    return (
        <div className="w-full py-4 animate-fadeIn">
             <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">活躍玩家分析 (Active Player Analysis)</h2>
                <p className="text-slate-500 dark:text-slate-400">
                    統計範圍：共 <span className="font-bold text-cyan-600 dark:text-cyan-400">{totalEventsCount}</span> 期活動 
                    (含 World Link)
                </p>

                {isAnalyzing && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 mt-4 mb-6 relative overflow-hidden shadow-sm">
                        <div className="flex justify-between items-center mb-2 relative z-10">
                            <span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm animate-pulse">
                                正在分析歷代榜單... ({Math.min(100, loadingProgress)}%)
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">
                                已處理: {processedCount} / {totalEventsCount} 期
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden relative z-10">
                            <div 
                                className="bg-cyan-500 h-2 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${loadingProgress}%` }}
                            ></div>
                        </div>
                         <button 
                            onClick={() => setIsPaused(!isPaused)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 transition-colors font-medium shadow-sm"
                         >
                             {isPaused ? "▶ 繼續" : "⏸ 暫停"}
                         </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                {/* 左表：Top 100 總次數排行 */}
                <DashboardTable 
                    title={
                        <div className="flex items-baseline gap-2">
                            <span>🏆 Top 100</span>
                            <span className="text-xs font-normal opacity-80">(共 {uniquePlayersCount.toLocaleString()} 人)</span>
                        </div>
                    }
                    subtitle="累計進入前百名次數最多的玩家"
                    data={topFrequent100} 
                    columns={[
                        { header: '#', className: 'w-12' },
                        { header: '玩家 (Player)', className: 'w-auto' },
                        { header: '上榜次數', className: 'text-right w-24' }
                    ]}
                    renderRow={(s: PlayerStat, idx) => renderRow(s, idx, s.top100Count)} 
                    color="bg-cyan-500" 
                />

                {/* 右表：特定排名次數排行 */}
                <DashboardTable 
                    title={
                        <div className="flex items-center gap-2">
                            <span>🎯 指定排名常客</span>
                            <span className="text-xs font-normal opacity-80">(共 {uniqueSpecificRankCount.toLocaleString()} 人)</span>
                        </div>
                    }
                    headerAction={
                        <div className="flex items-center gap-2 bg-white/20 dark:bg-black/20 p-1 rounded">
                            <span className="text-[10px] text-white font-bold pl-1">Rank:</span>
                            <Select
                                value={selectedSpecificRank}
                                onChange={(val) => setSelectedSpecificRank(Number(val))}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs py-1 pr-6 min-w-[80px]"
                                options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(r => ({ value: r, label: `${r}` }))}
                            />
                        </div>
                    }
                    subtitle={`累計獲得 "第 ${selectedSpecificRank} 名" 次數最多的玩家`}
                    data={topFrequentSpecific} 
                    columns={[
                        { header: '#', className: 'w-12' },
                        { header: '玩家 (Player)', className: 'w-auto' },
                        { header: '獲取次數', className: 'text-right w-24' }
                    ]}
                    emptyMessage={`尚無玩家多次獲得第 ${selectedSpecificRank} 名`}
                    renderRow={(s: PlayerStat, idx) => renderRow(s, idx, s.specificRankCounts[selectedSpecificRank] || 0)} 
                    color="bg-pink-500" 
                />
            </div>
        </div>
    );
};

export default PlayerAnalysisView;
