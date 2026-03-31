# Project Sekai Ranking Documentation Change Log
> **Document Name**: docs_change_log.md
> **Version**: v1.6.0
> **Date**: 2026-03-31

## [v1.6.0] - 2026-03-31
### 🏷️ 品牌重塑 (Rebranding)
- **品牌更名**：正式將專案名稱從 "Hi Sekai TW" 更名為 **"PJSK TW Observatory｜世界計畫台服排名觀測站"**。
- **UI 更新**：同步更新 `src/config/uiText.ts` 中的 `siteName` 與首頁標題，以及 `index.html` 的瀏覽器標籤名稱。
- **中繼資料**：更新 `package.json` (slug: `pjsk-tw-observatory`), `metadata.json` 與開發腳本的啟動日誌。
- **規格書同步**：全面更新 `README.md`, `PRODUCT_POLICY.md`, `DEPLOYMENT.md`, `PROJECT_STRUCTURE.md`, `SERVICES_SPECIFICATION.md` 與 `PAGE_HOME.md` 中的品牌引用，確保內外文件一致性。
- **API 隔離**：保留所有對第三方 "Hi Sekai API" 的正確引用，僅更動本 App 自身的品牌標示。

## [v1.5.0] - 2026-03-29
### 🌐 World Link 全面升級 (Phase 2)
- **歷史參考線 (Phase 2A)**：在 `ConfigContext.tsx` 實作 `getPrevRoundWlChapterScore`，讀取 `WorldLinkDetail.json` 推算上輪邊線。並於 `LiveEventView` 中的圖表增繪角色專屬顏色的虛線（歷史分數指標）。
- **共用章節選擇器 (Phase 2B)**：將 WL Tabs 邏輯解耦為 `WorldLinkTabs.tsx` 共用組件，成功修復並應用於 `PastEventDetailView` 與 `LiveEventView` 中，並完善了未開始與結算中的狀態 UI 與倒數提示。
- **手機版排版優化 (Phase 2C)**：重構 `MobileHomeView.tsx`，大幅提升資訊密度，將倒數計時與更新時間同行顯示。並讓手機版首頁支援隱藏角色文字的精靈版 WL 切換 Tabs，實現首頁榜單隨章節即時切換。
- **規格書更新**：新增 `COMPONENT_WORLD_LINK_TABS.md`，並更新 `PAGE_LIVE_EVENT.md`, `PAGE_MOBILE_HOME.md`, `PAGE_PAST_EVENTS.md`, `HOOKS_SPECIFICATION.md`, `API_ARCHITECTURE.md` 反映 Phase 2 的實作與 API 擴充。

## [v1.4.0] - 2026-03-27
### 🌐 World Link 章節感知 (Phase 1)
- **GitHub Action**: 修復 `cron-runner.ts` 路徑錯誤導致的自動腳本失敗問題（改用 `npm run cron:run`），並同步更新了 `SERVICE_STATS_SERVICE.md` 的指令參照。
- **`timeUtils.ts`**: 新增 `getWlChapterTimings`，統一管理各章節自有的啟動、暖場、運算中狀態，並解耦全域活動狀態。
- **`LiveEventView.tsx`**: 改為獨立 2 分鐘前端心跳更新狀態。實作章節動態 disabled (Tooltip) 並在章節結算時（calculating）整併隱藏圖表與榜位並顯示對應倒數，完整解耦切換分頁與重置章節 tab 的副作用。
- **GitIgnore**: 新增 `plan/` 的過濾規則以避免設計稿污染版本庫。

## [v1.3.0] - 2026-03-22

### ⚡ 核心統計引擎升級 (5-Dimension Stats Engine)
- **`api/_lib/statsService.ts`**: `recomputeAllPlayerStats()` 全面重寫。從舊版雙維度 (`user_id`, `unit_id`) 升級為**五大維度**引擎 (`all`, `unit_id`, `story_type`, `banner`, `four_star_cards`)。強制加入 `chapter_char_id = -1` 過濾條件，修復 World Link 章節榜單被錯誤計入 `all` 維度的 Bug（導致幽靈次數約多 +6）。執行前先以 TRUNCATE/DELETE 清空資料表，確保無惡意殘留資料。
- **`scripts/cron-runner.ts`**: 移除內部舊版 `recomputeStats()` 實作，改為直接引入 `statsService.ts` 的新引擎統一管理。
- **`scripts/migrate-historic-stats.ts`**: 補上 `chapter_char_id = -1` 過濾條件，並新增清空資料表邏輯於遷移前統一執行。
- **`player_activity_stats` 重新匯入**: 以修復後的腳本清空並重建全服 79,567 筆統計記錄，資料已恢復正確狀態。

### 📚 規格書更新
- **`DATABASE_SCHEMA.md`** → v3.0.0: 補齊 `event_rankings`, `players`, `player_activity_stats`（含五維度複合主鍵說明）與 `wl_chapter_border_stats` 資料表規格。
- **`SERVICE_STATS_SERVICE.md`** → v2.0.0: 更新為五大維度引擎說明，加入 TRUNCATE 前置清空邏輯與 WL 過濾器說明。
- **`PAGE_PLAYER_ANALYSIS.md`** → v2.0.0: 更新 API 端點 (dimension_type/id 參數)、前端維度對映邏輯、霸榜率分母計算說明。

## [v1.2.0] - 2026-03-21

### 🐛 前端渲染修復
- **`PlayerAnalysisView.tsx`**: 移除殘留的 Dead Code 修復 `TypeError`，頁面恢復正常顯示資料。
- **後端資料去重**: 所有 `player_activity_stats` 分頁查詢加入穩定排序，避免資料在多頁中重複出現。

## [v1.1.0] - 2026-03-19
### 📝 Documentation & Standards
- **Guidelines**: Created `DOCUMENTATION_GUIDELINES.md` to establish global documentation constraints, metadata headers, structural templates, Mermaid diagram rules, and the "Archaeologist" tone.

### 🐛 Bug Fixes
- **Live Event Refresh Time**: Reverted the `lastUpdated` property in `useRankings.ts` to `new Date()` to correctly reflect the user's manual local fetch time.
- **Gap Countdown Timer**: Fixed the `EventHeaderCountdown` unmounting unexpectedly during event gaps by explicitly mapping Hisekai's `closed_at` API property in both the backend bridge and frontend state check.

## [v1.0.0] - 2024-05-23
### 🚀 Major Improvements (Unified Ranking API)
- **Backend**: Implemented `getUnifiedRankings` in `api/_lib/rankingsService.ts` to merge Top 100 and Border data into a single request.
- **Backend Routes**: Registered `/api/event/:id/rankings` and `/api/event/live/rankings` in `server.ts`.
- **Frontend Hook**: Refactored `useRankings.ts` to support unified data fetching and state synchronization, eliminating asynchronous race conditions during view transitions.
- **UI Components**: Updated `PastEventDetailView`, `LiveEventView`, `WorldLinkView`, and `ResourceEstimatorView` to utilize the new unified rankings API.
- **Charts**: Fixed `LineChart.tsx` and `ChartAnalysis.tsx` to handle rank-based filtering correctly (isolating Top 100 vs Highlights), resolving the "vertical line" and axis compression issues.

### 🏠 Documentation Structure
- Initialized documentation in `docs/` reflecting system architecture and individual page specifications.
- Added `unified_api_refactoring.md` for detailed migration technical specs.
