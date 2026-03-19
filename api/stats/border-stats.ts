import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase';
import { withFallback } from '../_lib/withFallback';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  // 聚合統計資料每隔一段時間才更新，CDN 快取 30 分鐘
  res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=600');

  await withFallback(
    res,
    'border-stats-v2', // Updated key for potential cache invalidation

    // ① 主要來源：預先計算好的統計表 (極速)
    async () => {
      // 並行擷取一般活動紅線與 WL 章節紅線
      const [generalRes, wlRes] = await Promise.all([
        supabaseAdmin
          .from('event_border_stats')
          .select('*')
          .order('event_id', { ascending: false }),
        supabaseAdmin
          .from('wl_chapter_border_stats')
          .select('*')
          .order('event_id', { ascending: false })
      ]);

      if (generalRes.error) throw generalRes.error;
      if (wlRes.error) throw wlRes.error;

      // 格式化一般活動資料
      const formattedStats = (generalRes.data || []).map((row) => ({
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

      // 格式化 WL 章節資料
      const formattedWlStats = (wlRes.data || []).map((row) => ({
        eventId: row.event_id,
        chapterCharId: row.chapter_char_id,
        durationDays: row.duration_days,
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

      return { 
        stats: formattedStats,
        wlStats: formattedWlStats
      };
    },

    // ② 降級來源：從 event_rankings 即時聚合 (較慢，但能保證有資料)
    async () => {
      console.log('Fallback: Aggregating from event_rankings...');
      const targetRanks = [1, 10, 50, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000];
      
      const { data, error } = await supabaseAdmin
        .from('event_rankings')
        .select('event_id, rank, score, chapter_char_id')
        .in('rank', targetRanks);

      if (error) throw error;
      if (!data || data.length === 0) return { stats: [], wlStats: [] };

      const statsMap: Record<number, any> = {};
      const wlStatsMap: Record<string, any> = {};
      
      data.forEach((row) => {
        const { event_id, rank, score, chapter_char_id } = row;
        
        if (chapter_char_id === -1) {
          // 一般活動
          if (!statsMap[event_id]) {
            statsMap[event_id] = { eventId: event_id, top1: 0, top10: 0, top50: 0, top100: 0, borders: {} };
          }
          if (rank === 1) statsMap[event_id].top1 = score;
          else if (rank === 10) statsMap[event_id].top10 = score;
          else if (rank === 50) statsMap[event_id].top50 = score;
          else if (rank === 100) statsMap[event_id].top100 = score;
          else statsMap[event_id].borders[rank] = score;
        } else {
          // World Link 章節
          const key = `${event_id}-${chapter_char_id}`;
          if (!wlStatsMap[key]) {
            wlStatsMap[key] = { eventId: event_id, chapterCharId: chapter_char_id, top1: 0, top10: 0, top50: 0, top100: 0, borders: {} };
          }
          if (rank === 1) wlStatsMap[key].top1 = score;
          else if (rank === 10) wlStatsMap[key].top10 = score;
          else if (rank === 50) wlStatsMap[key].top50 = score;
          else if (rank === 100) wlStatsMap[key].top100 = score;
          else wlStatsMap[key].borders[rank] = score;
        }
      });

      return { 
        stats: Object.values(statsMap).sort((a: any, b: any) => b.eventId - a.eventId),
        wlStats: Object.values(wlStatsMap).sort((a: any, b: any) => b.eventId - a.eventId)
      };
    }
  );
}
