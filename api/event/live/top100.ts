import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLiveRankings } from '../../../src/services/rankingsService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const rankings = await getLiveRankings();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(rankings);
  } catch (error) {
    console.error("Error in Vercel API /api/event/live/top100:", error);
    return res.status(500).json({ error: "Failed to fetch live rankings" });
  }
}
