import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUnifiedRankings, getPastRankings, getBorderRankings } from '../../_lib/rankingsService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id, type = 'unified' } = req.query;
  const eventId = String(id);
  
  if (!eventId || eventId === 'undefined' || eventId === 'null') {
    return res.status(400).json({ error: "Invalid event ID" });
  }

  // 歷史資料快取 24 小時
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');

  try {
    if (type === 'top100') {
        const data = await getPastRankings(eventId);
        return res.status(200).send(data);
    }
    if (type === 'border') {
        const data = await getBorderRankings(eventId, false);
        return res.status(200).send(data);
    }
    
    const data = await getUnifiedRankings(eventId, false);
    return res.status(200).send(data);
  } catch (error) {
    console.error(`Failed to fetch event ${eventId} rankings via serverless:`, error);
    return res.status(500).json({ error: "Failed to fetch rankings" });
  }
}
