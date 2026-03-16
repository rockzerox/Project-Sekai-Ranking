import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../../lib/supabase';
import { withFallback } from '../../../lib/withFallback';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

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
