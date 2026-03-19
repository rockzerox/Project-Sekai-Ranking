# 🔌 外部 API 客戶端 (Hisekai Client)

> **Document Name**: SERVICE_HISEKAI_CLIENT.md
> **Version**: v1.0.0
> **Date**: 2026-03-19

**文件代號**: `SERVICE_HISEKAI_CLIENT`
**檔案路徑**: `api/_lib/hisekaiClient.ts`
**主要用途**: 高防禦性的特製 HTTP Catch 客戶端，攔截字串溢位變形並解決 JavaScript BigInt 原生缺陷。

---

## 1. 功能概述 (Feature Overview)
所有直接向目標第三方 Hisekai API 拉舉原始資料池的行為，在我們專案的規定中必須穿透此工具模組。這不僅保護了 JSON 架構不被怪異回應衝垮，也保全了我們伺服器端（Vercel）的記憶體安全。

## 2. 技術實作 (Technical Implementation)
*   **大數防丟失機制 `BIGINT_REGEX`**:
    原生的 `JSON.parse` 在面臨超過 15 位的識別 ID 時會因雙精確度浮點數特性導致尾端變異。此腳本透過正規表示式先將 JSON 中過大的整數套用引號化為字串，安全渡過 Parse 階段。
*   **記憶體溢位防禦 (OOM Guard)**:
    硬性鎖定回應 `MAX_RESPONSE_SIZE = 10 * 1024 * 1024` (10MB)。避免遭到超大惡意 payload 回塞，一經觸發立即強制拋出 `Error('API 回應過大')`。

## 3. 模組依賴 (Module Dependencies)
*   零依賴純 TypeScript 網路底層核心庫。
