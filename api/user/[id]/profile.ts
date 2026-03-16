import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPlayerProfile } from '../../../src/services/dataService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const profile = await getPlayerProfile(id);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(profile);
  } catch (error) {
    console.error(`Error in Vercel API /api/user/${id}/profile:`, error);
    return res.status(500).json({ error: `Failed to fetch player profile for ${id}` });
  }
}
