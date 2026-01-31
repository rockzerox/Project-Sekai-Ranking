# 📄 頁面規格說明書 - World Link 分析 (World Link Analysis)

**文件代號**: `PAGE_WORLD_LINK`
**對應視圖**: `currentView === 'worldLink'` (App.tsx)
**主要用途**: 專為「World Link」這一特殊活動類型設計的綜合分析看板，解決傳統榜單無法直觀比較各章節（角色）熱度的問題。

---

## 1. 功能概述 (Feature Overview)

World Link 活動將一次活動拆分為多個章節 (Chapters)，每個章節對應不同角色且天數可能不同。本頁面旨在標準化這些數據以進行公平比較。

### 1.1 核心功能
*   **輪次切換**: 支援切換「第一輪 (2023-2024)」與「第二輪 (2024-)」的 World Link 活動群組。
*   **日均分校正 (Daily Average Correction)**:
    *   由於 WL 各章節持續天數不同（例如第 140 期某些章節為 2 天，其餘多為 3 天），系統會讀取設定檔中的 `chDavg` 進行權重校正。
    *   提供「總分」與「日均」兩種視角。
*   **雙模式圖表**:
    *   **活躍度模式 (Activity)**: 以橫向長條圖比較各角色的絕對分數。
    *   **全域顯示 (Global)**: 以 **T100** 或 **T500** 為基準線，將各角色的 T200/T300...T10000 分數標準化為百分比，視覺化呈現「競爭熱度分佈」。
*   **四榜並列**: 同時展示 Top 1, Top 10, Top 100, 及自選 Border (如 T1000) 的排名列表。

### 1.2 互動機制
*   **基準切換**: 在全域圖表模式下，可切換 Base Line (T100 或 T500)，以適應不同熱度的觀察需求。
*   **數據懸停**: 滑鼠移至圖表上的幾何圖形（代表不同名次），會顯示具體分數與名次。

---

## 2. 技術實作 (Technical Implementation)

### 2.1 資料結構與獲取
位於 `components/WorldLinkView.tsx`。

*   **設定檔依賴**: 高度依賴 `ConfigContext` 中的 `wlDetails` 與 `getWlIdsByRound`。
*   **聚合邏輯 (Aggregation)**:
    1.  根據選定的 Round 取得所有相關 Event IDs。
    2.  並行請求每個 Event 的 `/top100` 與 `/border`。
    3.  從 API 回傳的 `userWorldBloomChapterRankings` 中，提取各角色的子榜單數據。
    4.  將數據展平 (Flatten) 為 `AggregatedCharStat` 陣列，包含角色名稱、顏色、所屬期數、各名次分數。

### 2.2 圖表渲染邏輯
*   **Rank Shape**: 使用 SVG 繪製不同形狀（圓形、方形、三角形等）代表不同名次 (T200, T300...)，以便在單一條狀圖上區分多個數據點。
*   **標準化公式**:
    *   `Value = (TargetScore / BaseScore) * 100%`
    *   若 BaseScore (e.g. T100) 為 0，則處理為 0 以免除錯。

---

## 3. UI/UX 排版設計 (UI Layout)

### 3.1 控制區
*   **頂部**: 標題與描述。
*   **過濾器**:
    *   左側: 輪次按鈕 (第一輪 / 第二輪)。
    *   右側: 顯示模式按鈕 (總分 / 日均)。

### 3.2 圖表區 (Collapsible)
*   **模式切換**: Activity (長條圖) / Global (相對分佈圖)。
*   **視覺**: 使用角色代表色作為長條圖背景色（半透明），並疊加角色頭像。

### 3.3 列表區
*   採用 4 欄式 Grid 佈局，分別顯示 Top 1, Top 10, Top 100, 自選 Border。
*   列表內的每個 Row 包含：排名、角色顏色條、角色名稱、所屬期數(Event ID)、章節數(Ch.X)、分數。

---

## 4. 模組依賴 (Module Dependencies)

*   `components/WorldLinkView.tsx`
*   `contexts/ConfigContext.ts` (提供 WL 詳細設定)
*   `components/ui/DashboardTable.tsx`
*   `components/ui/Select.tsx`
*   `hooks/useRankings.ts`
