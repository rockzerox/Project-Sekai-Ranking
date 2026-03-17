import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { withFallback } from '../_lib/withFallback';

const HISEKAI_API_BASE = process.env.HISEKAI_API_BASE || 'https://api.hisekai.org/tw';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withFallback(
    res,
    'event-list',
    // ① 主要來源：Supabase
    async () => {
      // 設定快取：瀏覽器快取 5 分鐘，CDN 快取 1 小時 (s-maxage)
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .not('name', 'is', null)
        .not('name', 'eq', '')
        .order('id', { ascending: true });
      if (error) throw error;
      return data;
    },
    // ② 備援來源：Hisekai API
    async () => {
      const response = await fetch(`${HISEKAI_API_BASE}/event/list`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    }
  );
}
