import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withFallback } from '../../_utils/withFallback';

const HISEKAI_API_BASE = process.env.HISEKAI_API_BASE || 'https://api.hisekai.org/tw';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withFallback(
    res,
    'live-top100',
    // ① 主要來源：Supabase (Live 資料通常不在 DB，或由 Cron 更新)
    // 這裡我們暫時設為 null，讓它直接去抓 API，或者你可以從 DB 抓最近一次快取
    async () => null,
    // ② 備援來源：Hisekai API
    async () => {
      const response = await fetch(`${HISEKAI_API_BASE}/event/live/top100`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    }
  );
}
