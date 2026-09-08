# 🛠️ 腳本系統與維護規格書 (Scripts Specification)

**撰寫日期**: 2026-03-24
**更新日期**: 2026-09-08
**版本號**: 1.2.0

**文件代號**: `SCRIPTS_SPECIFICATION`
**檔案路徑**: `scripts/`
**主要用途**: 管理應用程式所有離線任務、自動化 Cron Job 以及資料庫維護性工作，負責數據的抓取、回填與結構化處理。

---

## 1. 腳本架構設計 (Scripts Architecture)

本專案採用三層分類架構，旨在區分自動化執行與人工維護腳本，並保留遷移歷史。

### 1.1 `scripts/cron/` (自動化定期執行)
*   **用途**: 由 GitHub Actions 或 Vercel Cron 定時啟動，負責維護現時數據。
*   **核心腳本**:
    *   `cron-runner.ts`: **入口中心**。負責同步活動中繼資料、自動識別 WL 活動並將原生 `chapters` 合併寫入 `events.extra_data`、抓取即時排名數據、動態計算各章節 `duration_days` 寫入 `wl_chapter_border_stats`（含特殊終章 `character: 0`），並更新玩家統計五維數據。內建調用 `ingestGuards.ts` 雙層斷路器，當解析結果異常時主動拋出錯誤中斷整輪排程，防止觸發破壞性清空資料庫。
    *   `ingestGuards.ts`: **(2026-09 新增)** 獨立斷路器純邏輯模組。匯出 `assertIngestSafety` 函式，防禦「全榜 0 筆解析失敗」與「WL 活動總榜存在但章節 0 筆遺失」兩大故障型態，零外部依賴與副作用，便於獨立單元測試與安全防護。

### 1.2 `scripts/maintenance/` (手動維護與回填)
*   **用途**: 處理資料不一致修正、歷史數據補齊或一次性的大規模統計重算。
*   **核心腳本**:
    *   `backfill-events-chapters.ts`: **(WL 重構新增)** 取得 Hisekai 原生章節資料，以合併模式回填至 Supabase `events.extra_data.chapters`，並保持行級快照 `_bak_events_extra_data` 備份。
    *   `backfill-wl-borders.ts`: **(WL 重構更新)** 透過 API 動態計算歷史各章天數，回填所有 World Link 活動各章節的榜線數據至 `wl_chapter_border_stats`。
    *   `backfill-rankings.ts`: 用於回填過往特定活動的榜單數據至 Supabase。
    *   `sync-event-meta.ts`: 與外部 API 同步活動基礎資訊 (如名稱、開始/結束時間)。
    *   `migrate-historic-stats.ts`: 將歷史榜單數據轉換為系統所需的「五維玩家統計」格式。

### 1.3 `scripts/archived/` (歸檔記錄)
*   **用途**: 已完成的一次性遷移腳本，不再執行但保留用於程式碼追蹤。
*   **內容包含**: 舊版的卡片、歌單與團體遷移邏輯。

---

## 2. 執行規範 (Execution Guidelines)

### 2.1 共享邏輯
*   所有腳本統一引用 `scripts/_client.ts` 或使用 `createClient` 存取 Supabase Admin 客戶端。
*   腳本必須支援 `dotenv` 以加載本地開發環境變數。

### 2.2 錯誤處理
*   所有 Cron 腳本必須包含全域 `try/catch` 塊。
*   執行結果建議寫入 log 檔案或透過外部監控系統回傳失敗通知。

### 2.3 執行範例
```bash
# 使用 tsx 直接在本機執行維護腳本
npx tsx scripts/maintenance/backfill-events-chapters.ts
```

---

## 3. 模組依賴 (Module Dependencies)

*   `api/_lib/services/`: 腳本經常調用 Service Layer 的邏輯以重用業務規則。
*   `eventDetail.json`: 作為活動中繼資料的本地緩存來源（`WorldLinkDetail.json` 已淘汰並解除引用）。

---

## 4. 變更日誌 (Change Log)

*   **v1.2.0 (2026-09-08)**: 引入 `ingestGuards.ts` 獨立斷路器模組；在 `cron-runner.ts` 補齊 Hisekai 新 API 格式之 `userId` 解析（支援 `last_player_info.profile.id`）與章節相容鏈（`player_top_100_rankings` / `player_border_rankings`），並實裝雙層斷路防護機制。
*   **v1.1.0 (2026-08-25)**: WL API Chapters 重構更新：`cron-runner.ts` 與 `backfill-wl-borders.ts` 淘汰 `WorldLinkDetail.json` 靜態依賴改為原生動態計算；新增 `backfill-events-chapters.ts` 維護腳本。
*   **v1.0.0 (2026-03-24)**: 建立全域腳本規範文件，並將腳本體系正式區分為 Cron/Maintenance/Archived 三大分類。
