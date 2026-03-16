import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBorderRankings } from '../../../src/services/rankingsService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const rankings = await getBorderRankings("live", true);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(rankings);
  } catch (error) {
    console.error("Error in Vercel API /api/event/live/border:", error);
    return res.status(500).json({ error: "Failed to fetch live border rankings" });
  }
}
