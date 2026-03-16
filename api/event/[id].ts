import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_utils/supabase';
import { withFallback } from '../_utils/withFallback';

const HISEKAI_API_BASE = process.env.HISEKAI_API_BASE || 'https://api.hisekai.org/tw';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid event ID" });
  }

  return withFallback(
    res,
    `event-${id}`,
    // ① 主要來源：Supabase
    async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', Number(id))
        .single();
      if (error) throw error;
      return data;
    },
    // ② 備援來源：Hisekai API
    async () => {
      // 注意：Hisekai API 可能沒有單個活動的端點，通常是從列表過濾
      const response = await fetch(`${HISEKAI_API_BASE}/event/list`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const events = await response.json();
      return events.find((e: any) => String(e.id) === String(id)) || null;
    }
  );
}
