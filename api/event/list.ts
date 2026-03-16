import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';
import { withFallback } from '../../lib/withFallback';

const HISEKAI_API_BASE = process.env.HISEKAI_API_BASE || 'https://api.hisekai.org/tw';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withFallback(
    res,
    'event-list',
    // ① 主要來源：Supabase
    async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      return data;
    },
    // ② 備援來源：Hisekai API
    async () => {
      const response = await fetch(`${HISEKAI_API_BASE}/event/list`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    }
  );
}
