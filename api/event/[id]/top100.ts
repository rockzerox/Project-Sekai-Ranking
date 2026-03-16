import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../_utils/supabase';
import { fetchHisekai } from '../../_utils/hisekaiClient';
import { withFallback } from '../../_utils/withFallback';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const eventId = Number(req.query.id);
  if (isNaN(eventId)) return res.status(400).json({ error: 'Invalid eventId' });

  await withFallback(
    res,
    `rankings-${eventId}`,

    // ① 主要來源：Supabase (JOIN players 取得最新名稱)
    async () => {
      const { data, error } = await supabaseAdmin
        .from('event_rankings')
        .select(`
          rank, score, last_played_at, raw_user_card, chapter_char_id,
          players!inner ( user_id, user_name )
        `)
        .eq('event_id', eventId)
        .lte('rank', 100)
        .order('rank', { ascending: true });
      
      if (error) throw error;
      if (!data || data.length === 0) return null;

      const overallRankings: any[] = [];
      const chapterRankingsMap: Record<number, any[]> = {};

      data.forEach((r: any) => {
        const mappedRow = {
          rank: r.rank,
          score: r.score,
          userId: r.players.user_id,
          name: r.players.user_name,
          lastPlayedAt: r.last_played_at,
          userCard: r.raw_user_card
        };

        if (r.chapter_char_id === -1) {
          overallRankings.push(mappedRow);
        } else {
          if (!chapterRankingsMap[r.chapter_char_id]) {
            chapterRankingsMap[r.chapter_char_id] = [];
          }
          chapterRankingsMap[r.chapter_char_id].push(mappedRow);
        }
      });

      const userWorldBloomChapterRankings = Object.keys(chapterRankingsMap).map(charId => ({
        gameCharacterId: parseInt(charId),
        rankings: chapterRankingsMap[parseInt(charId)]
      }));

      // 轉換格式以符合前端預期 (與 hisekai API 結構一致)
      return {
        rankings: overallRankings,
        userWorldBloomChapterRankings
      };
    },

    // ② 備援來源：hisekai API
    async () => fetchHisekai(`/event/${eventId}/top100`)
  );
}
