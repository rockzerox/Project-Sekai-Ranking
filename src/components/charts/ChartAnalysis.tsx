import React, { useState, useMemo } from 'react';
import { useCardData } from '../../services/cardService';
import { RankEntry, SortOption, CardsMap } from '../../types';
import LineChart from '../../components/charts/LineChart';
import CrownIcon from '../../components/icons/CrownIcon';
import { CHARACTERS } from '../../config/constants';
import { formatScoreForChart } from '../../utils/mathUtils';
import { useConfig } from '../../contexts/ConfigContext';

interface ChartAnalysisProps {
  rankings: RankEntry[];
  sortOption: SortOption;
  isHighlights?: boolean;
  eventId?: number;
  cards?: CardsMap;
  isLiveEvent?: boolean;
  aggregateAt?: string | null;
  activeChapterId?: string;
}

const LIVE_RANK_OPTIONS = [3, 10, 50, 100] as const;
type LiveRankOption = typeof LIVE_RANK_OPTIONS[number];

const ChartAnalysis: React.FC<ChartAnalysisProps> = ({
  rankings, sortOption, isHighlights = false, eventId,
  cards: cardsProp, isLiveEvent = false, aggregateAt: aggregateAtProp, activeChapterId
}) => {
  const { cards: cardsFromHook } = useCardData();
  const { getPrevRoundWlChapterScore } = useConfig();
  const cards = cardsProp || cardsFromHook;
  const [now] = useState(() => Date.now());
  const [selectedHighlightRank, setSelectedHighlightRank] = useState<number>(200);
  const [selectedLiveRank, setSelectedLiveRank] = useState<LiveRankOption>(100);

  const prevRoundScores = useMemo(() => {
    if (!isLiveEvent || !eventId || !activeChapterId || activeChapterId === 'all') return null;
    return getPrevRoundWlChapterScore(eventId, activeChapterId);
  }, [isLiveEvent, eventId, activeChapterId, getPrevRoundWlChapterScore]);

  const activeCharColor = useMemo(() => {
    if (activeChapterId && activeChapterId !== 'all') return CHARACTERS[activeChapterId]?.color;
    return undefined;
  }, [activeChapterId]);

  const { borderData, t100Score, liveAggregateAt } = useMemo(() => {
    const borders = rankings.filter(r => r.rank > 100)
      .map(r => ({ rank: r.rank, score: r.score, name: r.user.display_name }));
    const t100 = rankings.find(r => r.rank === 100)?.score || 0;
    return { borderData: borders, t100Score: t100, liveAggregateAt: aggregateAtProp };
  }, [rankings, aggregateAtProp]);

  const findCutoffRank = (dataPoints: { value: number, rank?: number }[], threshold: number, maxRankFallback: number): number => {
    const firstUnsafeIdx = dataPoints.findIndex(d => d.value <= threshold);
    if (firstUnsafeIdx === -1) return maxRankFallback;
    if (firstUnsafeIdx === 0) return 0;
    const d1 = dataPoints[firstUnsafeIdx - 1];
    const d2 = dataPoints[firstUnsafeIdx];
    if (d1.value > 0 && d2.value > 0 && threshold > 0 && d1.rank && d2.rank) {
      const lnY = Math.log(threshold), lnY1 = Math.log(d1.value), lnY2 = Math.log(d2.value);
      const t_c = Math.max(0, Math.min(1, (lnY - lnY1) / (lnY2 - lnY1)));
      const t_l = Math.acos(1 - 2 * t_c) / Math.PI;
      return d1.rank + (d2.rank - d1.rank) * t_l;
    }
    const ratio = (threshold - d1.value) / (d2.value - d1.value);
    return (d1.rank || 0) + ((d2.rank || 0) - (d1.rank || 0)) * ratio;
  };

  const {
    chartData, title, valueFormatter, yAxisFormatter, color, yLabel,
    safeThreshold, giveUpThreshold, safeRankCutoff, giveUpRankCutoff,
    chartVariant, remainingSafeSlots, t100ExtendedStats,
    liveGiveUpRankInTop100, liveChasers
  } = useMemo(() => {
    let data: { label: string, value: number, rank?: number, captainCharacterId?: number, eventId?: number }[] = [];
    let chartTitle = '', formatter = (v: number) => Math.round(v).toLocaleString();
    let axisFormatter = (v: number) => Math.round(v).toLocaleString();
    let chartColor = 'cyan', axisY = 'Value';
    let calculatedSafeThreshold: number | undefined;
    let calculatedGiveUpThreshold: number | undefined;
    let calculatedSafeRankCutoff: number | undefined;
    let calculatedGiveUpRankCutoff: number | undefined;
    let calculatedRemainingSlots: number | undefined;
    let calculatedT100Extended: { chasers: number, giveUpRank: number } | null = null;
    let calculatedLiveGiveUpRankInTop100: number | null | undefined;
    let calculatedLiveChasers: number | undefined;
    let variant: 'live' | 'highlights' | 'default' = 'default';

    const sourceData = [...rankings].sort((a, b) => a.rank - b.rank);

    // T100 border interpolation for extended stats (used when selectedLiveRank===100)
    if ((!eventId || isLiveEvent) && liveAggregateAt && t100Score > 0) {
      const sec = (new Date(liveAggregateAt).getTime() - now) / 1000;
      if (sec > 0) {
        const giveUpScore = t100Score - (sec / 100) * 68000;
        const pts = [{ rank: 100, value: t100Score }, ...borderData.filter(b => b.rank > 100 && b.score > 0).map(b => ({ rank: b.rank, value: b.score }))].sort((a, b) => a.rank - b.rank);
        if (pts.length >= 2) {
          const gr = findCutoffRank(pts, giveUpScore, 10001);
          if (gr > 100) calculatedT100Extended = { chasers: Math.max(0, Math.floor(gr) - 100), giveUpRank: Math.ceil(gr) };
        }
      }
    }

    const effectiveSort = sortOption === 'dailyAvg' ? 'score' : sortOption;

    switch (effectiveSort) {
      case 'score': {
        chartTitle = isHighlights ? '精彩片段分佈 (Highlights)' : `Top ${selectedLiveRank} 總分分佈`;
        axisY = '分數 (Score)';
        formatter = formatScoreForChart;
        axisFormatter = formatScoreForChart;

        if (isHighlights) {
          variant = 'highlights';
          data = sourceData.filter(r => r.rank <= 10000 && r.score > 0).map(r => {
            let captainCharacterId: number | undefined;
            if (cards && r.last_player_info?.card?.id) {
              const card = cards[r.last_player_info.card.id.toString()];
              if (card) captainCharacterId = card.characterId;
            }
            return { label: `#${r.rank} ${r.user.display_name}`, value: r.score, rank: r.rank, captainCharacterId, eventId };
          }).sort((a, b) => (a.rank || 0) - (b.rank || 0));

          if ((!eventId || isLiveEvent) && liveAggregateAt) {
            const remSec = (new Date(liveAggregateAt).getTime() - now) / 1000;
            if (remSec > 0) {
              const maxGain = (remSec / 100) * 68000;
              const rankScore = selectedHighlightRank === 100 ? t100Score : (borderData.find(b => b.rank === selectedHighlightRank)?.score || 0);
              if (rankScore > 0) {
                calculatedSafeThreshold = rankScore + maxGain;
                calculatedGiveUpThreshold = Math.max(0, rankScore - maxGain);
                calculatedSafeRankCutoff = findCutoffRank(data, calculatedSafeThreshold, 10000);
                calculatedGiveUpRankCutoff = findCutoffRank(data, calculatedGiveUpThreshold, 10001);
                // Unified direct-count remaining slots (consistent with Top100 view)
                const secured = data.filter(r => (r.rank || 0) <= selectedHighlightRank && r.value > calculatedSafeThreshold!).length;
                calculatedRemainingSlots = Math.max(0, selectedHighlightRank - secured);
                // 🔒 K=0 gate: Highlights T100 — no external chasers means all 100 slots are locked
                if (selectedHighlightRank === 100 && (!calculatedT100Extended || calculatedT100Extended.chasers === 0)) {
                  calculatedRemainingSlots = 0;
                }
              }
            }
          }
        } else {
          variant = 'live';
          data = sourceData.map(r => {
            let captainCharacterId: number | undefined;
            if (cards && r.last_player_info?.card?.id) {
              const card = cards[r.last_player_info.card.id.toString()];
              if (card) captainCharacterId = card.characterId;
            }
            return { label: `#${r.rank} ${r.user.display_name}`, value: r.score, rank: r.rank, captainCharacterId, eventId };
          });

          if ((!eventId || isLiveEvent) && liveAggregateAt && data.length > 0) {
            const remSec = (new Date(liveAggregateAt).getTime() - now) / 1000;
            if (remSec > 0) {
              const maxGain = (remSec / 100) * 68000;
              const targetRankScore = data.find(r => r.rank === selectedLiveRank)?.value || 0;
              if (targetRankScore > 0) {
                calculatedSafeThreshold = targetRankScore + maxGain;
                calculatedGiveUpThreshold = Math.max(0, targetRankScore - maxGain);
                calculatedSafeRankCutoff = findCutoffRank(data, calculatedSafeThreshold, selectedLiveRank);
                const secured = data.filter(r => (r.rank || 0) <= selectedLiveRank && r.value > calculatedSafeThreshold!).length;
                calculatedRemainingSlots = Math.max(0, selectedLiveRank - secured);

                if (selectedLiveRank !== 100) {
                  // T3/T10/T50: giveup limited to within top 100
                  const top100 = data.filter(r => (r.rank || 0) <= 100).sort((a, b) => (a.rank || 0) - (b.rank || 0));
                  calculatedGiveUpRankCutoff = findCutoffRank(top100, calculatedGiveUpThreshold!, 101);
                  const firstOutIdx = top100.findIndex(d => d.value < calculatedGiveUpThreshold!);
                  calculatedLiveGiveUpRankInTop100 = firstOutIdx === -1 ? null : (top100[firstOutIdx].rank || null);
                  calculatedLiveChasers = data.filter(r => {
                    const rank = r.rank || 0;
                    return rank > selectedLiveRank && rank <= 100 && r.value > calculatedGiveUpThreshold!;
                  }).length;
                  // 🔒 K=0 gate: no external chasers → all N slots are locked
                  if (calculatedLiveChasers === 0) calculatedRemainingSlots = 0;
                } else {
                  // 🔒 T100 K=0 gate: no external chasers → all 100 slots are locked
                  if (!calculatedT100Extended || calculatedT100Extended.chasers === 0) {
                    calculatedRemainingSlots = 0;
                  }
                }
              }
            }
          }
        }
        chartColor = 'cyan';
        break;
      }
      case 'lastPlayedAt': {
        chartTitle = '最後上線時間'; axisY = '分鐘 (Mins)';
        data = isHighlights ? [] : sourceData.map(r => ({ label: `#${r.rank}`, value: Math.max(0, (now - new Date(r.lastPlayedAt).getTime()) / 60000), rank: r.rank }));
        chartColor = 'indigo'; axisFormatter = (v) => Math.round(v).toLocaleString();
        break;
      }
      case 'captain': {
        chartTitle = '隊長角色'; axisY = '隊長 ID';
        data = isHighlights ? [] : sourceData.map(r => {
          let captainCharacterId: number | undefined;
          if (cards && r.last_player_info?.card?.id) {
            const card = cards[r.last_player_info.card.id.toString()];
            if (card) captainCharacterId = card.characterId;
          }
          return { label: `#${r.rank} ${r.user.display_name}`, value: captainCharacterId || 0, rank: r.rank, captainCharacterId, eventId };
        });
        chartColor = 'purple';
        break;
      }
      default: {
        data = isHighlights ? [] : sourceData.map(r => {
          const [period, metric] = sortOption.split('_');
          let val = 0;
          if (period in r.stats) {
            const p = period as keyof typeof r.stats;
            const statsObj = r.stats[p];
            if (statsObj && metric in statsObj) val = statsObj[metric as keyof typeof statsObj] || 0;
          }
          return { label: `#${r.rank}`, value: val, rank: r.rank };
        });
        break;
      }
    }

    return {
      chartData: data, title: chartTitle, valueFormatter: formatter, yAxisFormatter: axisFormatter,
      color: chartColor, yLabel: axisY, safeThreshold: calculatedSafeThreshold,
      giveUpThreshold: calculatedGiveUpThreshold, safeRankCutoff: calculatedSafeRankCutoff,
      giveUpRankCutoff: calculatedGiveUpRankCutoff, chartVariant: variant,
      remainingSafeSlots: calculatedRemainingSlots, t100ExtendedStats: calculatedT100Extended,
      liveGiveUpRankInTop100: calculatedLiveGiveUpRankInTop100, liveChasers: calculatedLiveChasers
    };
  }, [rankings, sortOption, borderData, isHighlights, eventId, isLiveEvent, liveAggregateAt, selectedHighlightRank, selectedLiveRank, t100Score, now, cards]);

  const dashboardStats = useMemo(() => {
    if (!isHighlights || safeRankCutoff === undefined || giveUpRankCutoff === undefined) return null;
    const safe = Math.floor(safeRankCutoff);
    const giveUp = Math.ceil(giveUpRankCutoff);
    return { safe, giveUp, battleSize: Math.max(0, giveUp - safe) };
  }, [isHighlights, safeRankCutoff, giveUpRankCutoff]);

  const BadgeGreen = ({ children, title }: { children: React.ReactNode, title?: string }) => (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border bg-emerald-900/20 border-emerald-500/30 text-emerald-400" title={title}>{children}</div>
  );
  const BadgeAmber = ({ children, title }: { children: React.ReactNode, title?: string }) => (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border bg-amber-900/20 border-amber-500/30 text-amber-400" title={title}>{children}</div>
  );
  const BadgeRose = ({ children, title }: { children: React.ReactNode, title?: string }) => (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border bg-rose-900/20 border-rose-500/30 text-rose-400" title={title}>{children}</div>
  );
  const LabelSm = ({ children }: { children: React.ReactNode }) => <span className="text-[10px] sm:text-xs font-bold">{children}</span>;
  const ValueSm = ({ children }: { children: React.ReactNode }) => <span className="text-xs sm:text-sm font-mono font-black">{children}</span>;

  const isLiveCondition = !eventId || isLiveEvent;
  const showScoreStats = sortOption === 'score' || sortOption === 'dailyAvg';

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 w-full lg:w-auto">
          <h3 className="text-md font-semibold text-slate-200 whitespace-nowrap">{title}</h3>

          {/* ── Top100 Live Stats ── */}
          {!isHighlights && isLiveCondition && showScoreStats && remainingSafeSlots !== undefined && (
            <div className="flex flex-wrap items-center gap-2 animate-fadeIn">
              {remainingSafeSlots === 0 ? (
                <BadgeGreen title={`T${selectedLiveRank} 邊界戰已結束，前 ${selectedLiveRank} 名已確定`}>
                  <CrownIcon className="w-3.5 h-3.5" />
                  <LabelSm>✅ 大局已定</LabelSm>
                </BadgeGreen>
              ) : (
                <>
                  <BadgeGreen title={`T${selectedLiveRank} 圈內仍有 ${remainingSafeSlots} 個席次在搶奪中`}>
                    <CrownIcon className="w-3.5 h-3.5" />
                    <LabelSm>搶位:</LabelSm>
                    <ValueSm>{remainingSafeSlots} 席</ValueSm>
                  </BadgeGreen>
                  {selectedLiveRank === 100 && t100ExtendedStats && (
                    <>
                      <BadgeAmber title="理論上仍有機會追上 T100 的人數">
                        <LabelSm>⚔️ 追兵:</LabelSm><ValueSm>~{t100ExtendedStats.chasers} 人</ValueSm>
                      </BadgeAmber>
                      <BadgeRose title="T100 淘汰線">
                        <LabelSm>⛔ 出局:</LabelSm><ValueSm>Rank {t100ExtendedStats.giveUpRank}+</ValueSm>
                      </BadgeRose>
                    </>
                  )}
                  {selectedLiveRank !== 100 && (
                    <>
                      {liveChasers !== undefined && (
                        <BadgeAmber>
                          <LabelSm>⚔️ 追兵:</LabelSm><ValueSm>{liveChasers} 人</ValueSm>
                        </BadgeAmber>
                      )}
                      {liveGiveUpRankInTop100 != null && (
                        <BadgeRose title={`Rank ${liveGiveUpRankInTop100} 以後理論上無法進入 T${selectedLiveRank}`}>
                          <LabelSm>⛔ 出局:</LabelSm><ValueSm>Rank {liveGiveUpRankInTop100}+</ValueSm>
                        </BadgeRose>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Highlights Stats ── */}
          {dashboardStats && isLiveCondition && (
            <div className="flex flex-wrap items-center gap-2 animate-fadeIn">
              {selectedHighlightRank === 100 ? (
                // Highlights T100: unified direct-count remaining (same as Top100)
                remainingSafeSlots !== undefined && (
                  remainingSafeSlots === 0 ? (
                    <BadgeGreen>
                      <CrownIcon className="w-3.5 h-3.5" />
                      <LabelSm>✅ 穩了！</LabelSm>
                    </BadgeGreen>
                  ) : (
                    <>
                      <BadgeGreen>
                        <CrownIcon className="w-3.5 h-3.5" />
                        <LabelSm>未穩:</LabelSm><ValueSm>{remainingSafeSlots} 席</ValueSm>
                      </BadgeGreen>
                      {t100ExtendedStats && (
                        <>
                          <BadgeAmber><LabelSm>⚠️ 追兵:</LabelSm><ValueSm>~{t100ExtendedStats.chasers} 人</ValueSm></BadgeAmber>
                          <BadgeRose><LabelSm>⛔ 出局:</LabelSm><ValueSm>Rank {t100ExtendedStats.giveUpRank}+</ValueSm></BadgeRose>
                        </>
                      )}
                    </>
                  )
                )
              ) : (
                // Highlights non-T100
                <>
                  <BadgeGreen title="推估安全圈">
                    <LabelSm>✅ 安全:</LabelSm>
                    <span className="text-xs font-mono font-bold">{dashboardStats.safe > 0 ? `Top ${dashboardStats.safe}` : '—'}</span>
                  </BadgeGreen>
                  <BadgeAmber title="激戰區間">
                    <LabelSm>⚔️ 激戰:</LabelSm>
                    <span className="text-xs font-mono font-bold">{dashboardStats.battleSize > 0 ? dashboardStats.battleSize : '—'}</span>
                  </BadgeAmber>
                  <BadgeRose title="推估死心線">
                    <LabelSm>⛔ 死心:</LabelSm>
                    <span className="text-xs font-mono font-bold">{dashboardStats.giveUp < 10000 ? `Rank ${dashboardStats.giveUp}+` : '10000+'}</span>
                  </BadgeRose>
                </>
              )}
            </div>
          )}

          {/* ── Previous Round Scores ── */}
          {prevRoundScores && activeCharColor && (
            <div className="flex flex-wrap items-center gap-2 animate-fadeIn">
              {isHighlights ? (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-white/20 shadow-sm"
                  style={{ backgroundColor: `${activeCharColor}20`, borderColor: `${activeCharColor}40`, color: activeCharColor }}
                  title="上一輪同一角色的對應名次分數">
                  <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">📊 上輪 T{selectedHighlightRank}:</span>
                  <span className="text-xs sm:text-sm font-mono font-black">{valueFormatter(prevRoundScores[`top${selectedHighlightRank}` as keyof typeof prevRoundScores] || 0)}</span>
                </div>
              ) : (
                <>
                  {[{ key: 'top1', label: '📊 上輪 T1' }, { key: 'top10', label: 'T10' }, { key: 'top100', label: 'T100' }].map(({ key, label }) => (
                    <div key={key} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-white/20 shadow-sm"
                      style={{ backgroundColor: `${activeCharColor}20`, borderColor: `${activeCharColor}40`, color: activeCharColor }}>
                      <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">{label}:</span>
                      <span className="text-xs sm:text-sm font-mono font-black">{valueFormatter(prevRoundScores[key as keyof typeof prevRoundScores] || 0)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Highlights Rank Selector ── */}
        {isHighlights && isLiveCondition && showScoreStats && (
          <div className="flex flex-wrap gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 self-start lg:self-auto">
            {[100, 200, 300, 400, 500, 1000].map(r => (
              <button key={r} onClick={() => setSelectedHighlightRank(r)}
                className={`px-2 py-1 text-xs font-bold rounded transition-colors ${selectedHighlightRank === r ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                T{r}
              </button>
            ))}
          </div>
        )}

        {/* ── Top100 Rank Selector ── */}
        {!isHighlights && isLiveCondition && showScoreStats && (
          <div className="flex flex-wrap gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 self-start lg:self-auto">
            {LIVE_RANK_OPTIONS.map(r => (
              <button key={r} onClick={() => setSelectedLiveRank(r)}
                className={`px-2 py-1 text-xs font-bold rounded transition-colors ${selectedLiveRank === r ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                T{r}
              </button>
            ))}
          </div>
        )}
      </div>

      {chartData.length > 0 ? (
        <LineChart
          data={chartData}
          variant={chartVariant}
          lineColor={color}
          valueFormatter={valueFormatter}
          yAxisFormatter={yAxisFormatter}
          xAxisLabel="Rank"
          yAxisLabel={yLabel}
          safeThreshold={safeThreshold}
          safeRankCutoff={safeRankCutoff}
          giveUpThreshold={giveUpThreshold}
          giveUpRankCutoff={giveUpRankCutoff}
          cardsMap={cards || undefined}
          historicalLine={
            prevRoundScores && activeCharColor
              ? {
                  score: isHighlights ? (prevRoundScores[`top${selectedHighlightRank}` as keyof typeof prevRoundScores] || 0) : (prevRoundScores.top100 || 0),
                  color: activeCharColor,
                  label: `T${isHighlights ? selectedHighlightRank : 100}`
                }
              : undefined
          }
        />
      ) : (
        <div className="text-center py-10"><p className="text-slate-400">暫無資料顯示</p></div>
      )}
    </div>
  );
};

export default ChartAnalysis;