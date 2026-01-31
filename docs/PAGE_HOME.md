# 📄 頁面規格說明書 - 首頁 (Home)

**文件代號**: `PAGE_HOME`
**對應視圖**: `currentView === 'home'` (App.tsx)
**主要用途**: 作為應用程式的入口門戶 (Portal)，提供所有功能模組的總覽與快速導航入口。

---

## 1. 功能概述 (Feature Overview)

本頁面將龐雜的功能模組進行邏輯分類，並以視覺化的卡片形式呈現，協助使用者快速找到所需工具。

### 1.1 核心功能
*   **功能儀表板 (Feature Dashboard)**: 將 14 個功能頁面分為 5 大類別展示。
*   **快速導航**: 點擊任一卡片即可切換 `currentView` 至對應頁面。
*   **分類引導**:
    1.  **查榜 SEKAI**: 查詢現時與歷史榜單。
    2.  **分析 SEKAI**: 比較與趨勢分析。
    3.  **推角 SEKAI**: 針對角色/團體的深度挖掘。
    4.  **玩家 SEKAI**: 針對玩家行為與個體的分析。
    5.  **工具 SEKAI**: 實用計算工具。

### 1.2 互動機制
*   **動態標題**: 頂部的 Trophy Icon 會隨滑鼠互動產生旋轉特效。
*   **卡片回饋**: 滑鼠懸停於功能卡片時，邊框顏色會變為該功能代表角色的主題色，並產生陰影與位移效果。

---

## 2. 技術實作 (Technical Implementation)

### 2.1 組態設定 (Configuration)
位於 `components/HomeView.tsx` 內的 `sections` 陣列。

*   **資料結構**: 定義了每個區塊 (Section) 的標題、顏色以及包含的功能 (Features)。
*   **功能定義**: 每個 Feature 包含 `id` (對應 `currentView`), `title`, `description`, `icon`, `charColor`。
*   **文案來源**: 所有文字皆引用自 `UI_TEXT.home`，確保多語言擴充性。

### 2.2 導航邏輯
*   接收 `setCurrentView` 作為 Prop。
*   點擊卡片時觸發 `setCurrentView(feature.id)`，由 `App.tsx` 負責渲染對應的主內容組件。

---

## 3. UI/UX 排版設計 (UI Layout)

### 3.1 英雄區塊 (Hero Section)
*   **標題**: 大字體顯示 "Hi Sekai TW Rankings"。
*   **裝飾**: 兩側配置 `TrophyIcon`，背景帶有淡淡的 Cyan 光暈。
*   **描述**: 簡短說明網站用途。

### 3.2 功能網格 (Feature Grid)
*   **RWD 佈局**:
    *   手機: 1 欄 (垂直堆疊)。
    *   平板: 2 欄。
    *   桌機 (XL): 5 欄 (每個類別一欄)。
*   **類別標頭**: 每個欄位頂部顯示類別名稱 (如 "查榜 SEKAI")，背景色與邊框色對應該類別的主題色。
*   **功能卡片**:
    *   **Icon**: 左側顯示 SVG 圖示，背景色為淡化後的角色主題色。
    *   **文字**: 標題粗體，說明文字使用較小的灰色字體。
    *   **Hover Effect**: 邊框高亮，卡片輕微上浮。

### 3.3 頁腳 (Footer)
*   顯示非官方聲明與 API 資料來源連結。

---

## 4. 模組依賴 (Module Dependencies)

*   `components/HomeView.tsx`
*   `components/icons/TrophyIcon.tsx`
*   `constants.ts` (引用 `CHARACTERS` 顏色)
*   `constants/uiText.ts`
