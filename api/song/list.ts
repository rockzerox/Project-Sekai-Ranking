import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withFallback } from '../_utils/withFallback';

const HISEKAI_API_BASE = process.env.HISEKAI_API_BASE || 'https://api.hisekai.org/tw';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withFallback(
    res,
    'song-list',
    // ① 主要來源：Supabase (如果有的話，目前暫設為 null)
    async () => null,
    // ② 備援來源：Hisekai API
    async () => {
      const response = await fetch(`${HISEKAI_API_BASE}/song/list`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    }
  );
}
