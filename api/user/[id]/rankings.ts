import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../../api/_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('event_rankings')
      .select(`
        event_id, rank, score, last_played_at, raw_user_card, chapter_char_id,
        players!inner ( user_id, user_name )
      `)
      .eq('players.user_id', id)
      .order('last_played_at', { ascending: false });

    if (error) throw error;

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);
  } catch (error) {
    console.error(`Error in Vercel API /api/user/${id}/rankings:`, error);
    // Return empty array instead of 500 to gracefully handle failure as requested
    return res.status(200).json([]);
  }
}
