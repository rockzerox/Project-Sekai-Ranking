# 🏅 榜單微服務規格書 (Rankings Service)

> **Document Name**: SERVICE_RANKINGS_SERVICE.md
> **Version**: v1.0.0
> **Date**: 2026-03-19

**文件代號**: `SERVICE_RANKINGS_SERVICE`
**檔案路徑**: `api/_lib/rankingsService.ts`
**主要用途**: 構成「大一統 API」的核心服務，負責將不同來源或碎片的 Top 100 與 Border 數據跨系統合併為完整統一資料流。

---

## 1. 功能概述 (Feature Overview)
廢除了傳統的獨立呼叫端點。透過本服務的 `getUnifiedRankings` 作為守門員，負責將所有名次切面重新綁定對齊。消除了前端兩次非同步請求的競態條件與渲染順序錯位問題。

## 2. 技術實作 (Technical Implementation)
*   **`getUnifiedRankings(id, isLive)`**: 
    *   **即時模式 (`isLive === true`)**: 使用 `Promise.all` 並發呼叫 Hisekai API 的 top100 與 border 端點。將 `topData` 與 `borderData` 合併輸出，並**強制將 `end_at` 屬性精確對映為 `topData.closed_at`**，挽救計時器邏輯。
    *   **歷史模式 (`isLive === false`)**: 自 Supabase DB 中讀取，藉由建立 `.in(rank, [特定名次])` 與 `.lte(rank, 100)` 的高效率複合索引式查詢將歷史跨區拉回，並自建 `chapterRankingsMap` 還原為適用 World Link 的樹狀資料結構。

## 3. 模組依賴 (Module Dependencies)
*   內部依賴: `api/_lib/supabase.ts` (獲取 `supabaseAdmin`)
*   外部依賴: `process.env.HISEKAI_API_BASE` (防呆降級支援)
