# 📄 專案結構規格書 (Project Structure)

**撰寫日期**: 2026-03-16
**版本號**: 2.0.0

本文件詳細說明 **Hi Sekai TW** 的專案目錄結構，旨在協助開發者快速定位程式碼與資源。

## 1. 目錄結構概覽

```text
root/
├── api/                    # Vercel API Routes (Serverless Functions)
│   ├── _lib/               # 後端共享邏輯與服務層 (Service Layer)
│   └── ...                 # 各 API 端點
├── docs/                   # 專案規格書與技術文件 (Mermaid 序列圖)
├── public/                 # 放置靜態資源 (images)
├── src/                    # 原始碼目錄
│   ├── components/         # React 組件
│   │   ├── charts/         # 自定義 SVG 圖表組件
│   │   ├── layout/         # 全域佈局 (Sidebar, Navbar)
│   │   ├── pages/          # 核心功能視圖 (Live, Trend, Analysis, etc.)
│   │   └── ui/             # 原子級 UI 組件 (Card, Button, Tooltip)
│   ├── config/             # 遊戲常數與 UI 文字設定
│   ├── contexts/           # ConfigContext (全域狀態與顏色映射)
│   ├── data/               # 前端靜態資料 (如 eventDetail.json)
│   ├── hooks/              # 業務邏輯與 API 請求封裝 (useRankings, useEventList)
│   ├── services/           # 前端專用服務 (Card, FeatureFlag)
│   ├── utils/              # 核心演算法 (U(K), WL 校正, 時間處理)
│   ├── App.tsx             # 視圖切換與根邏輯
│   └── index.tsx           # 應用程式進入點
├── package.json            # 依賴管理
├── tailwind.config.js      # 樣式系統配置
└── vite.config.ts          # Vite 設定
```

## 2. 目錄職責說明

*   **`api/_lib/`**: **後端服務層**。封裝所有與外部 API (Hi Sekai API, Supabase) 的互動邏輯，隔離資料獲取細節，供 API Routes 使用。
*   **`docs/`**: 存放所有功能頁面規格書、資料庫結構文件 (`DATABASE_SCHEMA.md`) 與技術文件。
*   **`src/components/`**: 遵循原子設計原則，將 UI 拆分為獨立、可複用的組件。
*   **`src/services/`**: **前端服務層**。處理僅限前端使用的邏輯（如卡片資料快取、功能旗標）。
*   **`src/hooks/`**: 封裝組件級別的業務邏輯，如資料快取、狀態處理。
*   **`src/utils/`**: 存放純函式 (Pure Functions)，如數學計算、時間格式化，不依賴 React 狀態。
