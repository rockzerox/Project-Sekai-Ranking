import React, { useMemo, useState } from 'react';
import { RankEntry, CardsMap } from '../../types';
import { CHARACTERS } from '../../config/constants';
import { getAssetUrl } from '../../utils/gameUtils';

interface LeaderStickerPanelProps {
  rankings: RankEntry[];
  cardsMap?: CardsMap;
}

interface LeaderStatItem {
  charId: string;
  name: string;
  color: string;
  count: number;
  percentage: number;
}

const LeaderStickerPanel: React.FC<LeaderStickerPanelProps> = ({ rankings, cardsMap }) => {
  const [hoveredCharId, setHoveredCharId] = useState<string | null>(null);

  // 1. 取得 Top 100 資料並進行隊長統計
  const { top5Stats, flatList, totalPlayers } = useMemo(() => {
    // 篩選真正的 Top 100 玩家
    const top100 = rankings.filter(r => r.rank >= 1 && r.rank <= 100);
    const total = top100.length;

    const counts: Record<string, number> = {};
    let unknownCount = 0;

    top100.forEach(entry => {
      const cardId = entry.last_player_info?.card?.id;
      const card = (cardId && cardsMap) ? cardsMap[cardId.toString()] : null;
      if (card?.characterId) {
        const charId = String(card.characterId);
        counts[charId] = (counts[charId] || 0) + 1;
      } else {
        unknownCount++;
      }
    });

    // 依據使用人數排序
    const stats: LeaderStatItem[] = Object.entries(counts).map(([charId, count]) => {
      const charInfo = CHARACTERS[charId];
      return {
        charId,
        name: charInfo ? charInfo.name : `未知 (${charId})`,
        color: charInfo ? charInfo.color : '#64748b',
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    }).sort((a, b) => b.count - a.count);

    if (unknownCount > 0) {
      stats.push({
        charId: 'unknown',
        name: '未知/未載入',
        color: '#475569',
        count: unknownCount,
        percentage: total > 0 ? (unknownCount / total) * 100 : 0,
      });
    }

    // 展開為長度 100 的一維陣列 (由多到少排序)
    const flat: (string | null)[] = [];
    stats.forEach(item => {
      for (let i = 0; i < item.count; i++) {
        flat.push(item.charId);
      }
    });

    // 若不足 100 筆 (例如未載入完成)，用 null 填滿
    while (flat.length < 100) {
      flat.push(null);
    }

    // 取得前五名
    const top5 = stats.slice(0, 5);

    return {
      top5Stats: top5,
      flatList: flat,
      totalPlayers: total
    };
  }, [rankings, cardsMap]);

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
    const up = r > 0 ? flatList[c * 5 + (r - 1)] : null;
    if (up !== current) borderClasses += ' border-t-[3px]';

    // 下鄰居
    const down = r < 4 ? flatList[c * 5 + (r + 1)] : null;
    if (down !== current) borderClasses += ' border-b-[3px]';

    // 左鄰居
    const left = c > 0 ? flatList[(c - 1) * 5 + r] : null;
    if (left !== current) borderClasses += ' border-l-[3px]';

    // 右鄰居
    const right = c < 19 ? flatList[(c + 1) * 5 + r] : null;
    if (right !== current) borderClasses += ' border-r-[3px]';

    return borderClasses;
  };

  // 基於格子索引生成擬隨機角度 (避免重新渲染時跳動)
  const getRotationAngle = (k: number) => {
    const angles = [-1.5, 1, -0.5, 1.5, -1, 0.5, -2, 2, 0];
    return angles[k % angles.length];
  };

  return (
    <div className="flex flex-row gap-3 lg:gap-6 p-2 lg:p-4 bg-slate-900/40 dark:bg-slate-950/20 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner items-center justify-between">
      
      {/* ── 左側網格區 (自適應雙模網格) ── */}
      <div className="flex-1 select-none max-w-[220px] lg:max-w-none">
        
        {/* 1. 桌面端: aspect-[4/1] 自適應填滿貼紙牆 ($5 \times 20$ 網格) */}
        <div className="hidden lg:grid w-full aspect-[4/1] grid-rows-5 grid-flow-col gap-[2px] bg-slate-950/80 p-3 rounded-xl border border-slate-800 relative shadow-2xl overflow-hidden items-center justify-items-stretch">
          {flatList.map((charId, k) => {
            const c = Math.floor(k / 5);
            const r = k % 5;
            const charInfo = charId && charId !== 'unknown' ? CHARACTERS[charId] : null;
            const charColor = charInfo?.color || '#475569';
            const charName = charInfo?.name || (charId === 'unknown' ? '未知' : '無');
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
                onMouseEnter={() => charId && setHoveredCharId(charId)}
                onMouseLeave={() => setHoveredCharId(null)}
                title={`Rank ${c * 5 + r + 1}: ${charName}`}
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

        {/* 2. 行動端: 10x10 螢光棒發光小圓點 (自適應拉滿 75% 寬度) */}
        <div className="grid lg:hidden w-full aspect-square grid-rows-10 grid-flow-col gap-1.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 relative shadow-2xl items-center justify-items-stretch">
          {flatList.map((charId, k) => {
            const charInfo = charId && charId !== 'unknown' ? CHARACTERS[charId] : null;
            const charColor = charInfo?.color || '#475569';
            const charName = charInfo?.name || (charId === 'unknown' ? '未知' : '無');
            
            const isHovered = hoveredCharId !== null && hoveredCharId === charId;
            const isAnyHovered = hoveredCharId !== null;

            return (
              <div
                key={k}
                className="w-full h-full flex items-center justify-center transition-all duration-300"
                onMouseEnter={() => charId && setHoveredCharId(charId)}
                onMouseLeave={() => setHoveredCharId(null)}
                onTouchStart={() => charId && setHoveredCharId(charId)}
                title={`Rank ${Math.floor(k / 10) * 10 + (k % 10) + 1}: ${charName}`}
              >
                {charId ? (
                  <div
                    className="w-[50%] h-[50%] rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: charColor,
                      boxShadow: `0 0 5px ${charColor}`,
                      transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                      filter: isHovered ? `brightness(1.15)` : 'none',
                      opacity: isAnyHovered && !isHovered ? 0.35 : 1
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

      {/* ── 右側/併排統計區 (行動端等高左右併排，無須滾動) ── */}
      <div className="w-20 lg:w-64 flex flex-col justify-between gap-1 lg:gap-2.5 min-h-[96px] lg:min-h-[200px] flex-shrink-0">
        {/* 標題只在桌面端顯示 */}
        <div className="hidden lg:block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
          Top 5 人氣隊長使用率
        </div>
        <div className="flex-1 flex flex-col justify-between gap-1 lg:gap-2">
          {top5Stats.map((item, idx) => {
            const avatar = item.charId !== 'unknown' ? getAssetUrl(item.charId, 'character') : undefined;
            const isHovered = hoveredCharId !== null && hoveredCharId === item.charId;
            const isAnyHovered = hoveredCharId !== null;
            
            const medals = ['🥇', '🥈', '🥉'];
            const badge = medals[idx] || `${idx + 1}.`;

            return (
              <div
                key={item.charId}
                className={`flex items-center justify-between p-1 lg:p-2.5 rounded-lg lg:rounded-xl border transition-all duration-300 ${
                  isHovered 
                    ? 'bg-slate-800 border-slate-700 shadow-md scale-[1.01] lg:scale-[1.02]' 
                    : 'bg-slate-900/20 border-slate-800/65 lg:border-slate-800/80'
                }`}
                style={{
                  opacity: isAnyHovered && !isHovered ? 0.4 : 1,
                  boxShadow: isHovered ? `0 0 10px ${item.color}20` : 'none'
                }}
                onMouseEnter={() => setHoveredCharId(item.charId)}
                onMouseLeave={() => setHoveredCharId(null)}
              >
                <div className="flex items-center gap-1 lg:gap-2">
                  <span className="text-[10px] lg:text-sm font-black w-4 lg:w-5 text-center">{badge}</span>
                  <div className="relative flex-shrink-0">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={item.name}
                        className="w-8 h-8 lg:w-9 lg:h-9 rounded-full object-cover border border-white/30 bg-slate-800 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-slate-800 flex items-center justify-center text-[10px] lg:text-xs font-bold border border-white/30 flex-shrink-0">
                        ?
                      </div>
                    )}
                  </div>
                  {/* 名字在行動端隱藏 */}
                  <span 
                    className="hidden lg:inline text-sm font-bold truncate"
                    style={{ color: item.color }}
                  >
                    {item.name}
                  </span>
                </div>
                <div className="text-right flex-shrink-0 pl-1">
                  {/* 行動端只顯示人數數字，桌面端顯示 'X 人' */}
                  <span className="text-[10px] lg:text-xs font-mono font-bold text-slate-200 block leading-tight">
                    <span className="lg:hidden">{item.count}</span>
                    <span className="hidden lg:inline">{item.count} 人</span>
                  </span>
                  {/* 百分比只在桌面端顯示 */}
                  <span className="hidden lg:block text-[10px] font-mono text-slate-400">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default LeaderStickerPanel;
