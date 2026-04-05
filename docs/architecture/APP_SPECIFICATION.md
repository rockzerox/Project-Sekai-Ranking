# 📄 根組件規格說明書 - 全域應用程式 (App Root)

**撰寫日期**: 2026-04-05
**版本號**: 1.0.3

**文件代號**: `APP_SPECIFICATION`
**檔案路徑**: `src/App.tsx`
**主要用途**: 作為應用程式的根組件 (Root Component)，負責全域狀態管理、 View 路由切換、響應式環境偵測以及整體佈局 (Layout) 整合。

---

## 1. 核心職責 (Core Responsibilities)

`App.tsx` 扮演整個前端應用的調度中心，核心職責包含：

### 1.1 視圖導航與路由 (View Routing)
*   **狀態控制**: 使用 `currentView` (ViewType) 控制目前顯示的功能模組。
*   **路由分發**: 透過 `viewContent()` 函式將對應的 View 組件渲染至 `<main>` 區域。
*   **重置機制**: 切換部分視圖時（如首頁），會自動觸發 `setSelectedEvent(null)` 以維持導航邏輯乾淨。

### 1.2 響應式環境偵測 (RWD Environment)
*   **即時監聽**: 透過 `isMobile` state 與 `useEffect` 監聽視窗寬度變動（臨界值 768px）。
*   **UI 切換**: 
    *   **Desktop**: 渲染 `Sidebar` (側邊欄)。
    *   **Mobile**: 渲染 `MobileHeader` (頂部) 與 `MobileTabBar` (底部)。

### 1.3 資料預加載 (Data Pre-fetching)
*   **事件列表**: 掛載時自動抓取所有活動 Metadata (`fetchAllEvents`) 並分發給各個子視圖使用。

---

## 2. 技術實作 (Technical Implementation)

### 2.1 全域 Layout 結構
```tsx
<div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen ...">
    {/* 導覽層 - 桌面版 */}
    <Sidebar ... />

    <div className="flex-1 w-full flex flex-col">
        {/* 導覽層 - 手機版 */}
        <MobileHeader ... />

        {/* 內容層 */}
        <main className="p-4 md:p-6 w-full custom-scrollbar pb-24 md:pb-6">
            <ErrorBoundary>
                {/* 手機首頁特殊分支 */}
                {currentView === 'home' && isMobile ? (
                    <MobileHomeView />
                ) : (
                    viewContent()
                )}
            </ErrorBoundary>
        </main>
    </div>

    {/* 導覽層 - 手機版底部 */}
    <MobileTabBar ... />
</div>
```

### 2.2 狀態定義 (State Management)
*   **`currentView`**: 目前渲染的視圖 ID。
*   **`isMobile`**: 布林值，決定渲染哪一套導覽元件。
*   **`theme`**: 日夜模式狀態，連動全域 `dark` class 與系統配色。

---

## 3. 模組依賴 (Module Dependencies)

*   `src/components/layout/Sidebar.tsx` (Desktop Navigation)
*   `src/components/layout/MobileHeader.tsx` (Mobile Brand Bar)
*   `src/components/layout/MobileTabBar.tsx` (Mobile Navigation Bar)
*   `src/components/pages/MobileHomeView.tsx` (Mobile Home Content)
*   `src/contexts/ConfigContext.tsx` & `FeatureFlagProvider` (全域 Context 注入)

---

## 4. 變更日誌 (Change Log)

*   **v1.0.3 (2026-04-05)**: `ChartAnalysis.tsx` 重大優化，包含文字簡化、新增 Top100 名次(T3/T10/T50/T100)分析切換、優化非 T100 席位死心線邏輯(僅限 100 名內)、新增「已確定」狀態，並修復 Highlights 與 Top100 視圖中 T100 剩餘席位不一致的計算 Bug。
*   **v1.0.2 (2026-04-05)**: 引入 `src/config/mobileTokens.ts` 手機版 Design Token 架構，重構 `Select`、`CollapsibleSection`、`RankingItem`、`EventFilterGroup`、`SortSelector` 共 5 個共用元件之 `sm:` 響應式 class，集中改為引用 Token 常數。視覺輸出不變，維護性大幅提升。
*   **v1.0.1 (2026-04-05)**: 修正 `ScrollToTop` 按鈕在手機版與 `MobileTabBar` 重疊的問題。
*   **v1.0.0 (2026-03-24)**: 加入手機版/桌面版 UI 互斥渲染邏輯，改用 reactive `isMobile` state 取代原本的靜態函式。
