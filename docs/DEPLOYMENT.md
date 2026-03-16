# 📦 Hi Sekai TW 部署與生產環境說明書 (Deployment Guide)

**撰寫日期**: 2026-03-16
**版本號**: 2.0.0

本文件詳細說明 **Hi Sekai TW** 專案從開發環境遷移至正式生產環境（Production）的完整流程、架構要求、環境變數配置與維護指南。

---

## 1. 系統架構概述 (Architecture Overview)

本專案採用 **三層式架構 (Three-Tier Architecture)**，並針對高併發與資料一致性進行了優化：

*   **展示層 (Presentation Layer)**: 基於 React 18 的 SPA 應用，使用 Vite 進行打包與熱模組替換 (HMR) 開發。
*   **服務層 (Service Layer)**: 位於 `src/services/`，封裝所有業務邏輯與外部 API 互動，確保視圖層與資料來源解耦。
*   **資料層 (Data Layer)**: 採用混合資料來源策略：
    *   **Supabase (PostgreSQL)**: 儲存歸檔的歷史活動數據 (`event_border_stats`, `userWorldBloomChapterRankings`)，提供快速且穩定的查詢。
    *   **Hi Sekai API**: 提供即時活動數據，作為 Supabase 資料的補充來源。

---

## 2. 環境需求 (Prerequisites)

在部署至生產環境前，請確保伺服器環境滿足以下條件：

*   **Node.js**: 版本需 >= 18.0.0 (建議使用 LTS 版本)。
*   **Supabase 專案**: 需建立對應的 Supabase 專案，並完成資料表結構遷移。
*   **API 存取權**: 確保伺服器能正常存取 Hi Sekai API。

---

## 3. 環境變數配置 (Environment Variables)

生產環境必須配置以下環境變數。請參考 `.env.example` 建立 `.env` 檔案：

| 變數名稱 | 說明 | 是否必要 |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | 用於 Gemini AI 相關功能 | 是 |
| `SUPABASE_URL` | Supabase 專案 URL | 是 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服務帳號金鑰 (用於後端腳本與遷移) | 是 |
| `VITE_SUPABASE_URL` | 前端使用的 Supabase URL | 是 |
| `VITE_SUPABASE_ANON_KEY` | 前端使用的 Supabase 公開金鑰 | 是 |

> **安全提示**: `SUPABASE_SERVICE_ROLE_KEY` 僅限於後端腳本或伺服器端使用，**絕對不可**暴露於前端程式碼中。

---

## 4. 生產環境建置與啟動 (Build & Start)

本專案為全端應用 (Express + Vite)，生產環境建置流程如下：

### Step 1: 安裝依賴
```bash
npm install
```

### Step 2: 建置專案
執行 TypeScript 編譯與 Vite 打包：
```bash
npm run build
```
此指令會產生 `dist/` 目錄，包含靜態資源與編譯後的伺服器程式碼。

### Step 3: 啟動生產伺服器
專案使用 Express 作為生產環境伺服器，啟動指令為：
```bash
npm start
```
*(請確保 `package.json` 中的 `start` 腳本設定為 `node server.ts` 或對應的編譯後檔案)*

---

## 5. 部署指南 (Deployment Options)

### 5.1 Cloud Run (推薦)
本專案已針對 Cloud Run 容器化環境進行優化：
1.  確保 `Dockerfile` 正確設定 (使用 Node.js 18+ 基礎映像檔)。
2.  設定環境變數 (如第 3 節所述)。
3.  設定容器 Port 為 `3000` (平台強制規定)。

### 5.2 Vercel / 其他 PaaS
若部署至 Vercel，請注意：
*   需設定 `Build Command`: `npm run build`。
*   需設定 `Output Directory`: `dist`。
*   需設定 `Node.js` 版本為 18+。
*   API 路由需對應 `api/` 目錄結構。

---

## 6. 安全與維護 (Security & Maintenance)

### 6.1 資料庫規則 (Firestore/Supabase RLS)
*   **Supabase RLS**: 確保已啟用 Row Level Security，並設定嚴格的讀取權限，僅允許授權使用者存取特定資料。
*   **資料驗證**: 服務層 (`src/services/`) 已實作資料正規化，確保寫入資料庫的格式正確。

### 6.2 監控與錯誤處理
*   所有 API 請求皆封裝於服務層，並包含錯誤處理機制 (如 `try-catch` 與 `AbortController`)。
*   若發生 API 請求失敗，系統會自動記錄錯誤並嘗試降級查詢 Supabase。

### 6.3 故障排除 (Troubleshooting)
*   **API 請求失敗**: 檢查 `SUPABASE_URL` 與 `GEMINI_API_KEY` 是否正確。
*   **建置失敗**: 檢查 `package.json` 中的依賴版本是否與 `node_modules` 衝突，建議執行 `rm -rf node_modules package-lock.json && npm install`。
*   **容器啟動失敗**: 確認 `server.ts` 是否正確監聽 `0.0.0.0:3000`。
