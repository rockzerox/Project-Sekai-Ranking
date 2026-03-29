# 🪝 前端資料鉤子規格書 (Hooks Specification)

> **Document Name**: HOOKS_SPECIFICATION.md
> **Version**: v1.1.0
> **Date**: 2026-03-29

**文件代號**: `HOOKS_SPECIFICATION`
**檔案路徑**: `src/hooks/useRankings.ts`, `src/hooks/useEventList.ts`
**主要用途**: 統整並規範 Frontend 畫面層對活動清單與大一統榜單 API 的資料獲取與全域快取控制。

---

## 1. 功能概述 (Feature Overview)
本規格書定義了 `useRankings` 與 `useEventList` 兩大核心 React Hook 的職責。它們作為「視圖層 (View)」與「 API 路由層 (Backend)」的唯一橋樑，集中管理載入狀態 (Loading)、錯誤擷取 (Error Boundary) 與本機快取 (Caching)。

## 2. 技術實作 (Technical Implementation)

### 2.1 大一統榜單鉤子 (`useRankings.ts`)
*   **用途**: 管理現時/歷史活動的排行榜、特定邊線、以及面板的時程同步。
*   **狀態流轉**:
    *   `lastUpdated`: 寫死為「呼叫 API 成功並取得響應之**本機當下時間**」，確保完全即時。
    *   `liveEventTiming`: 擷取自 API 的 `closed_at` 與 `aggregate_at`，作為防護空窗期計時器被 Unmount 的生命週期依賴。
    *   `transformRankingsData`: 隔離於 Hooks 外部的純函數，阻斷重新指派屬性時引發的 HMR 無限重啟鏈。
*   **介面定義 (重點擷取)**:
```typescript
interface UseRankingsReturn {
    rankings: RankEntry[];           // 當前活動總榜清單 (已排序)
    worldLinkChapters: Record<string, RankEntry[]>; // 特化章節清單 (以 charId 為 key)
    liveEventTiming: { startAt: string, aggregateAt: string, rankingAnnounceAt: string } | null;
    fetchRankings: (eventId: number | 'live') => Promise<void>;
}
```

### 2.2 活動清單鉤子 (`useEventList.ts`)
*   **用途**: 應用程式首次掛載時，獲取遊戲歷史至今所有的活動索引 (EventSummary)。
*   **邏輯**: 使用通用的 `fetchJsonWithBigInt` 防止大數流失，並於內部自動進行 ID 降冪排序。

## 3. 模組依賴 (Module Dependencies)
*   **組件引用**: `LiveEventView`, `PastEventDetailView`, `PastEventsView`
*   **依賴工具**: 利用內部抽離的 `fetchJsonWithBigInt` (內含 Regex) 解析 Hisekai 傳回之十幾位數的超長 ID 防止 JavaScript 精度問題。
