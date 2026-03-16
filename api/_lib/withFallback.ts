import type { VercelResponse } from '@vercel/node';

/**
 * 容錯架構核心 (Fault-Tolerance Core)
 * 實現 Supabase -> Hisekai API -> Stale Cache 的三層降級邏輯。
 */

export type DataSource = 'supabase' | 'hisekai' | 'stale-cache' | 'error';

// 記憶體內的過期快取 (Stale Cache)
// 在同一個 Serverless 實例生命週期內有效
const memCache = new Map<string, { data: unknown; ts: number }>();
const STALE_TTL = 30 * 60 * 1000; // 30 分鐘

export async function withFallback<T>(
  res: VercelResponse,
  cacheKey: string,
  primary: () => Promise<T | null>,    // ① 主要來源：Supabase
  secondary: () => Promise<T>,         // ② 備援來源：hisekai API
  cacheControl = 's-maxage=300, stale-while-revalidate=60'
): Promise<void> {
  // 設定 Vercel Edge Cache Header
  res.setHeader('Cache-Control', cacheControl);

  // ① 第一層：Supabase
  try {
    const data = await primary();
    const isEmpty = Array.isArray(data) ? data.length === 0 : data == null;
    
    if (!isEmpty) {
      memCache.set(cacheKey, { data, ts: Date.now() });
      return void res.json({ source: 'supabase' satisfies DataSource, data });
    }
    // 若資料庫為空，視為尚未同步，進入下一層
  } catch (e) {
    console.warn(`[Supabase Fallback] 查詢失敗 (${cacheKey}):`, e);
  }

  // ② 第二層：hisekai API
  try {
    const data = await secondary();
    memCache.set(cacheKey, { data, ts: Date.now() });
    return void res.json({ source: 'hisekai' satisfies DataSource, data });
  } catch (e) {
    console.warn(`[Hisekai Fallback] 請求失敗 (${cacheKey}):`, e);
  }

  // ③ 第三層：最後防線 - Stale Cache
  const cached = memCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < STALE_TTL) {
    console.warn(`[Stale Cache] 提供過期資料 (${cacheKey})`);
    return void res.json({ source: 'stale-cache' satisfies DataSource, data: cached.data });
  }

  // 最終失敗
  res.status(503).json({
    source: 'error' satisfies DataSource,
    error: '所有資料來源均無法使用，請稍後再試。'
  });
}
