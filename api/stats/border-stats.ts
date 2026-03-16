import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase';
import { withFallback } from '../_lib/withFallback';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  await withFallback(
    res,
    'border-stats',

    // ① 主要來源：預先計算好的 event_border_stats 表 (極速)
    async () => {
      const { data, error } = await supabaseAdmin
        .from('event_border_stats')
        .select('*')
        .order('event_id', { ascending: false });

      if (error) {
        console.error('Failed to fetch from event_border_stats:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return null; // 觸發降級
      }

      // 將資料庫格式轉換為前端預期的格式
      const formattedStats = data.map((row) => ({
        eventId: row.event_id,
        top1: row.top1 || 0,
        top10: row.top10 || 0,
        top50: row.top50 || 0,
        top100: row.top100 || 0,
        borders: {
          200: row.border_200 || 0,
          300: row.border_300 || 0,
          400: row.border_400 || 0,
          500: row.border_500 || 0,
          1000: row.border_1000 || 0,
          2000: row.border_2000 || 0,
          5000: row.border_5000 || 0,
          10000: row.border_10000 || 0,
        }
      }));

      return { stats: formattedStats };
    },

    // ② 降級來源：從 event_rankings 即時聚合 (較慢，但能保證有資料)
    async () => {
      console.log('Fallback: Aggregating from event_rankings...');
      const targetRanks = [1, 10, 50, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000];
      
      const { data, error } = await supabaseAdmin
        .from('event_rankings')
        .select('event_id, rank, score')
        .eq('chapter_char_id', -1)
        .in('rank', targetRanks);

      if (error) {
        console.error('Fallback aggregation failed:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return { stats: [] };
      }

      // 在記憶體中進行 Group By
      const statsMap: Record<number, any> = {};
      
      data.forEach((row) => {
        const { event_id, rank, score } = row;
        if (!statsMap[event_id]) {
          statsMap[event_id] = {
            eventId: event_id,
            top1: 0, top10: 0, top50: 0, top100: 0,
            borders: {}
          };
        }

        if (rank === 1) statsMap[event_id].top1 = score;
        else if (rank === 10) statsMap[event_id].top10 = score;
        else if (rank === 50) statsMap[event_id].top50 = score;
        else if (rank === 100) statsMap[event_id].top100 = score;
        else statsMap[event_id].borders[rank] = score;
      });

      // 轉換為陣列並排序 (由新到舊)
      const formattedStats = Object.values(statsMap).sort((a, b) => b.eventId - a.eventId);

      return { stats: formattedStats };
    }
  );
}
