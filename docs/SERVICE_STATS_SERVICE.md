# 📈 數據分析微服務 (Stats Service)

> **Document Name**: SERVICE_STATS_SERVICE.md
> **Version**: v2.0.0
> **Date**: 2026-03-22

**文件代號**: `SERVICE_STATS_SERVICE`
**檔案路徑**: `api/_lib/statsService.ts`
**主要用途**: 大量歷史數據的聚合計算引擎，負責生成五大維度玩家戰績統整資料表，供玩家分析頁面快速查閱。

---

## 1. 功能概述 (Feature Overview)

本模組主要被 **獨立排程腳本 (`scripts/cron/cron-runner.ts`)** 或 **一次性遷移腳本 (`scripts/maintenance/migrate-historic-stats.ts`)** 喚醒。不介入與前端搶奪回應時間的一線流程，負責將歷史原始資料聚合成「玩家活動統計表」或「活動分數線大表」。

---

## 2. 技術實作 (Technical Implementation)

### 2.1 `recomputeAllPlayerStats()` — 五大維度引擎

此函式為核心計算引擎，依活動資料計算五個維度的玩家前百統計，並回寫至 `player_activity_stats`。

**執行流程：**

1.  **清空資料表 (TRUNCATE/DELETE)**: 利用 `supabase.rpc('execute_sql', ...)` 先清空 `player_activity_stats`，避免因舊 Bug 遺留的幽靈資料污染新的計算結果。
2.  **讀取活動 Metadata**: 抓取全部 `events` 的 `id, unit_id, story_type, banner, four_star_cards`。
3.  **逐期掃描排行榜**: 對每一期活動，以 `chapter_char_id = -1` 過濾掉 World Link 章節榜單（僅計算一般排行榜），並以分頁 `while` 迴圈打破 Supabase 1000 行限制。
4.  **五大維度發配 (`addPoint`)**:
    -   `all` (維度 ID = 0): 任何進入前百的活動均計入。
    -   `unit_id` (維度 ID = 活動 unit_id): 僅有 `unit_id` 不為 `NULL` 的活動計入。
    -   `story_type` (維度 ID = 故事類型整數): `unit_event=1`, `mixed_event=2`, `world_link=3`, 其他=99。
    -   `banner` (維度 ID = Banner 角色 ID): 解析 Banner 欄位去除尾碼後的角色 ID。
    -   `four_star_cards` (維度 ID = 四星卡角色 ID): 陣列，逐一解析記入對應角色 ID。
5.  **批次 Upsert**: 以 `batchSize = 1000`，將展平後的五維維度資料批次回寫，`onConflict` 依 `(user_id, dimension_type, dimension_id)` 複合主鍵去重。

> [!IMPORTANT]
> `all` 維度的計數需大於（而非等於）`unit_id` 所有維度的加總，因為部分活動尚未填入 `unit_id`，這些 `NULL unit_id` 的活動仍會被計入 `all`，但不會產生 `unit_id` 維度記錄。

### 2.2 `getBorderStats()` — 榜線快取/降級雙軌機制

*   **優先 (Fast Path)**: 直接讀取預建好的 `event_border_stats` 和 `wl_chapter_border_stats` 表，追求 10ms 內的回傳。
*   **備援降級 (Fallback)**: 若快取表無資料，緊急從 `event_rankings` 實時聚合。

---

## 3. 模組依賴 (Module Dependencies)

*   內部依賴: `api/_lib/supabase.ts` (具備批次 Upsert 之 service_role 金鑰)
*   排程入口: `scripts/cron/cron-runner.ts` → 直接 `import { recomputeAllPlayerStats } from '../api/_lib/statsService.ts'`
*   遷移入口: `scripts/maintenance/migrate-historic-stats.ts` (包含同等五維邏輯，用於一次性歷史資料補建)
