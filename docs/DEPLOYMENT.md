# 📦 Hi Sekai TW 專案落地與依賴說明書

**撰寫日期**: 2026-03-11
**版本號**: 1.1.0

本文件整理了將 **Hi Sekai TW** 從原型階段遷移至正式生產環境（Production）所需的技術堆疊與套件依賴。

## 1. 系統環境需求 (Prerequisites)

在開始安裝之前，請確保您的開發環境已安裝以下工具：

*   **Node.js**: 版本需 >= 18.0.0 (建議使用 LTS 版本)
*   **套件管理器**: npm (預設), yarn, 或 pnpm

---

## 2. 核心依賴 (Dependencies)

這些是應用程式運行時必須的套件。

| 套件名稱 | 用途說明 |
| :--- | :--- |
| **react** | 建立使用者介面的核心庫 (UI Library)。 |
| **react-dom** | 將 React 組件渲染至 DOM 的入口。 |

> **注意**：目前的程式碼使用原生 SVG 繪製圖表與圖示，且自行實作路由邏輯，因此不需要額外安裝 `react-router-dom`、`recharts` 或 `lucide-react` 等第三方庫，保持了極致的輕量化。

---

## 3. 開發與建置依賴 (DevDependencies)

這些套件僅在開發階段與編譯（Build）過程中使用，不會打包進最終的用戶端程式碼。

### 🛠️ 建置工具 (Build Tool)
| 套件名稱 | 用途說明 |
| :--- | :--- |
| **vite** | 下一代前端構建工具，提供極速的開發伺服器與打包功能。 |
| **@vitejs/plugin-react** | 讓 Vite 能夠編譯與處理 React 代碼 (HMR 等功能)。 |
| **typescript** | 提供靜態型別檢查，增強程式碼的健壯性與維護性。 |

### 🎨 樣式處理 (Styling)
目前專案使用 CDN 引入 Tailwind，但在正式落地時**必須**改為本地安裝，以支援 Tree-shaking (移除未使用的 CSS) 並優化效能。

| 套件名稱 | 用途說明 |
| :--- | :--- |
| **tailwindcss** | Utility-first CSS 框架。 |
| **postcss** | CSS 轉換工具，Tailwind 的依賴核心。 |
| **autoprefixer** | 自動為 CSS 加上瀏覽器前綴 (Vendor Prefixes)，確保跨瀏覽器相容性。 |

### 🧩 型別定義 (Type Definitions)
| 套件名稱 | 用途說明 |
| :--- | :--- |
| **@types/react** | React 的 TypeScript 定義檔。 |
| **@types/react-dom** | React DOM 的 TypeScript 定義檔。 |
| **@types/node** | Node.js 環境的型別定義 (用於設定檔等)。 |

### ☁️ 部署相關 (Deployment)
| 套件名稱 | 用途說明 |
| :--- | :--- |
| **@vercel/node** | 若部署至 Vercel，用於支援 Serverless API Function (`api/` 目錄下的檔案)。 |

---

## 4. 落地安裝流程 (Installation Guide)

若您將此程式碼下載至本地，請依序執行以下步驟：

### Step 1: 初始化專案
將所有檔案放入資料夾後，開啟終端機 (Terminal) 並執行：

```bash
npm install
```

### Step 2: 初始化 Tailwind CSS
由於從 CDN 轉為本地建置，需產生設定檔：

```bash
npx tailwindcss init -p
```

這會產生 `tailwind.config.js` 與 `postcss.config.js`。您需要修改 `tailwind.config.js` 的 `content` 陣列以指向您的檔案：

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 保持專案原有的暗色模式設定
  theme: {
    extend: {
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } }
      }
    },
  },
  plugins: [],
}
```

並在 CSS 入口檔 (需新增 `index.css`) 加入：
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 3: 啟動開發伺服器

```bash
npm run dev
```

### Step 4: 建置生產版本

```bash
npm run build
```

---

## 5. 專案結構建議

為了符合現代 React 專案標準，建議落地時調整檔案結構如下：

```text
root/
├── public/             # 放置靜態資源 (images, json data)
├── src/                # 原始碼目錄
│   ├── api/            # API 相關邏輯
│   ├── src/components/     # React 組件
│   ├── constants/      # 常數定義
│   ├── contexts/       # React Context
│   ├── hooks/          # Custom Hooks
│   ├── utils/          # 工具函式
│   ├── src/App.tsx         # 主應用組件
│   ├── src/index.tsx       # 進入點
│   └── src/types.ts        # 型別定義
├── docs/               # 專案文件
├── index.html          # HTML 模板 (需修改 script src 指向 /src/index.tsx)
├── package.json        # 依賴管理
├── tsconfig.json       # TypeScript 設定
└── vite.config.ts      # Vite 設定
```

## 1. 功能概述 (Feature Overview)

此頁面提供核心功能的概覽。

## 2. 技術實作 (Technical Implementation)

描述資料獲取與狀態管理邏輯。

## 3. UI/UX 排版設計 (UI Layout)

說明畫面佈局與互動設計。

## 4. 模組依賴 (Module Dependencies)

列出相關的組件與 Hooks。
