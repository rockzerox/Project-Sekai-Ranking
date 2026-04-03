# 📄 元件規格說明書 - RankingItem

**撰寫日期**: 2026-04-03
**版本號**: 2.0.0

**文件代號**: `COMPONENT_RANKING_ITEM`
**對應檔案**: `src/components/shared/RankingItem.tsx`
**主要用途**: 排行榜中單一玩家的資料卡片，支援展開詳情、玩家活躍狀態指示器、安全/死心線計算，以及響應式字體密度。

---

## 1. Props 介面

```typescript
interface RankingItemProps {
    entry: RankEntry;           // 玩家排名資料
    sortOption: SortOption;     // 當前排序依據，決定右側顯示內容
    hideStats?: boolean;        // true = 精彩片段模式，隱藏時速統計
    aggregateAt?: string;       // 結算時間，用於安全線/死心線計算
    eventDuration?: number;     // 活動持續天數
    cardsMap?: CardsMap;        // 卡片 ID → 角色 ID 對照表（用於頭像）
    isLiveEvent?: boolean;      // 是否為現時活動（控制活躍狀態功能）
    now?: number;               // 當前時間戳 (ms)，由父層 setInterval 提供
}
```

---

## 2. 核心功能模組

### 2.1 安全線 / 死心線 (Safe / Give-up Lines)

位於內部 `StatDisplay` 子函式，僅在 `sortOption === 'score'` 且 `hideStats === false` 時渲染。

**計算公式**:
```typescript
const maxGainPerSec = 68000 / 100; // 理論極限：每 100 秒 6.8 萬分
const maxGain = remainingSeconds * maxGainPerSec;
const safeThreshold = currentScore + maxGain;    // 安全線
const giveUpThreshold = targetScore - maxGain;   // 死心線
```

**顯示條件**: 同時存在 `safeLine` 與 `giveUpLine` 時，以右對齊 Flexbox 顯示分數 + 參考線盒。手機直立模式亦可見（已移除 `hidden sm:flex`）。

### 2.2 玩家活躍狀態指示器

**觸發條件**: `isLiveEvent === true` 且 `entry.lastPlayedAt` 存在。

**計算邏輯**:
```typescript
const offlineMinutes = (isLiveEvent && entry.lastPlayedAt && now)
    ? (now - new Date(entry.lastPlayedAt).getTime()) / 60000
    : -1;
const isOnline = offlineMinutes >= 0 && offlineMinutes <= 2;
const showRestBar = isLiveEvent && !isOnline && offlineMinutes > 2;
const fillPercent = showRestBar ? Math.min(100, (offlineMinutes / (24 * 60)) * 100) : 0;
```

**視覺元件**:

| 狀態 | 元件 | 說明 |
|---|---|---|
| 線上 (≤ 2 min) | 頭像右下角綠點 | `w-2 h-2` + `animate-pulse` + emerald-400 |
| 離線 (> 2 min) | 月亮 🌙 + 進度條 + 時間標籤 | 0-24h 刻度，cyan-500/70 品牌色，放置於玩家名稱下方 |

**時間標籤格式**: `< 60 min → "45m"`, `≥ 60 min → "3h"`, `> 24h → "24h+"`

### 2.3 展開詳情

點擊 `RankingItem` 後顯示 `DetailStatCard` 群組（1H / 3H / 24H）。  
**注意**: 展開圖標容器（`w-5 ml-2`）僅在 `isClickable === true` 時渲染。精彩片段模式下整個 `<div>` 不渲染，消除右側死區空間。

---

## 3. 響應式設計

| 元素 | 手機端 (`< sm`) | 桌面端 (`≥ sm`) |
|---|---|---|
| 名次字體 | `text-sm` | `text-base` |
| 玩家名稱 | `text-xs` | `text-lg` |
| 頭像 | `w-7 h-7` | `w-10 h-10` |
| 月亮 icon | `w-2.5 h-2.5` | `w-3 h-3` |
| 休息條長度 | `w-14` | `w-20` |
| 展開圖標 | `w-4 h-4` | `w-5 h-5` |
| Stats 最小寬 | `min-w-[4rem]` | `min-w-[7rem]` |

---

## 4. 重要設計決策

*   **`now` 由父層統一傳入**: `LiveEventView` 透過 `setInterval(2min)` 維護 `now` 狀態並傳入，避免每個 Item 各自計時造成效能浪費。
*   **`bare mode` 非此元件負責**: 倒數計時的裸文字模式由 `EventHeaderCountdown` 的 `bare` prop 控制。
*   **右側死區修正**: 精彩片段模式 (`isClickable = false`) 下，展開圖標的 `<div>` 容器整體不渲染，而非內部 `<svg>` 不渲染，確保右側無佔位空間。
