# 📅 活動管理微服務 (Events Service)

> **Document Name**: SERVICE_EVENTS_SERVICE.md
> **Version**: v1.0.0
> **Date**: 2026-03-19

**文件代號**: `SERVICE_EVENTS_SERVICE`
**檔案路徑**: `api/_lib/eventsService.ts`
**主要用途**: 負責活動清單同步操作，保護手工設定檔不被自動作業覆蓋並定期汲取外部最新名錄。

---

## 1. 功能概述 (Feature Overview)
作為外部活動時程表與內部歷史資料庫的校正伺服器。提供基礎 GET 操作供前端畫出目錄牆 (List)，並備有一套嚴謹的狀態合併邏輯以支援每日的排程同步更新。

## 2. 技術實作 (Technical Implementation)
*   **`syncEvents()`**: 
    核心的資料 Upsert 校準器。比較外部 API 傳回之新資料，結合現存於本地表的資料池 `existingEventsMap`。能妥善地**保留人工維護的靜態標籤** (如 `unit_id`, `event_type`, `banner`) 並且無縫銜接官方新的 `start_at` 與 `closed_at` 時程表。
*   **`getEventsList()` / `getEventById()`**: 常用的唯讀端口，供 `api/event/list` 直接調用以串聯 `useEventList`。

## 3. 模組依賴 (Module Dependencies)
*   內部依賴: `api/_lib/supabase.ts` (提供關聯索引寫入)
