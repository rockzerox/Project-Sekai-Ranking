import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
// 嚴格檢查：伺服器端必須使用 SERVICE_ROLE_KEY，不應 fallback 到 anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration in top-players API');
}

const supabase = createClient(supabaseUrl, supabaseKey || '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { unit_id = 0, limit = 50 } = req.query;

  try {
    // 取得統計數據，並關聯玩家名稱 (從 players 表)
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

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(data);
  } catch (error) {
    console.error("Error in Vercel API /api/stats/top-players:", error);
    return res.status(500).json({ error: "Failed to fetch top players stats" });
  }
}
