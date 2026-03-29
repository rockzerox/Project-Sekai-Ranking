# 🧩 組件規格說明書 - World Link 標籤列 (World Link Tabs)

**撰寫日期**: 2026-03-29
**版本號**: 1.0.0

**文件代號**: `COMPONENT_WORLD_LINK_TABS`
**對應視圖**: `src/components/shared/WorldLinkTabs.tsx`
**主要用途**: 專為 World Link (WL) 類型活動設計的共用章節切換器組件，支援動態計時、狀態改變感知（未開始/準備中/進行中）與響應式佈局。

---

## 1. 功能概述 (Feature Overview)

本組件是 World Link 活動不可或缺的導航核心，它解析活動詳細設定與時間軸，為使用者提供直觀地切換「總榜」與「角色個人章節」排名的介面。組件已被廣泛運用於「現時活動 (Live Event)」、「歷史活動 (Past Events)」與「手機版首頁 (Mobile Home)」。

### 1.1 核心功能
*   **動態狀態按鈕 (Dynamic State Buttons)**: 
    *   **活動中/已結束**: 按鈕可用，顯示對應角色的代表色（當選中時滿版填充，未選中時為框線）。
    *   **未開始 (Not Started)**: 按鈕灰階且半透明 (`opacity-30 grayscale`)，無法點擊，懸停時顯示包含開播時間的 Tooltip。
    *   **準備中 (Warming)**: 排名數據結算前過渡期，無法點擊，懸停顯示「資料尚未就緒，請稍後」。
*   **響應式設計 (Responsive Design)**:
    *   **桌機版**: 顯示角色頭像 (Avatar) 與角色名稱。
    *   **手機版 (小螢幕)**: 自動隱藏文字（利用 `hidden sm:inline`），僅保留角色頭像，讓有限的螢幕寬度也能容納多至 6 個章節的按鈕。
*   **橫向滾動 (Horizontal Scroll)**: 外層容器帶有 `overflow-x-auto no-scrollbar`，確保在章節過多時也不會影響版面結構。

---

## 2. 介面定義 (Props Interface)

```typescript
export interface WorldLinkChapterTab {
    charId: string;           // 角色 ID ("1" ~ "26")
    status?: WlChapterStatus; // optional: 未傳入代表自由切換 (例如過去活動)
    startAt?: string;         // optional: 未開始時的倒數計時提示用
}

interface WorldLinkTabsProps {
    chapters: WorldLinkChapterTab[];   // 章節陣列，順序決定按鈕順序
    activeChapter: string;             // 當前選中的章節 (包含 'all')
    onChapterChange: (charId: string) => void; // 切換回呼事件
}
```

---

## 3. 模組依賴 (Module Dependencies)

*   **內部工具**: `../../utils/timeUtils.ts` (WlChapterStatus 定義)
*   **常數設定**: `../../config/constants.ts` (取得 `CHARACTERS` 以獲取角色顏色與名稱)
*   **樣式與資源**: `getAssetUrl` 取得頭像圖片 `Chibi/{charId}.png`。

---

## 4. 引用位置 (Usage Locations)

此組件目前主要供以下視圖引用：
1.  **`LiveEventView.tsx`**: 呈現即時活動排名。受限於現實時間，各章節會因為 `now` 的推移而自動解除鎖定狀態。
2.  **`MobileHomeView.tsx`**: 呈現在手機版首頁，讓資訊密度極高的情況下依舊能快速切換關注角色即時分數。
3.  **`PastEventDetailView.tsx`**: 在回顧歷史 WL 活動時提供，無狀態限制（所有按鈕均可自由切換）。
