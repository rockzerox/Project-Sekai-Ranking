import React, { useState, useEffect, useMemo } from 'react';
import { RankEntry, SortOption, HisekaiBorderApiResponse, PastEventBorderApiResponse, HisekaiApiResponse } from '../types';
import LineChart from './LineChart';
import CrownIcon from './icons/CrownIcon';
import { API_BASE_URL } from '../constants';
import { formatScoreForChart } from '../utils/mathUtils';
import { fetchJsonWithBigInt } from '../hooks/useRankings';

interface ChartAnalysisProps {
  rankings: RankEntry[];
  sortOption: SortOption;
  isHighlights?: boolean;
  eventId?: number; 
}

interface BorderItem {
    rank: number;
    score: number;
    name: string;
}

const ChartAnalysis: React.FC<ChartAnalysisProps> = ({ rankings, sortOption, isHighlights = false, eventId }) => {
  const [borderData, setBorderData] = useState<BorderItem[]>([]);
  const [liveAggregateAt, setLiveAggregateAt] = useState<string | null>(null);
  const [t100Score, setT100Score] = useState<number>(0);
  const [t100SafeCount, setT100SafeCount] = useState<number | null>(null);
  const [selectedHighlightRank, setSelectedHighlightRank] = useState<number>(200);

  useEffect(() => {
    const fetchData = async () => {
        const isScoreRelated = sortOption === 'score' || sortOption === 'dailyAvg';
        if (!isScoreRelated) {
            setBorderData([]);
            return;
        }

        try {
            const shouldFetchBorder = isHighlights || (!eventId && isScoreRelated);
            if (shouldFetchBorder) {
                // 修正：路徑移除 /tw
                const url = eventId 
                    ? `${API_BASE_URL}/event/${eventId}/border`
                    : `${API_BASE_URL}/event/live/border`;

                const json = await fetchJsonWithBigInt(url);
                if (json) {
                    let items: BorderItem[] = [];
                    if (eventId) {
                        const data = json as PastEventBorderApiResponse;
                        if (data.borderRankings) items = data.borderRankings.map(r => ({ rank: r.rank, score: r.score, name: r.name }));
                    } else {
                        const data = json as HisekaiBorderApiResponse;
                        if (data.border_player_rankings) items = data.border_player_rankings.map(r => ({ rank: r.rank, score: r.score, name: r.name }));
                    }
                    setBorderData(items);
                }
            }

            if (!eventId) {
                // 修正：路徑改為 /event/live/top100
                const topData: HisekaiApiResponse = await fetchJsonWithBigInt(`${API_BASE_URL}/event/live/top100`);
                if (topData) {
                    setLiveAggregateAt(topData.aggregate_at);
                    const r100 = topData.top_100_player_rankings.find(r => r.rank === 100);
                    if (r100) setT100Score(r100.score);

                    const now = Date.now();
                    const end = new Date(topData.aggregate_at).getTime();
                    const remainingSeconds = (end - now) / 1000;
                    if (remainingSeconds > 0) {
                        const maxGain = (remainingSeconds / 100) * 68000;
                        const safeThreshold = (r100?.score || 0) + maxGain;
                        const safeCount = topData.top_100_player_rankings.filter(r => r.score > safeThreshold).length;
                        setT100SafeCount(safeCount);
                    } else {
                        setT100SafeCount(100); 
                    }
                }
            }
        } catch (e) { console.error("Failed to fetch chart data", e); }
    };
    fetchData();
  }, [sortOption, eventId, isHighlights]);


  const { chartData, title, valueFormatter, yAxisFormatter, color, yLabel, safeThreshold, giveUpThreshold, safeRankCutoff, giveUpRankCutoff, chartVariant, remainingSafeSlots, t100ExtendedStats } = useMemo(() => {
    let data: { label: string, value: number, rank?: number }[] = [];
    let chartTitle = '';
    let formatter = (v: number) => Math.round(v).toLocaleString();
    let axisFormatter = (v: number) => Math.round(v).toLocaleString();
    let chartColor = 'cyan'; 
    let axisY = 'Value';
    
    let calculatedSafeThreshold: number | undefined = undefined;
    let calculatedGiveUpThreshold: number | undefined = undefined;
    let calculatedSafeRankCutoff: number | undefined = undefined;
    let calculatedGiveUpRankCutoff: number | undefined = undefined;
    let calculatedRemainingSlots: number | undefined = undefined;
    let calculatedT100Extended: { chasers: number, giveUpRank: number } | null = null;
    let variant: 'live' | 'highlights' | 'default' = 'default';

    const sourceData = [...rankings].sort((a, b) => a.rank - b.rank);

    const findCutoffRank = (dataPoints: { value: number, rank?: number }[], threshold: number, maxRankFallback: number) => {
        const firstUnsafeIdx = dataPoints.findIndex(d => d.value <= threshold);
        if (firstUnsafeIdx === -1) return maxRankFallback; 
        if (firstUnsafeIdx === 0) return 0; 
        const d1 = dataPoints[firstUnsafeIdx - 1]; 
        const d2 = dataPoints[firstUnsafeIdx];     
        if (d1.value > 0 && d2.value > 0 && threshold > 0 && d1.rank && d2.rank) {
             const lnY = Math.log(threshold);
             const lnY1 = Math.log(d1.value);
             const lnY2 = Math.log(d2.value);
             const t_curved = (lnY - lnY1) / (lnY2 - lnY1);
             const t_curved_clamped = Math.max(0, Math.min(1, t_curved));
             const t_linear = Math.acos(1 - 2 * t_curved_clamped) / Math.PI;
             return d1.rank + (d2.rank - d1.rank) * t_linear;
        } else {
             const ratio = (threshold - d1.value) / (d2.value - d1.value);
             return (d1.rank || 0) + ((d2.rank || 0) - (d1.rank || 0)) * ratio;
        }
    };

    if (!eventId && liveAggregateAt && t100Score > 0) {
        const now = Date.now();
        const end = new Date(liveAggregateAt).getTime();
        const sec = (end - now) / 1000;
        if (sec > 0) {
            const maxGain = (sec / 100) * 68000;
            const giveUpScore = t100Score - maxGain;
            const interpolationPoints: { rank: number, value: number }[] = [];
            interpolationPoints.push({ rank: 100, value: t100Score });
            borderData.forEach(b => {
                if (b.rank > 100 && b.score > 0) interpolationPoints.push({ rank: b.rank, value: b.score });
            });
            interpolationPoints.sort((a,b) => a.rank - b.rank);
            if (interpolationPoints.length >= 2) {
                const giveUpRank = findCutoffRank(interpolationPoints, giveUpScore, 10001);
                if (giveUpRank > 100) {
                    calculatedT100Extended = { chasers: Math.max(0, Math.floor(giveUpRank) - 100), giveUpRank: Math.ceil(giveUpRank) };
                }
            }
        }
    }

    const effectiveSortForChart = sortOption === 'dailyAvg' ? 'score' : sortOption;
    switch(effectiveSortForChart) {
        case 'score':
            chartTitle = isHighlights ? '精彩片段分佈 (Highlights)' : 'Top 100 總分分佈';
            axisY = '分數 (Score)';
            formatter = formatScoreForChart;
            axisFormatter = formatScoreForChart;
            if (isHighlights) {
                variant = 'highlights';
                data = borderData.filter(b => b.rank <= 10000 && b.score > 0).map(b => ({ label: `#${b.rank} ${b.name || 'Player'}`, value: b.score, rank: b.rank })).sort((a, b) => (a.rank || 0) - (b.rank || 0));
                if (!eventId && liveAggregateAt) {
                    const now = Date.now();
                    const end = new Date(liveAggregateAt).getTime();
                    const remainingSeconds = (end - now) / 1000;
                    if (remainingSeconds > 0) {
                        const maxGain = (remainingSeconds / 100) * 68000;
                        let rankScore = selectedHighlightRank === 100 ? t100Score : (borderData.find(b => b.rank === selectedHighlightRank)?.score || 0);
                        if (rankScore > 0) {
                            calculatedSafeThreshold = rankScore + maxGain;
                            calculatedGiveUpThreshold = Math.max(0, rankScore - maxGain);
                            calculatedSafeRankCutoff = findCutoffRank(data, calculatedSafeThreshold, 10000);
                            calculatedGiveUpRankCutoff = findCutoffRank(data, calculatedGiveUpThreshold, 10001);
                        }
                    }
                }
            } else {
                variant = 'live'; 
                data = sourceData.map(r => ({ label: `#${r.rank} ${r.user.display_name}`, value: r.score, rank: r.rank }));
                if (!eventId && liveAggregateAt && data.length > 0) {
                    const now = Date.now();
                    const end = new Date(liveAggregateAt).getTime();
                    const remainingSeconds = (end - now) / 1000;
                    if (remainingSeconds > 0) {
                        const maxGain = (remainingSeconds / 100) * 68000;
                        const rank100Score = data.find(r => r.rank === 100)?.value || 0; 
                        calculatedSafeThreshold = rank100Score + maxGain;
                        calculatedSafeRankCutoff = findCutoffRank(data, calculatedSafeThreshold, 100);
                        const safelySecuredCount = data.filter(r => r.value > calculatedSafeThreshold!).length;
                        calculatedRemainingSlots = Math.max(0, 100 - safelySecuredCount);
                    }
                }
            }
            chartColor = 'cyan';
            break;
        case 'lastPlayedAt':
            chartTitle = '最後上線時間'; axisY = '分鐘 (Mins)';
            const now = Date.now();
            data = isHighlights ? [] : sourceData.map(r => ({ label: `#${r.rank}`, value: Math.max(0, (now - new Date(r.lastPlayedAt).getTime()) / 60000), rank: r.rank }));
            chartColor = 'indigo'; axisFormatter = (v) => Math.round(v).toLocaleString(); 
            break;
        default:
            data = isHighlights ? [] : sourceData.map(r => ({ label: `#${r.rank}`, value: (r.stats as any)[sortOption.split('_')[0]]?.[sortOption.split('_')[1]] || 0, rank: r.rank }));
    }
    return { chartData: data, title: chartTitle, valueFormatter: formatter, yAxisFormatter: axisFormatter, color: chartColor, yLabel: axisY, safeThreshold: calculatedSafeThreshold, giveUpThreshold: calculatedGiveUpThreshold, safeRankCutoff: calculatedSafeRankCutoff, giveUpRankCutoff: calculatedGiveUpRankCutoff, chartVariant: variant, remainingSafeSlots: calculatedRemainingSlots, t100ExtendedStats: calculatedT100Extended };
  }, [rankings, sortOption, borderData, isHighlights, eventId, liveAggregateAt, selectedHighlightRank, t100Score]);

  const dashboardStats = useMemo(() => {
    if (!isHighlights || safeRankCutoff === undefined || giveUpRankCutoff === undefined) return null;
    const safe = Math.floor(safeRankCutoff);
    const giveUp = Math.ceil(giveUpRankCutoff);
    const battleSize = Math.max(0, giveUp - safe);
    return { safe, giveUp, battleSize };
  }, [isHighlights, safeRankCutoff, giveUpRankCutoff]);

  return (
    <div className="space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 w-full lg:w-auto">
                <h3 className="text-md font-semibold text-slate-200 whitespace-nowrap">{title}</h3>
                {!isHighlights && !eventId && (sortOption === 'score' || sortOption === 'dailyAvg') && remainingSafeSlots !== undefined && (
                     <div className="flex flex-wrap items-center gap-2 animate-fadeIn">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border bg-emerald-900/20 border-emerald-500/30 text-emerald-400" title={`目前有 ${100 - remainingSafeSlots} 人分數已超越安全線，剩餘 ${remainingSafeSlots} 個名額可供爭奪`}><CrownIcon className="w-3.5 h-3.5" /><span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">T100 剩餘:</span><span className="text-xs sm:text-sm font-mono font-black">{remainingSafeSlots} 名</span></div>
                        {t100ExtendedStats && (<div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border bg-amber-900/20 border-amber-500/30 text-amber-400" title="推估理論上仍有機會追上 T100 的人數"><span className="text-[10px] sm:text-xs font-bold">[推估] ⚔️ 潛在追擊:</span><span className="text-xs sm:text-sm font-mono font-black">~{t100ExtendedStats.chasers} 人</span></div>)}
                        {t100ExtendedStats && (<div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border bg-rose-900/20 border-rose-500/30 text-rose-400" title="推估 T100 的死心排名"><span className="text-[10px] sm:text-xs font-bold">[推估] ⛔ T100 死心線:</span><span className="text-xs sm:text-sm font-mono font-black">Rank {t100ExtendedStats.giveUpRank}+</span></div>)}
                     </div>
                )}
                {dashboardStats && !eventId && (
                    <div className="flex flex-wrap items-center gap-2 animate-fadeIn">
                        {selectedHighlightRank === 100 ? (
                            <>
                                {t100SafeCount !== null && (<div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border bg-emerald-900/20 border-emerald-500/30 text-emerald-400"><CrownIcon className="w-3.5 h-3.5" /><span className="text-[10px] sm:text-xs font-bold">T100 剩餘:</span><span className="text-xs sm:text-sm font-mono font-black">{Math.max(0, 100 - t100SafeCount)} 名</span></div>)}
                                {t100ExtendedStats && (<div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border bg-amber-900/20 border-amber-500/30 text-amber-400" title="推估理論上仍有機會追上 T100 的人數"><span className="text-[10px] sm:text-xs font-bold">[推估] ⚔️ 潛在追擊:</span><span className="text-xs sm:text-sm font-mono font-black">~{t100ExtendedStats.chasers} 人</span></div>)}
                                {t100ExtendedStats && (<div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border bg-rose-900/20 border-rose-500/30 text-rose-400" title="推估 T100 的死心排名"><span className="text-[10px] sm:text-xs font-bold">[推估] ⛔ T100 死心線:</span><span className="text-xs sm:text-sm font-mono font-black">Rank {t100ExtendedStats.giveUpRank}+</span></div>)}
                            </>
                        ) : (
                            <>
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-emerald-900/20 border-emerald-500/30 text-emerald-400" title="推估安全圈"><span className="text-[10px] font-bold">✅ 安全:</span><span className="text-xs font-mono font-bold">{dashboardStats.safe > 0 ? `Top ${dashboardStats.safe}` : '—'}</span></div>
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-amber-900/20 border-amber-500/30 text-amber-400" title="激戰區間"><span className="text-[10px] font-bold">⚔️ 激戰:</span><span className="text-xs font-mono font-bold">{dashboardStats.battleSize > 0 ? dashboardStats.battleSize : '—'}</span></div>
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-rose-900/20 border-rose-500/30 text-rose-400" title="推估死心線"><span className="text-[10px] font-bold">⛔ 死心:</span><span className="text-xs font-mono font-bold">{dashboardStats.giveUp < 10000 ? `Rank ${dashboardStats.giveUp}+` : '10000+'}</span></div>
                            </>
                        )}
                    </div>
                )}
            </div>
            {isHighlights && !eventId && (sortOption === 'score' || sortOption === 'dailyAvg') && (
                <div className="flex flex-wrap gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 self-start lg:self-auto">
                    {[100, 200, 300, 400, 500, 1000].map(r => (
                        <button key={r} onClick={() => setSelectedHighlightRank(r)} className={`px-2 py-1 text-xs font-bold rounded transition-colors ${selectedHighlightRank === r ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>T{r}</button>
                    ))}
                </div>
            )}
        </div>
        {chartData.length > 0 ? (
            <LineChart data={chartData} variant={chartVariant} lineColor={color} valueFormatter={valueFormatter} yAxisFormatter={yAxisFormatter} xAxisLabel="Rank" yAxisLabel={yLabel} safeThreshold={safeThreshold} safeRankCutoff={safeRankCutoff} giveUpThreshold={giveUpThreshold} giveUpRankCutoff={giveUpRankCutoff} />
        ) : (
             <div className="text-center py-10"><p className="text-slate-400">暫無資料顯示</p></div>
        )}
    </div>
  );
};

export default ChartAnalysis;