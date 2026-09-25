# 🧩 組件規格說明書 - 隊長應援貼紙牆 (Leader Sticker Panel)

> **Document Name**: COMPONENT_LEADER_STICKER_PANEL.md  
> **Version**: v2.0.0  
> **Date**: 2026-09-25  

**文件代號**: `COMPONENT_LEADER_STICKER_PANEL`  
**對應視圖**: `src/components/shared/LeaderStickerPanel.tsx`  
**主要用途**: 統計現時活動前百 (Top 100) 玩家所掛載的隊長卡片，以真實名次綁定、雙模自適應（桌機 5×20 貼紙牆 vs 手機 10×10 燈光秀）與結構鏡像輪播進行視覺化呈現。

---

## 1. 功能概述 (Feature Overview)

本組件深度分析 Top 100 榜單數據，依玩家真實名次綁定隊長角色，在桌機端與行動端分別提供截然不同且高度專屬的展演形式。

### 1.1 桌機版模式 (Desktop Mode, $\ge 1024\text{px}$)
*   **$5 \times 20$ 貼紙牆與同角色聚合**: 將前百玩家依隊長角色使用人數降序排列展開為 100 格。
*   **真實玩家綁定與升序排列**: 每一格皆綁定一位真實玩家資訊（名次、暱稱、隊長角色）。**在同一角色的區塊內部，玩家依真實名次（`rank`）由小到大（升序）填入**，保證高排名玩家始終排在該角色區塊的前列。
*   **上方資訊橫列 (Header Status Bar)**:
    *   位於貼紙牆正上方，高度為 32px（`h-8`），寬度 100% 與下方 5×20 貼紙牆左右邊緣嚴格對齊。
    *   **平時狀態**: 顯示當期活動名稱（若未載入則顯示 `前百人氣隊長分佈` 作為 fallback）。
    *   **Hover 狀態**: 滑鼠懸停於任一貼紙時，即時切換顯示該格真實玩家資訊（例如：`Rank 3    玩家暱稱`）。
    *   **幾何高度控制**: 利用左側貼紙牆（4:1 比例）天然低於右側 Top 5 的垂直留白空間，加入橫列後左側總高仍小於右側，確保外層面板高度平整不增高。
*   **徹底移除原生 Tooltip**: 移除了 HTML 原生 `title` 屬性，杜絕瀏覽器灰色小提示框與流水號誤導。
*   **應援色邊框合併 (Neighbor-aware Borders)**: 檢查上下左右相鄰格子是否為同一角色，若相同則省略內部邊框，使同一角色組合成連續的應援大區塊。
*   **擬隨機微傾斜**: 貼紙頭像套用擬隨機旋轉角度（$-2^\circ \sim +2^\circ$），呈現手貼貼紙的立體層次感。
*   **右側固定 Top 5 側邊欄**: 保留頂部「Top 5 人氣隊長使用率」標題與前五名條目；文字保持可反白複製；修復百分比 `block leading-tight`，杜絕高度溢出。

### 1.2 行動端模式 (Mobile Mode, $< 1024\text{px}$)
*   **頂部橫跨整寬資訊列**: 橫跨整個組件最頂部（同時覆蓋左側燈海與右側清單）：
    *   **燈光秀播放中**: 顯示當前聚焦角色的名稱與使用人數，文字套用該角色的專屬應援色。
    *   **全亮拍**: 切換顯示當期活動名稱（或 fallback 提示）。
*   **$10 \times 10$ 螢光棒燈海 (Concert Penlight Sea)**:
    *   將 100 個隊長位置重組為 10×10 網格，以專屬應援色發光圓點呈現。
    *   **單點聚焦時序**: 每一拍（1 秒）僅點亮當前名次的角色光點，非聚焦角色光點淡至 15% opacity（`opacity: 0.15`）。
*   **右側 5 格分頁輪播與結構鏡像佔位 (Ghost Carousel)**:
    *   以 5 個條目為一頁進行自動輪播（第 1 頁顯示 1~5 名，第 2 頁顯示 6~10 名），名次標籤隨頁面變更為真實名次（`6. 7. 8...`）。
    *   輪播時僅當前聚焦名次之條目維持高亮，同頁其餘條目保持暗態（`opacity: 0.4`）。
    *   **結構鏡像佔位（Invisible Ghost）**: 若最後一頁未滿 5 格，佔位格完全鏡像真實條目的 DOM 盒子模型並施加 `invisible`，達到 100% 像素級等高，**徹底消除最後一頁換頁時的抽動現象**。
*   **全亮收斂拍 (Full Light Beat)**:
    *   播完所有有出場的已知角色後，進入持續 2 秒的全亮拍。
    *   燈海 100 顆光點全亮、右側自動切回第 1 頁且 5 格全亮、頂部資訊列顯示活動名稱。2 秒後回到第 1 拍循環。
*   **互動簡化（暫停／繼續）**:
    *   手機端徹底拔除所有光點與清單卡片上的 `onTouchStart` 與 hover 事件。
    *   點擊組件範圍切換暫停／繼續，暫停時畫面直接定格，無多餘 icon 干擾。

### 1.3 狀態與效能防禦
*   **桌機雙 Hover 狀態協同**:
    *   `hoveredCharId`: 掌控全域同角色連動發光與其餘淡出。
    *   `hoveredPlayer`: 掌控上方資訊橫列即時顯示玩家資訊。
