import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withFallback } from '../../../lib/withFallback';

const HISEKAI_API_BASE = process.env.HISEKAI_API_BASE || 'https://api.hisekai.org/tw';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withFallback(
    res,
    'live-border',
    // ① 主要來源：Supabase (Live 資料通常不在 DB)
    async () => null,
    // ② 備援來源：Hisekai API
    async () => {
      const response = await fetch(`${HISEKAI_API_BASE}/event/live/border`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    }
  );
}
