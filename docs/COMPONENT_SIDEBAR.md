# 🧩 組件規格說明書 - 側邊導航欄 (Sidebar)

**文件代號**: `COMPONENT_SIDEBAR`
**檔案路徑**: `src/components/layout/Sidebar.tsx`
**主要用途**: 全域導航控制器，負責視圖切換、主題切換與選單收合。

---

## 1. 功能概述 (Feature Overview)

側邊欄是使用者在不同功能間切換的主要路徑，需保持在畫面左側（桌機）或透過漢堡選單喚出（手機）。

### 1.1 核心功能
*   **視圖導航**: 提供所有功能頁面的連結，點擊後切換 `src/App.tsx` 的 `currentView`。
*   **分組管理**: 依據功能性質將連結分組 (Categories)，支援折疊/展開各分組。
*   **響應式收合**:
    *   **Desktop**: 可切換「展開 (Expanded)」與「精簡 (Collapsed)」模式。精簡模式下只顯示圖示。
    *   **Mobile**: 預設隱藏，點擊漢堡選單後滑出 (Off-canvas)，點擊遮罩層或連結後自動收回。
*   **主題切換**: 控制 Light/Dark Mode 的切換。

### 1.2 互動機制
*   **自動展開**: 當 `currentView` 改變時（例如從首頁點擊卡片進入），側邊欄會自動展開該功能所屬的分組。
*   **Active State**: 當前所在的頁面連結會顯示高亮背景與左側指示條 (Indicator)。

---

## 2. 技術實作 (Technical Implementation)

### 2.1 導航結構 (Navigation Structure)
定義於 `NAV_GROUPS` 常數。
*   包含 5 個群組，每個群組定義了 `category` 名稱、代表色、以及子項目 `items`。
*   每個 Item 包含 `id`, `label`, `icon`, `charColor`。

### 2.2 狀態管理
*   **`expandedGroups` (Set<string>)**: 追蹤目前展開的群組。
*   **`isCollapsed` (boolean)**: 控制側邊欄的寬度 (w-60 vs w-20)。
*   **`theme`**: 切換 Tailwind 的 `dark` class。

### 2.3 視覺邏輯
*   **精簡模式**:
    *   隱藏群組標題與 Item 文字。
    *   Item 圖示置中。
    *   Hover 時顯示原生 `title` 提示。
    *   強制鎖定分組為「視覺上展開」，但在 DOM 結構上移除折疊控制鈕。
*   **自動滾動**: 內容區域使用 `flex-1 overflow-y-auto`，確保在小螢幕高度下仍可滾動查看所有選項。

---

## 3. UI/UX 排版設計 (UI Layout)

### 3.1 頂部品牌區 (Brand Header)
*   顯示 App Logo 與名稱。
*   點擊 Logo 可快速返回首頁 (`home`)。
*   在精簡模式下僅顯示 Logo。

### 3.2 導航列表 (Nav List)
*   **群組標題**: 點擊可折疊/展開該群組。左側有色條標示群組顏色。
*   **連結項目**:
    *   **Normal**: 灰色文字，透明背景。
    *   **Active**: 淺灰色背景，文字變深，左側出現該功能代表色 (charColor) 的指示條。
    *   **Hover**: 圖示輕微放大。

### 3.3 底部操作區 (Footer Actions)
*   **主題切換鈕**: 太陽/月亮圖示切換。
*   **收合控制鈕**: 僅在桌機版顯示，切換側邊欄寬度。
*   **版權宣告**: 僅在展開模式下顯示。

---

## 4. 模組依賴 (Module Dependencies)

*   `src/components/layout/Sidebar.tsx`
*   `src/components/icons/TrophyIcon.tsx`
*   `src/config/uiText.ts`
*   `src/config/config/constants.ts` (引用 `CHARACTERS` 顏色)
