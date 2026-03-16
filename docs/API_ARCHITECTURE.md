# API 架構規格書 (API Architecture Specification)

## 1. 功能概述
本專案採用「雙軌制 API 架構」，以確保在 Gemini AI Studio (本地開發環境) 與 Vercel (正式部署環境) 之間擁有一致的業務邏輯與開發體驗。

## 2. 核心架構設計

### 2.1. 三層式架構
為了實現職責分離 (Separation of Concerns)，專案分為以下三層：
1.  **邏輯層 (`api/_utils/`)**：
    *   核心業務邏輯所在地。
    *   負責 Supabase 查詢、Hisekai API 請求、資料格式轉換與容錯邏輯。
    *   **自給自足規範**：`api/` 下的所有檔案必須獨立運行，不應引入 `src/` 目錄下的任何模組。
    *   **核心模組**：
        *   `withFallback.ts`: 核心容錯包裝器。
        *   `supabase.ts`: 統一的 Supabase Admin Client。
        *   `hisekaiClient.ts`: Hisekai API Fetch 封裝。
        *   `eventsService.ts`, `rankingsService.ts`, `statsService.ts`, `dataService.ts`: 業務邏輯服務。
2.  **本地預覽層 (`server.ts`)**：
    *   基於 Express。
    *   僅用於 Gemini AI Studio 的本地預覽。
    *   作為 `api/_utils/` 的 Wrapper，將 Service 的結果透過 Express 路由回傳。
3.  **正式部署層 (`api/` 目錄)**：
    *   基於 Vercel API Routes (Serverless Functions)。
    *   用於正式部署到 Vercel。
    *   同樣作為 `api/_utils/` 的 Wrapper，符合 Vercel 的函式規範。

### 2.2. 容錯架構 (Fault-Tolerance Architecture)
為了確保高可用性，正式部署層 (`api/`) 導入了 `withFallback` 機制：

1.  **第一層：Supabase (Primary)**
    *   優先從 Supabase 讀取預計算或已入庫的資料。
    *   優點：極速回應、減少對原始 API 的壓力。
2.  **第二層：Hisekai API (Fallback)**
    *   若 Supabase 無資料或查詢失敗，自動轉向原始 API (`api.hisekai.org/tw`)。
    *   優點：確保資料即時性與完整性。
3.  **第三層：Stale Cache (Last Defense)**
    *   若前兩者皆失敗，回傳記憶體中最近一次成功的快取資料。
    *   優點：在極端故障情況下仍能提供基本服務。

### 2.3. 資料處理流程
所有 API 請求均遵循以下流程：
1.  **觸發**：前端呼叫 `/api/...`。
2.  **路由分發**：
    *   本地環境：由 `server.ts` 攔截。
    *   正式環境：由 Vercel 根據 `api/` 目錄分發至對應的 Serverless Function。
3.  **容錯執行 (`withFallback`)**：
    *   呼叫 `supabaseAdmin` 進行資料庫查詢。
    *   必要時呼叫 `fetchHisekai` 進行 API 請求。
4.  **回傳**：回傳統一包裝格式：
    ```json
    {
      "source": "supabase" | "hisekai" | "stale-cache",
      "data": { ... }
    }
    ```

## 3. API 端點列表

### 3.1. 活動相關 (Events)
| 端點路徑 | 方法 | Service 函式 | 功能描述 |
| :--- | :--- | :--- | :--- |
| `/api/event/list` | GET | `getEventsList` | 取得所有活動列表 |
| `/api/event/:id` | GET | `getEventById` | 取得特定活動詳細資料 |

### 3.2. 排名相關 (Rankings)
| 端點路徑 | 方法 | Service 函式 | 功能描述 |
| :--- | :--- | :--- | :--- |
| `/api/event/live/top100` | GET | `getLiveRankings` | 取得當前活動 Top 100 |
| `/api/event/:id/top100` | GET | `getPastRankings` | 取得歷史活動 Top 100 |
| `/api/event/live/border` | GET | `getBorderRankings` | 取得當前活動榜線 |
| `/api/event/:id/border` | GET | `getBorderRankings` | 取得歷史活動榜線 |

### 3.3. 玩家與資料 (Data)
| 端點路徑 | 方法 | Service 函式 | 功能描述 |
| :--- | :--- | :--- | :--- |
| `/api/user/:id/profile` | GET | `getPlayerProfile` | 取得玩家個人資料 |
| `/api/song/list` | GET | `getSongsData` | 取得歌曲資料庫 |

## 4. 安全性與環境變數
*   **環境變數管理**：
    *   前端僅使用 `VITE_` 開頭的變數。
    *   後端 Service 優先使用 `SUPABASE_SERVICE_ROLE_KEY` 等安全金鑰，不暴露於前端。
*   **CORS 與權限**：Vercel 環境下透過 `vercel.json` 或 API Header 進行安全管控。
*   **Cron 安全**：預計算 API 將加入 `CRON_SECRET` 驗證機制。
