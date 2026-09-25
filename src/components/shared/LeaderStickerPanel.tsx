import React, { useMemo, useState, useEffect } from 'react';
import { RankEntry, CardsMap } from '../../types';
import { CHARACTERS } from '../../config/constants';
import { getAssetUrl } from '../../utils/gameUtils';
import { useMobile } from '../../hooks/useMobile';

interface LeaderStickerPanelProps {
  rankings: RankEntry[];
  cardsMap?: CardsMap;
  eventName?: string;
}

export interface HoveredPlayerInfo {
  rank: number;
  playerName: string;
}

export interface StickerCellData {
  rank: number;
  playerName: string;
  charId: string;
  color: string;
  name: string;
  isUnknown?: boolean;
}

export interface LeaderStatItem {
  charId: string;
  name: string;
  color: string;
  count: number;
  percentage: number;
}

const LeaderStickerPanel: React.FC<LeaderStickerPanelProps> = ({ rankings, cardsMap, eventName }) => {
  const [hoveredCharId, setHoveredCharId] = useState<string | null>(null);
  const [hoveredPlayer, setHoveredPlayer] = useState<HoveredPlayerInfo | null>(null);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const isMobile = useMobile(1024);

  // 1. 取得 Top 100 資料並進行隊長統計（綁定真實玩家）
  const { top5Stats, activeCharStats, flatList, totalPlayers } = useMemo(() => {
    // 篩選真正的 Top 100 玩家
    const top100 = rankings.filter(r => r.rank >= 1 && r.rank <= 100);
    const total = top100.length;

    const playerGroups: Record<string, RankEntry[]> = {};
    const unknownEntries: RankEntry[] = [];

    top100.forEach(entry => {
      const cardId = entry.last_player_info?.card?.id;
      const card = (cardId && cardsMap) ? cardsMap[cardId.toString()] : null;
      if (card?.characterId) {
        const charId = String(card.characterId);
        if (!playerGroups[charId]) playerGroups[charId] = [];
        playerGroups[charId].push(entry);
      } else {
        unknownEntries.push(entry);
      }
    });

    // 1. 已知角色清單（降序），專供手機燈光秀輪播使用
    const activeStats: LeaderStatItem[] = Object.entries(playerGroups).map(([charId, entries]) => {
      const charInfo = CHARACTERS[charId];
      return {
        charId,
        name: charInfo ? charInfo.name : `未知 (${charId})`,
        color: charInfo ? charInfo.color : '#64748b',
        count: entries.length,
        percentage: total > 0 ? (entries.length / total) * 100 : 0,
      };
    }).sort((a, b) => b.count - a.count);

    // 2. 未知角色項目（若有）
    const unknownItem: LeaderStatItem | null = unknownEntries.length > 0 ? {
      charId: 'unknown',
      name: '未知/未載入',
      color: '#475569',
      count: unknownEntries.length,
      percentage: total > 0 ? (unknownEntries.length / total) * 100 : 0,
    } : null;

    // 3. 完整統計清單與桌機 Top 5（維持現行切片行為：未知角色若進前 5 則自然切入）
    const allStats = unknownItem ? [...activeStats, unknownItem] : activeStats;
    const top5 = allStats.slice(0, 5);

    // 4. 展開為長度 100 的格子陣列（同角色內部依真實名次 rank 升序排列）
    const flat: (StickerCellData | null)[] = [];

    // 先填已知角色
    activeStats.forEach(stat => {
      const entries = playerGroups[stat.charId] || [];
      // 同角色內部，依玩家真實名次 rank 升序排列（由小到大）
      entries.sort((a, b) => a.rank - b.rank);
      entries.forEach(entry => {
        flat.push({
          rank: entry.rank,
          playerName: entry.user.display_name || entry.user.username || `Player ${entry.rank}`,
          charId: stat.charId,
          color: stat.color,
          name: stat.name,
          isUnknown: false,
        });
      });
    });

    // 再填未知角色（依名次升序）
    if (unknownEntries.length > 0) {
      unknownEntries.sort((a, b) => a.rank - b.rank);
      unknownEntries.forEach(entry => {
        flat.push({
          rank: entry.rank,
          playerName: entry.user.display_name || entry.user.username || `Player ${entry.rank}`,
          charId: 'unknown',
          color: '#475569',
          name: '未知',
          isUnknown: true,
        });
      });
    }

    // 不足 100 筆 (例如榜單未滿)，用 null 填滿
    while (flat.length < 100) {
      flat.push(null);
    }

    return {
      top5Stats: top5,
      activeCharStats: activeStats,
      flatList: flat,
      totalPlayers: total,
    };
  }, [rankings, cardsMap]);

  // 章節切換或角色清單變更時重設拍數歸零
  useEffect(() => {
    setCurrentBeat(0);
  }, [activeCharStats]);

  // 全亮拍判定
  const isFullLightBeat = currentBeat >= activeCharStats.length;
  const currentActiveChar = (!isFullLightBeat && activeCharStats[currentBeat]) ? activeCharStats[currentBeat] : null;

  // 燈光秀定時器（僅在手機模式下執行）
  useEffect(() => {
    if (!isMobile || isPaused || activeCharStats.length === 0) return;
    const isFullLight = currentBeat >= activeCharStats.length;
    const duration = isFullLight ? 2000 : 1000;

    const timer = setTimeout(() => {
      setCurrentBeat(prev => (prev >= activeCharStats.length ? 0 : prev + 1));
    }, duration);

    return () => clearTimeout(timer);
  }, [isMobile, currentBeat, isPaused, activeCharStats.length]);

  // 手機點擊暫停／繼續切換
  const handleContainerClick = () => {
    if (isMobile) {
      setIsPaused(prev => !prev);
    }
  };

  // 手機右側 5 格分頁與鏡像佔位資料切片
  const currentPageIndex = isFullLightBeat ? 0 : Math.floor(currentBeat / 5);
  const pageItems = useMemo(() => {
    const start = currentPageIndex * 5;
    const items: (LeaderStatItem | null)[] = activeCharStats.slice(start, start + 5);
    while (items.length < 5) {
      items.push(null);
    }
    return items;
  }, [activeCharStats, currentPageIndex]);

  if (totalPlayers === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        無排行數據以進行統計。
      </div>
    );
  }

  // 2. 邊框判斷函式 (行 r: 0-4, 列 c: 0-19)
  const getBorders = (r: number, c: number, charId: string | null) => {
    if (!charId) return '';
    const current = charId;
    let borderClasses = '';

    // 上鄰居
    const up = r > 0 ? flatList[c * 5 + (r - 1)]?.charId : null;
    if (up !== current) borderClasses += ' border-t-[3px]';

    // 下鄰居
    const down = r < 4 ? flatList[c * 5 + (r + 1)]?.charId : null;
    if (down !== current) borderClasses += ' border-b-[3px]';

    // 左鄰居
    const left = c > 0 ? flatList[(c - 1) * 5 + r]?.charId : null;
    if (left !== current) borderClasses += ' border-l-[3px]';

    // 右鄰居
    const right = c < 19 ? flatList[(c + 1) * 5 + r]?.charId : null;
    if (right !== current) borderClasses += ' border-r-[3px]';

    return borderClasses;
  };

  // 基於格子索引生成擬隨機角度 (避免重新渲染時跳動)
  const getRotationAngle = (k: number) => {
    const angles = [-1.5, 1, -0.5, 1.5, -1, 0.5, -2, 2, 0];
    return angles[k % angles.length];
  };

  return (
    <div 
      className="flex flex-col p-2 lg:p-4 bg-slate-900/40 dark:bg-slate-950/20 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner"
      onClick={handleContainerClick}
    >
      {/* 📱 1. 手機端橫跨整寬頂部資訊列 (block lg:hidden) */}
      <div className="block lg:hidden w-full mb-2 px-1 text-center font-bold text-xs truncate h-5 leading-5 select-none">
        {isFullLightBeat ? (
          <span className="text-slate-300">{eventName || '前百人氣隊長分佈'}</span>
        ) : currentActiveChar ? (
          <span style={{ color: currentActiveChar.color }}>
            {currentActiveChar.name}　{currentActiveChar.count} 人
          </span>
        ) : null}
      </div>

      {/* 2. 主內容橫向排列 (MainRow) */}
      <div className="flex flex-row gap-3 lg:gap-6 items-center justify-between">
        
        {/* 左側欄：桌機橫列 + 貼紙牆 / 手機 10x10 燈海 (保留 select-none) */}
        <div className="flex-1 flex flex-col justify-center max-w-[220px] lg:max-w-none select-none">
          
          {/* 💻 桌機專屬資訊橫列 (28~32px，與貼紙牆等寬對齊) */}
          <div className="hidden lg:flex items-center h-8 mb-1.5 px-3 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs font-medium text-slate-300">
            {hoveredPlayer ? (
              <span className="font-bold text-white tracking-wide">
                Rank {hoveredPlayer.rank}&nbsp;&nbsp;&nbsp;&nbsp;{hoveredPlayer.playerName}
              </span>
            ) : (
              <span className="text-slate-400 truncate">{eventName || '前百人氣隊長分佈'}</span>
            )}
          </div>

          {/* 💻 桌機 5×20 貼紙牆 (移除原生 title，支援雙 hover 狀態) */}
          <div className="hidden lg:grid w-full aspect-[4/1] grid-rows-5 grid-flow-col gap-[2px] bg-slate-950/80 p-3 rounded-xl border border-slate-800 relative shadow-2xl overflow-hidden items-center justify-items-stretch">
            {flatList.map((cell, k) => {
              const c = Math.floor(k / 5);
              const r = k % 5;
              const charId = cell?.charId || null;
              const charColor = cell?.color || '#475569';
              const charName = cell?.name || (charId === 'unknown' ? '未知' : '無');
              const avatar = charId && charId !== 'unknown' ? getAssetUrl(charId, 'character') : undefined;

              const borderStyle = getBorders(r, c, charId);
              const isHovered = hoveredCharId !== null && hoveredCharId === charId;
              const isAnyHovered = hoveredCharId !== null;
              const rotateDeg = getRotationAngle(k);

              return (
                <div
                  key={k}
                  className="relative w-full h-full flex items-center justify-center transition-all duration-300"
                  style={{
                    borderColor: charId ? charColor : 'transparent',
                    borderStyle: 'solid',
                    ...((borderStyle.includes('border-t') ? { borderTopWidth: '3px' } : { borderTopWidth: '0px' })),
                    ...((borderStyle.includes('border-b') ? { borderBottomWidth: '3px' } : { borderBottomWidth: '0px' })),
                    ...((borderStyle.includes('border-l') ? { borderLeftWidth: '3px' } : { borderLeftWidth: '0px' })),
                    ...((borderStyle.includes('border-r') ? { borderRightWidth: '3px' } : { borderRightWidth: '0px' })),
                    backgroundColor: charId ? `${charColor}10` : 'transparent',
                    filter: isHovered 
                      ? `drop-shadow(0 0 5px ${charColor}80)` 
                      : 'none',
                    opacity: isAnyHovered && !isHovered ? 0.35 : 1
                  }}
                  onMouseEnter={() => {
                    if (cell && !cell.isUnknown) setHoveredCharId(cell.charId);
                    if (cell && cell.rank) setHoveredPlayer({ rank: cell.rank, playerName: cell.playerName });
                  }}
                  onMouseLeave={() => {
                    setHoveredCharId(null);
                    setHoveredPlayer(null);
                  }}
                >
                  {/* 貼紙頭像 (使用百分比大小以適配 aspect 寬高) */}
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={charName}
                      className="w-[82%] h-[82%] rounded-full object-cover border-2 border-white/80 shadow-md transition-transform duration-200 hover:scale-110"
                      style={{
                        transform: `rotate(${rotateDeg}deg)`
                      }}
                    />
                  ) : charId ? (
                    <div 
                      className="w-[82%] h-[82%] rounded-full bg-slate-800 border-2 border-white/80 shadow-md flex items-center justify-center text-[8px] text-white"
                      style={{ transform: `rotate(${rotateDeg}deg)` }}
                    >
                      ?
                    </div>
                  ) : (
                    <div className="w-[82%] h-[82%] rounded-full border border-dashed border-slate-850" />
                  )}
                </div>
              );
            })}
          </div>

          {/* 📱 手機 10×10 螢光棒燈海 (純展示，無任何 touch/mouse 事件) */}
          <div className="grid lg:hidden w-full aspect-square grid-rows-10 grid-flow-col gap-1.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 relative shadow-2xl items-center justify-items-stretch">
            {flatList.map((cell, k) => {
              const charId = cell?.charId || null;
              const charColor = cell?.color || '#475569';
              const isHighlighted = isFullLightBeat || (currentActiveChar && charId === currentActiveChar.charId);

              return (
                <div
                  key={k}
                  className="w-full h-full flex items-center justify-center transition-all duration-300"
                >
                  {charId ? (
                    <div
                      className="w-[50%] h-[50%] rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: charColor,
                        boxShadow: isHighlighted ? `0 0 5px ${charColor}` : 'none',
                        transform: isHighlighted ? 'scale(1.2)' : 'scale(1)',
                        filter: isHighlighted ? 'brightness(1.15)' : 'none',
                        opacity: isHighlighted ? 1 : 0.15
                      }}
                    />
                  ) : (
                    <div className="w-[35%] h-[35%] rounded-full bg-slate-900 border border-dashed border-slate-800" />
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* 右側欄：桌機固定 Top 5 / 手機 5 格輪播 (不加 select-none，文字可選取) */}
        <div className="w-20 lg:w-64 flex flex-col justify-between min-h-[96px] lg:min-h-[200px] flex-shrink-0">
          
          {/* 💻 桌機固定 Top 5 (保留標題與 onMouseEnter/Leave 連動高亮，使用 flex-1 填滿) */}
          <div className="hidden lg:flex flex-col justify-between gap-2 flex-1">
            {/* 標題只在桌面端顯示 */}
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              Top 5 人氣隊長使用率
            </div>
            <div className="flex-1 flex flex-col justify-between gap-2">
              {top5Stats.map((item, idx) => {
                const avatar = item.charId !== 'unknown' ? getAssetUrl(item.charId, 'character') : undefined;
                const isHovered = hoveredCharId !== null && hoveredCharId === item.charId;
                const isAnyHovered = hoveredCharId !== null;
                
                const medals = ['🥇', '🥈', '🥉'];
                const badge = medals[idx] || `${idx + 1}.`;

                return (
                  <div
                    key={item.charId}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 ${
                      isHovered 
                        ? 'bg-slate-800 border-slate-700 shadow-md scale-[1.02]' 
                        : 'bg-slate-900/20 border-slate-800/80'
                    }`}
                    style={{
                      opacity: isAnyHovered && !isHovered ? 0.4 : 1,
                      boxShadow: isHovered ? `0 0 10px ${item.color}20` : 'none'
                    }}
                    onMouseEnter={() => setHoveredCharId(item.charId)}
                    onMouseLeave={() => setHoveredCharId(null)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black w-5 text-center">{badge}</span>
                      <div className="relative flex-shrink-0">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={item.name}
                            className="w-9 h-9 rounded-full object-cover border border-white/30 bg-slate-800 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold border border-white/30 flex-shrink-0">
                            ?
                          </div>
                        )}
                      </div>
                      <span 
                        className="text-sm font-bold truncate"
                        style={{ color: item.color }}
                      >
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0 pl-1">
                      <span className="text-xs font-mono font-bold text-slate-200 block leading-tight">
                        {item.count} 人
                      </span>
                      <span className="block text-[10px] font-mono text-slate-400 leading-tight">
                        {item.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 📱 手機 5 格輪播 (純展示，無 mouse/touch 事件，使用 flex-1 填滿，結構鏡像零誤差佔位) */}
          <div className="flex lg:hidden flex-col justify-between gap-1 flex-1 min-h-[96px] select-none">
            {pageItems.map((item, slotIndex) => {
              if (!item) {
                // 像素級鏡像佔位格：完全相同的 DOM 盒子模型，確保高度與真實條目 100% 絕對相等，永不抽動
                return (
                  <div
                    key={`empty-${slotIndex}`}
                    className="flex items-center justify-between p-1 rounded-lg border border-transparent invisible select-none"
                    aria-hidden="true"
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-black w-4 text-center">0.</span>
                      <div className="w-8 h-8 rounded-full" />
                    </div>
                    <div className="text-right pl-1">
                      <span className="text-[10px] font-mono font-bold leading-tight">0</span>
                    </div>
                  </div>
                );
              }

              const entryRankIndex = currentPageIndex * 5 + slotIndex;
              const isItemHighlighted = isFullLightBeat || entryRankIndex === currentBeat;
              const avatar = item.charId !== 'unknown' ? getAssetUrl(item.charId, 'character') : undefined;

              return (
                <div
                  key={item.charId}
                  className={`flex items-center justify-between p-1 rounded-lg border transition-all duration-300 ${
                    isItemHighlighted
                      ? 'bg-slate-800 border-slate-700 shadow-md scale-[1.02]'
                      : 'bg-slate-900/20 border-slate-800/65 opacity-40'
                  }`}
                  style={{
                    boxShadow: isItemHighlighted ? `0 0 10px ${item.color}20` : 'none'
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black w-4 text-center">{entryRankIndex + 1}.</span>
                    <div className="relative flex-shrink-0">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={item.name}
                          className="w-8 h-8 rounded-full object-cover border border-white/30 bg-slate-800 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold border border-white/30 flex-shrink-0">
                          ?
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 pl-1">
                    <span className="text-[10px] font-mono font-bold text-slate-200 block leading-tight">
                      {item.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
};

export default LeaderStickerPanel;
