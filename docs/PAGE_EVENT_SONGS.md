# 活動曲目及MV (Event Songs and MVs) 頁面規格書

## 1. 功能概述
「活動曲目及MV」頁面位於「工具 SEKAI」分類下，主要提供 Project Sekai 台服各期活動的關聯歌曲資訊。
使用者可以透過此頁面查詢各期活動的書下曲（或相關曲目），並直接取得官方 2D/3D MV 的觀看連結。

## 2. 資料依賴與處理
此頁面整合了三個主要的資料來源：
*   **`src/data/song.json`**: 提供核心的歌曲資訊，包含 `eventId`, `title`, `lyricist`, `composer`, `arranger`, `mv2d`, `mv3d`。其 key 值作為歌曲編號用於獲取歌曲圖片。
*   **`src/data/eventDetail.json`**: 透過 `eventId` 關聯，取得該活動的所屬團體 (`unit`) 與 Banner 角色 (`banner`)。
*   **API `/event/list` (透過 `App.tsx` 的 `allEvents` 傳入)**: 透過 `eventId` 關聯，取得該活動的完整名稱 (`eventName`)。

### 資料合併邏輯 (Join)
在 `useMemo` 中，以 `song.json` 為主體進行遍歷，將上述三個資料源的資訊合併為單一物件，並預設以 `eventId` 升冪排序。

## 3. UI/UX 排版與設計
*   **主題色**: 採用系統預設風格 (Slate/Cyan)，與其他功能頁面保持一致。
*   **頁面標頭**: 顯示大標題「活動曲目及MV」與說明文字。
*   **篩選器區塊**: 使用共用的 `EventFilterGroup` 組件，提供團體與 Banner 篩選。
*   **資料表格**: 響應式表格設計，包含 10 個欄位。
*   **分頁控制**: 使用共用的 `Pagination` 組件（隱藏「精彩片段」按鈕），每頁顯示 20 筆資料。

## 4. 篩選器與排序功能
提供以下兩個維度的篩選功能（透過 `EventFilterGroup` 實作），所有條件為 `AND` 邏輯交集：
1.  **團體 (Unit)**: 下拉選單，選項來自 `UNIT_ORDER` 與 `UNIT_MASTER`。
2.  **Banner 角色**: 下拉選單，選項動態從合併後的資料中提取所有出現過的 Banner 角色。

**排序功能**:
*   **活動ID**: 表頭提供可點擊的排序按鈕，支援升冪 (asc) 與降冪 (desc) 切換，預設為升冪。

## 5. 表格欄位定義
依序顯示以下欄位：
1.  **活動ID**: 數字 ID。
2.  **活動名稱**: 包含完整活動名稱（過長時截斷並顯示 tooltip）以及該活動的 Logo 圖片（靠左對齊）。
3.  **團體**: 僅顯示團體 Icon，滑鼠懸停時顯示團體名稱 Tooltip。
4.  **Banner**: 僅顯示角色頭像，滑鼠懸停時顯示角色名稱 Tooltip。
5.  **曲名**: 包含歌曲名稱以及該歌曲的封面圖片（圖片來源為 `song.json` 的 key 值補零至三位數）。
6.  **作詞**: 作詞者名稱。
7.  **作曲**: 作曲者名稱。
8.  **編曲**: 編曲者名稱。
9.  **2D MV**: 若有連結，顯示紅色的 YouTube 播放圖示按鈕（點擊另開新分頁）；若無，顯示 `-`。
10. **3D MV**: 同上。

## 6. 相關檔案
*   `src/components/pages/EventSongsView.tsx`: 頁面主組件。
*   `src/config/uiText.ts`: 包含此頁面使用的所有靜態文字 (`UI_TEXT.eventSongs`)。
*   `src/components/layout/Sidebar.tsx`: 側邊欄導覽項目設定。
*   `src/App.tsx`: 路由與狀態管理。
