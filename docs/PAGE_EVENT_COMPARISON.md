# 📄 頁面規格說明書 - 活動比較分析 (Event Comparison)

**文件代號**: `PAGE_EVENT_COMPARISON`
**對應視圖**: `currentView === 'comparison'` (App.tsx)
**主要用途**: 允許使用者並排比較任意兩期活動的榜單數據，分析分數膨脹趨勢與競爭型態差異。

---

## 1. 功能概述 (Feature Overview)

本頁面是資深玩家評估活動難度與預測分數線的重要工具。

### 1.1 核心功能
*   **雙活動選取**: 下拉選單選擇 "Event A" (基準) 與 "Event B" (對照)。支援關鍵字搜尋與快速篩選。
*   **數據正規化 (Normalization)**:
    *   **總分模式**: 直接比較原始分數。
    *   **日均模式 (Daily Avg)**: 將分數除以活動天數，消除活動長度不同造成的偏差。
*   **疊加圖表**: 將兩期活動的分數曲線繪製於同一張圖表上 (X軸: 排名, Y軸: 分數)。
*   **自動化分析報告**:
    *   **陡峭度 (Steepness)**: 分析 T1-T10, T10-T100 等區間的斜率，判斷頭部競爭激烈程度。
    *   **平均分 (Avg Score)**: 比較整體分數水平。
    *   **勝出判定**: 系統自動標示哪一期活動在特定區間更為「卷」(競爭激烈)。

### 1.2 互動機制
*   **鼠標追蹤 (Crosshair)**: 滑鼠在圖表移動時，自動吸附至最近的排名點，並顯示兩期活動在該名次的具體分數。
*   **快速篩選**: 在下拉選單上方提供團體/屬性篩選器，方便從上百期活動中快速找到目標 (例如：比較所有「25時」的箱活)。

---

## 2. 技術實作 (Technical Implementation)

### 2.1 資料獲取 (Data Fetching)
位於 `components/EventComparisonView.tsx` 的 `handleCompare` 函式。

*   **並行請求**: 使用 `Promise.all` 同時發送 4 個 API 請求：
    1.  Event A Top 100 (`/event/{id}/top100`)
    2.  Event A Borders (`/event/{id}/border`)
    3.  Event B Top 100
    4.  Event B Borders
*   **數據合併**: 將 Top 100 詳細名單與 Border 概略名單合併、去重、排序，產生完整的 `SimpleRankData[]`。

### 2.2 圖表繪製邏輯 (Chart Logic)
*   **X軸變形 (Log-Linear Scale)**: 
    *   由於 T1-T100 的關注度遠高於 T1000-T10000，且排名數值跨度大。
    *   採用 **分段比例尺**: 前 30% 寬度顯示 T1-T100，後 70% 寬度顯示 T100-T10000 (使用對數縮放)，讓頭部排名更清晰。
*   **SVG 路徑生成**: 計算每個數據點的 `(x, y)` 座標，生成 SVG `<path d="M... L...">`。

### 2.3 分析演算法 (Analysis Algorithm)
位於 `ChartDisplay` memo 中的 `getTrendAnalysis`。
*   將排名切分為 `[1-10]`, `[10-100]`, `[100-1000]`, `[1000+]` 四個區間。
*   計算每個區間的 **Spread (離散度)**: `(Max - Min) / Avg`。
    *   Spread 越大，代表分數拉得越開（斷層大）。
*   根據 Spread 與 Average Score 的比值 (Ratio)，判定 A 或 B 勝出，並生成對應的評語 (Evaluation Text)。

---

## 3. UI/UX 排版設計 (UI Layout)

### 3.1 選擇區 (Selection Area)
*   **兩欄式佈局**: 左側選擇活動 A，右側選擇活動 B。
*   **中間動作鈕**: 「開始比較」按鈕，載入時顯示 Loading 狀態。
*   **輔助篩選列**: 位於選單上方，提供 Unit / Banner / Attribute 等快速過濾器。

### 3.2 圖表區 (Chart Area)
*   **標頭**: 顯示兩期活動的名稱、Logo、代表色點 (Legend) 與持續天數。
*   **控制**: 右上角切換「總分 / 日均」模式。
*   **繪圖區**: 
    *   背景顯示 Y 軸網格。
    *   使用 SVG 繪製兩條不同顏色的折線。
    *   虛線標示 X 軸的比例尺切換點 (Scale Change)。
*   **Tooltip**: 懸浮視窗顯示當前 Rank 及兩者的分數對比。

### 3.3 分析卡片區 (Analysis Cards)
*   位於圖表下方，分為 4 個卡片 (對應 4 個排名區間)。
*   **內容**:
    *   區間標題 (e.g., Top 10-100)。
    *   **競爭陡峭度**: 顯示勝出者的顏色條與名稱。
    *   **平均分數**: 顯示較高者的顏色條與名稱。
    *   **系統評語**: 一句簡短的總結 (e.g., "第XX期 分數大幅領先，且排名前段斷層極大")。

---

## 4. 模組依賴 (Module Dependencies)

*   `components/EventComparisonView.tsx` (獨立組件，內含圖表邏輯)
*   `components/ui/Select.tsx`
*   `components/ui/EventFilterGroup.tsx`
*   `hooks/useRankings.ts` (複用 `fetchJsonWithBigInt`)
*   `utils/mathUtils.ts` (分數格式化)
*   `constants/uiText.ts`
