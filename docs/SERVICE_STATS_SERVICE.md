# 📈 數據分析微服務 (Stats Service)

> **Document Name**: SERVICE_STATS_SERVICE.md
> **Version**: v1.0.0
> **Date**: 2026-03-19

**文件代號**: `SERVICE_STATS_SERVICE`
**檔案路徑**: `api/_lib/statsService.ts`
**主要用途**: 大量歷史數據的聚合計算引擎，負責生成百萬級戰績統整與提供快取邊線供全域介面查閱。

---

## 1. 功能概述 (Feature Overview)
本模組主要被非同步背景任務 (Cron Jobs) 喚醒。不加入與前端搶奪回應時間的一線流程，負責將笨重的歷史原始資料分而治之，聚合成如「玩家活動統計表」或「活動分數線大表」。

## 2. 技術實作 (Technical Implementation)
*   **`recomputeAllPlayerStats()`**: 
    1. 大量掃出 `event_rankings` 所有資料（排除 WL 特殊章節）。
    2. 建立二維記憶體字典 Map 操作，即時計算該名玩家在各式團體中達標 Top100 的佔比、以及所有歷史落點分佈。
    3. 群集切割後以 `batchSize = 500` 透過 `.upsert` 批次回寫進入 `player_activity_stats`，達成快速換血。
*   **`getBorderStats()`**: 採用快取/降級雙軌並行查詢機制。
    *   **優先 (Fast Path)**: 直接讀取已建好的 `event_border_stats` 以追求 10ms 內的回傳。
    *   **備援降級 (Fallback)**: 若失去快取表，將緊急從原始 `event_rankings` 以過濾陣列實時拉升進行聚合。

## 3. 模組依賴 (Module Dependencies)
*   內部依賴: `api/_lib/supabase.ts` (具備批次 Upsert 之強力覆寫金鑰)
