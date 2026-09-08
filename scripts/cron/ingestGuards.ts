/**
 * scripts/cron/ingestGuards.ts
 * 
 * 排程資料寫入斷路器 (Circuit Breakers)
 * 提供純函式檢查，防止排程在解析失敗時破壞性清空或寫入錯誤資料。
 */

export function assertIngestSafety(allRankings: any[], ev: any, eventId: number): void {
  const wlRows = allRankings.filter(r => r.chapter_char_id !== -1);
  const isWlEvent = Array.isArray(ev?.chapters) && ev.chapters.length > 0;
  if (allRankings.length === 0) {
    throw new Error(`[cron] 活動 ${eventId} 解析出 0 筆排名，中止以避免清空既有資料`);
  }
  if (isWlEvent && wlRows.length === 0) {
    throw new Error(`[cron] WL 活動 ${eventId} 總榜 ${allRankings.length} 筆但章節 0 筆，疑似章節解析失效，中止以避免刪除既有章節資料`);
  }
}
