# 🗄️ 後端資料庫客戶端 (Supabase Client)

> **Document Name**: SERVICE_SUPABASE_CLIENT.md
> **Version**: v1.0.0
> **Date**: 2026-03-19

**文件代號**: `SERVICE_SUPABASE_CLIENT`
**檔案路徑**: `api/_lib/supabase.ts`
**主要用途**: 供應受防護的高級金鑰權限連線例項，專為 API Route 這類封閉受信任後端環境而生。

---

## 1. 功能概述 (Feature Overview)
提供經過環境變數認證的 `supabaseAdmin` 物件。由於本物件具備跨越 RLS（列級安全策略）的破壞級覆寫權力，故設計規定僅存在於 `api/` 下層。

## 2. 技術實作 (Technical Implementation)
*   **初始化器**: 結合 `process.env.SUPABASE_URL` 與金鑰 `SUPABASE_SERVICE_ROLE_KEY` 調用 `@supabase/supabase-js` 的 `createClient` 產生上帝視角的連線。
*   **多型別名 (Naming Alias)**: 透過導出 `export const supabase = supabaseAdmin;` 作為語法補丁，使所有的後續的 Service 層（原先可能使用公共客戶端）不需要更動引用的命名習慣即可無縫升級為安全端點。

## 3. 模組依賴 (Module Dependencies)
*   `@supabase/supabase-js`
