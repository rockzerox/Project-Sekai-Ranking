# 📑 專案文件撰寫全域規範 (Project Documentation Guidelines)

> **Document Name**: DOCUMENTATION_GUIDELINES.md
> **Version**: v1.0.0
> **Date**: 2026-03-19

**文件代號**: `DOCUMENTATION_GUIDELINES`
**主要用途**: 定義並統一 Projekt Sekai Ranking 系統中所有規格書、架構文件與組件說明的文件撰寫風格與排版標準。

---

## 1. 核心撰寫原則 (Core Principles)

*   **專業口吻 (Professional Tone)**: 以「考古學家 (Archaeologist)」的視角與口吻撰寫。內容必須客觀、專業、嚴謹，在執行或描述複雜邏輯前，需進行深度分析與脈絡梳理。
*   **語言規範 (Language)**: 內文以繁體中文為主、英文為輔。專業技術術語、變數名稱、組件名稱必須保留原始英文（例如：Serverless Functions、`useEffect`、`fetch`）。
*   **雙語標題 (Bilingual Headers)**: 主章節大標題必須採用 `中文 (English)` 的雙語對照格式，且必須帶有數字層級編號，以便於閱讀與快速定位。

## 2. 文件頭部格式規範 (Metadata Header Standard)

每份 Markdown 文件建立時，必須在主標題下方強制加上 Metadata 區塊。

### 2.1 基礎資訊 (Blockquote 區塊)
必須使用 `>` 引用區塊包裹三個強制屬性：
```markdown
> **Document Name**: [檔案名稱.md]
> **Version**: v[大版.小版.修訂]
> **Date**: [YYYY-MM-DD]
```

### 2.2 延伸屬性 (粗體字區塊)
引用區塊下方補充文件分類資訊：
```markdown
**文件代號**: `[通常為大寫底線分隔，如 COMPONENT_NAME]` (若適用)
**檔案路徑**: `[對應的實體代碼路徑，如 src/components/.../xxx.tsx]` (若適用)
**主要用途**: [一句話精練描述本文件的目標或該模組的用途]
```

## 3. 內容架構模板 (Content Structure Template)

一份標準的組件或架構說明書，需盡量包含以下主題段落：

1.  **1. 功能概述 (Feature Overview)**: 說明該組件或系統模組在高階層面解決什麼問題。
2.  **2. 技術實作 (Technical Implementation)**: 包含 Props 介面定義 (需放 Code Block)、主要依賴的常數、引用的 Hook 物件、狀態流轉。
3.  **3. UI/UX 與排版設計 (UI Layout)** (若為前端畫面): 說明視覺外觀、特定模式下的呈現（如 Compact/Highlights 模式、響應式尺寸與互動反饋）。
4.  **4. 模組依賴 (Module Dependencies)**: 列出引用的內部實體檔案、子組件與重要的第三方庫。
5.  **5. 序列圖 或 架構圖 (Sequence / Architecture Diagram)**: 利用圖表釐清複雜資料請求或組件傳遞邏輯。

## 4. 圖表與渲染規範 (Visuals & Diagrams)

繪製 Mermaid 圖表時，必須嚴格遵守以下以相容 HackMD 與本地預覽的語法限制：
*   **禁用字元**: 嚴禁在語法中使用全形空格。
*   **特定標籤限制**: `subgraph` 標題內禁止使用 `<br/>` HTML 標記。
*   **換行限制**: 節點 (Node) 內部的文字換行最多僅限 1 次。
*   **線條樣式**: 盡量簡化線條上的文字，**絕對禁止**使用複雜或自定義的 `stroke-dasharray`。

## 5. 文件生命週期與存檔機制 (File Lifecycle & Saving Protocol)

1.  **雙重輸出 (Dual Output)**: 
    *   **背景存檔**: 文件必須準確存放於專案根目錄之 `docs/` 資料夾下 (*。
    *   **前端渲染**: 每次產出文件時，必須觸發建立專屬 **Artifact** 以利於左側窗格即時預覽與連動。
2.  **變更日誌 (Change Log)**: 
    *   對任何技術文件、專案架構或重大程式碼的變更，修改完成後**必須**同步更新 `docs/docs_change_log.md`。
    *   更新內容需簡潔明確，並根據修改範圍歸入對應標籤與日期之下。

> (*) 註：系統操作時應確保以絕對路徑將檔案正確寫入磁碟，同時滿足上述之要求。
