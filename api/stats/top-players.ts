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
      // 1. 取得分頁後的排行榜數據 (用於顯示清單)
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

      // 2. 取得全域統計數據 (用於顯示 "共 XXX 人")
      // 為了解決 Supabase 1000 筆限制問題，我們分頁抓取所有活躍玩家統計
      let allStats: any[] = [];
      let from = 0;
      let hasMore = true;
      while (hasMore) {
        const { data: statsChunk, error: countErr } = await supabase
          .from('player_activity_stats')
          .select('top100_count, specific_rank_counts')
          .eq('unit_id', Number(unit_id))
          .range(from, from + 999);
        
        if (countErr) throw countErr;
        allStats = [...allStats, ...(statsChunk || [])];
        if (!statsChunk || statsChunk.length < 1000) {
          hasMore = false;
        } else {
          from += 1000;
        }
      }

      const metadata = {
        totalTop100: allStats.filter(s => s.top100_count > 0).length,
        rankCounts: {} as Record<number, number>
      };

      // 統計 1-10 名的不重複玩家數 (直接從完整數據中計算)
      for (let i = 1; i <= 10; i++) {
        metadata.rankCounts[i] = allStats.filter(s => (s.specific_rank_counts?.[i] || 0) > 0).length;
      }

      return { data, metadata };
    },
    // ② 備援來源：無 (目前 Hisekai API 沒有提供此類聚合統計)
    async () => ({ data: [], metadata: { totalTop100: 0, rankCounts: {} } })
  );
}
