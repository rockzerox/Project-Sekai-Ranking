# 📄 頁面規格說明書 - 現時活動 (Live Event)

**文件代號**: `PAGE_LIVE_EVENT`
**對應視圖**: `currentView === 'live'` (src/App.tsx)
**主要用途**: 提供正在進行中的活動即時排名資訊、競爭數據分析與預測。

---

## 1. 功能概述 (Feature Overview)

本頁面是使用者進入應用程式後的第一個核心功能，旨在提供「戰場最前線」的即時資訊。

### 1.1 核心功能
*   **即時榜單查詢**: 顯示 Top 100 玩家的即時分數、名稱、隊伍資訊。
*   **精彩片段 (Highlights)**: 切換模式以查看特定名次（如 T200, T500, T1000, T2000, T5000, T10000）的分數線，而非連續的 1-100 名。
*   **倒數計時**: 顯示距離活動結算（Aggregate At）的剩餘時間。
*   **競爭數據儀表板**: 自動計算 T1/T10、T10/T50 等區間的分數倍率與差值，以及 T50-T100 的變異係數 (CV)，用以判斷競爭激烈程度。
*   **動態圖表**: 繪製分數分佈曲線，視覺化呈現排名斷層。
*   **安全線/死心線計算**:
    *   **安全線 (Safe Line)**: 根據剩餘時間，計算「理論上即使現在停止遊玩，被追上的機率極低」的分數門檻。
    *   **死心線 (Give-up Line)**: 計算「理論上即使現在開始以最高效率追趕，也無法超越」的分數門檻。

### 1.2 互動機制
*   **排序切換**: 支援依「總分」、「日均分」、「最後上線時間」及「時速 (1H/3H/24H)」排序。
*   **展開詳情**: 點擊單一玩家卡片，可展開查看詳細時速數據（過去 1/3/24 小時的場數、得分、平均分）。
*   **分頁控制**: 在 Top 100 模式下支援分頁瀏覽；在精彩片段模式下顯示關鍵名次。

---

## 2. 技術實作 (Technical Implementation)

### 2.1 資料來源 (Data Fetching)
本頁面主要依賴 `src/hooks/useRankings.ts` 進行資料管理。

| 資料類型 | API 端點 | 觸發時機 | 備註 |
| :--- | :--- | :--- | :--- |
| **Top 100 榜單** | `/event/live/top100` | 頁面載入時、切換分頁至一般模式時 | 回傳前 100 名完整資料 |
| **邊線榜單 (Borders)** | `/event/live/border` | 切換至「精彩片段」模式時、繪製圖表時 | 回傳特定名次 (200, 300...) 資料 |

### 2.2 核心邏輯 (Core Logic)

#### A. 安全線與死心線公式
位於 `src/components/shared/RankingItem.tsx` 與 `src/components/charts/ChartAnalysis.tsx`。

```typescript
const maxGainPerSec = 68000 / 100; // 假設極限理論值：每 100 秒獲得 6.8 萬分 (獨奏極限)
const maxGain = remainingSeconds * maxGainPerSec;

// 安全線：當前分數 + 剩餘時間理論最大增幅
const safeThreshold = currentScore + maxGain;

// 死心線：目標分數 - 剩餘時間理論最大增幅
const giveUpThreshold = targetScore - maxGain;
```

#### B. 競爭數據計算
位於 `src/App.tsx` 的 `competitiveStats` memo。
*   計算特定名次間的倍率 (Ratio) 與差值 (Diff)。
*   利用 `src/utils/mathUtils.ts` 計算變異係數 (CV)，數值越低代表分數分佈越平均（競爭越膠著）。

#### C. 狀態管理
*   **`useRankings`**: 封裝了 `fetch` 邏輯、錯誤處理、快取 (Cache) 機制。
*   **`currentPage`**: 控制顯示一般榜單 (number) 或是精彩片段 ('highlights')。

---

## 3. UI/UX 排版設計 (UI Layout)

頁面採用垂直流式佈局，由上而下分為三個主要區塊。

### 3.1 頁面頭部 (Header Section)
*   **標題**: 顯示「現時活動 (Live Event)」。
*   **活動資訊卡**:
    *   **左側**: 活動 Logo、活動名稱 (依據設定檔顯示主題色)、剩餘時間倒數、最後更新時間。
    *   **右側**: `StatsDisplay` 組件，以緊湊的數據陣列顯示 T1/T10 等競爭指標。

### 3.2 圖表分析區 (Chart Section) - 可折疊
*   使用 `CollapsibleSection` 包覆。
*   **組件**: `ChartAnalysis.tsx` -> `LineChart.tsx`。
*   **視覺**:
    *   **X軸**: 排名 (Rank)。
    *   **Y軸**: 分數 (Score)。
    *   **輔助線**: 繪製「安全區 (綠色背景)」與「死心區 (紅色背景)」。
    *   **互動**: 懸停於圖表點可查看該名次的具體分數與玩家名稱。

### 3.3 排行榜列表區 (Ranking List Section) - 可折疊
*   使用 `CollapsibleSection` 包覆。
*   **控制列**:
    *   **分頁器 (`Pagination`)**: 1-20, 21-40... 以及「精彩片段」切換按鈕。
    *   **排序器 (`SortSelector`)**: 下拉選單選擇排序依據。
*   **列表內容 (`RankingList`)**:
    *   由多個 `RankingItem` 組成。
    *   **排名樣式**:
        *   Rank 1: 金色皇冠 + 背景高亮。
        *   Rank 2: 銀色獎盃 + 灰色背景。
        *   Rank 3: 銅色獎盃 + 橙色背景。
    *   **卡片佈局**:
        *   **左**: 名次、趨勢圖示。
        *   **中**: 玩家名稱、ID (隱藏/縮小顯示)。
        *   **右**: 主要分數數據 (依排序依據變化)、安全/死心線提示 (僅在分數排序時顯示)。
    *   **展開詳情**: 點擊後向下滑出，顯示 1H / 3H / 24H 的詳細數據卡片 (次數/得分/時速/平均)。

---

## 4. 模組依賴 (Module Dependencies)

*   `src/components/shared/RankingList.tsx`
*   `src/components/shared/RankingItem.tsx`
*   `src/components/charts/ChartAnalysis.tsx`
*   `src/components/charts/LineChart.tsx`
*   `src/components/ui/Pagination.tsx`
*   `src/components/ui/SortSelector.tsx`
*   `src/components/ui/CollapsibleSection.tsx`
*   `src/hooks/useRankings.ts`
*   `src/utils/mathUtils.ts` (計算 CV, 格式化分數)
*   `src/config/uiText.ts` (多語言文案引用)
