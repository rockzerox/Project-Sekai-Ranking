
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { EventSummary } from '../../types';
import { UNITS, API_BASE_URL } from '../../config/constants';
import DashboardTable from '../../components/ui/DashboardTable';
import Select from '../../components/ui/Select';
import { useConfig } from '../../contexts/ConfigContext';
import { fetchJsonWithBigInt } from '../../hooks/useRankings';
import { UI_TEXT } from '../../config/uiText';
import { supabase } from '../../lib/supabase';

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
    const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [totalEventsCount, setTotalEventsCount] = useState(0);
    const [selectedSpecificRank, setSelectedSpecificRank] = useState<number>(1);
    const [metadata, setMetadata] = useState<{ totalTop100: number; rankCounts: Record<number, number> } | null>(null);

    // 1. 初始化：取得統計數據
    useEffect(() => {
        const fetchData = async () => {
            setIsAnalyzing(true);
            try {
                // 取得活動總數用於計算霸榜率
                const events: EventSummary[] = await fetchJsonWithBigInt(`${API_BASE_URL}/event/list`);
                const now = new Date();
                const pastEventsCount = events.filter(e => new Date(e.closed_at) < now).length;
                setTotalEventsCount(pastEventsCount);

                // 取得預計算的排行榜 (unit_id = 0 代表總計)
                const res = await fetchJsonWithBigInt(`${API_BASE_URL}/stats/top-players?unit_id=0&limit=100`);
                
                if (res && res.data) {
                    const formattedStats: PlayerStat[] = res.data.map((item: any) => ({
                        userId: item.user_id,
                        latestName: item.players?.user_name || 'Unknown',
                        top100Count: item.top100_count,
                        specificRankCounts: item.specific_rank_counts || {},
                        unitCounts: {} // 預計算表暫不提供詳細單位拆解，若需此功能可後續擴充
                    }));
                    setPlayerStats(formattedStats);
                    setMetadata(res.metadata);
                }
            } catch (e) {
                console.error("PlayerAnalysis: Failed to fetch stats", e);
            } finally {
                setIsAnalyzing(false);
            }
        };
        fetchData();
    }, []);

    // 2. 數據排序與過濾 (Memoized)
    const { topFrequent100, topFrequentSpecific, uniquePlayersCount, uniqueSpecificRankCount } = useMemo(() => {
        // 左表：Top 100 常客 (已經由 API 排序好)
        const sortedByTop100 = playerStats.slice(0, 15);

        // 右表：特定排名常客 (依照該排名獲得次數排序)
        const specificRankUsers = playerStats.filter(s => (s.specificRankCounts[selectedSpecificRank] || 0) > 0);
        
        const sortedBySpecificRank = [...specificRankUsers]
            .sort((a, b) => {
                const countA = a.specificRankCounts[selectedSpecificRank] || 0;
                const countB = b.specificRankCounts[selectedSpecificRank] || 0;
                if (countA !== countB) return countB - countA;
                return b.top100Count - a.top100Count;
            })
            .slice(0, 15);

        return {
            topFrequent100: sortedByTop100,
            topFrequentSpecific: sortedBySpecificRank,
            uniquePlayersCount: metadata?.totalTop100 || 0,
            uniqueSpecificRankCount: metadata?.rankCounts[selectedSpecificRank] || 0
        };
    }, [playerStats, selectedSpecificRank, metadata]);

    // 渲染表格列
    const renderRow = (stat: PlayerStat, idx: number, value: number, isTop100Table: boolean = false) => {
        const dominationRate = totalEventsCount > 0 ? ((stat.top100Count / totalEventsCount) * 100).toFixed(1) : "0.0";
        return (
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
            {isTop100Table && (
                <td className="px-3 py-2 text-right font-mono text-cyan-600 dark:text-cyan-400 align-middle font-bold">
                    {dominationRate}%
                </td>
            )}
        </tr>
    )};

    return (
        <div className="w-full py-4 animate-fadeIn">
             <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{UI_TEXT.playerAnalysis.title}</h2>
                <p className="text-slate-500 dark:text-slate-400">
                    {UI_TEXT.playerAnalysis.descriptionPrefix} <span className="font-bold text-cyan-600 dark:text-cyan-400">{totalEventsCount}</span> {UI_TEXT.playerAnalysis.descriptionSuffix}
                </p>

                {isAnalyzing && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 mt-4 mb-6 relative overflow-hidden shadow-sm">
                        <div className="flex justify-center items-center relative z-10">
                            <span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm animate-pulse">
                                {UI_TEXT.playerAnalysis.processing}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                {/* 左表：Top 100 總次數排行 */}
                <DashboardTable 
                    title={
                        <div className="flex items-baseline gap-2">
                            <span>{UI_TEXT.playerAnalysis.tableTop100.title}</span>
                            <span className="text-xs font-normal opacity-80">(共 {uniquePlayersCount.toLocaleString()} 人)</span>
                        </div>
                    }
                    subtitle={UI_TEXT.playerAnalysis.tableTop100.subtitle}
                    data={topFrequent100} 
                    columns={[
                        { header: '#', className: 'w-12' },
                        { header: '玩家 (Player)', className: 'w-auto' },
                        { header: '上榜次數', className: 'text-right w-24' },
                        { header: '前百霸榜率', className: 'text-right w-24' }
                    ]}
                    renderRow={(s: PlayerStat, idx) => renderRow(s, idx, s.top100Count, true)} 
                    color="bg-cyan-500" 
                />

                {/* 右表：特定排名次數排行 */}
                <DashboardTable 
                    title={
                        <div className="flex items-center gap-2">
                            <span>{UI_TEXT.playerAnalysis.tableSpecific.title}</span>
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
                    subtitle={`${UI_TEXT.playerAnalysis.tableSpecific.subtitlePrefix} ${selectedSpecificRank} ${UI_TEXT.playerAnalysis.tableSpecific.subtitleSuffix}`}
                    data={topFrequentSpecific} 
                    columns={[
                        { header: '#', className: 'w-12' },
                        { header: '玩家 (Player)', className: 'w-auto' },
                        { header: '獲取次數', className: 'text-right w-24' }
                    ]}
                    emptyMessage={`尚無玩家多次獲得第 ${selectedSpecificRank} 名`}
                    renderRow={(s: PlayerStat, idx) => renderRow(s, idx, s.specificRankCounts[selectedSpecificRank] || 0, false)} 
                    color="bg-pink-500" 
                />
            </div>
        </div>
    );
};

export default PlayerAnalysisView;