*   **桌機定時器休眠 (`useMobile(1024)`)**: 透過統一 Hook 判斷，在桌機模式下計時器徹底靜止，杜絕每秒無效 re-render。
*   **World Link 章節切換時序安全**: 監聽角色名單依賴，切換章節時拍數立即安全歸零，讀取端具備邊界越界防護，消除 1 秒異常畫面。

---

## 2. 介面定義 (Props Interface)

```typescript
export interface LeaderStickerPanelProps {
  rankings: RankEntry[];   // 當前排行數據列表 (組件內部過濾出 Rank 1 ~ 100)
  cardsMap?: CardsMap;     // 卡片 ID 對照表，解析 player card id 到角色 characterId
  eventName?: string;      // 當期活動名稱 (由 LiveEventView 傳入，供橫列與資訊列顯示)
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
```

---

## 3. 核心邏輯 (Core Logic)

### 3.1 四段式資料管線 (Data Pipeline)
在 `useMemo` 中將排行榜資料拆分為四層，精確支援桌機與手機雙模需求：
```typescript
// 1. 已知角色清單（降序，排除未知，專供手機燈光秀輪播使用）
const activeStats: LeaderStatItem[] = ...;

// 2. 未知角色條目（若有無法解析卡片的玩家，建立單一灰色未知條目）
const unknownItem: LeaderStatItem | null = ...;

// 3. 完整統計清單與桌機 Top 5（維持現行切片行為：未知角色若進前 5 則自然切入）
const allStats = unknownItem ? [...activeStats, unknownItem] : activeStats;
const top5Stats = allStats.slice(0, 5);

// 4. 展開為長度 100 的格子陣列（同角色內部依玩家真實名次 rank 升序排列）
const flat: (StickerCellData | null)[] = [];
activeStats.forEach(stat => {
  const entries = playerGroups[stat.charId] || [];
  entries.sort((a, b) => a.rank - b.rank); // 同角色內名次由小到大排序
  entries.forEach(entry => flat.push({ ... }));
});
if (unknownEntries.length > 0) {
  unknownEntries.sort((a, b) => a.rank - b.rank);
  unknownEntries.forEach(entry => flat.push({ isUnknown: true, ... }));
}
```

### 3.2 邊框合併判斷 (Border Merging)
藉由一維索引換算二維座標（行 $r: 0 \sim 4$，列 $c: 0 \sim 19$），比對相鄰格子的 `charId`：
```typescript
const getBorders = (r: number, c: number, charId: string | null) => {
  if (!charId) return '';
  const current = charId;
  let borderClasses = '';

  const up = r > 0 ? flatList[c * 5 + (r - 1)]?.charId : null;
  if (up !== current) borderClasses += ' border-t-[3px]';

  const down = r < 4 ? flatList[c * 5 + (r + 1)]?.charId : null;
  if (down !== current) borderClasses += ' border-b-[3px]';

  const left = c > 0 ? flatList[(c - 1) * 5 + r]?.charId : null;
  if (left !== current) borderClasses += ' border-l-[3px]';

  const right = c < 19 ? flatList[(c + 1) * 5 + r]?.charId : null;
  if (right !== current) borderClasses += ' border-r-[3px]';

  return borderClasses;
};
```

### 3.3 手機時序控制與分頁判定
```typescript
// 統一判定全亮拍運算子
const isFullLightBeat = currentBeat >= activeCharStats.length;
const currentActiveChar = (!isFullLightBeat && activeCharStats[currentBeat]) ? activeCharStats[currentBeat] : null;

// 全亮拍強制回歸第 0 頁，否則依拍數推進
const currentPageIndex = isFullLightBeat ? 0 : Math.floor(currentBeat / 5);

// 燈光秀定時器（僅在手機模式且非暫停時執行）
useEffect(() => {
  if (!isMobile || isPaused || activeCharStats.length === 0) return;
  const duration = isFullLightBeat ? 2000 : 1000;
  const timer = setTimeout(() => {
    setCurrentBeat(prev => (prev >= activeCharStats.length ? 0 : prev + 1));
  }, duration);
  return () => clearTimeout(timer);
}, [isMobile, currentBeat, isPaused, activeCharStats.length]);
```

### 3.4 結構鏡像佔位機制 (Ghost Placeholder)
```tsx
{pageItems.map((item, slotIndex) => {
  if (!item) {
    // 結構鏡像：完全相符的盒子模型，由排版引擎自動計算高度，達成像素級零誤差等高
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
  // 正常條目渲染...
})}
```

---

## 4. 模組依賴 (Module Dependencies)

*   **斷點偵測**: `../../hooks/useMobile.ts` (傳入 `1024` 進行桌機／手機邏輯分流)
*   **常數設定**: `../../config/constants.ts` (獲取 `CHARACTERS` 角色顏色與名稱)
*   **動態資源**: `../../utils/gameUtils.ts` (利用 `getAssetUrl` 獲取 Chibi 圓形頭像網址)
*   **型別定義**: `../../types.ts` (`RankEntry`, `CardsMap`)

---

## 5. 引用位置 (Usage Locations)

1.  **`src/components/pages/LiveEventView.tsx`**:
    位於即時活動頁面的「圖表分析區」折疊面板中，作為 Tab 切換子視圖，傳入當前榜單、卡片字典與活動名稱：
    ```tsx
    <LeaderStickerPanel
        rankings={chartRankings}
        cardsMap={cards || undefined}
        eventName={eventName}
    />
    ```
