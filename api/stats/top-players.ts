import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { withFallback } from '../_lib/withFallback';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { unit_id = 0, limit = 50 } = req.query;

  // 活躍玩家統計每次活動結束後才會更新，CDN 快取 10 分鐘
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=120');

  return withFallback(
    res,
    `top-players-${unit_id}-${limit}`,
    // ① 主要來源：Supabase
    async () => {
      const { data, error } = await supabase
        .from('player_activity_stats')
        .select(`
          user_id,
          top100_count,
          specific_rank_counts,
          players!inner (
            user_name
          )
        `)
        .eq('unit_id', Number(unit_id))
        .order('top100_count', { ascending: false })
        .limit(Number(limit));

      if (error) throw error;
      return data;
    },
    // ② 備援來源：無 (目前 Hisekai API 沒有提供此類聚合統計)
    async () => []
  );
}
