import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { withFallback } from '../_lib/withFallback';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { dimension_type = 'all', dimension_id = 0, limit = 50 } = req.query;

  // 活躍玩家統計每次活動結束後才會更新，CDN 快取 10 分鐘
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=120');

  return withFallback(
    res,
    `top-players-${dimension_type}-${dimension_id}-${limit}`,
    // ① 主要來源：Supabase
    async () => {
      // 1. 全量載入該維度所有人
      let allStats: any[] = [];
      let from = 0;
      let hasMore = true;
      while (hasMore) {
        const { data: statsChunk, error: countErr } = await supabase
          .from('player_activity_stats')
          .select('user_id, top100_count, specific_rank_counts')
          .eq('dimension_type', dimension_type.toString())
          .eq('dimension_id', Number(dimension_id))
          .range(from, from + 999);
        
        if (countErr) {
          console.error("Supabase top-players query error:", countErr);
          throw countErr;
        }
        allStats = [...allStats, ...(statsChunk || [])];
        if (!statsChunk || statsChunk.length < 1000) {
          hasMore = false;
        } else {
          from += 1000;
        }
      }

      // Metadata (總計資訊)
      const metadata = {
        totalTop100: allStats.filter(s => s.top100_count > 0).length,
        rankCounts: {} as Record<number, number>
      };
      for (let i = 1; i <= 10; i++) {
        metadata.rankCounts[i] = allStats.filter(s => (s.specific_rank_counts?.[i] || 0) > 0).length;
      }

      // 2. 在記憶體中精準切片 (Slicing)
      const topFrequent100 = [...allStats]
        .sort((a, b) => b.top100_count - a.top100_count)
        .slice(0, 15);

      const specificRanks: Record<number, any[]> = {};
      for (let i = 1; i <= 10; i++) {
        specificRanks[i] = [...allStats]
          .filter(s => (s.specific_rank_counts?.[i] || 0) > 0)
          .sort((a, b) => {
             const countA = a.specific_rank_counts?.[i] || 0;
             const countB = b.specific_rank_counts?.[i] || 0;
             if (countA !== countB) return countB - countA;
             return b.top100_count - a.top100_count; // Tie-breaker
          })
          .slice(0, 15);
      }

      // 3. 收集所有需要補齊細節的 user_id
      const uniqueUserIds = new Set<string>();
      topFrequent100.forEach(s => uniqueUserIds.add(s.user_id));
      Object.values(specificRanks).forEach(list => list.forEach(s => uniqueUserIds.add(s.user_id)));
      const userIdsArray = Array.from(uniqueUserIds);

      // 4. 二次精準查詢 (Batch IN)
      let nameMap = new Map<string, string>();
      let unitCountsMap: Record<string, Record<string, number>> = {};
      userIdsArray.forEach(id => unitCountsMap[id] = {});

      if (userIdsArray.length > 0) {
        // [A] 取得暱稱
        const { data: usersData } = await supabase
          .from('players')
          .select('user_id, user_name')
          .in('user_id', userIdsArray);
        if (usersData) {
          usersData.forEach(u => nameMap.set(u.user_id, u.user_name));
        }

        // [B] 取得團體徽章次數 (dimension_type = 'unit_id')
        const { data: unitStats } = await supabase
          .from('player_activity_stats')
          .select('user_id, dimension_id, top100_count')
          .eq('dimension_type', 'unit_id')
          .in('user_id', userIdsArray);
        if (unitStats) {
          unitStats.forEach(st => {
             unitCountsMap[st.user_id][st.dimension_id.toString()] = st.top100_count;
          });
        }
      }

      // 5. 組裝 JSON
      const formatPlayer = (p: any) => ({
        user_id: p.user_id,
        top100_count: p.top100_count,
        specific_rank_counts: p.specific_rank_counts,
        players: { user_name: nameMap.get(p.user_id) || 'Unknown' },
        unitCounts: unitCountsMap[p.user_id] || {}
      });

      const formattedTop100 = topFrequent100.map(formatPlayer);
      const formattedSpecific: Record<number, any[]> = {};
      for (let i = 1; i <= 10; i++) {
        formattedSpecific[i] = specificRanks[i].map(formatPlayer);
      }

      return { 
        data: {
          topFrequent100: formattedTop100,
          topFrequentSpecific: formattedSpecific
        }, 
        metadata 
      };
    },
    // ② 備援來源：無 (目前 Hisekai API 沒有提供此類聚合統計)
    async () => ({ 
      data: { topFrequent100: [], topFrequentSpecific: {} }, 
      metadata: { totalTop100: 0, rankCounts: {} } 
    })
  );
}
