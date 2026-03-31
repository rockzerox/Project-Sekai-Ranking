# 📄 專案結構規格書 (Project Structure)

**撰寫日期**: 2026-03-22
**版本號**: 3.0.0

本文件詳細說明 **PJSK TW Observatory** 的專案目錄結構，旨在協助開發者與 AI 助手快速定位程式碼、腳本與規劃文件。

## 1. 目錄結構概覽

```text
root/
├── .agent/                 # ❤️ AI 助手協作核心 (Git-ignored)
│   ├── workflows/          # AI 自動化工作流 (.md 指令集)
│   ├── rules.md            # 專案專屬 AI 規範 (如隔離原則)
│   ├── docs_change_log.md  # 文件異動追蹤日誌
│   └── SESSION.md          # 任務進度與當前會話狀態
├── .github/                # GitHub Actions 工作流 (CI/CD)
├── api/                    # 🚀 Vercel Serverless Functions (後端)
│   ├── _lib/               # 後端共享邏輯與 Service Layer (不計入端點數量)
│   ├── [routes]/           # 各 API 端點 (event, song, stats, player, etc.)
│   └── supabase.ts         # 後端專用 Supabase Client
├── docs/                   # 📄 技術文件與頁面規格 (Markdown)
│   ├── architecture/       # 架構設計、資料庫與基礎環境設定
│   ├── components/         # 共用原子與自訂組件規格
│   ├── pages/              # 各功能頁面規格 (如 LIVE_EVENT)
│   └── services/           # 後端微服務與 API Logic 規範
├── scripts/                # 🛠️ 自動化與維護腳本 (分類管理)
│   ├── cron/               # 定期執行腳本 (如 cron-runner.ts)
│   ├── maintenance/        # 維護性工作 (Backfill, Fix-durations, etc.)
│   └── archived/           # 已過時或一次性遷移腳本
├── public/                 # 靜態資源 (images, icons)
├── src/                    # 💅 前端原始碼 (React + Vite)
│   ├── components/         # 原子化 React 組件 (UI, Layout, Charts)
│   ├── config/             # 遊戲常數、介面文字與 UI 配置
│   ├── data/               # 前端本地資料快取 (eventDetail.json)
│   ├── hooks/              # 封裝後的 React Hooks (API 請求與快取)
│   ├── lib/                # 前端第三方 SDK 適配 (如 supabase.ts)
│   ├── services/           # 前端業務邏輯服務層 (Card, Flag, Analytics)
│   ├── utils/              # 純函式工具 (時間格式化、HL 計算)
│   ├── App.tsx             # 路由與根頁面邏輯
│   └── index.tsx           # 進入點
├── vercel.json             # Vercel 部署配置
└── vite.config.ts          # Vite 建構配置
```

## 2. 目錄職責與設計模式

*   **`api/_lib/`**: **後端核心**。嚴格禁止在 API Routes 內撰寫長篇業務邏輯。所有資料獲取、計算與 DB 操作皆應封裝於此，確保端點檔案輕量化。
*   **`scripts/` (三層架構)**:
    *   `cron`: 僅放置由外部 Cron Job (如 Github Actions 或 Vercel Cron) 呼叫的常態性腳本。
    *   `maintenance`: 用於資料庫校正、歷史數據回填等手動執行的修護腳本。
    *   `archived`: 保存過去使用的遷移腳本（不再執行，僅供參考）。
*   **`.agent/`**: 專為 AI 協作設計的緩存區。其中 `rules.md` 是 AI 每一次工作的起點（Wake-up Protocol），`docs_change_log.md` 則確保文件同步的透明度。
*   **`docs/`**: 採用「行動文件」原則。當 API 或 UI 流程變動時，必須優先更新此目錄下的 `.md` 文件。
*   **`src/lib/` vs `src/services/`**:
    *   `lib`: 底層庫初始化（如 Supabase）。
    *   `services`: 高層級功能（如卡片渲染邏輯、追蹤標籤管理）。
