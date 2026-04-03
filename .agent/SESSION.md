# 🕒 Session Context (上次更新: 2026-04-03)

## 🏁 目前狀態摘要 (Status Summary)
完成手機版 UX 第一波優化（5 項工作 / 8 個檔案）。TypeScript 編譯通過，等待使用者手機端實機驗證。

## ✅ 已完成事項 (Done)
**本次 Session：手機版 UX 優化實作**
- **[NEW] useMobile Hook** (`src/hooks/useMobile.ts`) — 統一 640px 斷點偵測，取代 3 處散落邏輯
- **RankingItem 字體縮減**：名次 `text-sm`、名稱 `text-xs`、頭像 `w-7 h-7`，手機端全面降一級
- **安全線/死心線**：移除 `hidden sm:flex`，現在直立手機也可見
- **綠點指示器**：≤2 分鐘上線在頭像右下角顯示 `animate-pulse` 綠點（僅 `isLiveEvent`）
- **月亮休息條**：>2 分鐘顯示月亮 icon + cyan 品牌色進度條（0-24h 刻度）+ 離線時間標籤
- **手機版不分頁**：LiveEventView + PastEventDetailView 手機端直接回傳全 100 筆
- **Pagination 手機端**：數字頁按鈕 `!isMobile` 隱藏，精彩片段按鈕保留
- **LiveEventView Header 壓縮**：手機端 `sm:hidden` 緊湊排（小圖+名稱+倒數一行）、桌面端 `hidden sm:block` 保留 Grid
- **CollapsibleSection**：標題 `text-base sm:text-lg`
- **LineChart**：`{false && isMobile &&` 停用橫向提示，代碼保留備用

**前次 Session：**
- 品牌重塑至 PJSK TW Observatory，Git 已推送

## 🚩 下次開始建議 (Next Action)
- **等待使用者手機實機回饋**（字體密度、休息條可讀性、Header 排版）
- 根據回饋決定是否微調（特別是 Header 資訊排版）
- 之後繼續：社群夥伴引流區塊 + UnitAnalysis/CharacterAnalysis 路由復活

## 💡 關鍵備忘 (Critical Notes)
- `useMobile` 使用 640px（`sm` 斷點）；App.tsx 框架層繼續使用 768px（`md`）不動
- 月亮 icon path: `M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z`（與 MobileHeader 同款）
- 休息條：進度條反映「離線時長」，不是「剩餘時間」，越滿代表越久未上線
- 品牌定位：`PJSK TW Observatory`（觀測站），資料來源 `Hi Sekai API`（合作方）
