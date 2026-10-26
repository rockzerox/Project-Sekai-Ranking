import React, { useState, useEffect, useMemo } from 'react';
import { useConfig } from '../../contexts/ConfigContext';
import { useEventList } from '../../hooks/useEventList';
import { useCardData, getCharacterIdByCardId } from '../../services/cardService';
import { fetchJsonWithBigInt } from '../../hooks/useRankings';
import { API_BASE_URL, CHARACTERS, UNITS, FINALE_EVENT_ID } from '../../config/constants';
import { getAssetUrl } from '../../utils/gameUtils';
import { UI_TEXT } from '../../config/uiText';

interface FinalePlayerRecord {
  rank: number;
  name: string;
  score: number;
  char: number;
  wl: { char: number; r1: number | null; r2: number | null }[];
  banner: [number, number][] | null;
  star4: [number, number][];
}

const UNIT_ORDER = ['1', '2', '3', '4', '5', '0'];

const unitOf = (c: number): string => (c > 20 ? '0' : String(Math.floor((c - 1) / 4) + 1));
const membersOf = (u: string): number[] => {
  if (u === '1') return [1, 2, 3, 4];
  if (u === '2') return [5, 6, 7, 8];
  if (u === '3') return [9, 10, 11, 12];
  if (u === '4') return [13, 14, 15, 16];
  if (u === '5') return [17, 18, 19, 20];
  return [21, 22, 23, 24, 25, 26];
};

