# 🧩 組件規格說明書 - 隊長應援貼紙牆 (Leader Sticker Panel)

**撰寫日期**: 2026-06-26
**版本號**: 1.0.0

**文件代號**: `COMPONENT_LEADER_STICKER_PANEL`
**對應視圖**: `src/components/shared/LeaderStickerPanel.tsx`
**主要用途**: 統計活動前百 (Top 100) 玩家使用的隊長卡片，並依據使用率以應援牆形式進行雙模自適應視覺化呈現。

---

## 1. 功能概述 (Feature Overview)

本組件分析 Top 100 榜單數據，統計各角色隊長的使用人數與百分比，提供極具特色且與眾不同的兩種展示模式。

### 1.1 桌機版模式 (Desktop Mode)
*   **$5 \times 20$ 貼紙牆**: 將前百玩家依隊長使用率多寡展開成 100 格網格。
*   **應援色邊框合併 (Neighbor-aware Borders)**: 系統會檢查格子的上下左右鄰居，若為相同角色則不繪製內部邊框，使同一角色的相連格子形成一個連續的應援大區塊，加深應援色邊框的包圍感。
*   **隨機傾斜效果**: 每一張頭像貼紙都會套用擬隨機旋轉角度（如 `-1.5° ~ 2°`），使貼紙牆呈現像現實世界中手貼貼紙的「不規則活潑感」。
*   **Top 5 側邊欄**: 右側顯示前五名熱門角色的精準統計，包括名次、頭像、名字、使用人數及佔比。

### 1.2 行動端模式 (Mobile Mode)
為了在手機小螢幕上提供「零滑動一屏」視覺，且不遮擋下方排行榜，本組件在 `lg` 斷點以下會自動重構：
*   **$10 \times 10$ 發光圓點**: 將 $5 \times 20$ 網格重組為 $10 \times 10$ 網格。圓點僅以該角色的代表色顯示發光點（螢光棒光點），類似從舞台上俯瞰觀眾席的螢光棒海效果，大幅縮減了頭像所佔用的面積。
*   **右側極簡併排**: 右側 25% 空間用作 Top 5 直立清單。為了限制縱向高度在 $100\text{px}$ 左右以配合左側網格高度，**完全隱藏了角色名字與百分比**，僅顯示放大後的 `w-8 h-8` ($32\text{px}$) 大頭像與使用人數，兩側高度完美像素級對齊。

### 1.3 互動機制
*   **Hover 高亮連動**: 滑鼠懸停（或手機端點擊）任何一格貼紙/發光圓點，或右側的 Top 5 角色頭像時，同角色的所有項目皆會觸發發光邊框，非選中項目則會半透明淡出（`opacity: 0.35`），具備極高互動質感。

---

## 2. 介面定義 (Props Interface)

```typescript
export interface LeaderStickerPanelProps {
  rankings: RankEntry[];   // 當前排行數據列表 (組件內部會過濾出 Rank 1 ~ 100)
  cardsMap?: CardsMap;     // 卡片 ID 對照表，用來解析 player card id 到角色 characterId
}
```

---

## 3. 核心邏輯 (Core Logic)

### 3.1 邊框合併判斷 (Border Merging)
利用一維網格位置判定格子的邊緣鄰居：
```typescript
const getBorders = (r: number, c: number, charId: string | null) => {
  if (!charId) return '';
  const current = charId;
  let borderClasses = '';

  const up = r > 0 ? flatList[c * 5 + (r - 1)] : null;
  if (up !== current) borderClasses += ' border-t-[3px]';

  const down = r < 4 ? flatList[c * 5 + (r + 1)] : null;
  if (down !== current) borderClasses += ' border-b-[3px]';

  const left = c > 0 ? flatList[(c - 1) * 5 + r] : null;
  if (left !== current) borderClasses += ' border-l-[3px]';

  const right = c < 19 ? flatList[(c + 1) * 5 + r] : null;
  if (right !== current) borderClasses += ' border-r-[3px]';

  return borderClasses;
};
```

---

## 4. 模組依賴 (Module Dependencies)

*   **常數設定**: `../../config/constants.ts` (獲取 `CHARACTERS` 以獲取角色顏色與名稱)
*   **動態資源**: `../../utils/gameUtils.ts` (利用 `getAssetUrl` 獲取頭像資源網址)

---

## 5. 引用位置 (Usage Locations)

1.  **`LiveEventView.tsx`**: 呈現在即時活動頁面的「圖表分析區」折疊面板中，作為 Tab 切換的子視圖。
