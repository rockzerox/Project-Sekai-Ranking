import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../_lib/supabase';
import { withFallback } from '../../_lib/withFallback';
import { FINALE_EVENT_ID } from '../../../src/config/constants';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  // 多人模式：終章專屬排行榜
  if (id === 'finale') {
    const { anchorEvent } = req.query;
    if (anchorEvent !== String(FINALE_EVENT_ID)) {
      return res.status(400).json({ error: `Invalid or missing anchorEvent parameter. Expected ${FINALE_EVENT_ID}.` });
    }

    return withFallback(
      res,
      `user-rankings-finale-${FINALE_EVENT_ID}`,
      // ① 主要來源：Supabase
      async () => {
        const { data: finaleData, error: finaleError } = await supabase
          .from('event_rankings')
          .select(`
            user_id, rank, score, raw_user_card,
            players ( user_name )
          `)
          .eq('event_id', FINALE_EVENT_ID)
          .eq('chapter_char_id', 0)
          .lte('rank', 100)
          .order('rank', { ascending: true });

        if (finaleError) throw finaleError;
        if (!finaleData || finaleData.length === 0) return null;

        const userIds = finaleData.map((r: any) => r.user_id);
        const historyData: any[] = [];
        const PAGE_SIZE = 1000;
        let page = 0;
        let hasMore = true;

        while (hasMore) {
          const { data: pageRows, error: historyError } = await supabase
            .from('event_rankings')
            .select('user_id, event_id, chapter_char_id, rank')
            .in('user_id', userIds)
            .lt('event_id', FINALE_EVENT_ID)
            .lte('rank', 100)
            .order('event_id', { ascending: true })
            .order('rank', { ascending: true })
            .order('id', { ascending: true })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

          if (historyError) throw historyError;
          if (!pageRows || pageRows.length === 0) {
            hasMore = false;
          } else {
            historyData.push(...pageRows);
            if (pageRows.length < PAGE_SIZE) {
              hasMore = false;
            } else {
              page++;
            }
          }
        }

        return {
          eventId: FINALE_EVENT_ID,
          finale: finaleData.map((r: any) => ({
            userId: r.user_id,
            name: r.players?.user_name || 'Unknown',
            rank: r.rank,
            score: r.score,
            userCard: r.raw_user_card
          })),
          history: historyData.map((h: any) => ({
            userId: h.user_id,
            eventId: h.event_id,
            chapterCharId: h.chapter_char_id,
            rank: h.rank
          }))
        };
      },
      // ② 備援來源：無
      async () => ({
        eventId: FINALE_EVENT_ID,
        finale: [],
        history: []
      }),
      'public, s-maxage=86400, stale-while-revalidate=3600'
    );
  }

  // 單人模式：維持原狀，行為完全不變
  return withFallback(
    res,
    `user-rankings-${id}`,
    // ① 主要來源：Supabase
    async () => {
      const { data, error } = await supabase
        .from('event_rankings')
        .select(`
          event_id, rank, score, last_played_at, raw_user_card, chapter_char_id,
          players!inner ( user_id, user_name )
        `)
        .eq('players.user_id', id)
        .order('last_played_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    // ② 備援來源：無 (目前 Hisekai API 沒有提供單一玩家所有活動排名的端點)
    async () => []
  );
}
