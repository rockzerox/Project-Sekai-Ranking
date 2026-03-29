# 🛠️ 腳本系統與維護規格書 (Scripts Specification)

**撰寫日期**: 2026-03-24
**版本號**: 1.0.0

**文件代號**: `SCRIPTS_SPECIFICATION`
**檔案路徑**: `scripts/`
**主要用途**: 管理應用程式所有離線任務、自動化 Cron Job 以及資料庫維護性工作，負責數據的抓取、回填與結構化處理。

---

## 1. 腳本架構設計 (Scripts Architecture)

本專案採用三層分類架構，旨在區分自動化執行與人工維護腳本，並保留遷移歷史。

### 1.1 `scripts/cron/` (自動化定期執行)
*   **用途**: 由 GitHub Actions 或 Vercel Cron 定時啟動，負責維護現時數據。
*   **核心腳本**:
    *   `cron-runner.ts`: **入口中心**。負責檢查現時活動、抓取即時排名數據、更新玩家統計五維數據，並處理結束後的數據結算。

### 1.2 `scripts/maintenance/` (手動維護與回填)
*   **用途**: 處理資料不一致修正、歷史數據補齊或一次性的大規模統計重算。
*   **核心腳本**:
    *   `backfill-rankings.ts`: 用於回填過往特定活動的榜單數據至 Supabase。
    *   `sync-event-meta.ts`: 與外部 API 同步活動基礎資訊 (如名稱、開始/結束時間)。
    *   `migrate-historic-stats.ts`: 將歷史榜單數據轉換為系統所需的「五維玩家統計」格式。

### 1.3 `scripts/archived/` (歸檔記錄)
*   **用途**: 已完成的一次性遷移腳本，不再執行但保留用於程式碼追蹤。
*   **內容包含**: 舊版的卡片、歌單與團體遷移邏輯。

---

## 2. 執行規範 (Execution Guidelines)

### 2.1 共享邏輯
*   所有腳本統一引用 `scripts/_client.ts` 來存取 Supabase Admin 客戶端。
*   腳本必須支援 `dotenv` 以加載本地開發環境變數。

### 2.2 錯誤處理
*   所有 Cron 腳本必須包含全域 `try/catch` 塊。
*   執行結果建議寫入 log 檔案或透過外部監控系統回傳失敗通知。

### 2.3 執行範例
```bash
# 使用 tsx 直接在本機執行維護腳本
npx tsx scripts/maintenance/sync-event-meta.ts
```

---

## 3. 模組依賴 (Module Dependencies)

*   `api/_lib/services/`: 腳本經常調用 Service Layer 的邏輯以重用業務規則。
*   `eventDetail.json`: 作為活動中繼資料的本地緩存來源。

---

## 4. 變更日誌 (Change Log)

*   **v1.0.0 (2026-03-24)**: 建立全域腳本規範文件，並將腳本體系正式區分為 Cron/Maintenance/Archived 三大分類。
