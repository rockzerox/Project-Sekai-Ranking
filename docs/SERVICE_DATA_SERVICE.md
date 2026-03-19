# 📊 靜態資料微服務 (Data Service)

> **Document Name**: SERVICE_DATA_SERVICE.md
> **Version**: v1.0.0
> **Date**: 2026-03-19

**文件代號**: `SERVICE_DATA_SERVICE`
**檔案路徑**: `api/_lib/dataService.ts`
**主要用途**: 基礎的輕量級全反向代理中繼通道 (Proxy Gateway)，繞過跨域問題以保護前端直接取得原始 Metadata。

---

## 1. 功能概述 (Feature Overview)
簡單且封閉功能的橋段，為了防止第三方 API 改寫 CORS 限制或發生路由錯位，故於後端服務層搭建的獨立存取點，專供玩家簡歷查詢與全域歌曲資料抓取使用。

## 2. 技術實作 (Technical Implementation)
*   **`getPlayerProfile(userId)`**: 中繼對接外部的 `/user/{userId}/profile` 端點。
*   **`getSongsData()`**: 中繼對接 `/song/list` 獲取完整歌曲清單。
*   **極簡化回傳**: 本服務強烈限制不實踐 `JSON.parse` 也不在後端消耗記憶體。所有的調用皆使用原生的 `.text()` 原文傳遞，將結構分離與消耗交還給前端處理，確保 Serverless Function 執行在超短期生命週期內結束。

## 3. 模組依賴 (Module Dependencies)
*   外部依賴: `process.env.HISEKAI_API_BASE`
