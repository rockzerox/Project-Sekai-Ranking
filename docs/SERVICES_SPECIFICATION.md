# 📄 服務層規格說明書 (Services Specification)

**撰寫日期**: 2026-03-16
**版本號**: 2.0.0

本文件詳細說明 **Hi Sekai TW** 服務層的架構與各模組職責。服務層分為 **前端服務層 (`src/services/`)** 與 **後端服務層 (`api/_utils/`)**，負責與外部資料來源 (Supabase, Hi Sekai API) 進行互動，並將處理後的資料提供給展示層 (Presentation Layer) 或 API 端點使用。

## 1. 架構概述

服務層採用 **解耦設計**，將 API 請求、資料正規化與業務邏輯封裝於獨立的服務類別或函式中。
*   **前端服務層**：處理 React 組件直接使用的邏輯（如卡片快取）。
*   **後端服務層**：處理 API Routes 使用的邏輯，符合 Vercel Serverless Functions 的部署規範。

## 2. 服務模組詳解

### 2.1. 前端服務層 (`src/services/`)

| 服務名稱 | 檔案路徑 | 職責說明 |
| :--- | :--- | :--- |
| **CardService** | `src/services/cardService.ts` | 處理卡片資料的獲取與轉換，包含卡片屬性、技能與數值解析。 |
| **FeatureFlagService** | `src/services/featureFlagService.ts` | 管理頁面功能開關與實驗性功能。 |

### 2.2. 後端服務層 (`api/_utils/`)
這些服務僅供 `api/` 下的 Serverless Functions 使用，確保後端邏輯自給自足，不引用 `src/` 目錄下的任何模組。

| 服務名稱 | 檔案路徑 | 職責說明 |
| :--- | :--- | :--- |
| **SupabaseClient** | `api/_utils/supabase.ts` | 統一的 Supabase Admin Client 配置。 |
| **HisekaiClient** | `api/_utils/hisekaiClient.ts` | Hisekai API 的 Fetch 封裝。 |
| **DataService** | `api/_utils/dataService.ts` | 處理基礎資料（如歌曲、玩家個人資料）的讀取。 |
| **EventsService** | `api/_utils/eventsService.ts` | 處理活動列表與活動詳情的獲取與同步。 |
| **RankingsService** | `api/_utils/rankingsService.ts` | 處理榜單數據（Top100/Border）的獲取與正規化。 |
| **StatsService** | `api/_utils/statsService.ts` | 處理統計運算與資料分析演算法。 |

## 3. 資料獲取策略 (Data Fetching Strategy)

本專案採用 **混合資料來源策略**：

1.  **優先查詢 Supabase**: 對於歷史戰績、歸檔資料，優先從 Supabase 查詢。
2.  **API 補強**: 若 Supabase 無資料，則降級請求 Hi Sekai API。
3.  **資料正規化**: 所有服務層函式回傳的資料皆會經過正規化處理，確保格式一致，方便展示層使用。

## 4. 序列圖範例 (Sequence Diagram)

```mermaid
sequenceDiagram
    participant View as 展示層 (Component)
    participant Service as 服務層 (Service)
    participant DB as Supabase
    participant API as Hi Sekai API

    View->>Service: 請求數據 (e.g., getRankings)
    Service->>DB: 查詢歷史數據
    alt 資料存在
        DB-->>Service: 回傳歸檔數據
    else 資料不存在
        Service->>API: 請求即時數據
        API-->>Service: 回傳數據
    end
    Service->>Service: 資料正規化
    Service-->>View: 回傳處理後的數據
```
