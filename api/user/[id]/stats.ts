import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPlayerStats } from '../../../src/services/statsService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const stats = await getPlayerStats(id);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(stats);
  } catch (error) {
    console.error(`Error in Vercel API /api/user/${id}/stats:`, error);
    return res.status(500).json({ error: `Failed to fetch player stats for ${id}` });
  }
}