export const FinaleStatisticsView: React.FC = () => {
  const { isWorldLink, getWlIdsByRound, getWlDetail } = useConfig();
  const { events, isLoading: isEventsLoading } = useEventList();
  const { cards, isLoading: isCardsLoading } = useCardData();

  const [apiData, setApiData] = useState<{
    finale: { userId: string; name: string; rank: number; score: number; userCard: unknown }[];
    history: { userId: string; eventId: number; chapterCharId: number; rank: number }[];
  } | null>(null);
  const [isApiLoading, setIsApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [mode, setMode] = useState<'avatar' | 'bar'>('avatar');
  const [selectedChar, setSelectedChar] = useState<number>(20);
  const [expandedRank, setExpandedRank] = useState<number | null>(null);

  // Fetch finale multi-player rankings
  useEffect(() => {
    let isMounted = true;
    setIsApiLoading(true);
    setApiError(null);

    fetchJsonWithBigInt(`${API_BASE_URL}/user/finale/rankings?anchorEvent=${FINALE_EVENT_ID}`)
      .then((res: any) => {
        if (!isMounted) return;
        const payload = res?.data || res;
        // Item 7: Check that finale has records; empty finale triggers error
        if (payload?.finale && Array.isArray(payload.finale) && payload.finale.length > 0) {
          setApiData(payload);
        } else {
          setApiError('無法取得終章排名數據。');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to fetch finale rankings:', err);
        setApiError('載入數據失敗，請稍後再試。');
      })
      .finally(() => {
        if (isMounted) setIsApiLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Item 1: Compute WL event IDs for Round 1 & Round 2 (exclude FINALE_EVENT_ID)
  const { wl1Events, wl2Events, wlEventsByUnit } = useMemo(() => {
    const r1 = getWlIdsByRound(1).filter((id) => id !== FINALE_EVENT_ID);
    const r2 = getWlIdsByRound(2).filter((id) => id !== FINALE_EVENT_ID);
    const byUnit: Record<string, [number, number]> = {
      '1': [137, 171],
      '2': [130, 176],
      '3': [118, 163],
      '4': [124, 167],
      '5': [112, 170],
      '0': [140, 179],
    };

    const mapRound = (roundIds: number[], roundIndex: 0 | 1) => {
      roundIds.forEach((id) => {
        const detail = getWlDetail(id);
        if (detail?.chapters && detail.chapters.length > 0) {
          const char0 = detail.chapters[0].character;
          if (char0 > 0) {
            const u = unitOf(char0);
            if (byUnit[u]) byUnit[u][roundIndex] = id;
          }
        }
      });
    };

    if (r1.length > 0) mapRound(r1, 0);
    if (r2.length > 0) mapRound(r2, 1);

    const sortedWl1 = r1.length > 0 ? [...r1].sort((a, b) => a - b) : [112, 118, 124, 130, 137, 140];
    const sortedWl2 = r2.length > 0 ? [...r2].sort((a, b) => a - b) : [163, 167, 170, 171, 176, 179];

    return {
      wl1Events: sortedWl1,
      wl2Events: sortedWl2,
      wlEventsByUnit: byUnit,
    };
  }, [getWlIdsByRound, getWlDetail]);

  // General normal events < 180, excluding WL chapters and test events
  const { normalEvents, normalEventsMap, bannerTotalByChar, star4TotalByChar } = useMemo(() => {
    const allWl = new Set([...wl1Events, ...wl2Events]);
    const now = Date.now();

    const normals = events.filter((e) => {
      if (e.id >= FINALE_EVENT_ID) return false;
      if (allWl.has(e.id) || isWorldLink(e.id)) return false;
      if (new Date(e.closed_at).getTime() > now) return false;
      return true;
    });

    const map = new Map<number, typeof events[0]>();
    normals.forEach((e) => map.set(e.id, e));

    const bTotal: Record<number, number> = {};
    const s4Total: Record<number, number> = {};

    for (let c = 1; c <= 26; c++) {
      if (c <= 20) {
        bTotal[c] = normals.filter((e) => Number(e.banner) === c).length;
      } else {
        bTotal[c] = 0; // Virtual singer banner N/A
      }
      s4Total[c] = normals.filter(
        (e) => e.four_star_cards && e.four_star_cards.some((card) => Number(String(card).split('-')[0]) === c)
      ).length;
    }

    return {
      normalEvents: normals,
      normalEventsMap: map,
      bannerTotalByChar: bTotal,
      star4TotalByChar: s4Total,
    };
  }, [events, wl1Events, wl2Events, isWorldLink]);

  // Aggregate players and character distributions
  const { playersByChar, charCounts, maxCount, uniqueCount, extinctCount, gotCharsCount } = useMemo(() => {
    if (!apiData || !cards) {
      return {
        playersByChar: {} as Record<number, FinalePlayerRecord[]>,
        charCounts: {} as Record<number, number>,
        maxCount: 0,
        uniqueCount: 0,
        extinctCount: 0,
        gotCharsCount: 0,
      };
    }

    const histByUserId = new Map<string, typeof apiData.history>();
    apiData.history.forEach((h) => {
      const arr = histByUserId.get(h.userId) || [];
      arr.push(h);
      histByUserId.set(h.userId, arr);
    });

    const playerList: FinalePlayerRecord[] = apiData.finale.map((p) => {
      const cardId = Array.isArray(p.userCard) && p.userCard.length > 0 ? Number(p.userCard[0]) : null;
      const char = (cardId ? getCharacterIdByCardId(cards, cardId) : null) || 0;
      const u = unitOf(char);
      const [w1, w2] = wlEventsByUnit[u] || [0, 0];

      const pHist = histByUserId.get(p.userId) || [];
      const genHist = pHist.filter((h) => h.chapterCharId === -1);

      // WL chapter records for unit members
      const allMembers = membersOf(u);
      const orderedMembers = [char, ...allMembers.filter((m) => m !== char)];

      const wl = orderedMembers.map((m) => {
        const r1Entry = pHist.find((h) => h.eventId === w1 && h.chapterCharId === m);
        const r2Entry = pHist.find((h) => h.eventId === w2 && h.chapterCharId === m);
        return {
          char: m,
          r1: r1Entry ? r1Entry.rank : null,
          r2: r2Entry ? r2Entry.rank : null,
        };
      });

      // Banner records
      let banner: [number, number][] | null = null;
      if (char <= 20) {
        banner = genHist
          .filter((h) => normalEventsMap.has(h.eventId) && Number(normalEventsMap.get(h.eventId)?.banner) === char)
          .sort((a, b) => a.eventId - b.eventId)
          .map((h) => [h.eventId, h.rank]);
      }

      // 4-star records
      const star4: [number, number][] = genHist
        .filter(
          (h) =>
            normalEventsMap.has(h.eventId) &&
            normalEventsMap.get(h.eventId)?.four_star_cards?.some((c) => Number(String(c).split('-')[0]) === char)
        )
        .sort((a, b) => a.eventId - b.eventId)
        .map((h) => [h.eventId, h.rank]);

      return {
        rank: p.rank,
        name: p.name || '—',
        score: p.score,
        char,
        wl,
        banner,
        star4,
      };
    });

    const byChar: Record<number, FinalePlayerRecord[]> = {};
    for (let c = 1; c <= 26; c++) byChar[c] = [];
    playerList.forEach((p) => {
      if (byChar[p.char]) byChar[p.char].push(p);
    });

    const counts: Record<number, number> = {};
    let max = 0;
    let got = 0;
    let unique = 0;
    let extinct = 0;

    for (let c = 1; c <= 26; c++) {
      const len = byChar[c].length;
      counts[c] = len;
      if (len > max) max = len;
      if (len > 0) got++;
      if (len === 1) unique++;
      if (len === 0) extinct++;
    }

    return {
      playersByChar: byChar,
      charCounts: counts,
      maxCount: max,
      uniqueCount: unique,
      extinctCount: extinct,
      gotCharsCount: got,
    };
  }, [apiData, cards, wlEventsByUnit, normalEventsMap]);

  // Set initial selected character once when data loads
  const [hasInitializedChar, setHasInitializedChar] = useState(false);
  useEffect(() => {
    if (!hasInitializedChar && Object.keys(charCounts).length > 0) {
      const sorted = Object.keys(charCounts)
        .map(Number)
        .sort((a, b) => (charCounts[b] || 0) - (charCounts[a] || 0) || a - b);
      if (sorted.length > 0) {
        setSelectedChar(sorted[0]);
        setHasInitializedChar(true);
      }
    }
  }, [charCounts, hasInitializedChar]);

  const tagOf = (c: number): 'solo' | 'extinct' | null => {
    const cnt = charCounts[c] ?? 0;
    if (cnt === 0) return 'extinct';
    if (cnt === 1) return 'solo';
    return null;
  };

  const renderBadge = (tag: 'solo' | 'extinct' | null, small = false) => {
    if (!tag) return null;
    const sizeCls = small ? 'text-[9px] px-1 py-px' : 'text-[10px] px-1.5 py-0.5';
    if (tag === 'solo') {
      return (
        <span className={`whitespace-nowrap font-black rounded bg-amber-400 text-amber-950 ${sizeCls}`}>
          獨佔
        </span>
      );
    }
    return (
      <span className={`whitespace-nowrap font-black rounded bg-slate-500 text-white ${sizeCls}`}>
        絕版
      </span>
    );
  };

  const renderRankCell = (r: number | null) => {
    if (r == null) {
      return <span className="text-xs text-slate-400 dark:text-slate-500">未進 T100</span>;
    }
    const isTop10 = r <= 10;
    return (
      <span className={`font-black ${isTop10 ? 'text-amber-500' : 'text-slate-800 dark:text-slate-100'}`}>
        第 <span className="font-mono">{r}</span> 名
      </span>
    );
  };

  const renderRatioBlock = (title: string, list: [number, number][] | null, total: number, na: boolean) => {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-2.5">
        <div className="text-[11px] font-black text-slate-500 dark:text-slate-400">{title}</div>
        {na ? (
          <div className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">不適用</div>
        ) : (
          <>
            <div className="mt-0.5">
              <span className="text-xl font-black">{list?.length || 0}</span>
              <span className="text-xs font-bold text-slate-400"> / {total}</span>
            </div>
            {list && list.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {list.map(([e, r]) => (
                  <span
                    key={e}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    第{e}期 ·{' '}
                    <b className={r <= 10 ? 'text-amber-600 dark:text-amber-400' : ''}>第{r}名</b>
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderPlayerDetail = (p: FinalePlayerRecord) => {
    const u = unitOf(p.char);
    const [w1, w2] = wlEventsByUnit[u] || [0, 0];

    return (
      <div className="px-3 pb-3 pt-1 grid grid-cols-1 xl:grid-cols-5 gap-3">
        <div className="xl:col-span-3 rounded-xl border border-slate-200 dark:border-slate-700 p-2.5">
          <div className="text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1">WL 章節 T100 名次</div>
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-slate-400 font-bold border-b border-slate-100 dark:border-slate-700/60">
                <th className="text-left pl-2 py-1">角色</th>
                <th className="py-1 text-center">WL1 · 第{w1}期</th>
                <th className="py-1 text-center">WL2 · 第{w2}期</th>
              </tr>
            </thead>
            <tbody>
              {p.wl.map((w) => {
                const charInfo = CHARACTERS[String(w.char)];
                const isOwn = w.char === p.char;
                const chibiUrl = getAssetUrl(String(w.char), 'character');
                return (
                  <tr key={w.char} className={isOwn ? 'bg-slate-100 dark:bg-slate-900/60 rounded' : ''}>
                    <td className="py-1 pl-2 pr-3">
                      <div className="flex items-center gap-1.5">
                        {chibiUrl && <img src={chibiUrl} alt={charInfo?.name} className="w-4 h-4 rounded-full object-cover" />}
                        <span className="text-xs font-bold" style={{ color: charInfo?.color }}>
                          {charInfo?.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-1 px-3 text-center">{renderRankCell(w.r1)}</td>
                    <td className="py-1 px-3 text-center">{renderRankCell(w.r2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="xl:col-span-2 grid grid-cols-2 xl:grid-cols-1 gap-2.5 content-start">
          {renderRatioBlock('Banner 活動 T100', p.banner, bannerTotalByChar[p.char] || 0, p.banner === null)}
          {renderRatioBlock('四星角色活動 T100', p.star4, star4TotalByChar[p.char] || 0, false)}
        </div>
      </div>
    );
  };

  // Scope strings computed dynamically
  const scopeInfo = useMemo(() => {
    const normalMin = normalEvents.length > 0 ? Math.min(...normalEvents.map((e) => e.id)) : 1;
    const normalMax = normalEvents.length > 0 ? Math.max(...normalEvents.map((e) => e.id)) : 178;
    const normalCount = normalEvents.length;

    const span = (arr: number[]) => (arr.length > 0 ? `第${arr[0]}–${arr[arr.length - 1]}期` : '');

    const line = `終章：第${FINALE_EVENT_ID}期 TOP 100 · WL 章節：WL1 ${span(wl1Events)}、WL2 ${span(wl2Events)} · Banner／四星角色活動：第${normalMin}–${normalMax}期一般活動`;

    const items = [
      `終章：第${FINALE_EVENT_ID}期「Wishes in Bloom!」最終排名 TOP 100。`,
      `WL 章節：WL1 共 ${wl1Events.length} 期（${wl1Events.map((e) => '第' + e + '期').join('、')}）、WL2 共 ${wl2Events.length} 期（${wl2Events.map((e) => '第' + e + '期').join('、')}），各角色章節排名 TOP 100。`,
      `Banner／四星角色活動：第${normalMin}–${normalMax}期之一般活動共 ${normalCount} 期，不含 WL 章節活動；排名為活動總榜 TOP 100。`,
      `虛擬歌手不計 Banner 活動。`,
      `各榜僅收錄 TOP 100，「未進 T100」不代表未參與該期活動。`,
    ];

    return { line, items };
  }, [normalEvents, wl1Events, wl2Events]);

  const isLoading = isApiLoading || isEventsLoading || isCardsLoading;

  // Item 2: Loading container matches other observatory pages (w-full py-4 animate-fadeIn)
  if (isLoading) {
    return (
      <div className="w-full py-12 animate-fadeIn flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500 mb-4"></div>
        <div className="text-slate-500 dark:text-slate-400 font-bold">載入終章統計數據中...</div>
      </div>
    );
  }

  // Item 2: Error container matches other observatory pages
  if (apiError || !apiData) {
    return (
      <div className="w-full py-12 animate-fadeIn text-center">
        <div className="text-rose-500 font-bold text-lg mb-2">{apiError || '暫無數據'}</div>
        <p className="text-slate-500 text-sm">請確認網絡連線或稍後再試。</p>
      </div>
    );
  }

  const selectedCharInfo = CHARACTERS[String(selectedChar)];
  const selectedUnitId = unitOf(selectedChar);
  const selectedUnit = UNITS[selectedUnitId];
  const selectedTag = tagOf(selectedChar);
  const selectedPlayers = playersByChar[selectedChar] || [];

  return (
    // Item 2: Outer container changed to w-full py-4 animate-fadeIn (no max-w-7xl, no px-4/6)
    <div className="w-full py-4 animate-fadeIn">
      {/* Header */}
      <header className="mb-3">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-0.5">
          {UI_TEXT.finaleStats.title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {UI_TEXT.finaleStats.description}
        </p>
      </header>

      {/* Item 3: Main 12-col Grid (5 : 7), tailored for 1280x800 single-screen view without document scroll */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[calc(100vh-185px)] lg:min-h-[520px]">
        {/* Left Column: Character Border Distributions (5 cols) */}
        <section className="lg:col-span-5 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-3.5 flex flex-col min-h-0">
          {/* Section Header with Mode Toggle */}
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="font-black text-slate-800 dark:text-white text-sm">角色框分布</h3>
            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setMode('avatar')}
                className={`px-2.5 py-0.5 text-xs font-bold rounded-md transition ${
                  mode === 'avatar'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                頭像
              </button>
              <button
                onClick={() => setMode('bar')}
                className={`px-2.5 py-0.5 text-xs font-bold rounded-md transition ${
                  mode === 'bar'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                長條圖
              </button>
            </div>
          </div>

          {/* 3 Summary Cards */}
          <div className="grid grid-cols-3 gap-2 mb-1.5">
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900/70 px-2.5 py-1">
              <div className="text-[10px] font-bold opacity-70">取得角色</div>
              <div className="text-lg font-black leading-tight text-slate-800 dark:text-slate-100">
                {gotCharsCount}
                <span className="text-xs font-bold opacity-60"> / 26</span>
              </div>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2.5 py-1">
              <div className="text-[10px] font-bold opacity-70">獨佔框</div>
              <div className="text-lg font-black leading-tight">{uniqueCount}</div>
            </div>
            <div className="rounded-xl bg-slate-200/70 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 px-2.5 py-1">
              <div className="text-[10px] font-bold opacity-70">絕版框</div>
              <div className="text-lg font-black leading-tight">{extinctCount}</div>
            </div>
          </div>

          {/* View Container: Avatar Grid vs Bar Chart */}
          <div className="flex-1 min-h-0 overflow-y-auto scroll-thin pr-0.5">
            {mode === 'avatar' ? (
              <div className="flex flex-col justify-between h-full">
                {UNIT_ORDER.map((u) => {
                  const members = membersOf(u);
                  const rowHasTag = members.some((c) => tagOf(c) !== null);
                  const unitTotal = members.reduce((sum, c) => sum + (charCounts[c] ?? 0), 0);
                  const logoUrl = getAssetUrl(u, 'unit');

                  return (
                    <div
                      key={u}
                      className="flex items-center gap-1.5 py-0.5 border-b last:border-b-0 border-slate-100 dark:border-slate-700/60"
                    >
                      {/* Unit Logo & Total Count (matches avatar sizing, pure number) */}
                      <div className="flex flex-col items-center gap-0.5 shrink-0 p-0.5">
                        {rowHasTag && <div className="h-3.5" />}
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center p-1">
                          {logoUrl && (
                            <img
                              src={logoUrl}
                              alt={UNITS[u]?.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          )}
                        </div>
                        <span
                          className="text-base font-black leading-none"
                          style={{ color: UNITS[u]?.color }}
                        >
                          {unitTotal}
                        </span>
                      </div>

                      {/* Divider between Unit and Characters */}
                      <div className="w-px h-9 bg-slate-200 dark:bg-slate-700 shrink-0 self-center mx-1" />

                      {/* Character Cells */}
                      <div className="grid grid-cols-6 gap-1 flex-1">
                        {members.map((c) => {
                          const charInfo = CHARACTERS[String(c)];
                          const cnt = charCounts[c] ?? 0;
                          const t = tagOf(c);
                          const isSel = c === selectedChar;
                          const chibiUrl = getAssetUrl(String(c), 'character');

                          const frameCls =
                            t === 'solo'
                              ? 'border-2 border-amber-400 bg-amber-50/70 dark:bg-amber-500/10'
                              : t === 'extinct'
                              ? 'border-2 border-dashed border-slate-400 dark:border-slate-500 bg-slate-100/70 dark:bg-slate-900/50'
                              : 'border-2 border-transparent';

                          return (
                            <button
                              key={c}
                              onClick={() => {
                                setSelectedChar(c);
                                setExpandedRank(null);
                              }}
                              className={`relative rounded-xl ${frameCls} p-0.5 flex flex-col items-center gap-0.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition ${
                                isSel ? 'ring-2 ring-offset-1 dark:ring-offset-slate-800' : ''
                              }`}
                              style={isSel ? ({ '--tw-ring-color': charInfo?.color } as React.CSSProperties) : {}}
                              title={charInfo?.name}
                            >
                              {/* Tag reservation slot for vertical alignment */}
                              {rowHasTag && (
                                <div className="h-3.5 flex items-center justify-center">
                                  {renderBadge(t, true)}
                                </div>
                              )}
                              {chibiUrl && (
                                <img
                                  src={chibiUrl}
                                  alt={charInfo?.name}
                                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600 ${
                                    t === 'extinct' ? 'grayscale opacity-60' : ''
                                  }`}
                                />
                              )}
                              <span
                                className="text-base font-black leading-none"
                                style={{ color: t === 'extinct' ? '#94a3b8' : charInfo?.color }}
                              >
                                {cnt}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Bar Chart Mode: 26 characters sorted by count, strictly fills container without scroll */
              <div
                className="h-full grid gap-px"
                style={{ gridTemplateRows: 'repeat(26, minmax(0, 1fr))' }}
              >
                {Object.keys(CHARACTERS)
                  .map(Number)
                  .filter((c) => c >= 1 && c <= 26)
                  .sort((a, b) => (charCounts[b] || 0) - (charCounts[a] || 0) || a - b)
                  .map((c) => {
                    const charInfo = CHARACTERS[String(c)];
                    const cnt = charCounts[c] ?? 0;
                    const t = tagOf(c);
                    const pct = maxCount > 0 ? (cnt / maxCount) * 100 : 0;
                    const isSel = c === selectedChar;
                    const u = unitOf(c);
                    const unitColor = UNITS[u]?.color || '#94a3b8';
                    const chibiUrl = getAssetUrl(String(c), 'character');

                    return (
                      <button
                        key={c}
                        onClick={() => {
                          setSelectedChar(c);
                          setExpandedRank(null);
                        }}
                        className={`w-full min-h-0 flex items-center gap-1.5 px-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 transition ${
                          isSel ? 'bg-slate-100 dark:bg-slate-700/60' : ''
                        }`}
                      >
                        {chibiUrl && (
                          <img
                            src={chibiUrl}
                            alt=""
                            className={`w-3.5 h-3.5 rounded-full border border-slate-200 dark:border-slate-600 object-cover ${
                              t === 'extinct' ? 'grayscale opacity-60' : ''
                            }`}
                          />
                        )}
                        <span
                          className="w-[4.2rem] shrink-0 text-left text-[11px] font-bold truncate"
                          style={{ color: t === 'extinct' ? '#94a3b8' : charInfo?.color }}
                        >
                          {charInfo?.name}
                        </span>
                        <div className="flex-1 h-2.5 flex items-stretch">
                          <div className="w-[3px] shrink-0 rounded-sm" style={{ background: unitColor }} />
                          <div
                            className={`flex-1 bg-slate-100 dark:bg-slate-700/50 rounded-r ml-0.5 ${
                              t === 'extinct' ? 'border border-dashed border-slate-300 dark:border-slate-600' : ''
                            }`}
                          >
                            <div
                              className="h-full rounded-r"
                              style={{ width: `${pct}%`, background: charInfo?.color, opacity: 0.85 }}
                            />
                          </div>
                        </div>
                        <span className="w-5 text-right text-xs font-black font-mono text-slate-800 dark:text-slate-200">
                          {cnt}
                        </span>
                        <span className="w-9 text-left">{renderBadge(t, true)}</span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Player Records for Selected Character (7 cols) */}
        <section className="lg:col-span-7 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-0">
          {/* Character Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
            {getAssetUrl(String(selectedChar), 'character') && (
              <img
                src={getAssetUrl(String(selectedChar), 'character')}
                alt={selectedCharInfo?.name}
                className={`w-12 h-12 rounded-full border-2 object-cover ${
                  selectedTag === 'extinct' ? 'grayscale opacity-60' : ''
                }`}
                style={{ borderColor: selectedCharInfo?.color }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black" style={{ color: selectedCharInfo?.color }}>
                  {selectedCharInfo?.name}
                </span>
                {renderBadge(selectedTag)}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {getAssetUrl(selectedUnitId, 'unit') && (
                  <img
                    src={getAssetUrl(selectedUnitId, 'unit')}
                    alt=""
                    className="h-4 max-w-[36px] object-contain"
                  />
                )}
                <span className="text-xs font-bold" style={{ color: selectedUnit?.color }}>
                  {selectedUnit?.name}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div
                className="text-2xl font-black leading-none"
                style={{ color: selectedTag === 'extinct' ? '#94a3b8' : selectedCharInfo?.color }}
              >
                {selectedPlayers.length}
              </div>
              <div className="text-[10px] font-bold text-slate-400 mt-0.5">取得人數</div>
            </div>
          </div>

          {/* Player List / Empty State */}
          <div className="flex-1 min-h-0 overflow-y-auto scroll-thin p-3 space-y-2">
            {selectedPlayers.length === 0 ? (
              <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center">
                {getAssetUrl(String(selectedChar), 'character') && (
                  <img
                    src={getAssetUrl(String(selectedChar), 'character')}
                    alt=""
                    className="w-16 h-16 rounded-full grayscale opacity-40 mb-2.5 object-cover"
                  />
                )}
                <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  本屆無玩家取得此角色框
                </div>
              </div>
            ) : (
              selectedPlayers.map((p) => {
                const isOpen = expandedRank === p.rank;
                const isTop10 = p.rank <= 10;

                return (
                  <div
                    key={p.rank}
                    className={`rounded-xl border transition-colors ${
                      isOpen
                        ? 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        : 'border-slate-200 dark:border-slate-700/70 bg-slate-50/60 dark:bg-slate-900/30'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedRank(isOpen ? null : p.rank)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left select-none"
                    >
                      <span
                        className={`w-16 shrink-0 text-center text-xs font-black rounded-md py-0.5 ${
                          isTop10
                            ? 'bg-amber-400 text-amber-950'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        第 {p.rank} 名
                      </span>
                      <span className="flex-1 min-w-0 truncate font-bold text-slate-800 dark:text-slate-100">
                        {p.name}
                      </span>
                      <span className="font-mono text-sm font-bold text-cyan-600 dark:text-cyan-400">
                        {p.score.toLocaleString('en-US')}
                      </span>
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOpen && renderPlayerDetail(p)}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Footer: Statistics Scope Disclosure */}
      <details className="group mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
        <summary className="list-none cursor-pointer flex items-center gap-2 select-none">
          <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-bold text-slate-600 dark:text-slate-300 shrink-0">統計範圍</span>
          <span className="truncate">{scopeInfo.line}</span>
          <svg
            className="w-3 h-3 shrink-0 transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <ul className="mt-2 ml-5 space-y-0.5 list-disc">
          {scopeInfo.items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </details>
    </div>
  );
};

export default FinaleStatisticsView;
